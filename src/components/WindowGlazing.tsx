import { createContext, useContext } from 'react';
import { GLAZING_APPEARANCE, type Glazing } from '@/lib/house-details';

export type GlazingSelection = { id: Glazing; changed: boolean };
export type GlazingPalette = Record<Glazing | 'original', { glass: string; frame: string }>;

export const WindowGlazingContext = createContext<{ selection: GlazingSelection; palette: GlazingPalette } | null>(null);

export function useWindowGlazing() {
  const context = useContext(WindowGlazingContext);
  if (!context) throw new Error('Window glazing requires its scene provider');
  const { selection, palette } = context;
  return {
    ...selection,
    ...(selection.changed ? GLAZING_APPEARANCE[selection.id] : { frameWidth: 0.07, frameDepth: 0.05, roughness: 0.2 }),
    ...palette[selection.changed ? selection.id : 'original'],
  };
}