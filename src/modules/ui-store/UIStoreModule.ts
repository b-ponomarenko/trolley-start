import { Module, optional, provide, Scope } from '@tinkoff/dippy';
import { commandLineListTokens } from '../../core/tokens';
import { HTML_ATTRS_TOKEN } from '../render/tokens';
import { useUIStore } from './hooks';
import { createUIStore } from './createUIStore';
import { readThemeCookie, writeThemeCookie } from './themeCookie';
import { THEME_STORAGE_TOKEN, UI_STORE_DEFAULTS_TOKEN, UI_STORE_TOKEN } from './tokens';
import type { UIState } from './types';

const defaults: UIState = { theme: 'system' };

/**
 * UI state (the colour theme) on TanStack Store. Add it to `modules` and the rest follows:
 *
 * - a store per request container (`UI_STORE_TOKEN`);
 * - `customerStart` restores the saved theme (`THEME_STORAGE_TOKEN`, the cookie by default) — on the server from the request,
 *   in the browser from `document.cookie` — before anything renders;
 * - in the browser every change is written back to the cookie, so the next server render
 *   already uses it and there is no flash of the wrong theme.
 *
 * - `<html data-theme>` through `HTML_ATTRS_TOKEN`, rendered on the server already.
 *
 * Read and change it with `useTheme()` / `useUIStore(selector)`.
 */
@Module({
  providers: [
    provide({
      provide: UI_STORE_TOKEN,
      scope: Scope.REQUEST,
      useFactory: ({ initial }) => createUIStore(initial ?? defaults),
      deps: { initial: optional(UI_STORE_DEFAULTS_TOKEN) },
    }),
    provide({
      provide: HTML_ATTRS_TOKEN,
      useValue: {
        target: 'html',
        useAttrs: () => ({ 'data-theme': useUIStore((state) => state.theme) }),
      },
    }),
    provide({
      provide: THEME_STORAGE_TOKEN,
      scope: Scope.SINGLETON,
      useValue: { read: readThemeCookie, write: writeThemeCookie },
    }),
    provide({
      provide: commandLineListTokens.customerStart,
      useFactory:
        ({ store, storage }) =>
        () => {
          const saved = storage.read();

          if (saved) {
            store.actions.setTheme(saved);
          }

          if (typeof document !== 'undefined') {
            store.subscribe((state) => storage.write(state.theme));
          }
        },
      deps: { store: UI_STORE_TOKEN, storage: THEME_STORAGE_TOKEN },
    }),
  ],
})
export class UIStoreModule {}
