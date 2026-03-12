/**
 * Official Brand Asset Map
 * 
 * Central registry mapping SPIRAL framework elements to their official uploaded icons
 * and illustrations. All components MUST use this map instead of generating or
 * inventing visual assets.
 * 
 * Priority order:
 * 1. Official uploaded icon from Brand Kit
 * 2. Official Martin Tognola illustration from Brand Kit
 * 3. Approved template visual
 * 4. Placeholder visual concept (neutral, never auto-generated)
 */

// ─── Zone Icons ───
import zoneSpiralingDown from '@/assets/icons/zone-spiraling-down.png';
import zoneStagnating from '@/assets/icons/zone-stagnating.png';
import zoneSpiralingUp from '@/assets/icons/zone-spiraling-up.png';

// ─── Principle Icons ───
import principleSynergize from '@/assets/icons/principle-synergize.png';
import principleProvide from '@/assets/icons/principle-provide.png';
import principleInspect from '@/assets/icons/principle-inspect.png';
import principleRespond from '@/assets/icons/principle-respond.png';
import principleActAccept from '@/assets/icons/principle-act-accept.png';
import principleLearn from '@/assets/icons/principle-learn.png';

// ─── Illustrations (Martin Tognola) ───
import illustrationSynergize from '@/assets/illustrations/synergize.jpg';
import illustrationProvide from '@/assets/illustrations/provide.jpg';
import illustrationInspect from '@/assets/illustrations/inspect.jpg';
import illustrationRespond from '@/assets/illustrations/respond.jpg';
import illustrationActAccept from '@/assets/illustrations/act-accept.jpg';
import illustrationLearn from '@/assets/illustrations/learn.jpg';
import illustrationSpiralingUp from '@/assets/illustrations/spiraling-up.png';
import illustrationSpiralingDown from '@/assets/illustrations/spiraling-down.jpg';
import illustrationSpiralingDown2 from '@/assets/illustrations/spiraling-down-2.jpg';
import illustrationStagnating from '@/assets/illustrations/stagnating.jpg';

// ─── Types ───
export interface BrandAssetEntry {
  icon: string;
  illustration: string;
  illustrationAlt?: string; // secondary illustration if available
  label: string;
}

// ─── Zone Assets ───
export const ZONE_ASSETS: Record<string, BrandAssetEntry> = {
  spiraling_down: {
    icon: zoneSpiralingDown,
    illustration: illustrationSpiralingDown,
    illustrationAlt: illustrationSpiralingDown2,
    label: 'Spiralling Down',
  },
  stagnating: {
    icon: zoneStagnating,
    illustration: illustrationStagnating,
    label: 'Stagnating',
  },
  spiraling_up: {
    icon: zoneSpiralingUp,
    illustration: illustrationSpiralingUp,
    label: 'Spiralling Up',
  },
};

// ─── Principle Assets (keyed by letter) ───
export const PRINCIPLE_ASSETS: Record<string, BrandAssetEntry> = {
  S: {
    icon: principleSynergize,
    illustration: illustrationSynergize,
    label: 'Synergize',
  },
  P: {
    icon: principleProvide,
    illustration: illustrationProvide,
    label: 'Provide',
  },
  I: {
    icon: principleInspect,
    illustration: illustrationInspect,
    label: 'Inspect',
  },
  R: {
    icon: principleRespond,
    illustration: illustrationRespond,
    label: 'Respond',
  },
  A: {
    icon: principleActAccept,
    illustration: illustrationActAccept,
    label: 'Act & Accept',
  },
  L: {
    icon: principleLearn,
    illustration: illustrationLearn,
    label: 'Learn',
  },
};

// ─── Principle Assets keyed by name (lowercase) ───
export const PRINCIPLE_ASSETS_BY_NAME: Record<string, BrandAssetEntry> = {
  synergize: PRINCIPLE_ASSETS.S,
  provide: PRINCIPLE_ASSETS.P,
  inspect: PRINCIPLE_ASSETS.I,
  respond: PRINCIPLE_ASSETS.R,
  'act & accept': PRINCIPLE_ASSETS.A,
  'act_accept': PRINCIPLE_ASSETS.A,
  learn: PRINCIPLE_ASSETS.L,
};

/**
 * Resolve the best available icon for a SPIRAL principle or zone.
 * Returns the official icon URL, or null if no match found.
 * 
 * @param key - Principle letter (S/P/I/R/A/L), principle name, or zone key
 */
export function resolveBrandIcon(key: string): string | null {
  // Try principle by letter
  if (PRINCIPLE_ASSETS[key]) return PRINCIPLE_ASSETS[key].icon;
  
  // Try principle by name
  const lower = key.toLowerCase().trim();
  if (PRINCIPLE_ASSETS_BY_NAME[lower]) return PRINCIPLE_ASSETS_BY_NAME[lower].icon;
  
  // Try zone
  const zoneKey = lower.replace(/[\s-]+/g, '_');
  if (ZONE_ASSETS[zoneKey]) return ZONE_ASSETS[zoneKey].icon;
  
  // Log missing asset for debugging
  console.warn(`[Brand Assets] No official icon found for: "${key}". Using placeholder.`);
  return null;
}

/**
 * Resolve the best available illustration for a SPIRAL principle or zone.
 */
export function resolveBrandIllustration(key: string): string | null {
  if (PRINCIPLE_ASSETS[key]) return PRINCIPLE_ASSETS[key].illustration;
  
  const lower = key.toLowerCase().trim();
  if (PRINCIPLE_ASSETS_BY_NAME[lower]) return PRINCIPLE_ASSETS_BY_NAME[lower].illustration;
  
  const zoneKey = lower.replace(/[\s-]+/g, '_');
  if (ZONE_ASSETS[zoneKey]) return ZONE_ASSETS[zoneKey].illustration;
  
  return null;
}

/**
 * Get all assets for a SPIRAL principle or zone.
 */
export function resolveBrandAsset(key: string): BrandAssetEntry | null {
  if (PRINCIPLE_ASSETS[key]) return PRINCIPLE_ASSETS[key];
  
  const lower = key.toLowerCase().trim();
  if (PRINCIPLE_ASSETS_BY_NAME[lower]) return PRINCIPLE_ASSETS_BY_NAME[lower];
  
  const zoneKey = lower.replace(/[\s-]+/g, '_');
  if (ZONE_ASSETS[zoneKey]) return ZONE_ASSETS[zoneKey];
  
  return null;
}
