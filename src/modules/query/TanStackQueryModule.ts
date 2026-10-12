import { QueryClient } from '@tanstack/react-query';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { Module, optional, provide, Scope } from '@tinkoff/dippy';
import type { QueryClientConfig } from '@tanstack/react-query';
import { ROUTER_PLUGIN_TOKEN } from '../router/tokens';
import { QUERY_CLIENT_OPTIONS_TOKEN, QUERY_CLIENT_TOKEN } from './tokens';

const statusOf = (error: unknown): number | undefined =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof error.status === 'number'
    ? error.status
    : undefined;

/**
 * Retries what may succeed on a second attempt — network failures (a rate-limited response without
 * CORS headers surfaces as one in the browser), `429` and `5xx` — and never a definitive `4xx`.
 */
export const createRetryPolicy =
  (maxRetries: number) =>
  (failureCount: number, error: unknown): boolean => {
    const status = statusOf(error);

    if (status !== undefined && status < 500 && status !== 429) {
      return false;
    }

    return failureCount < maxRetries;
  };

export const shouldRetry = createRetryPolicy(3);

export const defaultQueryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Data rendered on the server must not be refetched the moment the client hydrates.
      staleTime: 60_000,
      // The server retries once so a flaky backend cannot hold the response for long; the browser
      // can afford to be patient.
      retry: import.meta.env.SSR ? createRetryPolicy(1) : shouldRetry,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: false,
    },
  },
};

/**
 * Data fetching through TanStack Query.
 *
 * Creates one client per request container and plugs it into the router with
 * `setupRouterSsrQueryIntegration`, which dehydrates the cache into the streamed HTML — including
 * queries that settle *after* the shell was flushed — and wraps the app in `QueryClientProvider`.
 */
@Module({
  providers: [
    provide({
      provide: QUERY_CLIENT_TOKEN,
      scope: Scope.REQUEST,
      useFactory: ({ options }) => new QueryClient(options ?? defaultQueryClientConfig),
      deps: { options: optional(QUERY_CLIENT_OPTIONS_TOKEN) },
    }),
    provide({
      provide: ROUTER_PLUGIN_TOKEN,
      scope: Scope.REQUEST,
      useFactory:
        ({ queryClient }) =>
        (router) =>
          setupRouterSsrQueryIntegration({ router, queryClient }),
      deps: { queryClient: QUERY_CLIENT_TOKEN },
    }),
  ],
})
export class TanStackQueryModule {}
