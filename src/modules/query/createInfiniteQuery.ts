import type {
  InfiniteData,
  QueryFunctionContext,
  QueryKey,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import type { Container, ProvideDepsIterator, ProviderDeps } from '@tinkoff/dippy';
import type { QueryContext } from './createQuery';

export type DeclaredInfiniteQueryOptions<Page, PageParam> = Omit<
  UseInfiniteQueryOptions<Page, Error, InfiniteData<Page, PageParam>, QueryKey, PageParam>,
  'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam' | 'getPreviousPageParam'
>;

export type InfiniteQueryFn<
  Deps extends ProviderDeps,
  Params extends unknown[],
  Page,
  PageParam,
> = (
  this: ProvideDepsIterator<Deps> & QueryContext,
  pageParam: PageParam,
  ...params: Params
) => Promise<Page>;

export interface CreateInfiniteQueryOptions<
  Deps extends ProviderDeps,
  Params extends unknown[],
  Page,
  PageParam,
> {
  key: QueryKey | ((...params: Params) => QueryKey);
  /** Loads one page. `pageParam` comes first so the query params can be spread after it. */
  fn: InfiniteQueryFn<Deps, Params, Page, PageParam>;
  initialPageParam: PageParam;
  /** Return `undefined` or `null` when there is no next page. */
  getNextPageParam: (
    lastPage: Page,
    allPages: Page[],
    lastPageParam: PageParam
  ) => PageParam | undefined | null;
  infiniteQueryOptions?: DeclaredInfiniteQueryOptions<Page, PageParam>;
  deps?: Deps;
}

export interface InfiniteQuery<
  Deps extends ProviderDeps = {},
  Params extends unknown[] = [],
  Page = unknown,
  PageParam = unknown,
> extends Omit<CreateInfiniteQueryOptions<Deps, Params, Page, PageParam>, 'key' | 'deps'> {
  readonly kind: 'infinite';
  readonly deps: Deps;
  key(...params: Params): QueryKey;
}

/**
 * Declares a paginated query — the counterpart of tramvai's `createInfiniteQuery`.
 *
 * ```ts
 * export const charactersQuery = createInfiniteQuery({
 *   key: ['characters'],
 *   initialPageParam: 1,
 *   fn(page: number) { return this.api.getCharacters(page, this.signal); },
 *   getNextPageParam: (lastPage) => lastPage.nextPage,
 *   deps: { api: RICK_AND_MORTY_API_TOKEN },
 * });
 * ```
 */
export function createInfiniteQuery<
  Deps extends ProviderDeps = {},
  Params extends unknown[] = [],
  Page = unknown,
  PageParam = unknown,
>({
  key,
  deps,
  ...rest
}: CreateInfiniteQueryOptions<Deps, Params, Page, PageParam>): InfiniteQuery<
  Deps,
  Params,
  Page,
  PageParam
> {
  const buildKey = typeof key === 'function' ? key : () => key;

  return {
    ...rest,
    kind: 'infinite',
    deps: deps ?? ({} as Deps),
    key: (...params: Params) => buildKey(...params),
  };
}

export function toInfiniteQueryOptions<
  Deps extends ProviderDeps,
  Params extends unknown[],
  Page,
  PageParam,
>(
  query: InfiniteQuery<Deps, Params, Page, PageParam>,
  deps: ProvideDepsIterator<Deps>,
  params: Params
) {
  return {
    ...query.infiniteQueryOptions,
    queryKey: query.key(...params),
    initialPageParam: query.initialPageParam,
    getNextPageParam: (lastPage: Page, allPages: Page[], lastPageParam: PageParam) =>
      query.getNextPageParam(lastPage, allPages, lastPageParam) ?? undefined,
    queryFn: ({ pageParam, signal }: QueryFunctionContext<QueryKey, PageParam>) =>
      query.fn.call({ ...deps, signal }, pageParam as PageParam, ...params),
  };
}

export function infiniteQueryOptionsFor<
  Deps extends ProviderDeps,
  Params extends unknown[],
  Page,
  PageParam,
>(di: Container, query: InfiniteQuery<Deps, Params, Page, PageParam>, ...params: Params) {
  return toInfiniteQueryOptions(query, di.getOfDeps(query.deps), params);
}
