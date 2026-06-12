'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `value` delayed by `delayMs`. Updates as the input settles.
 * Used by the search box so we don't hit the API on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
