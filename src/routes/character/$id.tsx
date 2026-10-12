import { Suspense } from 'react';
import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { characterQuery, episodesQuery, StatusBadge } from '@/entities/character';
import { HttpError } from '@/modules/http';
import { ensureQueryData, prefetchQuery, useSuspenseQuery } from '@/modules/query';
import { idsFromUrls } from '@/shared/api/rick-and-morty';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Separator } from '@/shared/ui/separator';
import { Skeleton } from '@/shared/ui/skeleton';

const parseId = (raw: string): number => {
  const id = Number(raw);

  if (!Number.isInteger(id) || id <= 0) {
    throw notFound();
  }

  return id;
};

const Fact = ({ label, value, testId }: { label: string; value: string; testId?: string }) => (
  <div className="min-w-0">
    <dt className="text-sm text-muted-foreground">{label}</dt>
    <dd className="mt-0.5 text-lg font-medium break-words" data-testid={testId}>
      {value}
    </dd>
  </div>
);

const Episodes = ({ ids }: { ids: number[] }) => {
  const { data: episodes } = useSuspenseQuery(episodesQuery, ids);

  return (
    <ol className="divide-y" data-testid="episode-list">
      {episodes.map((episode) => (
        <li key={episode.id} className="flex items-baseline gap-4 py-3" data-testid="episode">
          <span className="w-16 shrink-0 text-sm text-muted-foreground tabular-nums">
            {episode.episode}
          </span>
          <span className="min-w-0 flex-1 font-medium">{episode.name}</span>
          <span className="hidden shrink-0 text-sm text-muted-foreground sm:block">
            {episode.air_date}
          </span>
        </li>
      ))}
    </ol>
  );
};

const EpisodesFallback = ({ count }: { count: number }) => (
  <div className="flex flex-col gap-3 py-3" data-testid="episodes-fallback" aria-hidden="true">
    {Array.from({ length: Math.min(count, 8) }, (_, index) => (
      <Skeleton key={index} className="h-6" />
    ))}
  </div>
);

const CharacterPage = () => {
  const id = parseId(Route.useParams().id);
  const { data: character } = useSuspenseQuery(characterQuery, id);
  const episodeIds = idsFromUrls(character.episode);

  return (
    <article data-testid="character-detail">
      <Button asChild variant="ghost" className="mb-6 -ml-3">
        <Link to="/" data-testid="back-to-list">
          <ArrowLeft aria-hidden="true" />
          All characters
        </Link>
      </Button>

      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12">
        <Card className="h-fit overflow-hidden py-0">
          <img
            src={character.image}
            alt={character.name}
            width={300}
            height={300}
            className="aspect-square w-full object-cover"
          />
        </Card>

        <div className="min-w-0">
          <StatusBadge status={character.status} className="bg-secondary shadow-none" />
          <h1
            className="mt-4 text-5xl leading-[0.95] font-extrabold font-condensed break-words sm:text-6xl lg:text-7xl"
            data-testid="detail-name"
          >
            {character.name}
          </h1>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
            <Fact label="Species" value={character.species} testId="detail-species" />
            <Fact label="Gender" value={character.gender} testId="detail-gender" />
            {character.type ? <Fact label="Kind" value={character.type} /> : null}
            <Fact label="Origin" value={character.origin.name} />
            <Fact label="Last seen" value={character.location.name} />
          </dl>

          <Separator className="my-10" />

          <section aria-labelledby="episodes-heading">
            <h2 id="episodes-heading" className="text-2xl font-bold font-condensed">
              Appears in {episodeIds.length} {episodeIds.length === 1 ? 'episode' : 'episodes'}
            </h2>
            {/* Streamed: the character is in the first flush, the episodes arrive later. */}
            <Suspense fallback={<EpisodesFallback count={episodeIds.length} />}>
              <Episodes ids={episodeIds} />
            </Suspense>
          </section>
        </div>
      </div>
    </article>
  );
};

export const Route = createFileRoute('/character/$id')({
  loader: async ({ context, params }) => {
    const id = parseId(params.id);

    // Awaited: the name goes into <title>, and an unknown id must become a real 404.
    const character = await ensureQueryData(context.di, characterQuery, id).catch((error) => {
      if (error instanceof HttpError && error.status === 404) {
        throw notFound();
      }

      throw error;
    });

    // Not awaited: the episode list streams in after the shell.
    void prefetchQuery(context.di, episodesQuery, idsFromUrls(character.episode));

    return { name: character.name, species: character.species, image: character.image };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} | Multiverse Census` },
          { name: 'description', content: `${loaderData.name}, ${loaderData.species}.` },
          { property: 'og:image', content: loaderData.image },
        ]
      : [],
  }),
  component: CharacterPage,
});
