/**
 * Premium feature constants and helpers.
 */

export const FREE_LIMITS = {
  /** Max AI vocabulary lookups per day (free tier) */
  AI_LOOKUPS_PER_DAY: 5,
  /** Max word favorites (free tier) */
  WORD_FAVORITES: 30,
  /** Max sentence favorites (free tier) */
  SENTENCE_FAVORITES: 30,
  /** Max cards per session (free tier) */
  CARDS_PER_SESSION: 20,
  /** CEFR levels available on free tier */
  FREE_LEVELS: ['A1', 'A2', 'B1', 'B2'] as const,
} as const;

export const PREMIUM_LIMITS = {
  WORD_FAVORITES: 300,
  SENTENCE_FAVORITES: 300,
  CARDS_PER_SESSION: 100,
} as const;

/** RevenueCat entitlement identifier */
export const ENTITLEMENT_ID = 'premium';

/** RevenueCat API key — set in env or replace with actual key */
export const REVENUECAT_API_KEY_IOS =
  process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY ?? 'appl_OCQbeCJMSgTFzIybfmzCsLvlFHz';

/** AdMob unit IDs */
export const ADMOB_IDS = {
  /** Banner ad on training screen */
  BANNER: process.env.NEXT_PUBLIC_ADMOB_BANNER_ID ?? 'ca-app-pub-5434162081070782/2006515142',
  /** Interstitial after training session */
  INTERSTITIAL: process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID ?? 'ca-app-pub-5434162081070782/7032657297',
} as const;

const AI_LOOKUP_STORAGE_KEY = 'iec-ai-lookup-usage';

interface DailyUsage {
  date: string; // YYYY-MM-DD
  count: number;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getUsage(): DailyUsage {
  try {
    const raw = localStorage.getItem(AI_LOOKUP_STORAGE_KEY);
    if (!raw) return { date: todayKey(), count: 0 };
    const parsed = JSON.parse(raw) as DailyUsage;
    if (parsed.date !== todayKey()) return { date: todayKey(), count: 0 };
    return parsed;
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

export function getAILookupCount(): number {
  return getUsage().count;
}

export function incrementAILookupCount(): void {
  const usage = getUsage();
  usage.count += 1;
  localStorage.setItem(AI_LOOKUP_STORAGE_KEY, JSON.stringify(usage));
}

export function canUseAILookup(isPremium: boolean): boolean {
  if (isPremium) return true;
  return getUsage().count < FREE_LIMITS.AI_LOOKUPS_PER_DAY;
}

export function remainingAILookups(isPremium: boolean): number {
  if (isPremium) return Infinity;
  return Math.max(0, FREE_LIMITS.AI_LOOKUPS_PER_DAY - getUsage().count);
}

export function isLevelFree(level: string): boolean {
  return (FREE_LIMITS.FREE_LEVELS as readonly string[]).includes(level);
}

export function getMaxCards(isPremium: boolean): number {
  return isPremium ? PREMIUM_LIMITS.CARDS_PER_SESSION : FREE_LIMITS.CARDS_PER_SESSION;
}

export function getMaxFavorites(isPremium: boolean): { words: number; sentences: number } {
  return isPremium
    ? { words: PREMIUM_LIMITS.WORD_FAVORITES, sentences: PREMIUM_LIMITS.SENTENCE_FAVORITES }
    : { words: FREE_LIMITS.WORD_FAVORITES, sentences: FREE_LIMITS.SENTENCE_FAVORITES };
}
