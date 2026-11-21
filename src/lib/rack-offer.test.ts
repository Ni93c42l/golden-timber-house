import { describe, expect, it } from 'vitest';
import { normalizeOfferNumber } from './rack-offer';

describe('manual rack offer values', () => {
  it('keeps coverage within a percentage of the annual heat demand', () => {
    expect(normalizeOfferNumber('coverage', 120)).toBe(100);
    expect(normalizeOfferNumber('coverage', -5)).toBe(0);
    expect(normalizeOfferNumber('coverage', 64.5)).toBe(64.5);
  });
  it('accepts manually entered dimensions and prices without deriving them from the house', () => {
    expect(normalizeOfferNumber('width', 1.2)).toBe(1.2);
    expect(normalizeOfferNumber('height', 2.4)).toBe(2.4);
    expect(normalizeOfferNumber('price', 18000)).toBe(18000);
  });
});