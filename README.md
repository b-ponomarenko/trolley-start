# Trolley Start

A modular **SSR framework with streaming** built on **TanStack Start**, **TanStack Router**,
**TanStack Query**, **TanStack Store** and **[@tinkoff/dippy]** dependency injection. It follows the
developer experience of [tramvai]: `createApp`, modules, tokens, a command-line lifecycle,
request-scoped containers and declarative `createQuery`.

It is the server-rendering sibling of `../trolley`, which is client-only.

The repository contains the framework (`src/core`, `src/modules`) and a demo app built with it: the
**Multiverse Census**, a list of every character from the [Rick and Morty API], with infinite
scroll, a details page, and light and dark themes.

[@tinkoff/dippy]: https://npmjs.com/package/@tinkoff/dippy
[tramvai]: https://tramvai.dev
[Rick and Morty API]: https://rickandmortyapi.com

---

## Getting started

```bash
npm install
npx playwright install chromium   # once, for the e2e suite

npm run dev          # http://127.0.0.1:3000
npm run build        # production build into dist/
npm run preview      # serve the production build

npm run typecheck    # tsc --noEmit
npm run test         # vitest — framework and API unit tests
npm run test:e2e     # playwright — builds, serves against a mock API, drives the browser
npm run verify       # typecheck → format check → unit → build → e2e
```

| Variable                      | Default                           | Meaning                    |
| ----------------------------- | --------------------------------- | -------------------------- |
| `VITE_RICK_AND_MORTY_API_URL` | `https://rickandmortyapi.com/api` | Base URL of the API client |

---

## How a request is served

```ts
// src/index.ts — the application, created once per process
export const app = createApp({
  name: 'rick-and-morty',
  modules: [CommonModule, RenderModule, TanStackQueryModule, UIStoreModule, RickAndMortyApiModule],
  providers: [/* app-level providers, registered last, override anything */],
});

// src/router.tsx — TanStack Start's entry, called per request and once in the browser
export const getRouter = () => createAppRouter(app, routeTree);
```

```
process start ─ createApp ─ root container: framework → module → app providers  (Scope.SINGLETON lives here)

request ─ getRouter() ─ createAppRouter
            ├─ app.fork()                     child container                 (Scope.REQUEST lives here)
            ├─ createRouter({ context: { di }, Wrap: DiProvider + EXTEND_RENDER })
            ├─ ROUTER_TOKEN ← router,  ROUTER_PLUGIN_TOKEN (query SSR integration)
            └─ command lines  server: customerStart → resolveUserDeps → resolvePageDeps
         ─ TanStack Start: router.load() → loaders → renderToStream
            ├─ shell + Suspense fallbacks flushed immediately
            └─ suspended parts + dehydrated query cache streamed as their data settles

browser ─ getRouter() ─ same, once:   client: customerStart → resolveUserDeps → resolvePageDeps
        ─ hydrate;  after every navigation:   spa: afterSpaTransition
```

The root/child container split is tramvai's: singletons (HTTP clients, environment, logger) are
shared, while request-scoped values (the query client, the router, the UI store) are created per
request, so one visitor's data never leaks into another visitor's render.

---

## Streaming

A loader decides what the first flush waits for:

```ts
loader: async ({ context, params }) => {
  // awaited: needed for <title> and a real 404
  const character = await ensureQueryData(context.di, characterQuery, id);
  // not awaited: streamed into the same response later
  void prefetchQuery(context.di, episodesQuery, idsFromUrls(character.episode));
},
```

The component reads both with `useSuspenseQuery`. Whatever is not ready yet sits behind a
`<Suspense>` boundary: the server flushes its fallback straight away and streams the real markup,
together with the dehydrated query data, once it arrives, so the client does not refetch.

Measured against the production build: the list shell arrives in about 20 ms, and the cards follow
in the same response when the API answers. Crawlers (detected by user agent) get the complete HTML
in one piece.

---

## Command lines

```ts
export const commandLineListTokens = {
  customerStart,
  resolveUserDeps,
  resolvePageDeps,
  afterSpaTransition,
};

lines = {
  server: [customerStart, resolveUserDeps, resolvePageDeps],
  client: [customerStart, resolveUserDeps, resolvePageDeps],
  spa: [afterSpaTransition],
};
```

Lines run sequentially and the commands on one line run in parallel. The first failure aborts the
run. Commands are resolved from the **request container**, so they can depend on request-scoped
services:

```ts
provide({
  provide: commandLineListTokens.customerStart,
  useFactory:
    ({ store, storage }) =>
    () => {
      /* … */
    },
  deps: { store: UI_STORE_TOKEN, storage: THEME_STORAGE_TOKEN },
});
```

To add a stage, create a multi token and override `COMMAND_LINES_TOKEN`.

---

## Modules

