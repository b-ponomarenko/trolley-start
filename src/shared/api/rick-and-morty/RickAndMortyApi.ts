import type { HttpClient } from '@/modules/http';
import type { Character, CharactersPage, Episode, Paginated } from './types';

const pageFromUrl = (url: string | null): number | null => {
  if (!url) {
    return null;
  }

  const page = Number(new URL(url).searchParams.get('page'));

  return Number.isInteger(page) && page > 0 ? page : null;
};

/** Pulls numeric ids out of resource URLs such as `https://…/api/episode/28`. */
export const idsFromUrls = (urls: string[]): number[] =>
  urls.map((url) => Number(url.split('/').pop())).filter((id) => Number.isInteger(id) && id > 0);

/** Typed facade over https://rickandmortyapi.com — the only place that knows its URL layout. */
export class RickAndMortyApi {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async getCharacters(page: number, signal?: AbortSignal): Promise<CharactersPage> {
    const data = await this.http.get<Paginated<Character>>('/character', {
      params: { page },
      signal,
    });

    return {
      page,
      nextPage: pageFromUrl(data.info.next),
      total: data.info.count,
      characters: data.results,
    };
  }

  getCharacter(id: number, signal?: AbortSignal): Promise<Character> {
    return this.http.get<Character>(`/character/${id}`, { signal });
  }

  /** The API answers a single id with an object and several ids with an array. */
  async getEpisodes(ids: number[], signal?: AbortSignal): Promise<Episode[]> {
    if (ids.length === 0) {
      return [];
    }

    const data = await this.http.get<Episode | Episode[]>(`/episode/${ids.join(',')}`, { signal });

    return Array.isArray(data) ? data : [data];
  }
}
