import { createToken, Scope } from '@tinkoff/dippy';

export interface Logger {
  debug(message: string, ...rest: unknown[]): void;
  info(message: string, ...rest: unknown[]): void;
  warn(message: string, ...rest: unknown[]): void;
  error(message: string, ...rest: unknown[]): void;
}

export type LogLevel = keyof Logger | 'silent';

/** Creates a named logger: `di.get(LOGGER_TOKEN)('router').info(...)`. */
export type LoggerFactory = (name: string) => Logger;

export const LOGGER_TOKEN = createToken<LoggerFactory>('LOGGER_TOKEN', { scope: Scope.SINGLETON });

/** Lowest level that is printed. Defaults to `info` in production and `debug` in development. */
export const LOGGER_LEVEL_TOKEN = createToken<LogLevel>('LOGGER_LEVEL_TOKEN', {
  scope: Scope.SINGLETON,
});
