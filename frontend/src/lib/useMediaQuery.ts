import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribe to a media query.
 *
 * Lets a component render one layout or another rather than rendering both and hiding one with
 * CSS — which would put duplicate content in the accessibility tree.
 *
 * Built on `useSyncExternalStore` rather than useState + useEffect: the match is external state,
 * so this reads it during render and stays correct without a synchronising effect.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
