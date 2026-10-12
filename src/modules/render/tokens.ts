import { createToken } from '@tinkoff/dippy';
import type { ComponentType, ReactNode } from 'react';

/** A wrapper contributed by a module — receives the current tree and returns the extended one. */
export type ExtendRender = (outlet: ReactNode) => ReactNode;

/**
 * Wraps the **whole application**, outside the document. Use it for context providers that render
 * no DOM and must be available everywhere, the document shell included (`DiProvider` sits above
 * all of them).
 *
 * Wrappers are folded in registration order, so a wrapper registered **later** ends up **higher**:
 * `[A, B, C] -> <C><B><A>{app}</A></B></C>`.
 *
 * Anything that renders markup belongs in `LAYOUT_OPTIONS_TOKEN` wrappers instead — TanStack Start
 * renders `<html>` inside these wrappers, so DOM here would end up outside the document.
 */
export const EXTEND_RENDER = createToken<ExtendRender>('EXTEND_RENDER', { multi: true });

export interface LayoutProps {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

export type LayoutWrapper = ComponentType<{ children: ReactNode }>;

export interface LayoutOptions {
  components?: {
    /** Arranges header, page and footer. Defaults to a plain vertical stack. */
    layout?: ComponentType<LayoutProps>;
    header?: ComponentType;
    footer?: ComponentType;
  };
  /**
   * Global providers around the root layout, inside `<body>` — tooltips, toasts, portals, anything
   * that renders markup or needs the document. Folded like `EXTEND_RENDER`: registered later,
   * rendered higher.
   */
  wrappers?: LayoutWrapper[];
}

/**
 * Extends the root layout — the counterpart of tramvai's `LAYOUT_OPTIONS`. Multi token: modules
 * and the application each contribute; components registered later win, wrappers accumulate.
 *
 * ```ts
 * provide({
 *   provide: LAYOUT_OPTIONS_TOKEN,
 *   useValue: { components: { header: AppHeader }, wrappers: [TooltipProvider] },
 * });
 * ```
 */
export const LAYOUT_OPTIONS_TOKEN = createToken<LayoutOptions>('LAYOUT_OPTIONS_TOKEN', {
  multi: true,
});

export type HtmlAttributes = Record<string, string | undefined>;

export interface HtmlAttrs {
  target: 'html' | 'body';
  /** Static attributes. */
  attrs?: HtmlAttributes;
  /**
   * Attributes computed while rendering — a React hook, so it may read stores and re-render the
   * document when they change. Called on the server too, so the first HTML already has them.
   */
  useAttrs?: () => HtmlAttributes;
}

/** Attributes of `<html>` and `<body>` — the counterpart of tramvai's `HTML_ATTRS`. */
export const HTML_ATTRS_TOKEN = createToken<HtmlAttrs>('HTML_ATTRS_TOKEN', { multi: true });
