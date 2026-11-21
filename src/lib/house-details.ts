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

export type Glazing = typeof GLAZING_OPTIONS[number]['id'];
export type WindowKind = 'closedPanel' | 'closedLouvre' | 'openPanel' | 'openLouvre';

// Deliberately visible presentation differences, not thermal-performance calculations.
export const GLAZING_APPEARANCE = {
  single: { frameWidth: 0.045, frameDepth: 0.04, roughness: 0.32 },
  double: { frameWidth: 0.08, frameDepth: 0.085, roughness: 0.23 },
  triple: { frameWidth: 0.12, frameDepth: 0.13, roughness: 0.17 },
  quadruple: { frameWidth: 0.16, frameDepth: 0.18, roughness: 0.12 },
} satisfies Record<Glazing, { frameWidth: number; frameDepth: number; roughness: number }>;

export function windowKindForGlazing(kind: WindowKind, changed: boolean, reveal: boolean): WindowKind {
  if (!changed || !reveal) return kind;
  return kind === 'closedPanel' ? 'openPanel' : kind === 'closedLouvre' ? 'openLouvre' : kind;
}