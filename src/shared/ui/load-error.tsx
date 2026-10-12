import { useEffect } from 'react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { Button } from './button';

const describe = (error: unknown): string => {
  const status =
    typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined;

  if (status === 429) {
    return 'The Rick and Morty API is limiting requests right now. Wait a few seconds and try again.';
  }

  return 'The Rick and Morty API did not respond. Check your connection and try again.';
};

/**
 * Route error screen. Retrying resets the failed queries and re-runs the loaders, so the page
 * recovers in place without a full reload.
 */
export const LoadError = ({ error }: ErrorComponentProps) => {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <section role="alert" className="flex max-w-md flex-col items-start gap-4 py-16">
      <h1 className="text-4xl font-extrabold font-condensed">This page did not load</h1>
      <p className="text-muted-foreground">{describe(error)}</p>
      <Button onClick={() => void router.invalidate()} data-testid="retry">
        Try again
      </Button>
    </section>
  );
};
