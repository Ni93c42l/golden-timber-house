import { describe, expect, it } from 'vitest';
import { HEAT_SOURCES, LEVELS, CIRCULATION, FLOOR_PLATES, liftedOffset, stairBetween, radiatorsForLevel, facadeOpacity } from './house-layout';

describe('Innenräume des Stadthauses', () => {
  it('führt vom oberen Treppenpodest über begehbare Böden zu allen vier Raumzugängen', () => {
    const walkable = (x: number, z: number) => {
      const onFloor = FLOOR_PLATES.some(p => x >= p.x - p.width / 2 && x <= p.x + p.width / 2 && z >= p.z - p.depth / 2 && z <= p.z + p.depth / 2);
      const inStair = x > CIRCULATION.stairLeft - 0.15 && x < CIRCULATION.stairRight + 0.15 && z > CIRCULATION.back - 0.15 && z < CIRCULATION.front + 0.15;
      const inWall = Math.abs(Math.abs(x) - 1) < 0.23 && CIRCULATION.wallSegments.some(p => Math.abs(z - p.z) < p.length / 2 + 0.15);
      return onFloor && !inStair && !inWall && Math.abs(x) < 1.65 && z > -4.15 && z < 4.15;
    };
    for (const level of [1, 2, 3]) {
      const incoming = stairBetween(level - 1);
      expect(incoming?.endZ).toBe(-3);
      const queue: [number, number][] = [[-5, -36]];
      const seen = new Set(['-5,-36']);
      for (let i = 0; i < queue.length; i++) {
        const point = queue[i];
        if (!point) continue;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (dx === undefined || dz === undefined) continue;
          const x = point[0] + dx, z = point[1] + dz, key = `${x},${z}`;
          if (!seen.has(key) && walkable(x / 10, z / 10)) { seen.add(key); queue.push([x, z]); }
        }
      }
      for (const x of [-14, 14]) for (const z of [-36, 22]) expect(seen.has(`${x},${z}`)).toBe(true);
    }
  });
  it('lässt am Treppenende ein Podest und einen freien Seitenflur', () => {
    for (const lower of [0, 1, 2]) {
      const stair = stairBetween(lower);
      expect(stair?.endZ).toBe(CIRCULATION.back);
      expect(CIRCULATION.back - CIRCULATION.landingBack).toBeGreaterThanOrEqual(1.1);
      expect(CIRCULATION.corridorRight - CIRCULATION.stairRight).toBeGreaterThanOrEqual(0.9);
    }
  });
  it('erhält die blickseitige Fassade durchsichtig und die gegenüberliegende undurchsichtig', () => {
    expect(facadeOpacity(1)).toBeGreaterThan(0);
    expect(facadeOpacity(1)).toBeLessThan(0.2);
    expect(facadeOpacity(-1)).toBe(1);
  });
  it('zeigt Radiatoren auf allen drei Wohnstockwerken im Radiatorenmodus', () => {
    for (const level of [1, 2, 3]) expect(radiatorsForLevel(level, 'radiators').length).toBeGreaterThan(0);
    expect(radiatorsForLevel(0, 'radiators')).toEqual([]);
  });
  it('zeigt keine Radiatoren auf allen drei Wohnstockwerken im Bodenheizungsmodus', () => {
    for (const level of [1, 2, 3]) expect(radiatorsForLevel(level, 'underfloor')).toEqual([]);
  });
  it('zeigt im Gasmodus einen Gasheizkessel', () => {
    expect(HEAT_SOURCES.gas.device).toBe('gas-boiler');
  });
  it('zeigt im Wärmepumpenmodus eine Wärmepumpe', () => {
    expect(HEAT_SOURCES['heat-pump'].device).toBe('heat-pump');
  });
  it('zeigt im Servermodus ein 1 m breites, 1 m tiefes und 2 m hohes Rack', () => {
    expect(HEAT_SOURCES.server).toEqual({ device: 'server-rack', width: 1, depth: 1, height: 2 });
  });
  it('ersetzt einen Kellerraum durch einen Heizraum und erhält die anderen Räume', () => {
    const basement = LEVELS.find(level => level.id === 0);
    expect(basement?.rooms).toEqual(['Waschküche', 'Heizraum', 'Vorrat']);
  });
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