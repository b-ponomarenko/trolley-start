import { Link } from '@tanstack/react-router';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

export const AppHeader = () => (
  <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
      <Link to="/" className="flex items-center gap-3 rounded-md" data-testid="nav-home">
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-full bg-morty ring-2 ring-accent-foreground"
        >
          <span className="size-3.5 rounded-full border-2 border-accent-foreground" />
        </span>
        <span className="text-xl font-extrabold font-condensed">Multiverse Census</span>
      </Link>
      <div className="flex items-center gap-4">
        <a
          href="https://rickandmortyapi.com"
          target="_blank"
          rel="noreferrer"
          className="hidden text-sm text-muted-foreground hover:text-foreground sm:block"
        >
          Data from the Rick and Morty API
        </a>
        <ThemeToggle />
      </div>
    </div>
  </header>
);
