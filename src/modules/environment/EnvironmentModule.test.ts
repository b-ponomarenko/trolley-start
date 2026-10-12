import { describe, expect, it } from 'vitest';
import { buildEnvironment } from './EnvironmentModule';

describe('buildEnvironment', () => {
  it('prefers VITE_ prefixed values, then plain ones, then defaults', () => {
    expect(
      buildEnvironment({ VITE_A: 'vite', A: 'plain', B: 'plain' }, [
        { key: 'A' },
        { key: 'B' },
        { key: 'C', default: 'fallback' },
      ])
    ).toEqual({ A: 'vite', B: 'plain', C: 'fallback' });
  });

  it('lists every missing required variable', () => {
    expect(() =>
      buildEnvironment({}, [{ key: 'A' }, { key: 'B' }, { key: 'C', optional: true }])
    ).toThrow('Missing required environment variables: A, B');
  });
});
