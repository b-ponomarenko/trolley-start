import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { mergeLayoutOptions } from './layoutOptions';

const Header = () => null;
const OtherHeader = () => null;
const Footer = () => null;
const A = ({ children }: { children: ReactNode }) => children;
const B = ({ children }: { children: ReactNode }) => children;

describe('mergeLayoutOptions', () => {
  it('lets later registrations override components and accumulates wrappers', () => {
    const merged = mergeLayoutOptions([
      { components: { header: Header, footer: Footer }, wrappers: [A] },
      { components: { header: OtherHeader } },
      { wrappers: [B] },
    ]);

    expect(merged.components).toEqual({ header: OtherHeader, footer: Footer });
    expect(merged.wrappers).toEqual([A, B]);
  });

  it('copes with nothing registered', () => {
    expect(mergeLayoutOptions(null)).toEqual({ components: {}, wrappers: [] });
  });
});
