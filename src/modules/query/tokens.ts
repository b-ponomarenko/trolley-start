import { createToken, Scope } from '@tinkoff/dippy';
import type { QueryClient, QueryClientConfig } from '@tanstack/react-query';

/**
 * The TanStack Query client. **Request scoped**: every server request gets its own cache, which is
 * dehydrated and streamed to the browser; the browser has one for the whole session.
 */
export const QUERY_CLIENT_TOKEN = createToken<QueryClient>('QUERY_CLIENT_TOKEN', {
  scope: Scope.REQUEST,
});

/** Optional configuration for the query client. */
export const QUERY_CLIENT_OPTIONS_TOKEN = createToken<QueryClientConfig>(
  'QUERY_CLIENT_OPTIONS_TOKEN',
  { scope: Scope.SINGLETON }
);
