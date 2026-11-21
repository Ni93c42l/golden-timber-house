import { describe, expect, it } from 'vitest';
import { LEVELS, liftedOffset, stairBetween } from './house-layout';

describe('Innenräume des Stadthauses', () => {
  it('enthält Schlafzimmer, Küche und Wohnzimmer', () => {
    const rooms: string[] = LEVELS.flatMap(level => [...level.rooms]);
    for (const room of ['Schlafzimmer', 'Küche', 'Wohnzimmer']) expect(rooms).toContain(room);
  });
  it('verbindet alle verschiedenen Stockwerke durch Treppen', () => {
    for (const lower of [0, 1, 2]) {
      const stair = stairBetween(lower);
      expect(stair).not.toBeNull();
      expect(stair?.from).toBe(LEVELS[lower]?.y);
      expect(stair?.to).toBe(LEVELS[lower + 1]?.y);
      expect(stair?.rise).toBeGreaterThan(0);
    }
    expect(stairBetween(3)).toBeNull();
  });
  it('hebt nur die oberen Stockwerke an und schliesst das Haus wieder', () => {
    expect(liftedOffset(0, 1)).toBe(0);
    expect(liftedOffset(1, 1)).toBe(0);
    expect(liftedOffset(2, 1)).toBe(7);
    expect(liftedOffset(3, 1)).toBe(7);
    expect(liftedOffset(3, 3)).toBe(7);
    for (const layer of [0, 1, 2, 3]) expect(liftedOffset(layer, null)).toBe(0);
  });
  it('lässt oberhalb der Auswahl alle Stockwerke verbunden und erzeugt genau einen Spalt', () => {
    for (const selected of [0, 1, 2]) {
      const offsets = [0, 1, 2, 3].map(layer => liftedOffset(layer, selected));
      const gaps = offsets.slice(1).map((offset, index) => offset - (offsets[index] ?? 0));
      expect(gaps.filter(gap => gap > 0)).toEqual([7]);
      expect(gaps[selected]).toBe(7);
      for (let layer = selected + 1; layer < 3; layer++) {
        expect(liftedOffset(layer + 1, selected)).toBe(liftedOffset(layer, selected));
      }
    }
  });
});