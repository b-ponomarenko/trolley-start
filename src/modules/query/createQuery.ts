import type { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import type { Container, ProvideDepsIterator, ProviderDeps } from '@tinkoff/dippy';

/** Options a query may declare, minus the two the framework owns. */
export type DeclaredQueryOptions<Data> = Omit<
  UseQueryOptions<Data, Error, Data, QueryKey>,
  'queryKey' | 'queryFn'
>;

export interface QueryContext {
  /** Abort signal of the TanStack Query fetch — pass it to the HTTP client. */
  signal: AbortSignal;
}

export type QueryFn<Deps extends ProviderDeps, Params extends unknown[], Result> = (
  this: ProvideDepsIterator<Deps> & QueryContext,
  ...params: Params
) => Result;

export interface CreateQueryOptions<Deps extends ProviderDeps, Params extends unknown[], Result> {
  /** A static key, or a builder invoked with the params passed to `useQuery`. */
  key: QueryKey | ((...params: Params) => QueryKey);
  /**
   * The fetcher. Declared dependencies (and the abort `signal`) are bound to `this`, so write it as
   * a regular (non-arrow) function:
   *
   * ```ts
   * fn(id: number) {
   *   return this.api.get(`/character/${id}`, { signal: this.signal });
   * }
   * ```
   */
  fn: QueryFn<Deps, Params, Result>;
  /** Any other TanStack Query option. */
  queryOptions?: DeclaredQueryOptions<Awaited<Result>>;
  /** DI tokens resolved — from the request container — and bound to `this` inside `fn`. */
  deps?: Deps;
}

export interface Query<
  Deps extends ProviderDeps = {},
  Params extends unknown[] = [],
  Result = unknown,
> {
  readonly kind: 'query';
  readonly deps: Deps;
  readonly fn: QueryFn<Deps, Params, Result>;
  readonly queryOptions: DeclaredQueryOptions<Awaited<Result>> | undefined;
  key(...params: Params): QueryKey;
}

/**
 * Declares a query once, next to its dependencies, and reuses it from components and loaders.
 *
 * ```ts
 * export const characterQuery = createQuery({
 *   key: (id: number) => ['character', id],
 *   fn(id: number) { return this.api.getCharacter(id, this.signal); },
 *   deps: { api: RICK_AND_MORTY_API_TOKEN },
 * });
 * ```
 */
export function createQuery<
  Deps extends ProviderDeps = {},
  Params extends unknown[] = [],
  Result = unknown,
>({
  key,
  fn,
  queryOptions,
  deps,
}: CreateQueryOptions<Deps, Params, Result>): Query<Deps, Params, Result> {
  const buildKey = typeof key === 'function' ? key : () => key;

  return {
    kind: 'query',
    deps: deps ?? ({} as Deps),
    fn,
    queryOptions,
    key: (...params: Params) => buildKey(...params),
  };
}

/**
 * Turns a query plus resolved dependencies into plain TanStack Query options. The key and the
 * fetcher are applied last, so a query can never override them through `queryOptions`.
 */
export function toQueryOptions<Deps extends ProviderDeps, Params extends unknown[], Result>(
  query: Query<Deps, Params, Result>,
  deps: ProvideDepsIterator<Deps>,
  params: Params
) {
  return {
    ...query.queryOptions,
    queryKey: query.key(...params),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      Promise.resolve(query.fn.apply({ ...deps, signal }, params)) as Promise<Awaited<Result>>,
  };
}

/** Same as `toQueryOptions`, resolving the dependencies from a container. */
export function queryOptionsFor<Deps extends ProviderDeps, Params extends unknown[], Result>(
  di: Container,
  query: Query<Deps, Params, Result>,
  ...params: Params
) {
  return toQueryOptions(query, di.getOfDeps(query.deps), params);
}
