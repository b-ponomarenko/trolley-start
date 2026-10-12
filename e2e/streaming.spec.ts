import { BROWSER_UA, expect, test } from './fixtures';

interface Chunk {
  at: number;
  html: string;
}

const readChunks = async (url: string, userAgent: string): Promise<Chunk[]> => {
  const startedAt = Date.now();
  const response = await fetch(url, { headers: { 'user-agent': userAgent } });
  const decoder = new TextDecoder();
  const chunks: Chunk[] = [];

  for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
    chunks.push({ at: Date.now() - startedAt, html: decoder.decode(chunk, { stream: true }) });
  }

  return chunks;
};

test.describe('streaming SSR', () => {
  test('flushes the list shell before the characters arrive', async ({ baseURL }) => {
    const chunks = await readChunks(`${baseURL}/`, BROWSER_UA);
    const first = chunks[0]!.html;
    const all = chunks.map((chunk) => chunk.html).join('');

    expect(first).toContain('<h1');
    expect(first).toContain('data-testid="grid-fallback"');
    expect(first).not.toContain('data-testid="character-card"');

    const withCards = chunks.find((chunk) => chunk.html.includes('data-testid="character-card"'));

    // The mock API answers after 400ms; the shell must not have waited for it.
    expect(withCards!.at - chunks[0]!.at).toBeGreaterThan(250);
    expect(all.match(/data-testid="character-card"/g)).toHaveLength(20);
    // The query cache is streamed too, so the client does not refetch the first page.
    expect(all).toContain('Rick Sanchez');
  });

  test('renders the character first and streams the episode list after it', async ({ baseURL }) => {
    const chunks = await readChunks(`${baseURL}/character/1`, BROWSER_UA);
    const first = chunks[0]!.html;
    const all = chunks.map((chunk) => chunk.html).join('');

    expect(first).toContain('<title>Rick Sanchez | Multiverse Census</title>');
    expect(first).toContain('data-testid="detail-name"');
    expect(first).toContain('data-testid="episodes-fallback"');
    expect(first).not.toContain('data-testid="episode"');
    expect(all).toContain('data-testid="episode"');
  });

  test('gives crawlers the complete page in one go', async ({ request }) => {
    const response = await request.get('/', { headers: { 'user-agent': 'Googlebot/2.1' } });
    const html = await response.text();

    expect(html.match(/data-testid="character-card"/g)).toHaveLength(20);
  });

  test('answers unknown characters and pages with 404', async ({ request }) => {
    expect((await request.get('/character/9999')).status()).toBe(404);
    expect((await request.get('/character/not-a-number')).status()).toBe(404);
    expect((await request.get('/no-such-page')).status()).toBe(404);
  });
});
