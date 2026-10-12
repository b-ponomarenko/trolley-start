import type { Container } from '@tinkoff/dippy';
import type {
  Command,
  CommandLine,
  CommandLineEnv,
  CommandLineRunner as CommandLineRunnerInterface,
  CommandLines,
} from '../../core/types';
import type { Logger } from '../logger/tokens';

export interface CommandLineRunnerDeps {
  lines: CommandLines;
  logger?: Logger | null;
}

const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now());

/**
 * Executes the application lifecycle.
 *
 * The runner knows nothing about the meaning of the lines it walks. For the requested environment
 * it takes the ordered list of multi tokens and resolves the commands **from the container it is
 * given** — the request's child container — so commands are request-scoped:
 *
 * - lines are executed **sequentially**;
 * - commands inside a line are executed **in parallel**;
 * - a line without registered commands is skipped;
 * - the first failure aborts the run, later lines never start.
 */
export class CommandLineRunner implements CommandLineRunnerInterface {
  private readonly lines: CommandLines;

  private readonly logger: Logger | null;

  constructor({ lines, logger }: CommandLineRunnerDeps) {
    this.lines = lines;
    this.logger = logger ?? null;
  }

  async run(env: CommandLineEnv, di: Container): Promise<Container> {
    for (const line of this.lines[env] ?? []) {
      // eslint-disable-next-line no-await-in-loop -- lines are sequential by design
      await this.runLine(line, di);
    }

    return di;
  }

  private async runLine(line: CommandLine, di: Container): Promise<void> {
    const commands = di.get({ token: line, optional: true });

    if (!commands || commands.length === 0) {
      return;
    }

    const startedAt = now();

    await Promise.all(commands.map((command) => this.execute(command, line)));

    this.logger?.debug(
      `${line.toString()} — ${commands.length} command(s) in ${(now() - startedAt).toFixed(1)}ms`
    );
  }

  private async execute(command: Command, line: CommandLine): Promise<void> {
    if (typeof command !== 'function') {
      throw new TypeError(
        `Expected a function in command line "${line.toString()}", received "${String(command)}". ` +
          'Check that every provider registered on a command line resolves to a function.'
      );
    }

    await command();
  }
}
