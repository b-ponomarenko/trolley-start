import { describe, expect, it, vi } from 'vitest';
import { commandLineListTokens, createApp, createToken, Module, provide, Scope } from '@/core';
import { CommonModule } from '@/modules';

const SINGLETON_TOKEN = createToken<object>('singleton', { scope: Scope.SINGLETON });
const REQUEST_TOKEN = createToken<object>('request', { scope: Scope.REQUEST });
const VALUE_TOKEN = createToken<string>('value');

@Module({
  providers: [
    provide({ provide: SINGLETON_TOKEN, scope: Scope.SINGLETON, useFactory: () => ({}) }),
    provide({ provide: REQUEST_TOKEN, scope: Scope.REQUEST, useFactory: () => ({}) }),
    provide({ provide: VALUE_TOKEN, useValue: 'from module' }),
  ],
})
class TestModule {}

describe('createApp', () => {
  it('shares singletons and isolates request scoped values between forks', () => {
    const app = createApp({ name: 'test', modules: [TestModule] });
    const first = app.fork();
    const second = app.fork();

    expect(first.get(SINGLETON_TOKEN)).toBe(second.get(SINGLETON_TOKEN));
    expect(first.get(REQUEST_TOKEN)).not.toBe(second.get(REQUEST_TOKEN));
    expect(first.get(REQUEST_TOKEN)).toBe(first.get(REQUEST_TOKEN));
  });

  it('lets application providers override module providers', () => {
    const app = createApp({
      name: 'test',
      modules: [TestModule],
      providers: [provide({ provide: VALUE_TOKEN, useValue: 'from app' })],
    });

    expect(app.fork().get(VALUE_TOKEN)).toBe('from app');
  });

  it('runs the lines of the requested environment in order, inside the given container', async () => {
    const calls: string[] = [];
    const app = createApp({
      name: 'test',
      modules: [CommonModule, TestModule],
      providers: [
        provide({
          provide: commandLineListTokens.resolvePageDeps,
          useFactory: () => () => calls.push('page'),
        }),
        provide({
          provide: commandLineListTokens.customerStart,
          useFactory:
            ({ request }) =>
            () =>
              calls.push(`start:${typeof request}`),
          deps: { request: REQUEST_TOKEN },
        }),
        provide({
          provide: commandLineListTokens.afterSpaTransition,
          useFactory: () => () => calls.push('spa'),
        }),
      ],
    });

    await app.run('server', app.fork());
    expect(calls).toEqual(['start:object', 'page']);

    await app.run('spa', app.fork());
    expect(calls).toEqual(['start:object', 'page', 'spa']);
  });

  it('aborts the lifecycle on the first failing command', async () => {
    const later = vi.fn();
    const app = createApp({
      name: 'test',
      modules: [CommonModule],
      providers: [
        provide({
          provide: commandLineListTokens.customerStart,
          useFactory: () => () => Promise.reject(new Error('boom')),
        }),
        provide({ provide: commandLineListTokens.resolvePageDeps, useFactory: () => later }),
      ],
    });

    await expect(app.run('client', app.fork())).rejects.toThrow('boom');
    expect(later).not.toHaveBeenCalled();
  });

  it('explains how to fix a missing command line runner', async () => {
    const app = createApp({ name: 'test' });

    await expect(app.run('server', app.fork())).rejects.toThrow('CommandLineRunnerModule');
  });
});
