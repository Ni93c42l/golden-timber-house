export const HOUSE = { width: 12.5, depth: 9, socle: 1.3, storey: 3.3, top: 7.9, roof: 3.6 } as const;
export const LEVELS = [
  { id: 0, name: 'Keller', y: -1.4, rooms: ['Waschküche', 'Werkstatt', 'Vorrat'] },
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
  return layer > selected ? 7 + (layer - selected - 1) * 4 : 0;
}