import { Module, provide, Scope } from '@tinkoff/dippy';
import { ROUTER_OPTIONS_TOKEN } from './tokens';

/**
 * Routing through TanStack Router. The router itself is created per request by `createAppRouter`;
 * this module only provides the overridable defaults.
 */
@Module({
  providers: [
    provide({
      provide: ROUTER_OPTIONS_TOKEN,
      scope: Scope.SINGLETON,
      useValue: { defaultPreload: 'intent', scrollRestoration: true },
    }),
  ],
})
export class RouterModule {}
