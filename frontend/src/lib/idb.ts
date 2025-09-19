/**
 * IndexedDB Wrapper for Feedback Module
 * Thin adapter around idb library for easy swapping/removal
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FeedbackItem } from '../types/feedback';

interface FeedbackDB extends DBSchema {
  items: {
    key: string;
    value: FeedbackItem;
  };
  blobs: {
    key: string;
    value: Blob;
  };
  prefs: {
    key: string;
    value: any;
  };
}

class FeedbackIDB {
  private db: IDBPDatabase<FeedbackDB> | null = null;
  private readonly dbName = 'teche-feedback';
  private readonly version = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<FeedbackDB>(this.dbName, this.version, {
      upgrade(db) {
        // Create object stores
        if (!db.objectStoreNames.contains('items')) {
          db.createObjectStore('items', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('blobs')) {
          db.createObjectStore('blobs', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('prefs')) {
          db.createObjectStore('prefs', { keyPath: 'key' });
        }
      },
    });
  }

  private async ensureDB(): Promise<IDBPDatabase<FeedbackDB>> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  // Items API
  async saveItem(item: FeedbackItem): Promise<void> {
    const db = await this.ensureDB();
    await db.put('items', item);
  }

  async getItem(id: string): Promise<FeedbackItem | undefined> {
    const db = await this.ensureDB();
    return await db.get('items', id);
  }

  async listItems(): Promise<FeedbackItem[]> {
    const db = await this.ensureDB();
    return await db.getAll('items');
  }

  async deleteItem(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('items', id);
  }

  // Blobs API
  async putBlob(key: string, blob: Blob): Promise<void> {
    const db = await this.ensureDB();
    await db.put('blobs', blob, key);
  }

  async getBlob(key: string): Promise<Blob | undefined> {
    const db = await this.ensureDB();
    return await db.get('blobs', key);
  }

  async deleteBlob(key: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('blobs', key);
  }

  // Prefs API
  async setPref(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();
    await db.put('prefs', value, key);
  }

  async getPref(key: string): Promise<any> {
    const db = await this.ensureDB();
    return await db.get('prefs', key);
  }

  // Utility methods
  async pruneExpired(now: number = Date.now()): Promise<number> {
    const items = await this.listItems();
    const expiredItems: string[] = [];
    const expiredBlobs: string[] = [];

    for (const item of items) {
      const ttlDays = item.ttl_days || 30;
      const expiryTime = new Date(item.created_at).getTime() + (ttlDays * 24 * 60 * 60 * 1000);
      
      if (now > expiryTime) {
        expiredItems.push(item.id);
        
        // Collect blob references to delete
        if (item.artifacts.raw_file_ref) expiredBlobs.push(item.artifacts.raw_file_ref);
        if (item.artifacts.templated_file_ref) expiredBlobs.push(item.artifacts.templated_file_ref);
        if (item.artifacts.final_file_ref) expiredBlobs.push(item.artifacts.final_file_ref);
        expiredBlobs.push(...item.attachments);
      }
    }

    // Delete expired items
    for (const id of expiredItems) {
      await this.deleteItem(id);
    }

    // Delete expired blobs
    for (const key of expiredBlobs) {
      await this.deleteBlob(key);
    }

    return expiredItems.length;
  }

  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    await db.clear('items');
    await db.clear('blobs');
    await db.clear('prefs');
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
export const feedbackDB = new FeedbackIDB();

// Export types for convenience
export type { FeedbackItem };
