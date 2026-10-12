import { describe, expect, it } from 'vitest';
import { createHttpClient, HttpError, mockAdapter } from '@/modules/http';
import { idsFromUrls, RickAndMortyApi } from './RickAndMortyApi';

const apiWith = (adapter: ReturnType<typeof mockAdapter>) => {
  const client = createHttpClient({
    name: 'rick-and-morty',
    baseURL: 'https://api.test/api',
    adapter,
  });

  return { api: new RickAndMortyApi(client), client };
};

describe('RickAndMortyApi', () => {
  it('extracts the next page number from the page info', async () => {
    const adapter = mockAdapter({
      info: { count: 826, pages: 42, next: 'https://api.test/api/character?page=3', prev: null },
      results: [{ id: 21 }],
    });
    const { api, client } = apiWith(adapter);

    await expect(api.getCharacters(2)).resolves.toMatchObject({
      page: 2,
      nextPage: 3,
      total: 826,
      characters: [{ id: 21 }],
    });
    expect(client.axios.getUri(adapter.calls[0])).toBe('https://api.test/api/character?page=2');
  });

  it('reports the last page with nextPage null', async () => {
    const { api } = apiWith(
      mockAdapter({ info: { count: 1, pages: 1, next: null, prev: null }, results: [] })
    );

    await expect(api.getCharacters(1)).resolves.toMatchObject({ nextPage: null });
  });

  it('normalises a single episode into an array', async () => {
    const { api } = apiWith(mockAdapter({ id: 1, name: 'Pilot' }));

    await expect(api.getEpisodes([1])).resolves.toEqual([{ id: 1, name: 'Pilot' }]);
    await expect(api.getEpisodes([])).resolves.toEqual([]);
  });

  it('turns HTTP errors into HttpError with the status', async () => {
    const { api } = apiWith(mockAdapter({ error: 'Character not found' }, 404));

    const error = await api.getCharacter(9999).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ client: 'rick-and-morty', status: 404 });
  });

  it('reads ids out of resource urls', () => {
    expect(idsFromUrls(['https://x/api/episode/1', 'https://x/api/episode/28', 'nope'])).toEqual([
      1, 28,
    ]);
  });
});
