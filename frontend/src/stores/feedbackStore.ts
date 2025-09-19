/**
 * Feedback Store
 * Zustand store for feedback module state management
 */

import { create } from 'zustand';
import { feedbackDB } from '../lib/idb';
import { FeedbackItem, FeedbackFilters, FeedbackStore } from '../types/feedback';

export const useFeedbackStore = create<FeedbackStore>((set, get) => ({
  // Initial state
  items: [],
  filters: {},
  flagEnabled: false,
  isLoading: false,
  error: undefined,

  // Actions
  init: async (flagEnabled: boolean) => {
    if (!flagEnabled) {
      set({ flagEnabled: false, items: [] });
      return;
    }

    set({ isLoading: true, error: undefined });

    try {
      await feedbackDB.init();
      
      // Load items from IDB
      await feedbackDB.listItems();
      
      // Prune expired items
      await feedbackDB.pruneExpired();
      
      // Reload items after pruning
      const freshItems = await feedbackDB.listItems();
      
      set({ 
        items: freshItems, 
        flagEnabled: true, 
        isLoading: false 
      });

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
      // Generate ID and timestamp
      const id = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const created_at = new Date().toISOString();

      // Store blobs and get their keys
      const blobKeys: string[] = [];
      for (const [key, blob] of Object.entries(blobs)) {
        const blobKey = `blob_${id}_${key}`;
        await feedbackDB.putBlob(blobKey, blob);
        blobKeys.push(blobKey);
      }

      // Create the item
      const item: FeedbackItem = {
        ...itemData,
        id,
        created_at,
        attachments: blobKeys,
      };

      // Save to IDB
      await feedbackDB.saveItem(item);

      // NEW: Save to server (graceful failure)
      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: item,
            ttl_days: item.ttl_days || 30
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          console.log('✅ Feedback synced to server:', result.id);
        } else {
          throw new Error(result.error || 'Unknown server error');
        }
      } catch (serverError) {
        console.warn('⚠️ Failed to sync feedback to server:', serverError);
        // Continue - don't fail the whole operation
        // Could add a retry mechanism here in the future
      }

      // Update state
      set((state) => ({
        items: [...state.items, item],
        isLoading: false,
      }));

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

  // Optional: Load server feedback (for cross-account access)
  loadServerFeedback: async () => {
    const { flagEnabled } = get();
    if (!flagEnabled) return;

    set({ isLoading: true, error: undefined });

    try {
      const response = await fetch('/api/feedback?limit=100&offset=0');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.items && result.items.length > 0) {
        // Filter out duplicates (items that already exist locally)
        const existingIds = new Set(get().items.map(item => item.id));
        const newItems = result.items.filter((item: any) => !existingIds.has(item.id));
        
        if (newItems.length > 0) {
          set((state) => ({
            items: [...state.items, ...newItems],
            isLoading: false
          }));
          console.log(`✅ Loaded ${newItems.length} new feedback items from server`);
        } else {
          console.log('ℹ️ No new feedback items from server');
          set({ isLoading: false });
        }
      } else {
        console.log('ℹ️ No feedback items available from server');
        set({ isLoading: false });
      }
    } catch (error) {
      console.warn('⚠️ Failed to load server feedback:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load server feedback',
        isLoading: false 
      });
      // Don't fail - this is optional
    }
  },
}));
