import { Module, provide } from '@tinkoff/dippy';
import { DefaultLayout } from './RootLayout';
import { HTML_ATTRS_TOKEN, LAYOUT_OPTIONS_TOKEN } from './tokens';

/**
 * Rendering — the counterpart of tramvai's `RenderModule`. Owns the document (`RootDocument`) and
 * the root layout (`RootLayout`), and opens them up for extension:
 *
 * - `EXTEND_RENDER` — providers around the whole app, no DOM;
 * - `LAYOUT_OPTIONS_TOKEN` — layout, header, footer and global provider wrappers inside `<body>`;
 * - `HTML_ATTRS_TOKEN` — attributes of `<html>` and `<body>`.
 *
 * The defaults registered here come first, so any module or the application overrides them.
 */
@Module({
  providers: [
    provide({
      provide: LAYOUT_OPTIONS_TOKEN,
      useValue: { components: { layout: DefaultLayout } },
    }),
    provide({ provide: HTML_ATTRS_TOKEN, useValue: { target: 'html', attrs: { lang: 'en' } } }),
  ],
})
export class RenderModule {}
