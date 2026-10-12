import { useEffect, useRef } from 'react';

export interface UseOnVisibleOptions {
  /** How far ahead of the viewport the target counts as visible, e.g. `'800px'`. */
  rootMargin?: string;
  /** Pauses observation, e.g. while a page is already loading or nothing is left. */
  enabled?: boolean;
}

/**
 * Calls `onVisible` whenever the returned ref's element approaches the viewport. Used as the
 * sentinel of an infinite list so the next page starts loading *before* the user hits the end.
 */
export function useOnVisible<T extends Element>(
  onVisible: () => void,
  { rootMargin = '0px', enabled = true }: UseOnVisibleOptions = {}
) {
  const ref = useRef<T | null>(null);
  const callback = useRef(onVisible);

  callback.current = onVisible;

  useEffect(() => {
    const node = ref.current;

    if (!node || !enabled || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          callback.current();
        }
      },
      { rootMargin }
    );

    observer.observe(node);

    // Re-created whenever `enabled` flips, so a sentinel that is still on screen after a page
    // loaded fires again and keeps filling tall viewports.
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return ref;
}
