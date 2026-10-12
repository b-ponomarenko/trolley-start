import { describe, expect, it, vi } from 'vitest';
import { createContainer, createToken, provide } from '@tinkoff/dippy';
import { QueryClient } from '@tanstack/react-query';
import { createInfiniteQuery, toInfiniteQueryOptions } from './createInfiniteQuery';
import { createQuery } from './createQuery';
import { ensureInfiniteQueryData, ensureQueryData } from './prefetch';
import { QUERY_CLIENT_TOKEN } from './tokens';
import { shouldRetry } from './TanStackQueryModule';

const API_TOKEN = createToken<{ get(id: number): Promise<string> }>('api');

const setup = () => {
  const api = { get: vi.fn(async (id: number) => `item ${id}`) };
  const di = createContainer([
    provide({ provide: API_TOKEN, useValue: api }),
    provide({ provide: QUERY_CLIENT_TOKEN, useValue: new QueryClient() }),
  ]);

  return { api, di };
};

describe('createQuery', () => {
  it('binds declared dependencies and the abort signal to `this`', async () => {
    const { api, di } = setup();
    let signal: AbortSignal | undefined;
    const query = createQuery({
      key: (id: number) => ['item', id],
      fn(id: number) {
        signal = this.signal;

        return this.api.get(id);
      },
      deps: { api: API_TOKEN },
    });

    await expect(ensureQueryData(di, query, 7)).resolves.toBe('item 7');
    expect(api.get).toHaveBeenCalledWith(7);
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(query.key(7)).toEqual(['item', 7]);
  });

  it('serves the second call from the cache of the container', async () => {
    const { api, di } = setup();
    const query = createQuery({
      key: ['static'],
      fn() {
        return this.api.get(1);
      },
      deps: { api: API_TOKEN },
    });

    await ensureQueryData(di, query);
    await ensureQueryData(di, query);

    expect(api.get).toHaveBeenCalledTimes(1);
  });
});

describe('createInfiniteQuery', () => {
  it('passes the page param first and stops when getNextPageParam returns null', async () => {
    const { di } = setup();
    const fn = vi.fn(async (page: number, size: number) => ({
      page,
      size,
      next: page < 2 ? page + 1 : null,
    }));
    const query = createInfiniteQuery({
      key: (size: number) => ['pages', size],
      initialPageParam: 1,
      fn(page: number, size: number) {
        return fn(page, size);
      },
      getNextPageParam: (lastPage) => lastPage.next,
    });

    const data = await ensureInfiniteQueryData(di, query, 20);

    expect(data.pages).toEqual([{ page: 1, size: 20, next: 2 }]);
    expect(fn).toHaveBeenCalledWith(1, 20);

    const options = toInfiniteQueryOptions(query, {}, [20]);
    const all = await di.get(QUERY_CLIENT_TOKEN).fetchInfiniteQuery({ ...options, pages: 3 });

    expect(all.pages.map((page) => page.page)).toEqual([1, 2]);
  });
});

describe('shouldRetry', () => {
  it('retries network failures, 429 and 5xx, but not other 4xx', () => {
    expect(shouldRetry(0, new TypeError('Failed to fetch'))).toBe(true);
    expect(shouldRetry(0, { status: 429 })).toBe(true);
    expect(shouldRetry(0, { status: 503 })).toBe(true);
    expect(shouldRetry(0, { status: 404 })).toBe(false);
    expect(shouldRetry(3, { status: 503 })).toBe(false);
  });
});
