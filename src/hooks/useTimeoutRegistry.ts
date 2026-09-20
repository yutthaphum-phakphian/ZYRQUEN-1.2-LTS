import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook providing a safe timeout registry.
 * Guarantees that any pending timeouts registered through `registerTimeout`
 * are automatically cancelled on component unmount to prevent memory leaks,
 * setState on unmounted components, or unexpected side effects.
 */
export function useTimeoutRegistry() {
  const timeoutIdsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const registerTimeout = useCallback((handler: () => void, timeoutMs: number) => {
    const id = setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      handler();
    }, timeoutMs);

    timeoutIdsRef.current.add(id);

    return () => {
      clearTimeout(id);
      timeoutIdsRef.current.delete(id);
    };
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((id) => clearTimeout(id));
      timeoutIdsRef.current.clear();
    };
  }, []);

  return { registerTimeout, clearAllTimeouts };
}
