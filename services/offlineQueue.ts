// ========================================================
// 404 FOUNDERS - OFFLINE MESSAGE QUEUE / CACHE MANAGER
// Saves messages to localStorage outbox when offline
// Auto-flushes and sends once network connectivity returns
// ========================================================

import { Message } from '@/types/database';
import { messageService } from './messageService';

export interface QueuedMessage {
  tempId: string;
  chatId: string;
  senderId: string;
  text: string;
  replyToMessageId?: string | null;
  messageType?: string;
  queuedAt: string;
}

const STORAGE_KEY = '404_offline_message_outbox';
const SIMULATE_OFFLINE_KEY = '404_simulate_offline';

// Universal storage adapter: handles browser localStorage + Node.js test environment
const inMemoryStore = new Map<string, string>();

function getStorageItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    } catch {}
  }
  return inMemoryStore.get(key) || null;
}

function setStorageItem(key: string, value: string): void {
  inMemoryStore.set(key, value);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch {}
  }
}

function removeStorageItem(key: string): void {
  inMemoryStore.delete(key);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }
}

export const offlineQueue = {
  isSimulatedOffline(): boolean {
    return getStorageItem(SIMULATE_OFFLINE_KEY) === 'true';
  },

  setSimulatedOffline(val: boolean): void {
    setStorageItem(SIMULATE_OFFLINE_KEY, val ? 'true' : 'false');
  },

  isOffline(): boolean {
    if (this.isSimulatedOffline()) return true;
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return !navigator.onLine;
    }
    return false;
  },

  getQueueCount(): number {
    return this.getQueue().length;
  },

  getQueue(): QueuedMessage[] {
    try {
      const data = getStorageItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  enqueue(item: QueuedMessage): void {
    try {
      const queue = this.getQueue();
      if (!queue.some((q) => q.tempId === item.tempId)) {
        queue.push(item);
        setStorageItem(STORAGE_KEY, JSON.stringify(queue));
      }
    } catch (e) {
      console.warn('Failed to save message to offline cache:', e);
    }
  },

  dequeue(tempId: string): void {
    try {
      const queue = this.getQueue().filter((item) => item.tempId !== tempId);
      setStorageItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to remove message from offline cache:', e);
    }
  },

  clear(): void {
    removeStorageItem(STORAGE_KEY);
    removeStorageItem(SIMULATE_OFFLINE_KEY);
  },

  async flush(
    onMessageSent: (tempId: string, sentMessage: Message) => void
  ): Promise<{ sentCount: number; errors: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { sentCount: 0, errors: 0 };

    let sentCount = 0;
    let errors = 0;

    for (const item of queue) {
      try {
        const sent = await messageService.sendMessage({
          chatId: item.chatId,
          senderId: item.senderId,
          text: item.text,
          replyToMessageId: item.replyToMessageId,
        });

        this.dequeue(item.tempId);
        sentCount++;
        onMessageSent(item.tempId, sent);
      } catch (err) {
        console.warn(`Failed to flush message ${item.tempId}:`, err);
        errors++;
      }
    }

    return { sentCount, errors };
  },
};
