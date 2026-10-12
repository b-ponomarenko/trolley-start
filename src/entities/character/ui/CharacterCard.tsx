import { Link } from '@tanstack/react-router';
import { Card } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import type { Character } from '@/shared/api/rick-and-morty';
import { StatusBadge } from './StatusBadge';

export interface CharacterCardProps {
  character: Character;
  /** Cards above the fold load their portrait eagerly. */
  eager?: boolean;
}

export const CharacterCard = ({ character, eager = false }: CharacterCardProps) => (
  <Link
    to="/character/$id"
    params={{ id: String(character.id) }}
    data-testid="character-card"
    className="group block rounded-xl"
  >
    <Card className="gap-0 overflow-hidden py-0 transition-[border-color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:border-foreground/40">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={character.image}
          alt={character.name}
          width={300}
          height={300}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="size-full object-cover"
        />
        <StatusBadge status={character.status} className="absolute bottom-2.5 left-2.5" />
      </div>

      <div className="flex flex-col gap-3 p-4">
        <h2
          className="line-clamp-2 text-xl leading-tight font-bold font-condensed"
          data-testid="character-name"
        >
          {character.name}
        </h2>

        <dl className="grid grid-cols-2 gap-x-3 text-sm">
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Species</dt>
            <dd className="truncate font-medium" data-testid="character-species">
              {character.species}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Gender</dt>
            <dd className="truncate font-medium" data-testid="character-gender">
              {character.gender}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  </Link>
);

export const CharacterCardSkeleton = () => (
  <Card className="gap-0 overflow-hidden py-0" aria-hidden="true" data-testid="character-skeleton">
    <Skeleton className="aspect-square rounded-none" />
    <div className="flex flex-col gap-3 p-4">
      <Skeleton className="h-6 w-3/4" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
      </div>
    </div>
  </Card>
);
