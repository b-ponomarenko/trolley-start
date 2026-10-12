import { createToken, Scope } from '@tinkoff/dippy';
import type { CreateAxiosDefaults } from 'axios';
import type { HttpClient, HttpClientOptions } from './HttpClient';

export type HttpClientFactory = (options: HttpClientOptions) => HttpClient;

/**
 * Creates a named client — one per backend, each with its own axios options:
 *
 * ```ts
 * useFactory: ({ factory }) =>
 *   factory({ name: 'rick-and-morty', baseURL: 'https://rickandmortyapi.com/api', timeout: 5_000 }),
 * ```
 */
export const HTTP_CLIENT_FACTORY_TOKEN = createToken<HttpClientFactory>(
  'HTTP_CLIENT_FACTORY_TOKEN',
  { scope: Scope.SINGLETON }
);

/** The default client, for requests that do not deserve a client of their own. */
export const HTTP_CLIENT_TOKEN = createToken<HttpClient>('HTTP_CLIENT_TOKEN', {
  scope: Scope.SINGLETON,
});

/** Axios options of the default client (`baseURL`, headers, …). */
export const HTTP_CLIENT_OPTIONS_TOKEN = createToken<CreateAxiosDefaults>(
  'HTTP_CLIENT_OPTIONS_TOKEN',
  { scope: Scope.SINGLETON }
);

/** Axios options merged into **every** client the factory creates — timeouts, common headers. */
export const HTTP_CLIENT_DEFAULTS_TOKEN = createToken<CreateAxiosDefaults>(
  'HTTP_CLIENT_DEFAULTS_TOKEN',
  { scope: Scope.SINGLETON }
);
