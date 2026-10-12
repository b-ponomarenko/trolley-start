import { createToken, Scope } from '@tinkoff/dippy';
import type { AnyRouter, RouterConstructorOptions } from '@tanstack/react-router';

/** The router of the current request (or of the browser session). Request scoped. */
export const ROUTER_TOKEN = createToken<AnyRouter>('ROUTER_TOKEN', { scope: Scope.REQUEST });

/** The router options an application may override through DI. */
export type AppRouterOptions = Partial<
  Pick<
    RouterConstructorOptions<never, 'never', false, never, never>,
    | 'defaultPreload'
    | 'defaultPreloadDelay'
    | 'defaultPendingMs'
    | 'defaultPendingMinMs'
    | 'defaultStaleTime'
    | 'scrollRestoration'
    | 'defaultViewTransition'
    | 'defaultErrorComponent'
    | 'defaultNotFoundComponent'
    | 'defaultPendingComponent'
  >
>;

export const ROUTER_OPTIONS_TOKEN = createToken<AppRouterOptions>('ROUTER_OPTIONS_TOKEN', {
  scope: Scope.SINGLETON,
});

/**
 * Integrations applied to a freshly created router, before the lifecycle runs — this is how
 * `TanStackQueryModule` wires its SSR dehydration in without the router knowing about it.
 */
export const ROUTER_PLUGIN_TOKEN = createToken<(router: AnyRouter) => void>('ROUTER_PLUGIN_TOKEN', {
  multi: true,
});
