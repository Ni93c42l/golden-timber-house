export const HOUSE = { width: 12.5, depth: 9, socle: 1.3, storey: 3.3, top: 7.9, roof: 3.6 } as const;
export const HEATING_MODES = [
  { id: 'gas', name: 'Gasbetrieb' },
  { id: 'heat-pump', name: 'Wärmepumpe' },
  { id: 'server', name: 'Serverrack' },
] as const;
export type HeatingMode = typeof HEATING_MODES[number]['id'];
export const HEATING_SYSTEMS = [
  { id: 'radiators', name: 'Radiatoren' },
  { id: 'underfloor', name: 'Bodenheizung' },
] as const;
export type HeatingSystem = typeof HEATING_SYSTEMS[number]['id'];
const RADIATOR_POSITIONS = [
  { x: -2.45, z: 4.03, angle: Math.PI },
  { x: 4.7, z: 4.03, angle: Math.PI },
  { x: 3, z: -3.98, angle: 0 },
] as const;
export function radiatorsForLevel(level: number, system: HeatingSystem) {
  return system === 'radiators' && [1, 2, 3].includes(level) ? RADIATOR_POSITIONS : [];
}
export const HEAT_SOURCES = {
  gas: { device: 'gas-boiler', width: 1.35, depth: 1.25, height: 1.65 },
  'heat-pump': { device: 'heat-pump', width: 1.2, depth: 1.05, height: 1.65 },
  server: { device: 'server-rack', width: 1, depth: 1, height: 2 },
} as const;
export const LEVELS = [
  { id: 0, name: 'Keller', y: -1.4, rooms: ['Waschküche', 'Heizraum', 'Vorrat'] },
  { id: 1, name: 'Erdgeschoss', y: 1.3, rooms: ['Wohnzimmer', 'Küche', 'Esszimmer', 'Gäste-WC'] },
  { id: 2, name: 'Obergeschoss', y: 4.6, rooms: ['Schlafzimmer', 'Kinderzimmer', 'Arbeitszimmer', 'Bad'] },
  { id: 3, name: 'Dachstock', y: 7.9, rooms: ['Gästezimmer', 'Lesezimmer', 'Abstellraum'] },
] as const;
export function stairBetween(lower: number) {
  const bottom = LEVELS.find(level => level.id === lower);
  const top = LEVELS.find(level => level.id === lower + 1);
  if (!bottom || !top) return null;
  return { from: bottom.y, to: top.y, rise: top.y - bottom.y, steps: 18, run: 3.4, width: 0.9, x: -0.5, startZ: 0.4, endZ: -3 };
}

// A continuous right-hand passage bypasses the stacked stair flights.
export const CIRCULATION = {
  stairLeft: -0.95, stairRight: -0.05, front: 0.4, back: -3,
  landingBack: -4.2, corridorLeft: -0.92, corridorRight: 0.92,
  doorWidth: 1.1, doors: [2.2, -3.65],
  wallSegments: [{ z: 3.55, length: 1.6 }, { z: -0.75, length: 4.8 }, { z: -4.25, length: 0.2 }],
} as const;
export const FLOOR_PLATES = [
  { x: -3.625, z: 0, width: 5.25, depth: 9 },
  { x: 3.625, z: 0, width: 5.25, depth: 9 },
  { x: 0, z: 2.45, width: 2, depth: 4.1 },
  { x: 0, z: -3.75, width: 2, depth: 1.5 },
  { x: 0.475, z: -1.3, width: 1.05, depth: 3.4 },
] as const;
export function facadeOpacity(facing: number) {
  return facing > 0 ? 0.12 : 1;
}

export function liftedOffset(layer: number, selected: number | null) {
  if (selected === null) return 0;
  if (layer === 3 && selected === 3) return 7;
  return layer > selected ? 7 : 0;
}