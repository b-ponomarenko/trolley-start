import { Module } from '@tinkoff/dippy';
import { CommandLineRunnerModule } from './command/CommandLineRunnerModule';
import { EnvironmentModule } from './environment/EnvironmentModule';
import { LogModule } from './logger/LogModule';
import { RouterModule } from './router/RouterModule';

/**
 * The modules every application needs — the counterpart of tramvai's `CommonModule`.
 * `HttpModule` and `TanStackQueryModule` stay opt-in.
 */
@Module({
  imports: [CommandLineRunnerModule, LogModule, EnvironmentModule, RouterModule],
  providers: [],
})
export class CommonModule {}
