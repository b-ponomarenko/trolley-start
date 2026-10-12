import { createInfiniteQuery, createQuery } from '@/modules/query';
import { RICK_AND_MORTY_API_TOKEN } from '@/shared/api/rick-and-morty';

const deps = { api: RICK_AND_MORTY_API_TOKEN };

/** All characters, 20 per page, loaded page by page while the user scrolls. */
export const charactersQuery = createInfiniteQuery({
  key: ['characters'],
  initialPageParam: 1,
  fn(page: number) {
    return this.api.getCharacters(page, this.signal);
  },
  getNextPageParam: (lastPage) => lastPage.nextPage,
  deps,
});

export const characterQuery = createQuery({
  key: (id: number) => ['character', id],
  fn(id: number) {
    return this.api.getCharacter(id, this.signal);
  },
  queryOptions: { staleTime: 5 * 60_000 },
  deps,
});

export const episodesQuery = createQuery({
  key: (ids: number[]) => ['episodes', ids],
  fn(ids: number[]) {
    return this.api.getEpisodes(ids, this.signal);
  },
  queryOptions: { staleTime: 30 * 60_000 },
  deps,
});
