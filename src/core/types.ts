import type {
  Container,
  ExtendedModule,
  ModuleType,
  MultiTokenInterface,
  Provider,
} from '@tinkoff/dippy';

/**
 * A single unit of work registered on a command line. Returning a promise makes the runner await
 * it before the line is considered finished.
 */
export type Command = () => unknown;

/** A command line is a multi token — every provider registered on it contributes one command. */
export type CommandLine = MultiTokenInterface<Command>;

/**
 * Where the lifecycle runs:
 *
 * - `server` — once per incoming request, inside that request's child container;
 * - `client` — once, while the browser hydrates the server-rendered page;
 * - `spa` — on the client, after every in-app navigation.
 */
export type CommandLineEnv = 'server' | 'client' | 'spa';

/** Ordered lines per environment. Lines run one after another, commands in a line in parallel. */
export type CommandLines = Record<CommandLineEnv, CommandLine[]>;

export interface CommandLineRunner {
  /** Executes every line of the environment in order, against the given container. */
  run(env: CommandLineEnv, di: Container): Promise<Container>;
}

export interface AppInfo {
  appName: string;
}

export type ModuleList = (ModuleType | ExtendedModule)[];

export interface AppOptions {
  /** Human readable application name, exposed through `APP_INFO_TOKEN`. */
  name: string;
  /** Modules to register. Their `imports` are traversed automatically. */
  modules?: ModuleList;
  /** Application level providers. Registered after modules, so they can override module providers. */
  providers?: Provider[];
}
