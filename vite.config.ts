import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';

export default defineConfig({
  // `@/…` imports, from `paths` in tsconfig.json.
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    // `src/router.tsx` (getRouter) and `src/routes` are TanStack Start conventions.
    tanstackStart({ srcDirectory: 'src' }),
    // Must come after the Start plugin.
    viteReact(),
  ],
  server: {
    // On macOS `localhost` resolves to ::1 first; Playwright probes 127.0.0.1.
    host: '127.0.0.1',
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    restoreMocks: true,
  },
});
