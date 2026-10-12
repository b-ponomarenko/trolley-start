import { Module, provide, Scope } from '@tinkoff/dippy';
import { COMMAND_LINE_RUNNER_TOKEN, COMMAND_LINES_TOKEN } from '../../core/tokens';
import { LOGGER_TOKEN } from '../logger/tokens';
import { LogModule } from '../logger/LogModule';
import { CommandLineRunner } from './commandLineRunner';
import { lines } from './defaultLines';

/** Provides the lifecycle runner. Every application must include it (through `CommonModule`). */
@Module({
  imports: [LogModule],
  providers: [
    provide({ provide: COMMAND_LINES_TOKEN, scope: Scope.SINGLETON, useValue: lines }),
    provide({
      provide: COMMAND_LINE_RUNNER_TOKEN,
      scope: Scope.SINGLETON,
      useFactory: ({ lines: configured, logger }) =>
        new CommandLineRunner({ lines: configured, logger: logger('command-line') }),
      deps: { lines: COMMAND_LINES_TOKEN, logger: LOGGER_TOKEN },
    }),
  ],
})
export class CommandLineRunnerModule {}
