import { createToken, Scope } from '@tinkoff/dippy';
import type { UIStore } from './createUIStore';
import type { Theme, UIState } from './types';

/**
 * The UI store of the current request (or browser session). Request scoped, so one visitor's
 * theme never leaks into another visitor's server render.
 */
export const UI_STORE_TOKEN = createToken<UIStore>('UI_STORE_TOKEN', { scope: Scope.REQUEST });

/** State the store starts with before the saved preferences are applied. */
export const UI_STORE_DEFAULTS_TOKEN = createToken<UIState>('UI_STORE_DEFAULTS_TOKEN', {
  scope: Scope.SINGLETON,
});

/** Where the theme preference is persisted. Defaults to the `theme` cookie. */
export interface ThemeStorage {
  read(): Theme | undefined;
  write(theme: Theme): void;
}

export const THEME_STORAGE_TOKEN = createToken<ThemeStorage>('THEME_STORAGE_TOKEN', {
  scope: Scope.SINGLETON,
});
