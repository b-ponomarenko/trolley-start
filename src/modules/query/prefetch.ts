import type { InfiniteData } from '@tanstack/react-query';
import type { Container, ProviderDeps } from '@tinkoff/dippy';
import { queryOptionsFor } from './createQuery';
import type { Query } from './createQuery';
import { infiniteQueryOptionsFor } from './createInfiniteQuery';
import type { InfiniteQuery } from './createInfiniteQuery';
import { QUERY_CLIENT_TOKEN } from './tokens';

/**
 * Starts a query from a route loader **without waiting for it**. Paired with a suspense hook this
 * is what streams: the server flushes the shell right away, and the data — plus the HTML that
 * needs it — follows in the same response once the request settles.
 *
 * ```ts
 * loader: ({ context }) => { prefetchQuery(context.di, episodesQuery, ids); },
 * ```
 */
export function prefetchQuery<Deps extends ProviderDeps, Params extends unknown[], Result>(
  di: Container,
  query: Query<Deps, Params, Result>,
  ...params: Params
): Promise<void> {
  return di.get(QUERY_CLIENT_TOKEN).prefetchQuery(queryOptionsFor(di, query, ...params));
}

/** Waits for a query — for data the page cannot be rendered without (e.g. its `<title>`). */
export function ensureQueryData<Deps extends ProviderDeps, Params extends unknown[], Result>(
  di: Container,
  query: Query<Deps, Params, Result>,
  ...params: Params
): Promise<Awaited<Result>> {
  return di.get(QUERY_CLIENT_TOKEN).ensureQueryData(queryOptionsFor(di, query, ...params));
}

export function prefetchInfiniteQuery<
  Deps extends ProviderDeps,
  Params extends unknown[],
  Page,
  PageParam,
>(
  di: Container,
  query: InfiniteQuery<Deps, Params, Page, PageParam>,
  ...params: Params
): Promise<void> {
  return di
    .get(QUERY_CLIENT_TOKEN)
    .prefetchInfiniteQuery(infiniteQueryOptionsFor(di, query, ...params));
}

export function ensureInfiniteQueryData<
  Deps extends ProviderDeps,
  Params extends unknown[],
  Page,
  PageParam,
>(
  di: Container,
  query: InfiniteQuery<Deps, Params, Page, PageParam>,
  ...params: Params
): Promise<InfiniteData<Page, PageParam>> {
  return di
    .get(QUERY_CLIENT_TOKEN)
    .ensureInfiniteQueryData(infiniteQueryOptionsFor(di, query, ...params));
}
