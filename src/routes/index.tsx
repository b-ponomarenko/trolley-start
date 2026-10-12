import { Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { CharacterCard, CharacterCardSkeleton, charactersQuery } from '@/entities/character';
import { prefetchInfiniteQuery, useSuspenseInfiniteQuery } from '@/modules/query';
import { useOnVisible } from '@/shared/lib/useOnVisible';
import { Button } from '@/shared/ui/button';

const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5';

const SkeletonGrid = ({ count }: { count: number }) => (
  <>
    {Array.from({ length: count }, (_, index) => (
      <CharacterCardSkeleton key={index} />
    ))}
  </>
);

const CharacterGrid = () => {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage, isFetchNextPageError } =
    useSuspenseInfiniteQuery(charactersQuery);

  const characters = data.pages.flatMap((page) => page.characters);
  const total = data.pages[0]?.total ?? characters.length;

  // Start the next page well before the end of the list comes into view.
  const sentinel = useOnVisible<HTMLDivElement>(() => void fetchNextPage(), {
    rootMargin: '0px 0px 600px 0px',
    enabled: hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
  });

  return (
    <>
      <p className="mb-6 text-sm text-muted-foreground" data-testid="characters-count">
        Showing {characters.length} of {total}
      </p>

      <div className={GRID} data-testid="character-grid">
        {characters.map((character, index) => (
          <CharacterCard key={character.id} character={character} eager={index < 10} />
        ))}
        {isFetchingNextPage ? <SkeletonGrid count={5} /> : null}
      </div>

      <div ref={sentinel} aria-hidden="true" data-testid="list-sentinel" />

      <div className="mt-10 flex justify-center" role="status">
        {isFetchNextPageError ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p>The next page did not load. Check your connection and try again.</p>
            <Button variant="outline" onClick={() => void fetchNextPage()}>
              Load more characters
            </Button>
          </div>
        ) : null}
        {!hasNextPage ? (
          <p className="text-muted-foreground" data-testid="list-end">
            That is everyone: all {total} characters.
          </p>
        ) : null}
      </div>
    </>
  );
};

const CharactersPage = () => (
  <section>
    <header className="mb-8 max-w-2xl">
      <h1 className="text-4xl font-extrabold font-condensed sm:text-5xl">Characters</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        People, aliens and the occasional sentient object from every dimension. Open a card to see
        where they come from and which episodes they appear in.
      </p>
    </header>

    {/*
      The header above is part of the shell and is flushed immediately; the grid suspends until the
      first page arrives and is streamed into the same response.
    */}
    <Suspense
      fallback={
        <div className={`${GRID} mt-11`} data-testid="grid-fallback">
          <SkeletonGrid count={10} />
        </div>
      }
    >
      <CharacterGrid />
    </Suspense>
  </section>
);

export const Route = createFileRoute('/')({
  // Not awaited on purpose: the route resolves at once, the request keeps running and its result
  // is streamed. On client navigations the cached pages are reused.
  loader: ({ context }) => {
    void prefetchInfiniteQuery(context.di, charactersQuery);
  },
  component: CharactersPage,
});
