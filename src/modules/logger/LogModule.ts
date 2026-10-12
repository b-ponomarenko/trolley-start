import { Module, optional, provide, Scope } from '@tinkoff/dippy';
import { LOGGER_LEVEL_TOKEN, LOGGER_TOKEN } from './tokens';
import type { Logger, LoggerFactory, LogLevel } from './tokens';

const ORDER: LogLevel[] = ['debug', 'info', 'warn', 'error', 'silent'];

export const createConsoleLogger =
  (level: LogLevel): LoggerFactory =>
  (name) => {
    const threshold = ORDER.indexOf(level);
    const write =
      (method: keyof Logger) =>
      (message: string, ...rest: unknown[]) => {
        if (ORDER.indexOf(method) >= threshold) {
          // eslint-disable-next-line no-console -- this is the console logger
          console[method](`[${name}] ${message}`, ...rest);
        }
      };

    return {
      debug: write('debug'),
      info: write('info'),
      warn: write('warn'),
      error: write('error'),
    };
  };

/** Named console logger behind `LOGGER_TOKEN`; swap the provider to ship logs elsewhere. */
@Module({
  providers: [
    provide({
      provide: LOGGER_TOKEN,
      scope: Scope.SINGLETON,
      useFactory: ({ level }) =>
        createConsoleLogger(level ?? (import.meta.env.DEV ? 'debug' : 'info')),
      deps: { level: optional(LOGGER_LEVEL_TOKEN) },
    }),
  ],
})
export class LogModule {}
