import { useCallback } from 'react';
import { useSelector } from '@tanstack/react-store';
import { useDiToken } from '../../core/di';
import { UI_STORE_TOKEN } from './tokens';
import type { Theme, UIState } from './types';

/** The UI store of the current container. */
export const useUIStoreInstance = () => useDiToken(UI_STORE_TOKEN);

/** Subscribes to a slice of the UI store: `useUIStore((state) => state.theme)`. */
export function useUIStore<Selected>(selector: (state: UIState) => Selected): Selected {
  return useSelector(useUIStoreInstance(), selector);
}

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export function useTheme() {
  const store = useUIStoreInstance();
  const theme = useSelector(store, (state) => state.theme);
  const setTheme = useCallback((next: Theme) => store.actions.setTheme(next), [store]);
  const toggleTheme = useCallback(() => store.actions.toggleTheme(systemPrefersDark()), [store]);

  return { theme, setTheme, toggleTheme };
}
