import { useSyncExternalStore } from 'react';

/**
 * Saved ("hearted") products, persisted locally.
 *
 * A module-level store rather than a context: nothing here needs to be scoped to a subtree, and
 * `useSyncExternalStore` keeps every heart on the page in sync without a provider wrapping the
 * app. There is no customer account to sync against, so this stays on the device.
 */
const STORAGE_KEY = 'two_souls_saved';

const listeners = new Set<() => void>();

function read(): readonly string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

// Held as a stable reference: useSyncExternalStore compares snapshots by identity, so this may
// only be reassigned when the contents actually change.
let snapshot: readonly string[] = read();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): readonly string[] {
  return snapshot;
}

function commit(next: readonly string[]): void {
  snapshot = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage being unavailable should not stop the UI from updating.
  }
  listeners.forEach((listener) => listener());
}

export function useSavedIds(): readonly string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function toggleSaved(productId: string): void {
  commit(
    snapshot.includes(productId)
      ? snapshot.filter((id) => id !== productId)
      : [...snapshot, productId],
  );
}
