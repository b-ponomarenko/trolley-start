import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { HeadContent, Scripts } from '@tanstack/react-router';
import { useDi } from '../../core/di';
import { HTML_ATTRS_TOKEN } from './tokens';
import type { HtmlAttributes, HtmlAttrs } from './tokens';

const EMPTY: HtmlAttrs[] = [];

/** Applies every `HTML_ATTRS_TOKEN` entry; `useAttrs` hooks are called in a stable order. */
const useHtmlAttrs = () => {
  const di = useDi();
  const entries = useMemo(() => di.get({ token: HTML_ATTRS_TOKEN, optional: true }) ?? EMPTY, [di]);
  const result: Record<HtmlAttrs['target'], HtmlAttributes> = { html: {}, body: {} };

  for (const entry of entries) {
    Object.assign(result[entry.target], entry.attrs, entry.useAttrs?.());
  }

  return result;
};

/**
 * The document — use it as the root route's `shellComponent`. Its `<html>` and `<body>` attributes
 * come from `HTML_ATTRS_TOKEN`, head tags from the routes' `head()`.
 */
export const RootDocument = ({ children }: { children: ReactNode }) => {
  const { html, body } = useHtmlAttrs();

  return (
    <html {...html}>
      <head>
        <HeadContent />
      </head>
      <body {...body}>
        {children}
        <Scripts />
      </body>
    </html>
  );
};
