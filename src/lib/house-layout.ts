export const HOUSE = { width: 12.5, depth: 9, socle: 1.3, storey: 3.3, top: 7.9, roof: 3.6 } as const;
export const HEATING_MODES = [
  { id: 'gas', name: 'Gasbetrieb' },
  { id: 'heat-pump', name: 'Wärmepumpe' },
  { id: 'server', name: 'Serverrack' },
] as const;
export type HeatingMode = typeof HEATING_MODES[number]['id'];
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
  return { from: bottom.y, to: top.y, rise: top.y - bottom.y, steps: 18, run: 4, width: 1.4 };
}

export function liftedOffset(layer: number, selected: number | null) {
  if (selected === null) return 0;
  if (layer === 3 && selected === 3) return 7;
  return layer > selected ? 7 : 0;
}