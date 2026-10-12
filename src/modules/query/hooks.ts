import {
  useInfiniteQuery as useReactInfiniteQuery,
  useQuery as useReactQuery,
  useSuspenseInfiniteQuery as useReactSuspenseInfiniteQuery,
  useSuspenseQuery as useReactSuspenseQuery,
} from '@tanstack/react-query';
import type {
  InfiniteData,
  UseInfiniteQueryResult,
  UseQueryResult,
  UseSuspenseInfiniteQueryResult,
  UseSuspenseQueryResult,
} from '@tanstack/react-query';
import type { ProviderDeps } from '@tinkoff/dippy';
import { useDiDeps, useDiToken } from '../../core/di';
import { toQueryOptions } from './createQuery';
import type { Query } from './createQuery';
import { toInfiniteQueryOptions } from './createInfiniteQuery';
import type { InfiniteQuery } from './createInfiniteQuery';
import { QUERY_CLIENT_TOKEN } from './tokens';

/**
 * Runs a query declared with `createQuery`, resolving its dependencies from the container the tree
 * was rendered with (the request container during SSR).
 */
export function useQuery<Deps extends ProviderDeps, Params extends unknown[], Result>(
  query: Query<Deps, Params, Result>,
  ...params: Params
): UseQueryResult<Awaited<Result>, Error> {
  const deps = useDiDeps(query.deps);

  return useReactQuery(toQueryOptions(query, deps, params));
}

/**
 * Suspense flavour of `useQuery`. During SSR the component suspends, the shell is streamed
 * immediately and this part of the page follows as soon as the data is there.
 */
export function useSuspenseQuery<Deps extends ProviderDeps, Params extends unknown[], Result>(
  query: Query<Deps, Params, Result>,
  ...params: Params
): UseSuspenseQueryResult<Awaited<Result>, Error> {
  const deps = useDiDeps(query.deps);

  return useReactSuspenseQuery(toQueryOptions(query, deps, params));
}

export function useInfiniteQuery<
  Deps extends ProviderDeps,
  Params extends unknown[],
  Page,
  PageParam,
>(
  query: InfiniteQuery<Deps, Params, Page, PageParam>,
  ...params: Params
): UseInfiniteQueryResult<InfiniteData<Page, PageParam>, Error> {
  const deps = useDiDeps(query.deps);

  return useReactInfiniteQuery(toInfiniteQueryOptions(query, deps, params));
}

export function useSuspenseInfiniteQuery<
  Deps extends ProviderDeps,
  Params extends unknown[],
  Page,
  PageParam,
>(
  query: InfiniteQuery<Deps, Params, Page, PageParam>,
  ...params: Params
): UseSuspenseInfiniteQueryResult<InfiniteData<Page, PageParam>, Error> {
  const deps = useDiDeps(query.deps);

  return useReactSuspenseInfiniteQuery(toInfiniteQueryOptions(query, deps, params));
}

/** The query client of the current container. */
export function useQueryClient() {
  return useDiToken(QUERY_CLIENT_TOKEN);
}
