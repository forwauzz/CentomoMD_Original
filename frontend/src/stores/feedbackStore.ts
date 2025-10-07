/**
 * Feedback Store
 * Zustand store for feedback module state management
 */

import { create } from 'zustand';
import { feedbackDB } from '../lib/idb';
import { FeedbackItem, FeedbackFilters, FeedbackStore } from '../types/feedback';
import { feedbackSyncService } from '../services/feedbackSyncService';
import { useFeatureFlags } from '../lib/featureFlags';

export const useFeedbackStore = create<FeedbackStore>((set, get) => ({
  // Initial state
  items: [],
  filters: {},
  flagEnabled: false,
  isLoading: false,
  error: undefined,
  syncStatus: {
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    pendingItems: 0,
    failedItems: 0,
    error: null,
  },

  // Actions
  init: async (flagEnabled: boolean) => {
    if (!flagEnabled) {
      set({ flagEnabled: false, items: [] });
      return;
    }

    set({ isLoading: true, error: undefined });

    try {
      // Load items directly from API instead of IndexedDB
      const { apiFetch } = await import('../lib/api');
      const response = await apiFetch('/api/feedback', {
        method: 'GET',
      });

      if (response.success && response.data && response.data.items) {
        set({ 
          items: response.data.items, 
          flagEnabled: true, 
          isLoading: false 
        });
        console.log(`✅ Loaded ${response.data.items.length} feedback items from database`);
      } else {
        set({ 
          items: [], 
          flagEnabled: true, 
          isLoading: false 
        });
        console.log('📭 No feedback items found in database');
      }

      // Set up daily pruning timer
      const scheduleDailyPrune = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const msUntilTomorrow = tomorrow.getTime() - now.getTime();
        
        setTimeout(async () => {
          const { flagEnabled } = get();
          if (flagEnabled) {
            await get().pruneExpiredNow();
            scheduleDailyPrune(); // Schedule next day
          }
        }, msUntilTomorrow);
      };

      scheduleDailyPrune();

    } catch (error) {
      console.error('Failed to initialize feedback store:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
    }
  },

  addItem: async (itemData, blobs = {}) => {
    const { flagEnabled } = get();
    if (!flagEnabled) return;

    set({ isLoading: true, error: undefined });

    try {
      // Store blobs and get their keys (if any)
      const blobKeys: string[] = [];
      for (const [key, blob] of Object.entries(blobs)) {
        const blobKey = `blob_${Date.now()}_${key}`;
        await feedbackDB.putBlob(blobKey, blob);
        blobKeys.push(blobKey);
      }

      // Prepare data for API call
      const apiData = {
        ...itemData,
        attachments: blobKeys,
      };

      // Make direct API call to create feedback
      const { apiFetch } = await import('../lib/api');
      const response = await apiFetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (response.success && response.data) {
        const newItem = response.data;
        
        // Update state with the server-created item
        set((state) => ({
          items: [...state.items, newItem],
          isLoading: false,
        }));

        console.log('✅ Feedback saved directly to database:', newItem.id);
      } else {
        throw new Error(response.error || 'Failed to save feedback');
      }

    } catch (error) {
      console.error('Failed to add feedback item:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
    }
  },

  updateItem: async (id: string, partial: Partial<FeedbackItem>) => {
    const { flagEnabled } = get();
    if (!flagEnabled) return;

    set({ isLoading: true, error: undefined });

    try {
      const existingItem = await feedbackDB.getItem(id);
      if (!existingItem) {
        throw new Error('Item not found');
      }

      const updatedItem = { ...existingItem, ...partial };
      await feedbackDB.saveItem(updatedItem);

      set((state) => ({
        items: state.items.map(item => 
          item.id === id ? updatedItem : item
        ),
        isLoading: false,
      }));

    } catch (error) {
      console.error('Failed to update feedback item:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
    }
  },

  deleteItem: async (id: string) => {
    const { flagEnabled } = get();
    if (!flagEnabled) return;

    set({ isLoading: true, error: undefined });

    try {
      // Get item to find blob references
      const item = await feedbackDB.getItem(id);
      if (item) {
        // Delete associated blobs
        const blobKeys = [
          item.artifacts.raw_file_ref,
          item.artifacts.templated_file_ref,
          item.artifacts.final_file_ref,
          ...item.attachments,
        ].filter(Boolean) as string[];

        for (const blobKey of blobKeys) {
          await feedbackDB.deleteBlob(blobKey);
        }
      }

      // Delete the item
      await feedbackDB.deleteItem(id);

      // Update state
      set((state) => ({
        items: state.items.filter(item => item.id !== id),
        isLoading: false,
      }));

    } catch (error) {
      console.error('Failed to delete feedback item:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
    }
  },

  setFilters: (filters: Partial<FeedbackFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters }
    }));
  },

  exportAll: async () => {
    const { flagEnabled, items } = get();
    if (!flagEnabled) {
      throw new Error('Feedback module not enabled');
    }

    try {
      // Collect all blob references
      const allBlobKeys = new Set<string>();
      for (const item of items) {
        if (item.artifacts.raw_file_ref) allBlobKeys.add(item.artifacts.raw_file_ref);
        if (item.artifacts.templated_file_ref) allBlobKeys.add(item.artifacts.templated_file_ref);
        if (item.artifacts.final_file_ref) allBlobKeys.add(item.artifacts.final_file_ref);
        item.attachments.forEach(key => allBlobKeys.add(key));
      }

      // Fetch all blobs
      const files: Array<{ key: string; blob: Blob }> = [];
      for (const key of allBlobKeys) {
        const blob = await feedbackDB.getBlob(key);
        if (blob) {
          files.push({ key, blob });
        }
      }

      // Create JSON blob
      const json = new Blob([JSON.stringify(items, null, 2)], {
        type: 'application/json'
      });

      return { json, files };

    } catch (error) {
      console.error('Failed to export feedback data:', error);
      throw error;
    }
  },

  nukeAll: async () => {
    const { flagEnabled } = get();
    if (!flagEnabled) return;

    set({ isLoading: true, error: undefined });

    try {
      await feedbackDB.clearAll();
      set({ 
        items: [], 
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to nuke all feedback data:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
    }
  },

  pruneExpiredNow: async () => {
    const { flagEnabled } = get();
    if (!flagEnabled) return;

    try {
      const prunedCount = await feedbackDB.pruneExpired();
      
      if (prunedCount > 0) {
        // Reload items after pruning
        const freshItems = await feedbackDB.listItems();
        set({ items: freshItems });
      }
    } catch (error) {
      console.error('Failed to prune expired items:', error);
    }
  },

  // Sync-related actions
  syncPendingItems: async () => {
    const featureFlags = useFeatureFlags();
    if (!featureFlags.feedbackServerSync) return;

    try {
      await feedbackSyncService.syncPendingItems();
    } catch (error) {
      console.error('Failed to sync pending items:', error);
    }
  },

  syncItem: async (id: string) => {
    const featureFlags = useFeatureFlags();
    if (!featureFlags.feedbackServerSync) return false;

    try {
      const success = await feedbackSyncService.syncItem(id);
      
      if (success) {
        // Update item sync status
        set((state) => ({
          items: state.items.map(item =>
            item.id === id
              ? { ...item, syncStatus: 'synced' as const, lastSyncAttempt: new Date().toISOString() }
              : item
          ),
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Failed to sync item:', error);
      
      // Update item sync status to failed
      set((state) => ({
        items: state.items.map(item =>
          item.id === id
            ? { 
                ...item, 
                syncStatus: 'failed' as const, 
                lastSyncAttempt: new Date().toISOString(),
                syncError: error instanceof Error ? error.message : 'Sync failed'
              }
            : item
        ),
      }));
      
      return false;
    }
  },

  retryFailedSync: async () => {
    const featureFlags = useFeatureFlags();
    if (!featureFlags.feedbackServerSync) return;

    try {
      // Get all failed items
      const { items } = get();
      const failedItems = items.filter(item => item.syncStatus === 'failed');
      
      // Add them back to sync queue
      for (const item of failedItems) {
        feedbackSyncService.addToSyncQueue(item.id);
      }
      
      // Trigger sync
      await feedbackSyncService.syncPendingItems();
    } catch (error) {
      console.error('Failed to retry sync:', error);
    }
  },
}));
