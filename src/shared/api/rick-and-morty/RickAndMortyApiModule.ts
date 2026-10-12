import { createToken, Module, provide, Scope } from '@/core';
import { ENVIRONMENT_DEFINITION_TOKEN, ENVIRONMENT_TOKEN } from '@/modules/environment';
import { HTTP_CLIENT_FACTORY_TOKEN, HttpModule } from '@/modules/http';
import { RickAndMortyApi } from './RickAndMortyApi';

export const RICK_AND_MORTY_API_TOKEN = createToken<RickAndMortyApi>('RICK_AND_MORTY_API_TOKEN', {
  scope: Scope.SINGLETON,
});

/**
 * An application level module: declares the environment variable it needs and provides a typed
 * API client built on the framework's HTTP client factory.
 */
@Module({
  imports: [HttpModule],
  providers: [
    provide({
      provide: ENVIRONMENT_DEFINITION_TOKEN,
      useValue: { key: 'RICK_AND_MORTY_API_URL', default: 'https://rickandmortyapi.com/api' },
    }),
    provide({
      provide: RICK_AND_MORTY_API_TOKEN,
      scope: Scope.SINGLETON,
      useFactory: ({ createHttpClient, environment }) =>
        new RickAndMortyApi(
          // A client of its own: a name for logs and errors, and any axios options.
          createHttpClient({
            name: 'rick-and-morty',
            baseURL: environment.RICK_AND_MORTY_API_URL,
            timeout: 10_000,
          })
        ),
      deps: { createHttpClient: HTTP_CLIENT_FACTORY_TOKEN, environment: ENVIRONMENT_TOKEN },
    }),
  ],
})
export class RickAndMortyApiModule {}