| Module                    | Provides                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `CommonModule`            | `CommandLineRunnerModule`, `LogModule`, `EnvironmentModule`, `RouterModule`               |
| `CommandLineRunnerModule` | `COMMAND_LINE_RUNNER_TOKEN`, `COMMAND_LINES_TOKEN`                                        |
| `LogModule`               | `LOGGER_TOKEN` (named loggers), `LOGGER_LEVEL_TOKEN`                                      |
| `EnvironmentModule`       | `ENVIRONMENT_TOKEN`, validated from `ENVIRONMENT_DEFINITION_TOKEN`                        |
| `RouterModule`            | `ROUTER_OPTIONS_TOKEN`; per request `ROUTER_TOKEN`, `ROUTER_PLUGIN_TOKEN`                 |
| `RenderModule`            | `RootDocument`, `RootLayout`; `EXTEND_RENDER`, `LAYOUT_OPTIONS_TOKEN`, `HTML_ATTRS_TOKEN` |
| `HttpModule`              | axios: `HTTP_CLIENT_TOKEN` (default client), `HTTP_CLIENT_FACTORY_TOKEN` (named clients)  |
| `TanStackQueryModule`     | request-scoped `QUERY_CLIENT_TOKEN`, SSR dehydration and streaming                        |
| `UIStoreModule`           | request-scoped `UI_STORE_TOKEN` (TanStack Store), theme persistence, `<html data-theme>`  |

### Render

`RenderModule` owns the document and the root layout. The root route only plugs them in:

```ts
export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({ meta: [...], links: [...] }),
  shellComponent: RootDocument, // <html>, <head>, <body>
  component: RootLayout, // layout + header + footer + global providers
  notFoundComponent: NotFound,
});
```

Everything else is extended through tokens:

| Token                  | Where it renders                       | Use it for                                                    |
| ---------------------- | -------------------------------------- | ------------------------------------------------------------- |
| `LAYOUT_OPTIONS_TOKEN` | the root layout, inside `<body>`       | layout, header and footer components, **global providers**    |
| `HTML_ATTRS_TOKEN`     | `<html>` / `<body>` attributes         | `lang`, `data-theme`, anything the server must render already |
| `EXTEND_RENDER`        | around the whole app, outside `<html>` | context providers that render no DOM                          |

```ts
provide({
  provide: LAYOUT_OPTIONS_TOKEN,
  useValue: {
    components: { layout: AppLayout, header: AppHeader },
    wrappers: [TooltipProvider], // global providers, inside <body>
  },
});

provide({
  provide: HTML_ATTRS_TOKEN,
  useValue: { target: 'html', useAttrs: () => ({ 'data-theme': useUIStore((s) => s.theme) }) },
});
```

`LAYOUT_OPTIONS_TOKEN` is a multi token. Components registered later win, and wrappers accumulate
with later ones rendered higher. `RenderModule` registers its defaults first (a plain layout and
`lang="en"`), so modules and the app override them. `useAttrs` is a hook: it may read stores, and
it also runs on the server.

### HTTP

`HttpModule` wraps axios. Methods resolve with the response body and reject with `HttpError`
(`client`, `status`, `code`, `url`). The axios instance stays available as `client.axios`.

```ts
// the default client — configure it with HTTP_CLIENT_OPTIONS_TOKEN
const client = di.get(HTTP_CLIENT_TOKEN);
await client.get<User>('/user', { params: { id: 1 } });

// a client of your own: a name, plus any axios options
const api = di.get(HTTP_CLIENT_FACTORY_TOKEN)({
  name: 'rick-and-morty',
  baseURL: 'https://rickandmortyapi.com/api',
  timeout: 10_000,
  headers: { 'X-Client': 'census' },
});
```

`HTTP_CLIENT_DEFAULTS_TOKEN` holds axios options shared by every client. Headers are merged, not
replaced. Every client logs through `LOGGER_TOKEN` as `http:<name>`:

```
[http:rick-and-morty] GET https://rickandmortyapi.com/api/character/3 → 200 in 212ms
```

For tests, `mockAdapter(body, status)` is an axios adapter that answers without a network and
records its calls.

An application module, from the demo:

```ts
@Module({
  imports: [HttpModule],
  providers: [
    provide({
      provide: ENVIRONMENT_DEFINITION_TOKEN,
      useValue: { key: 'RICK_AND_MORTY_API_URL', default: 'https://rickandmortyapi.com/api' },
    }),
    provide({
      provide: RICK_AND_MORTY_API_TOKEN,
      scope: Scope.SINGLETON,
      useFactory: ({ createHttpClient, environment }) =>
        new RickAndMortyApi(
          createHttpClient({
            name: 'rick-and-morty',
            baseURL: environment.RICK_AND_MORTY_API_URL,
            timeout: 10_000,
          })
        ),
      deps: { createHttpClient: HTTP_CLIENT_FACTORY_TOKEN, environment: ENVIRONMENT_TOKEN },
    }),
  ],
})
export class RickAndMortyApiModule {}
```

`@Module` is dippy's legacy decorator, so `tsconfig.json` sets `experimentalDecorators: true`.

---

## Queries

Queries are declared next to their dependencies. `deps` and the abort `signal` are bound to `this`,
so write `fn` as a regular function, not an arrow:

