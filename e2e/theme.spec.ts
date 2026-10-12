import { expect, test, waitForHydration } from './fixtures';

test.describe('theme', () => {
  test('follows the system preference until the user picks a theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'system');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(14, 21, 37)');
  });

  test('toggles, persists in a cookie and is server rendered on the next visit', async ({
    page,
    context,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForHydration(page);

    await page.getByTestId('theme-toggle').click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(14, 21, 37)');
    expect((await context.cookies()).find((cookie) => cookie.name === 'theme')?.value).toBe('dark');

    // The server reads the cookie, so the HTML arrives dark before any script runs.
    const html = await (await page.request.get('/')).text();
    expect(html).toContain('data-theme="dark"');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await waitForHydration(page);
    await page.getByTestId('theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(243, 245, 247)');
  });
});
