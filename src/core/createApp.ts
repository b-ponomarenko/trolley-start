import { createChildContainer, createContainer, provide, Scope } from '@tinkoff/dippy';
import type { Container, Provider } from '@tinkoff/dippy';
import { APP_INFO_TOKEN, COMMAND_LINE_RUNNER_TOKEN, MODULES_LIST_TOKEN } from './tokens';
import type { AppOptions, CommandLineEnv } from './types';

const MISSING_RUNNER_MESSAGE =
  '`COMMAND_LINE_RUNNER_TOKEN` is not defined. Add `CommandLineRunnerModule` to the `modules` list of `createApp`.';

const appProviders = ({ name, modules = [] }: AppOptions): Provider[] => [
  provide({ provide: APP_INFO_TOKEN, scope: Scope.SINGLETON, useValue: { appName: name } }),
  provide({ provide: MODULES_LIST_TOKEN, scope: Scope.SINGLETON, useValue: modules }),
];

/**
 * A configured application.
 *
 * Holds the **root** container: every provider is registered there once, and `Scope.SINGLETON`
 * values live there for the lifetime of the process. Each request (and the browser session) gets
 * its own **child** container from `fork()`, where `Scope.REQUEST` values — the query client, the
 * router, request-bound commands — are instantiated. That is the same split tramvai uses, and it is
 * what keeps one user's data out of another user's server render.
 */
export class App {
  readonly di: Container;

  readonly name: string;

  private readonly modules: NonNullable<AppOptions['modules']>;

  private modulesResolved = false;

  constructor(options: AppOptions) {
    const { modules = [], providers = [] } = options;

    // `createContainer` registers `DI_TOKEN` -> the container itself.
    this.di = createContainer();
    this.name = options.name;
    this.modules = modules;

    // 1. framework level providers
    appProviders(options).forEach((item) => this.di.register(item));

    // 2. module providers, `imports` traversed and de-duplicated by dippy's module walker.
    this.di.prepareModules(modules);

    // 3. application providers last, so an application can override anything a module provides.
    providers.forEach((item) => this.di.register(item));
  }

  /**
   * Creates the container of one request (on the server) or of the browser session (on the client).
   * `extraProviders` are registered into the child only — e.g. the router created for this request.
   */
  fork(extraProviders: Provider[] = []): Container {
    return createChildContainer(this.di, extraProviders);
  }

  /**
   * Runs the lifecycle of `env` against a forked container. Module classes are instantiated once,
   * after the first run, so a module constructor may read state produced by the lifecycle.
   */
  async run(env: CommandLineEnv, di: Container): Promise<Container> {
    const runner = di.get({ token: COMMAND_LINE_RUNNER_TOKEN, optional: true });

    if (!runner) {
      throw new Error(this.describeMissingRunner(di));
    }

    await runner.run(env, di);

    if (!this.modulesResolved) {
      this.modulesResolved = true;
      this.di.resolveModules();
    }

    return di;
  }

  /** `optional: true` hides the underlying resolution error; re-resolve to recover it. */
  private describeMissingRunner(di: Container): string {
    if (this.modules.length === 0) {
      return MISSING_RUNNER_MESSAGE;
    }

    try {
      di.get(COMMAND_LINE_RUNNER_TOKEN);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);

      return `${MISSING_RUNNER_MESSAGE}\n\nProvider resolve error:\n${reason}`;
    }

    return MISSING_RUNNER_MESSAGE;
  }
}

/**
 * Entry point of an application — the counterpart of tramvai's `createApp`.
 *
 * ```ts
 * export const app = createApp({
 *   name: 'rick-and-morty',
 *   modules: [CommonModule, HttpModule, TanStackQueryModule, RouterModule],
 *   providers: [provide({ provide: tokenA, useValue: 'foobar' })],
 * });
 * ```
 *
 * Unlike a client-only app nothing runs here: TanStack Start calls `getRouter()` per request, and
 * that is where a container is forked and the lifecycle runs (see `createAppRouter`).
 */
export function createApp(options: AppOptions): App {
  return new App(options);
}
