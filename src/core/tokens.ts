import { createToken, Scope } from '@tinkoff/dippy';
import type { AppInfo, Command, CommandLineRunner, CommandLines, ModuleList } from './types';

/** Information about the running application. */
export const APP_INFO_TOKEN = createToken<AppInfo>('APP_INFO_TOKEN', { scope: Scope.SINGLETON });

/** The raw module list passed to `createApp`. */
export const MODULES_LIST_TOKEN = createToken<ModuleList>('MODULES_LIST_TOKEN', {
  scope: Scope.SINGLETON,
});

/** The lifecycle runner. Provided by `CommandLineRunnerModule`. */
export const COMMAND_LINE_RUNNER_TOKEN = createToken<CommandLineRunner>(
  'COMMAND_LINE_RUNNER_TOKEN',
  { scope: Scope.SINGLETON }
);

/**
 * Ordered lines per environment. Overriding this token is how an application adds a stage to the
 * lifecycle — the runner has no hardcoded knowledge of any line.
 */
export const COMMAND_LINES_TOKEN = createToken<CommandLines>('COMMAND_LINES_TOKEN', {
  scope: Scope.SINGLETON,
});

/**
 * Lifecycle stages, named after tramvai's. Commands are registered per request (`Scope.REQUEST`,
 * the default), so a command may depend on request-scoped services such as the query client.
 *
 * ```
 * server : customerStart → resolveUserDeps → resolvePageDeps → (TanStack Start streams the page)
 * client : customerStart → resolveUserDeps → resolvePageDeps → (hydration)
 * spa    : afterSpaTransition                                 (after every client navigation)
 * ```
 */
export const commandLineListTokens = {
  /** The request (or the browser session) started. Logging, request-bound config. */
  customerStart: createToken<Command>('commandLineListTokens.customerStart', { multi: true }),
  /** Load data about the current user. */
  resolveUserDeps: createToken<Command>('commandLineListTokens.resolveUserDeps', { multi: true }),
  /** Load data the page needs that is not owned by a route loader. */
  resolvePageDeps: createToken<Command>('commandLineListTokens.resolvePageDeps', { multi: true }),
  /** A client side navigation finished. */
  afterSpaTransition: createToken<Command>('commandLineListTokens.afterSpaTransition', {
    multi: true,
  }),
};
