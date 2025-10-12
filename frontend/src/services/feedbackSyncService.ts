/**
 * Feedback Sync Service
 * Handles synchronization between IndexedDB and server
 */

import { apiFetch } from '../lib/api';
import { getFeatureFlags } from '../lib/featureFlags';
import type { FeedbackItem } from '../types/feedback';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingItems: number;
  failedItems: number;
  error: string | null;
}

export interface SyncResult {
  synced: string[];
  failed: Array<{
    id: string;
    error: string;
  }>;
}

class FeedbackSyncService {
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    pendingItems: 0,
    failedItems: 0,
    error: null,
  };

  private listeners: Array<(status: SyncStatus) => void> = [];
  private syncQueue: Set<string> = new Set();
  private retryQueue: Map<string, number> = new Map();
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second base delay

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.notifyListeners();
      this.syncPendingItems();
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
      this.notifyListeners();
    });

    // Periodic sync when online
    setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.isSyncing) {
        this.syncPendingItems();
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.syncStatus); // Initial call

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Check if server sync is enabled
   */
  private isServerSyncEnabled(): boolean {
    const featureFlags = getFeatureFlags();
    return featureFlags.feedbackServerSync;
  }

  /**
   * Add item to sync queue
   */
  addToSyncQueue(itemId: string): void {
    if (!this.isServerSyncEnabled()) return;

    this.syncQueue.add(itemId);
    this.updatePendingCount();
    this.notifyListeners();

    // Trigger sync if online
    if (this.syncStatus.isOnline) {
      this.syncPendingItems();
    }
  }

  /**
   * Remove item from sync queue
   */
  removeFromSyncQueue(itemId: string): void {
    this.syncQueue.delete(itemId);
    this.retryQueue.delete(itemId);
    this.updatePendingCount();
    this.notifyListeners();
  }

  /**
   * Sync all pending items
   */
  async syncPendingItems(): Promise<SyncResult> {
    if (!this.isServerSyncEnabled() || !this.syncStatus.isOnline || this.syncStatus.isSyncing) {
      return { synced: [], failed: [] };
    }

    this.syncStatus.isSyncing = true;
    this.syncStatus.error = null;
    this.notifyListeners();

    try {
      const result = await this.performSync();
      
      this.syncStatus.lastSyncTime = new Date().toISOString();
      this.syncStatus.failedItems = result.failed.length;
      this.notifyListeners();

      return result;
    } catch (error) {
      this.syncStatus.error = error instanceof Error ? error.message : 'Sync failed';
      this.notifyListeners();
      throw error;
    } finally {
      this.syncStatus.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Perform the actual sync operation
   */
  private async performSync(): Promise<SyncResult> {
    const synced: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    // Get items from IndexedDB that need syncing
    const itemsToSync = await this.getItemsToSync();
    
    if (itemsToSync.length === 0) {
      return { synced, failed };
    }

    // Convert to server format
    const syncData = {
      items: itemsToSync.map(item => ({
        id: item.id,
        data: this.convertToServerFormat(item),
        timestamp: item.created_at,
      })),
    };

    try {
      // Prepare headers with optional user ID
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add user ID header if available (for authenticated users)
      try {
        const { supabase } = await import('../lib/authClient');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          headers['x-user-id'] = session.user.id;
        }
      } catch (error) {
        // Ignore auth errors - proceed without user ID (anonymous)
        console.debug('No authenticated user, proceeding anonymously');
      }

      // Send to server
      const response = await apiFetch<{ data: SyncResult }>('/api/feedback/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify(syncData),
      });

      const result = response.data;
      
      // Process results
      for (const id of result.synced) {
        synced.push(id);
        this.removeFromSyncQueue(id);
        await this.markAsSynced(id);
      }

      for (const failure of result.failed) {
        failed.push(failure);
        await this.handleSyncFailure(failure.id, failure.error);
      }

    } catch (error) {
      // If sync fails completely, mark all items as failed
      for (const item of itemsToSync) {
        failed.push({
          id: item.id,
          error: error instanceof Error ? error.message : 'Network error',
        });
        await this.handleSyncFailure(item.id, error instanceof Error ? error.message : 'Network error');
      }
    }

    return { synced, failed };
  }

  /**
   * Get items from IndexedDB that need syncing
   */
  private async getItemsToSync(): Promise<FeedbackItem[]> {
    try {
      // Import the feedback store to access IndexedDB data
      const { useFeedbackStore } = await import('../stores/feedbackStore');
      const store = useFeedbackStore.getState();
      
      // Get items that are pending sync
      return store.items.filter(item => 
        item.syncStatus === 'pending' || 
        (item.syncStatus === 'failed' && this.syncQueue.has(item.id))
      );
    } catch (error) {
      console.error('Failed to get items to sync:', error);
      return [];
    }
  }

  /**
   * Convert frontend feedback item to server format
   */
  private convertToServerFormat(item: FeedbackItem): any {
    return {
      session_id: undefined, // Will be set by backend if available
      meta: item.meta,
      ratings: this.convertRatingsToServerFormat(item.ratings),
      artifacts: item.artifacts,
      highlights: item.highlights.map(h => ({
        start_line: h.start_line,
        end_line: h.end_line,
        note: h.note,
      })),
      comment: item.comment,
      attachments: item.attachments,
      ttl_days: item.ttl_days || 30,
    };
  }

  /**
   * Convert frontend ratings to server format
   */
  private convertRatingsToServerFormat(ratings: any): any {
    const serverRatings: any = {};
    
    for (const [key, value] of Object.entries(ratings)) {
      if (value) {
        // Convert frontend rating to server format
        let score: number;
        let comment: string | undefined;

        if (typeof value === 'string') {
          // Frontend uses 'good' | 'meh' | 'bad'
          switch (value) {
            case 'good': score = 5; break;
            case 'meh': score = 3; break;
            case 'bad': score = 1; break;
            default: continue;
          }
        } else if (typeof value === 'object' && value !== null) {
          // Server format with score and comment
          score = (value as any).score;
          comment = (value as any).comment;
        } else {
          continue;
        }

        serverRatings[key] = { score, comment };
      }
    }

    return serverRatings;
  }

  /**
   * Mark item as synced in IndexedDB
   */
  private async markAsSynced(itemId: string): Promise<void> {
    try {
      // Import the feedback store to update the item
      const { useFeedbackStore } = await import('../stores/feedbackStore');
      const store = useFeedbackStore.getState();
      
      // Update the item's sync status
      await store.updateItem(itemId, {
        syncStatus: 'synced',
        lastSyncAttempt: new Date().toISOString(),
        syncError: undefined,
      });
    } catch (error) {
      console.error('Failed to mark item as synced:', error);
    }
  }

  /**
   * Handle sync failure with retry logic
   */
  private async handleSyncFailure(itemId: string, _error: string): Promise<void> {
    const retryCount = this.retryQueue.get(itemId) || 0;
    
    if (retryCount < this.maxRetries) {
      // Schedule retry with exponential backoff
      const delay = this.retryDelay * Math.pow(2, retryCount);
      this.retryQueue.set(itemId, retryCount + 1);
      
      setTimeout(() => {
        if (this.syncQueue.has(itemId)) {
          this.syncPendingItems();
        }
      }, delay);
    } else {
      // Max retries reached, remove from queue
      this.removeFromSyncQueue(itemId);
    }
  }

  /**
   * Update pending items count
   */
  private updatePendingCount(): void {
    this.syncStatus.pendingItems = this.syncQueue.size;
  }

  /**
   * Notify all listeners of status changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  /**
   * Force sync a specific item
   */
  async syncItem(itemId: string): Promise<boolean> {
    if (!this.isServerSyncEnabled()) return false;

    this.addToSyncQueue(itemId);
    const result = await this.syncPendingItems();
    return result.synced.includes(itemId);
  }

  /**
   * Get sync statistics
   */
  getStats(): {
    pending: number;
    failed: number;
    lastSync: string | null;
    isOnline: boolean;
  } {
    return {
      pending: this.syncStatus.pendingItems,
      failed: this.syncStatus.failedItems,
      lastSync: this.syncStatus.lastSyncTime,
      isOnline: this.syncStatus.isOnline,
    };
  }
}

// Export singleton instance
export const feedbackSyncService = new FeedbackSyncService();
