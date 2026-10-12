/** `system` follows the operating system's light/dark preference. */
export type Theme = 'light' | 'dark' | 'system';

export interface UIState {
  theme: Theme;
}

export const THEMES: readonly Theme[] = ['light', 'dark', 'system'];

export const isTheme = (value: unknown): value is Theme =>
  typeof value === 'string' && (THEMES as readonly string[]).includes(value);
