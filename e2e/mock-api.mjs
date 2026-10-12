// Deterministic stand-in for https://rickandmortyapi.com used by the e2e suite.
// Both the SSR server and the browser talk to it, so the suite runs offline and never hits rate
// limits. Responses are delayed on purpose so streaming is observable.
import { createServer } from 'node:http';

const PORT = Number(process.env.MOCK_API_PORT ?? 4010);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const PAGE_SIZE = 20;
const TOTAL = 45;
const STATUSES = ['Alive', 'Dead', 'unknown'];
const GENDERS = ['Male', 'Female', 'Genderless', 'unknown'];
const SPECIES = ['Human', 'Alien', 'Robot', 'Mythological Creature'];

const episodeCount = 6;
const episodes = Array.from({ length: episodeCount }, (_, index) => ({
  id: index + 1,
  name: `Episode ${index + 1}`,
  air_date: `January ${index + 1}, 2014`,
  episode: `S01E0${index + 1}`,
  characters: [],
  url: `${ORIGIN}/api/episode/${index + 1}`,
  created: '2017-11-10T12:56:33.798Z',
}));

const character = (id) => ({
  id,
  name: id === 1 ? 'Rick Sanchez' : `Character ${id}`,
  status: STATUSES[id % STATUSES.length],
  species: SPECIES[id % SPECIES.length],
  type: '',
  gender: GENDERS[id % GENDERS.length],
  origin: { name: 'Earth (C-137)', url: '' },
  location: { name: 'Citadel of Ricks', url: '' },
  image: `${ORIGIN}/avatar/${id}.svg`,
  episode: episodes.slice(0, (id % episodeCount) + 1).map((episode) => episode.url),
  url: `${ORIGIN}/api/character/${id}`,
  created: '2017-11-04T18:48:46.250Z',
});

const avatar = (id) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="hsl(${(id * 47) % 360} 60% 70%)"/><text x="150" y="170" font-size="64" text-anchor="middle" font-family="sans-serif">${id}</text></svg>`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'content-type': type, 'access-control-allow-origin': '*' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', ORIGIN);
  const path = url.pathname;

  if (path === '/health') {
    return send(res, 200, { ok: true });
  }

  if (path.startsWith('/avatar/')) {
    return send(res, 200, avatar(Number.parseInt(path.split('/').pop(), 10)), 'image/svg+xml');
  }

  if (path === '/api/character') {
    await sleep(400);
    const page = Number(url.searchParams.get('page') ?? 1);
    const pages = Math.ceil(TOTAL / PAGE_SIZE);

    if (page < 1 || page > pages) {
      return send(res, 404, { error: 'There is nothing here' });
    }

    const from = (page - 1) * PAGE_SIZE + 1;
    const results = Array.from({ length: Math.min(PAGE_SIZE, TOTAL - from + 1) }, (_, index) =>
      character(from + index)
    );

    return send(res, 200, {
      info: {
        count: TOTAL,
        pages,
        next: page < pages ? `${ORIGIN}/api/character?page=${page + 1}` : null,
        prev: page > 1 ? `${ORIGIN}/api/character?page=${page - 1}` : null,
      },
      results,
    });
  }

  const single = path.match(/^\/api\/character\/(\d+)$/);

  if (single) {
    const id = Number(single[1]);

    // A character whose backend is broken, for the error screen test.
    if (id === 45) {
      return send(res, 500, { error: 'Internal error' });
    }

    return id >= 1 && id <= TOTAL
      ? send(res, 200, character(id))
      : send(res, 404, { error: 'Character not found' });
  }

  const episodeMatch = path.match(/^\/api\/episode\/([\d,]+)$/);

  if (episodeMatch) {
    await sleep(800);
    const ids = episodeMatch[1].split(',').map(Number);
    const found = episodes.filter((episode) => ids.includes(episode.id));

    return send(res, 200, ids.length === 1 ? found[0] : found);
  }

  return send(res, 404, { error: 'Not found' });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`mock Rick and Morty API on ${ORIGIN}`);
});
