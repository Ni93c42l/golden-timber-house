import { describe, expect, it } from 'vitest';
import { HOUSE_AGE, normalizeHouseAge, windowKindForGlazing } from './house-details';

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

describe('Verglasung und Fensterläden', () => {
  it('behält die ursprünglichen Fensterläden bis zur ersten Änderung bei', () => {
    expect(windowKindForGlazing('closedPanel', false, true)).toBe('closedPanel');
    expect(windowKindForGlazing('closedLouvre', false, true)).toBe('closedLouvre');
  });
  it('öffnet zusätzliche ausgewählte Fensterläden nach einem Verglasungswechsel', () => {
    expect(windowKindForGlazing('closedPanel', true, true)).toBe('openPanel');
    expect(windowKindForGlazing('closedLouvre', true, true)).toBe('openLouvre');
    expect(windowKindForGlazing('closedPanel', true, false)).toBe('closedPanel');
    expect(windowKindForGlazing('openLouvre', true, true)).toBe('openLouvre');
  });
});