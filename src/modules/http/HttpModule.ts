import { Module, optional, provide, Scope } from '@tinkoff/dippy';
import type { CreateAxiosDefaults } from 'axios';
import { LogModule } from '../logger/LogModule';
import { LOGGER_TOKEN } from '../logger/tokens';
import type { LoggerFactory } from '../logger/tokens';
import { HttpClient } from './HttpClient';
import type { HttpClientOptions } from './HttpClient';
import {
  HTTP_CLIENT_DEFAULTS_TOKEN,
  HTTP_CLIENT_FACTORY_TOKEN,
  HTTP_CLIENT_OPTIONS_TOKEN,
  HTTP_CLIENT_TOKEN,
} from './tokens';

const BUILT_IN_DEFAULTS: CreateAxiosDefaults = {
  timeout: 15_000,
  headers: { Accept: 'application/json' },
};

/** Defaults first, then the client's own options; headers are merged rather than replaced. */
export const createHttpClient = (
  options: HttpClientOptions,
  defaults: CreateAxiosDefaults = BUILT_IN_DEFAULTS,
  logger?: LoggerFactory | null
): HttpClient =>
  new HttpClient(
    {
      ...defaults,
      ...options,
      headers: { ...defaults.headers, ...options.headers } as CreateAxiosDefaults['headers'],
    },
    logger?.(`http:${options.name}`)
  );

/**
 * HTTP on axios — the counterpart of tramvai's http-client module. Consumers depend on tokens, not
 * on axios, which keeps the transport swappable and easy to stub.
 *
 * - `HTTP_CLIENT_TOKEN` — the default client (`HTTP_CLIENT_OPTIONS_TOKEN` configures it);
 * - `HTTP_CLIENT_FACTORY_TOKEN` — `factory({ name, ...axiosOptions })` for a client of your own;
 * - `HTTP_CLIENT_DEFAULTS_TOKEN` — options shared by every client.
 *
 * Every client logs its requests through `LOGGER_TOKEN` as `http:<name>`.
 */
@Module({
  imports: [LogModule],
  providers: [
    provide({
      provide: HTTP_CLIENT_FACTORY_TOKEN,
      scope: Scope.SINGLETON,
      useFactory:
        ({ defaults, logger }) =>
        (options) =>
          createHttpClient(
            options,
            {
              ...BUILT_IN_DEFAULTS,
              ...defaults,
              headers: { ...BUILT_IN_DEFAULTS.headers, ...defaults?.headers },
            } as CreateAxiosDefaults,
            logger
          ),
      deps: { defaults: optional(HTTP_CLIENT_DEFAULTS_TOKEN), logger: LOGGER_TOKEN },
    }),
    provide({
      provide: HTTP_CLIENT_TOKEN,
      scope: Scope.SINGLETON,
      useFactory: ({ factory, options }) => factory({ ...options, name: 'default' }),
      deps: { factory: HTTP_CLIENT_FACTORY_TOKEN, options: optional(HTTP_CLIENT_OPTIONS_TOKEN) },
    }),
  ],
})
export class HttpModule {}
