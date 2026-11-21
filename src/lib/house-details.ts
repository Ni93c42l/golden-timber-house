export const HOUSE_AGE = { min: 0, max: 2026, step: 1 } as const;
export function normalizeHouseAge(value: number) {
  return Number.isFinite(value) ? Math.min(HOUSE_AGE.max, Math.max(HOUSE_AGE.min, Math.round(value))) : 0;
}
export const GLAZING_OPTIONS = [
  { id: 'single', name: 'Einfachverglasung' },
  { id: 'double', name: 'Doppelverglasung' },
  { id: 'triple', name: 'Dreifachverglasung' },
  { id: 'quadruple', name: 'Vierfachverglasung' },
] as const;