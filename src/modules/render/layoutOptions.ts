import type { LayoutOptions } from './tokens';

/** Merges every `LAYOUT_OPTIONS_TOKEN` value: later components win, wrappers accumulate. */
export const mergeLayoutOptions = (options: LayoutOptions[] | null | undefined) =>
  (options ?? []).reduce<Required<LayoutOptions>>(
    (merged, item) => ({
      components: { ...merged.components, ...item.components },
      wrappers: [...merged.wrappers, ...(item.wrappers ?? [])],
    }),
    { components: {}, wrappers: [] }
  );
