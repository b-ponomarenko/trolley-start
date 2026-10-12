import type { ReactElement, ReactNode } from 'react';
import type { Container } from '@tinkoff/dippy';
import { DiProvider } from '../../core/di';
import type { ExtendRender } from './tokens';

/** Folds every `EXTEND_RENDER` wrapper around `children` and puts the container above all of them. */
export const composeRender = (
  di: Container,
  extendRender: ExtendRender[] | null | undefined,
  children: ReactNode
): ReactElement => (
  <DiProvider di={di}>
    {(extendRender ?? []).reduce<ReactNode>((outlet, extend) => extend(outlet), children)}
  </DiProvider>
);
