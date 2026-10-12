import { commandLineListTokens } from '../../core/tokens';
import type { CommandLines } from '../../core/types';

const { customerStart, resolveUserDeps, resolvePageDeps, afterSpaTransition } =
  commandLineListTokens;

/** The default lifecycle, per environment. */
export const lines: CommandLines = {
  server: [customerStart, resolveUserDeps, resolvePageDeps],
  client: [customerStart, resolveUserDeps, resolvePageDeps],
  spa: [afterSpaTransition],
};
