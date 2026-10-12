import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type {
  Container,
  ExtractDependencyType,
  ProvideDepsIterator,
  ProviderDeps,
  TokenInterface,
} from '@tinkoff/dippy';

const DiContext = createContext<Container | null>(null);
DiContext.displayName = 'TrolleyDi';

export interface DiProviderProps {
  di: Container;
  children?: ReactNode;
}

/**
 * Makes the DI container available to the React tree. `RouterModule` mounts it above every
 * `EXTEND_RENDER` wrapper. On the server this is the request's child container.
 */
export const DiProvider = ({ di, children }: DiProviderProps) => (
  <DiContext.Provider value={di}>{children}</DiContext.Provider>
);

/** Returns the DI container the current tree was rendered with. */
export const useDi = (): Container => {
  const di = useContext(DiContext);

  if (!di) {
    throw new Error(
      'DI container is not available in the React tree. ' +
        'Render through the router created by `createAppRouter`, or wrap the tree in `<DiProvider di={di}>`.'
    );
  }

  return di;
};

/** Resolves a single token from the container. */
export function useDiToken<Token extends TokenInterface<unknown>>(
  token: Token
): ExtractDependencyType<Token> {
  const di = useDi();

  return useMemo(() => di.get(token as never) as ExtractDependencyType<Token>, [di, token]);
}

/**
 * Resolves a `deps` object — the same shape providers use. `deps` must be a stable reference
 * (module scope constant) because the resolution is memoized against it.
 */
export function useDiDeps<Deps extends ProviderDeps>(deps: Deps): ProvideDepsIterator<Deps> {
  const di = useDi();

  return useMemo(() => di.getOfDeps(deps), [di, deps]);
}
