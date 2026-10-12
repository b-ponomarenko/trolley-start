import { commandLineListTokens, createApp, provide } from '@/core';
import {
  CommonModule,
  LOGGER_TOKEN,
  LAYOUT_OPTIONS_TOKEN,
  RenderModule,
  ROUTER_OPTIONS_TOKEN,
  TanStackQueryModule,
  UIStoreModule,
} from '@/modules';
import { RickAndMortyApiModule } from '@/shared/api/rick-and-morty';
import { LoadError } from '@/shared/ui/load-error';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { AppHeader } from '@/widgets/app-header/AppHeader';
import { AppLayout } from '@/widgets/app-layout/AppLayout';

/**
 * The application: modules plus app-level providers, registered in one root container. Every
 * request forks a child of it — see `src/router.tsx`.
 */
export const app = createApp({
  name: 'rick-and-morty',
  modules: [CommonModule, RenderModule, TanStackQueryModule, UIStoreModule, RickAndMortyApiModule],
  providers: [
    // The root layout: our arrangement and header, and the global providers it needs.
    provide({
      provide: LAYOUT_OPTIONS_TOKEN,
      useValue: {
        components: { layout: AppLayout, header: AppHeader },
        wrappers: [TooltipProvider],
      },
    }),
    // App providers override module ones: same defaults as RouterModule, plus our error screen.
    provide({
      provide: ROUTER_OPTIONS_TOKEN,
      useValue: {
        defaultPreload: 'intent',
        scrollRestoration: true,
        defaultErrorComponent: LoadError,
      },
    }),
    // A lifecycle hook: runs for every server request, and once in the browser before hydration.
    provide({
      provide: commandLineListTokens.customerStart,
      useFactory:
        ({ logger }) =>
        () =>
          logger('app').debug(import.meta.env.SSR ? 'server request started' : 'client started'),
      deps: { logger: LOGGER_TOKEN },
    }),
  ],
});
