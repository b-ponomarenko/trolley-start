import { describe, expect, it, vi } from 'vitest';
import { createApp, provide } from '@/core';
import { CommonModule } from '../CommonModule';
import { createUIStore } from './createUIStore';
import { THEME_STORAGE_TOKEN, UI_STORE_TOKEN } from './tokens';
import { UIStoreModule } from './UIStoreModule';
import type { Theme } from './types';

describe('createUIStore', () => {
  it('toggles between light and dark, resolving `system` first', () => {
    const store = createUIStore({ theme: 'system' });

    store.actions.toggleTheme(true);
    expect(store.state.theme).toBe('light');

    store.actions.toggleTheme(true);
    expect(store.state.theme).toBe('dark');

    store.actions.setTheme('system');
    store.actions.toggleTheme(false);
    expect(store.state.theme).toBe('dark');
  });
});

describe('UIStoreModule', () => {
  const setup = (saved: Theme | undefined) => {
    const storage = { read: vi.fn(() => saved), write: vi.fn() };
    const app = createApp({
      name: 'test',
      modules: [CommonModule, UIStoreModule],
      providers: [provide({ provide: THEME_STORAGE_TOKEN, useValue: storage })],
    });

    return { app, storage };
  };

  it('restores the saved theme during customerStart and persists changes', async () => {
    const { app, storage } = setup('dark');
    const di = await app.run('client', app.fork());
    const store = di.get(UI_STORE_TOKEN);

    expect(store.state.theme).toBe('dark');

    store.actions.setTheme('light');
    expect(storage.write).toHaveBeenLastCalledWith('light');
  });

  it('keeps a separate store per request container', async () => {
    const { app } = setup(undefined);
    const first = await app.run('server', app.fork());
    const second = await app.run('server', app.fork());

    first.get(UI_STORE_TOKEN).actions.setTheme('dark');

    expect(first.get(UI_STORE_TOKEN).state.theme).toBe('dark');
    expect(second.get(UI_STORE_TOKEN).state.theme).toBe('system');
  });
});
