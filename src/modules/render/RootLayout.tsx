import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Outlet } from '@tanstack/react-router';
import { useDi } from '../../core/di';
import { mergeLayoutOptions } from './layoutOptions';
import { LAYOUT_OPTIONS_TOKEN } from './tokens';
import type { LayoutProps } from './tokens';

export const DefaultLayout = ({ header, footer, children }: LayoutProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
    {header}
    <main style={{ flex: 1 }}>{children}</main>
    {footer}
  </div>
);

/**
 * The root layout — use it as the root route's `component`. Built from `LAYOUT_OPTIONS_TOKEN`:
 * layout, header and footer components, wrapped in every global provider wrapper.
 */
export const RootLayout = () => {
  const di = useDi();
  const { components, wrappers } = useMemo(
    () => mergeLayoutOptions(di.get({ token: LAYOUT_OPTIONS_TOKEN, optional: true })),
    [di]
  );
  const { layout: Layout = DefaultLayout, header: Header, footer: Footer } = components;

  // Marks the document once React took over the server HTML (used by the e2e suite).
  useEffect(() => {
    document.body.dataset.hydrated = 'true';
  }, []);

  const page = (
    <Layout header={Header ? <Header /> : null} footer={Footer ? <Footer /> : null}>
      <Outlet />
    </Layout>
  );

  return wrappers.reduce<ReactNode>((outlet, Wrapper) => <Wrapper>{outlet}</Wrapper>, page);
};
