// ═══════════════════════════════════════════════════════════════
// Plately Workshop — Offline Action Queue (IndexedDB via Dexie)
// ═══════════════════════════════════════════════════════════════
// 
// When the KDS tablet loses internet, user actions (accept, reject,
// mark ready, etc.) are queued in IndexedDB and replayed when
// connectivity is restored.

import Dexie, { type Table } from 'dexie';

export type QueuedActionType =
  | 'update_order_status'
  | 'accept_order'
  | 'reject_order'
  | 'mark_preparing'
  | 'mark_ready';

export interface QueuedAction {
  id?: number;
  action: QueuedActionType;
  payload: Record<string, unknown>;
  created_at: string;
  retries: number;
}

class OfflineDB extends Dexie {
  actions!: Table<QueuedAction>;

  constructor() {
    super('plately-workshop-offline');
    this.version(1).stores({
      actions: '++id, action, created_at',
    });
  }
}

/** Singleton DB instance — only created in browser */
let db: OfflineDB | null = null;

function getDB(): OfflineDB {
  if (!db) {
    db = new OfflineDB();
  }
  return db;
}

/**
 * Queue an action for later execution when network is available.
 */
export async function queueAction(
  action: QueuedActionType,
  payload: Record<string, unknown>
): Promise<void> {
  if (typeof window === 'undefined') return; // SSR guard

  await getDB().actions.add({
    action,
    payload,
    created_at: new Date().toISOString(),
    retries: 0,
  });

  console.log(`[Offline] Queued action: ${action}`, payload);
}

/**
 * Get all pending actions (for display or debugging).
 */
export async function getPendingActions(): Promise<QueuedAction[]> {
  if (typeof window === 'undefined') return [];
  return getDB().actions.orderBy('created_at').toArray();
}

/**
 * Get count of pending actions.
 */
export async function getPendingCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  return getDB().actions.count();
}

/**
 * Flush all queued actions by executing them against Supabase.
 * Returns the number of successfully processed actions.
 * 
 * @param executor — A function that receives each action and applies it.
 *                   This is injected to avoid importing Supabase here.
 */
export async function flushQueue(
  executor: (action: QueuedAction) => Promise<void>
): Promise<number> {
  if (typeof window === 'undefined') return 0;

  const database = getDB();
  const actions = await database.actions.orderBy('created_at').toArray();
  let processed = 0;

  for (const action of actions) {
    try {
      await executor(action);
      await database.actions.delete(action.id!);
      processed++;
    } catch (error) {
      console.error(`[Offline] Failed to flush action:`, action, error);
      
      if (action.retries >= 5) {
        // Give up after 5 retries — remove from queue
        console.error(`[Offline] Dropping action after 5 retries:`, action);
        await database.actions.delete(action.id!);
      } else {
        // Increment retry counter
        await database.actions.update(action.id!, {
          retries: action.retries + 1,
        });
      }
    }
  }

  if (processed > 0) {
    console.log(`[Offline] Flushed ${processed}/${actions.length} actions`);
  }

  return processed;
}

/**
 * Clear all queued actions.
 */
export async function clearQueue(): Promise<void> {
  if (typeof window === 'undefined') return;
  await getDB().actions.clear();
}
