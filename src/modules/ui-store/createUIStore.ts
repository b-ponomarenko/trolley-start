import { createStore } from '@tanstack/store';
import type { Theme, UIState } from './types';

/**
 * The UI store: plain TanStack Store with its actions declared next to the state.
 *
 * `toggleTheme` needs to know what `system` currently resolves to, so the caller passes it in —
 * the store itself stays free of `window` and works the same during SSR.
 */
export const createUIStore = (initialState: UIState) =>
  createStore(initialState, ({ setState }) => ({
    setTheme(theme: Theme) {
      setState((state) => ({ ...state, theme }));
    },
    toggleTheme(systemPrefersDark: boolean) {
      setState((state) => {
        const current =
          state.theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : state.theme;

        return { ...state, theme: current === 'dark' ? 'light' : 'dark' };
      });
    },
  }));

export type UIStore = ReturnType<typeof createUIStore>;
