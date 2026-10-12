import { expect, test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

export const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

/** Fails the test on any console error — hydration mismatches surface there. */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];

      page.on('console', (message) => {
        if (message.type() === 'error') {
          errors.push(message.text());
        }
      });
      page.on('pageerror', (error) => errors.push(error.message));

      await use(errors);

      expect(errors, 'console errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Waits until React took over the server HTML. */
export const waitForHydration = (page: Page) =>
  expect(page.locator('body')).toHaveAttribute('data-hydrated', 'true');
