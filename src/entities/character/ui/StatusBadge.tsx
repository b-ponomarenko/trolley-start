import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { CharacterStatus } from '@/shared/api/rick-and-morty';

const LABEL: Record<CharacterStatus, string> = {
  Alive: 'Alive',
  Dead: 'Dead',
  unknown: 'Status unknown',
};

const DOT: Record<CharacterStatus, string> = {
  Alive: 'bg-alive',
  Dead: 'bg-dead',
  unknown: 'bg-unknown',
};

export interface StatusBadgeProps {
  status: CharacterStatus;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => (
  <Badge
    variant="secondary"
    data-testid="character-status"
    data-status={status}
    className={cn('gap-1.5 bg-card/95 text-foreground shadow-sm backdrop-blur', className)}
  >
    <span aria-hidden="true" className={cn('size-2 rounded-full', DOT[status])} />
    {LABEL[status]}
  </Badge>
);
