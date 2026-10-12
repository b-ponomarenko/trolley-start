import { expect, test, waitForHydration } from './fixtures';

test.describe('character list', () => {
  test('shows image, name, species, gender and status on every card', async ({ page }) => {
    await page.goto('/');

    const card = page.getByTestId('character-card').first();

    await expect(card.getByRole('img', { name: 'Rick Sanchez' })).toBeVisible();
    await expect(card.getByTestId('character-name')).toHaveText('Rick Sanchez');
    await expect(card.getByTestId('character-species')).toHaveText('Alien');
    await expect(card.getByTestId('character-gender')).toHaveText('Female');
    await expect(card.getByTestId('character-status')).toHaveText('Dead');
  });

  test('loads the next pages while scrolling towards the end', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    const cards = page.getByTestId('character-card');

    await expect(cards).toHaveCount(20);
    await page.getByTestId('list-sentinel').scrollIntoViewIfNeeded();
    await expect(cards).toHaveCount(40);
    await page.getByTestId('list-sentinel').scrollIntoViewIfNeeded();
    await expect(cards).toHaveCount(45);
    await expect(page.getByTestId('list-end')).toHaveText('That is everyone: all 45 characters.');
    await expect(page.getByTestId('characters-count')).toHaveText('Showing 45 of 45');
  });

  test('does not refetch the server-rendered page on hydration', async ({ page }) => {
    const apiCalls: string[] = [];

    page.on('request', (request) => {
      if (request.url().includes('/api/character')) {
        apiCalls.push(request.url());
      }
    });

    await page.goto('/');
    await waitForHydration(page);
    await page.waitForTimeout(500);

    expect(apiCalls).toEqual([]);
  });
});

test.describe('character details', () => {
  test('opens from a card and goes back to the list', async ({ page }) => {
    await page.goto('/');
    await waitForHydration(page);

    await page.getByTestId('character-card').nth(2).click();

    await expect(page).toHaveURL(/\/character\/3$/);
    await expect(page.getByTestId('detail-name')).toHaveText('Character 3');
    await expect(page).toHaveTitle('Character 3 | Multiverse Census');
    await expect(page.getByTestId('detail-species')).toHaveText('Mythological Creature');
    await expect(page.getByTestId('episode')).toHaveCount(4);

    await page.getByTestId('back-to-list').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('character-card')).toHaveCount(20);
  });

  test('shows a way back for an unknown character', async ({ page, consoleErrors }) => {
    const response = await page.goto('/character/9999');

    expect(response?.status()).toBe(404);
    // The browser itself logs the 404 document as a failed resource; that one is expected.
    consoleErrors.splice(0, consoleErrors.length);

    await expect(page.getByRole('heading', { name: 'Not in this dimension' })).toBeVisible();
    await page.getByRole('link', { name: 'Show all characters' }).click();
    await expect(page.getByTestId('character-card').first()).toBeVisible();
  });

  test('offers a retry when the API fails', async ({ page, consoleErrors }) => {
    const response = await page.goto('/character/45');

    expect(response?.status()).toBe(500);
    await expect(page.getByRole('alert')).toContainText('This page did not load');
    await expect(page.getByTestId('retry')).toBeVisible();
    // Failed document and API requests are logged by the browser; they are the point here.
    consoleErrors.splice(0, consoleErrors.length);
  });
});
