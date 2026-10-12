import { createRouter } from '@tanstack/react-router';
import type { AnyRoute } from '@tanstack/react-router';
import { Scope } from '@tinkoff/dippy';
import type { App } from '../../core/createApp';
import { LOGGER_TOKEN } from '../logger/tokens';
import { composeRender } from '../render/composeRender';
import { EXTEND_RENDER } from '../render/tokens';
import type { RouterContext } from './context';
import { ROUTER_OPTIONS_TOKEN, ROUTER_PLUGIN_TOKEN, ROUTER_TOKEN } from './tokens';

/**
 * The bridge between the application and TanStack Start — what `src/router.tsx` exports as
 * `getRouter`. Start calls it **once per server request** and **once in the browser**, so it is the
 * natural place for the per-request half of the lifecycle:
 *
 * 1. fork a child container from the application's root container;
 * 2. create the router with that container as route context, and wrap the tree in `DiProvider` and
 *    every `EXTEND_RENDER` wrapper;
 * 3. register it as `ROUTER_TOKEN` and apply `ROUTER_PLUGIN_TOKEN` integrations (query SSR);
 * 4. run the `server` / `client` command lines and only then hand the router to Start, which loads
 *    the matched routes and streams the HTML;
 * 5. in the browser, run the `spa` lines after every navigation.
 */
export async function createAppRouter<TRouteTree extends AnyRoute>(
  app: App,
  routeTree: TRouteTree
) {
  const isServer = import.meta.env.SSR;
  const di = app.fork();
  const options = di.get({ token: ROUTER_OPTIONS_TOKEN, optional: true });
  const extendRender = di.get({ token: EXTEND_RENDER, optional: true });
  const context: RouterContext = { di };

  const router = createRouter({
    routeTree,
    context,
    defaultPreload: 'intent',
    // TanStack Query owns caching; the router should not add a second layer of staleness.
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    ...options,
    Wrap: ({ children }) => composeRender(di, extendRender, children),
  });

  di.register({ provide: ROUTER_TOKEN, useValue: router, scope: Scope.REQUEST });

  for (const plugin of di.get({ token: ROUTER_PLUGIN_TOKEN, optional: true }) ?? []) {
    plugin(router);
  }

  await app.run(isServer ? 'server' : 'client', di);

  if (!isServer) {
    const logger = di.get(LOGGER_TOKEN)('router');

    router.subscribe('onResolved', (event) => {
      if (event.fromLocation && event.hrefChanged) {
        app.run('spa', di).catch((error: unknown) => logger.error('spa lifecycle failed', error));
      }
    });
  }

  return router;
}

export type AppRouter<TRouteTree extends AnyRoute = AnyRoute> = Awaited<
  ReturnType<typeof createAppRouter<TRouteTree>>
>;
