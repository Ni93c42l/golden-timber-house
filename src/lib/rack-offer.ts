// Editable presentation defaults, not a calculated quote or heating simulation.
export const DEFAULT_RACK_OFFER = {
  name: 'Serverrack mit Wärmerückgewinnung',
  width: 1,
  depth: 1,
  height: 2,
  coverage: 70,
  price: 14900,
  currency: 'CHF',
  note: 'Unverbindliches Beispiel · Wärmedeckung und Preis sind noch nicht berechnet. Leistungsumfang und Steuern sind noch offen.',
};

export type RackOffer = typeof DEFAULT_RACK_OFFER;

export function normalizeOfferNumber(field: 'width' | 'depth' | 'height' | 'coverage' | 'price', value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, field === 'coverage' ? Math.min(100, value) : value);
}

export function formatOfferNumber(value: number) {
  return new Intl.NumberFormat('de-CH', { maximumFractionDigits: 2 }).format(value);
}