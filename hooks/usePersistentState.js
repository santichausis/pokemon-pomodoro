import { useState, useEffect, useRef } from 'react';
import { readStored } from '@/lib/utils';

// useState whose value is mirrored to localStorage.
// Hydrates from storage after mount (SSR-safe) and never clobbers existing
// data: the initial mount write is skipped so the hydrated value wins.
export function usePersistentState(key, initial) {
  const [value, setValue] = useState(initial);
  const skipNextWrite = useRef(true);

  // Hydrate once from storage
  useEffect(() => {
    const stored = readStored(key, undefined);
    if (stored !== undefined && stored !== null) setValue(stored);
  }, [key]);

  // Persist on change, skipping the very first run (mount)
  useEffect(() => {
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
    }
  }, [key, value]);

  return [value, setValue];
}
