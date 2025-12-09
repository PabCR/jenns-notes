/**
 * Simple debounce hook to avoid frequent updates for fast-changing inputs.
 */
import { useEffect, useState } from 'react';

/**
 * Return a debounced value that only updates after the delay.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
