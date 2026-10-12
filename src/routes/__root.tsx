/// <reference types="vite/client" />
import { createRootRouteWithContext, Link } from '@tanstack/react-router';
import { RootDocument, RootLayout } from '@/modules/render';
import type { RouterContext } from '@/modules/router';
import { Button } from '@/shared/ui/button';
import appCss from '../styles.css?url';

const NotFound = () => (
  <section className="mx-auto flex max-w-md flex-col items-start gap-4 py-16">
    <h1 className="text-5xl font-extrabold font-condensed">Not in this dimension</h1>
    <p className="text-muted-foreground">
      The page you opened does not exist here. The character list covers every dimension we know of.
    </p>
    <Button asChild>
      <Link to="/">Show all characters</Link>
    </Button>
  </section>
);

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Multiverse Census' },
      {
        name: 'description',
        content: 'Every character from Rick and Morty, with species, gender and status.',
      },
      { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#f3f5f7' },
      { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#0e1525' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&display=swap',
      },
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'preconnect', href: 'https://rickandmortyapi.com' },
    ],
  }),
  // The document and the layout come from RenderModule; extend them through its tokens.
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: NotFound,
});