```ts
export const charactersQuery = createInfiniteQuery({
  key: ['characters'],
  initialPageParam: 1,
  fn(page: number) {
    return this.api.getCharacters(page, this.signal);
  },
  getNextPageParam: (lastPage) => lastPage.nextPage, // null → no more pages
  deps: { api: RICK_AND_MORTY_API_TOKEN },
});
```

| In components                                  | In loaders (`context.di`)                          |
| ---------------------------------------------- | -------------------------------------------------- |
| `useQuery`, `useSuspenseQuery`                 | `prefetchQuery` (stream), `ensureQueryData` (wait) |
| `useInfiniteQuery`, `useSuspenseInfiniteQuery` | `prefetchInfiniteQuery`, `ensureInfiniteQueryData` |

The default retry policy retries network failures, `429` and `5xx`, and never retries other `4xx`:
three times in the browser, and once on the server so a struggling backend cannot hold the response.
The public API rate-limits, and in the browser a `429` without CORS headers shows up as a network
error. When retries run out, the app's `defaultErrorComponent` shows a **Try again** button that
resets the failed queries and re-runs the loaders. It is provided through `ROUTER_OPTIONS_TOKEN` in
`src/index.ts`.

---

## UI store and themes

`UIStoreModule` is enabled with one line in `modules`. It provides:

- a TanStack Store per request container, with the actions `setTheme` and `toggleTheme`;
- a `customerStart` command that restores the saved theme before anything renders, from the request
  cookie on the server and from `document.cookie` in the browser. The server HTML therefore already
  carries the right `data-theme`, with no flash and no hydration mismatch;
- write-back of every change through `THEME_STORAGE_TOKEN`, a cookie by default.

```tsx
const { theme, toggleTheme, setTheme } = useTheme(); // 'light' | 'dark' | 'system'
const theme = useUIStore((state) => state.theme); // any slice
```

`UIStoreModule` adds `data-theme` to `<html>` itself through `HTML_ATTRS_TOKEN`, so the app needs no
theme code beyond the toggle. Colours are `light-dark()` pairs switched by
`color-scheme`, so `system` follows the OS preference with no JavaScript, and Tailwind's `dark:`
variant covers both an explicit `dark` and `system` with a dark OS.

---

## tramvai ↔ Trolley Start

| tramvai                                                         | here                                                                        |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `createApp({ name, modules, providers })`                       | same — `src/index.ts`                                                       |
| `@Module`, `provide`, `createToken`, `Scope`                    | same, from `@tinkoff/dippy` (re-exported by `@/core`)                       |
| root container + child container per request                    | `app.fork()` inside `getRouter()`                                           |
| `commandLineListTokens.*`                                       | `customerStart`, `resolveUserDeps`, `resolvePageDeps`, `afterSpaTransition` |
| `@tramvai/react-query` `createQuery` / `createInfiniteQuery`    | same shape — `@/modules/query`                                              |
| `useDi`                                                         | `useDi`, `useDiToken`, `useDiDeps`                                          |
| `LOGGER_TOKEN`, `ENV_MANAGER_TOKEN`                             | `LOGGER_TOKEN`, `ENVIRONMENT_TOKEN`                                         |
| `RenderModule`: `LAYOUT_OPTIONS`, `HTML_ATTRS`, `EXTEND_RENDER` | `RenderModule`: `LAYOUT_OPTIONS_TOKEN`, `HTML_ATTRS_TOKEN`, `EXTEND_RENDER` |
| `HTTP_CLIENT`, `HTTP_CLIENT_FACTORY({ name, … })`               | `HTTP_CLIENT_TOKEN`, `HTTP_CLIENT_FACTORY_TOKEN({ name, ...axiosOptions })` |
| file-system pages + streaming                                   | TanStack Start file routes + React 19 streaming                             |

---

## Layout

```
src/
├── core/            createApp/App (root container, fork, run), tokens, React↔DI bridge
├── modules/         command · logger · environment · http · query · render · router · ui-store
├── index.ts         createApp — the application
├── router.tsx       getRouter — TanStack Start entry
├── routes/          file routes: __root, / (list), /character/$id
├── entities/        character: queries and UI (card, status badge)
├── widgets/         app header and app layout (plugged in through LAYOUT_OPTIONS_TOKEN)
├── shared/          api (Rick and Morty module + client), ui (shadcn/ui), lib
└── styles.css       Tailwind v4 + theme tokens
e2e/                 Playwright suite + mock Rick and Morty API
```

Framework code (`src/core`, `src/modules`) never imports app code.

---

## Testing

- **Unit (Vitest):** container scoping and overrides, lifecycle order and failure, the runner,
  layout option merging, the HTTP module (default client, named clients, merged options, errors),
  query binding, caching, pagination and retries, the UI store and module, environment validation,
  and the API client.
- **e2e (Playwright):** runs a production build against `e2e/mock-api.mjs`, which returns 45
  deterministic characters with deliberate delays. It covers chunk timing for streaming,
  crawler HTML, 404s, card contents, infinite scroll to the end, no refetch on hydration, the
  details page and back navigation, and theme persistence with server rendering. Every test fails
  on any console error, which is where hydration mismatches show up.
