export { App, createApp } from './createApp';
export { DiProvider, useDi, useDiDeps, useDiToken } from './di';
export type { DiProviderProps } from './di';
export {
  APP_INFO_TOKEN,
  COMMAND_LINE_RUNNER_TOKEN,
  COMMAND_LINES_TOKEN,
  commandLineListTokens,
  MODULES_LIST_TOKEN,
} from './tokens';
export type {
  AppInfo,
  AppOptions,
  Command,
  CommandLine,
  CommandLineEnv,
  CommandLineRunner,
  CommandLines,
  ModuleList,
} from './types';

/* DI primitives are re-exported so application and module code has a single import source. */
export {
  createChildContainer,
  createContainer,
  createToken,
  declareModule,
  DI_TOKEN,
  Module,
  optional,
  provide,
  Scope,
} from '@tinkoff/dippy';
export type {
  BaseTokenInterface,
  Container,
  ExtendedModule,
  ExtractDependencyType,
  ExtractTokenType,
  ModuleType,
  MultiTokenInterface,
  Provider,
  ProviderDeps,
  ProvideDepsIterator,
  TokenInterface,
} from '@tinkoff/dippy';
