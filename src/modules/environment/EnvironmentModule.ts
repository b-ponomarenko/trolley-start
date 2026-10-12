import { Module, optional, provide, Scope } from '@tinkoff/dippy';
import type { EnvironmentDefinition } from './tokens';
import {
  ENVIRONMENT_DEFINITION_TOKEN,
  ENVIRONMENT_SOURCE_TOKEN,
  ENVIRONMENT_TOKEN,
} from './tokens';

const readValue = (
  source: Record<string, unknown>,
  definition: EnvironmentDefinition
): string | undefined => {
  const candidates = [source[`VITE_${definition.key}`], source[definition.key]];
  const found = candidates.find((value) => typeof value === 'string' && value !== '');

  return (found as string | undefined) ?? definition.default;
};

export const buildEnvironment = (
  source: Record<string, unknown>,
  definitions: EnvironmentDefinition[] | null
): Readonly<Record<string, string>> => {
  const environment: Record<string, string> = {};
  const missing: string[] = [];

  for (const definition of definitions ?? []) {
    const value = readValue(source, definition);

    if (value === undefined) {
      if (!definition.optional) {
        missing.push(definition.key);
      }

      continue;
    }

    environment[definition.key] = value;
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Define them as VITE_<NAME> in your .env file, or give the definition a `default`.'
    );
  }

  return Object.freeze(environment);
};

const readSource = (): Record<string, unknown> => ({
  // `process.env` only exists on the server; on the client only `VITE_*` variables are inlined.
  ...(import.meta.env.SSR ? process.env : {}),
  ...(import.meta.env as unknown as Record<string, unknown>),
});

/**
 * Collects variables declared through `ENVIRONMENT_DEFINITION_TOKEN` and validates them once.
 * Because values are read from `VITE_*` on both sides, the server and the client agree on them.
 */
@Module({
  providers: [
    provide({ provide: ENVIRONMENT_SOURCE_TOKEN, scope: Scope.SINGLETON, useFactory: readSource }),
    provide({
      provide: ENVIRONMENT_TOKEN,
      scope: Scope.SINGLETON,
      useFactory: ({ source, definitions }) => buildEnvironment(source, definitions),
      deps: {
        source: ENVIRONMENT_SOURCE_TOKEN,
        definitions: optional(ENVIRONMENT_DEFINITION_TOKEN),
      },
    }),
  ],
})
export class EnvironmentModule {}
