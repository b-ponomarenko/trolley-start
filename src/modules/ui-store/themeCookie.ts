import { createIsomorphicFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { isTheme } from './types';
import type { Theme } from './types';

export const THEME_COOKIE = 'theme';

const ONE_YEAR = 60 * 60 * 24 * 365;

const fromDocument = (): string | undefined =>
  document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${THEME_COOKIE}=`))
    ?.slice(THEME_COOKIE.length + 1);

/**
 * Reads the saved theme from the request cookie on the server and from `document.cookie` in the
 * browser, so both render the same theme and hydration never disagrees.
 */
export const readThemeCookie = createIsomorphicFn()
  .server((): Theme | undefined => {
    const value = getCookie(THEME_COOKIE);

    return isTheme(value) ? value : undefined;
  })
  .client((): Theme | undefined => {
    const value = fromDocument();

    return isTheme(value) ? value : undefined;
  });

export const writeThemeCookie = (theme: Theme) => {
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
};
