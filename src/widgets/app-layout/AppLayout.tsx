import type { LayoutProps } from '@/modules/render';

/** The application's arrangement of the root layout, plugged in through `LAYOUT_OPTIONS_TOKEN`. */
export const AppLayout = ({ header, footer, children }: LayoutProps) => (
  <div className="flex min-h-dvh flex-col">
    {header}
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12">{children}</main>
    {footer}
  </div>
);
