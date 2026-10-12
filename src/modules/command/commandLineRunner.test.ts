import { describe, expect, it } from 'vitest';
import { createContainer, createToken, provide } from '@tinkoff/dippy';
import type { Command } from '@/core';
import { CommandLineRunner } from './commandLineRunner';

const lineA = createToken<Command>('lineA', { multi: true });
const lineB = createToken<Command>('lineB', { multi: true });
const empty = createToken<Command>('empty', { multi: true });

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('CommandLineRunner', () => {
  it('runs lines sequentially and the commands of one line in parallel', async () => {
    const events: string[] = [];
    const di = createContainer([
      provide({
        provide: lineA,
        useValue: async () => {
          events.push('a1:start');
          await delay(20);
          events.push('a1:end');
        },
      }),
      provide({
        provide: lineA,
        useValue: async () => {
          events.push('a2:start');
          await delay(5);
          events.push('a2:end');
        },
      }),
      provide({ provide: lineB, useValue: () => events.push('b') }),
    ]);
    const runner = new CommandLineRunner({
      lines: { server: [lineA, empty, lineB], client: [], spa: [] },
    });

    await runner.run('server', di);

    expect(events).toEqual(['a1:start', 'a2:start', 'a2:end', 'a1:end', 'b']);
  });

  it('rejects providers that do not resolve to a function', async () => {
    const di = createContainer([provide({ provide: lineA, useValue: 42 as unknown as Command })]);
    const runner = new CommandLineRunner({ lines: { server: [lineA], client: [], spa: [] } });

    await expect(runner.run('server', di)).rejects.toThrow(TypeError);
  });
});
