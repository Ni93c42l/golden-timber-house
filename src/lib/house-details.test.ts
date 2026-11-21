import { describe, expect, it } from 'vitest';
import { HOUSE_AGE, normalizeHouseAge } from './house-details';

describe('Hausalter', () => {
  it('begrenzt den Regler auf 0 bis 2026 Jahre', () => {
    expect(HOUSE_AGE.min).toBe(0);
    expect(HOUSE_AGE.max).toBe(2026);
    expect(normalizeHouseAge(-1)).toBe(0);
    expect(normalizeHouseAge(2027)).toBe(2026);
  });
  it('verwendet ausschliesslich ganze Jahre in Einjahresschritten', () => {
    expect(HOUSE_AGE.step).toBe(1);
    expect(normalizeHouseAge(123.4)).toBe(123);
    expect(normalizeHouseAge(123.6)).toBe(124);
  });
});