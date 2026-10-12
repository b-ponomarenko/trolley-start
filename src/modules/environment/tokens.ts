import { createToken, Scope } from '@tinkoff/dippy';

export interface EnvironmentDefinition {
  /** Logical name, e.g. `API_URL`. Looked up as `VITE_API_URL` first, then as `API_URL`. */
  key: string;
  /** When true a missing value is allowed and the key is simply absent from the result. */
  optional?: boolean;
  /** Used when nothing was found in the source. */
  default?: string;
}

/**
 * Modules and applications declare the variables they need here. The module fails loudly when a
 * required one is missing, instead of failing later with `undefined` in a URL.
 */
export const ENVIRONMENT_DEFINITION_TOKEN = createToken<EnvironmentDefinition>(
  'ENVIRONMENT_DEFINITION_TOKEN',
  { multi: true }
);

/** Raw source of variables. Defaults to `import.meta.env` (+ `process.env` on the server). */
export const ENVIRONMENT_SOURCE_TOKEN = createToken<Record<string, unknown>>(
  'ENVIRONMENT_SOURCE_TOKEN',
  { scope: Scope.SINGLETON }
);

/** Validated, frozen environment, keyed by the declared logical names. */
export const ENVIRONMENT_TOKEN = createToken<Readonly<Record<string, string>>>(
  'ENVIRONMENT_TOKEN',
  { scope: Scope.SINGLETON }
);
