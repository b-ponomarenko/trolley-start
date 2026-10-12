import type { Container } from '@tinkoff/dippy';

/**
 * Context every route receives. Handing the request container to the router is what lets loaders
 * reach DI-provided services:
 *
 * ```ts
 * loader: ({ context, params }) => ensureQueryData(context.di, characterQuery, Number(params.id)),
 * ```
 */
export interface RouterContext {
  di: Container;
}
