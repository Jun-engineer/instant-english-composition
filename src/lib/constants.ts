import type { CEFRLevel } from './types';

export const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const CARD_TAGS = [
  'ability',
  'action',
  'analysis',
  'animals',
  'apology',
  'basic',
  'business',
  'clothes',
  'communication',
  'conditional',
  'critical',
  'culture',
  'daily-life',
  'decision',
  'discussion',
  'dreams',
  'economy',
  'education',
  'entertainment',
  'environment',
  'ethics',
  'evaluation',
  'exercise',
  'experience',
  'feeling',
  'food',
  'friends',
  'future',
  'health',
  'hobby',
  'home',
  'literature',
  'location',
  'media',
  'movie',
  'opinion',
  'policy',
  'reading',
  'reflection',
  'relationships',
  'research',
  'school',
  'shopping',
  'social',
  'sports',
  'study',
  'tech',
  'technology',
  'theory',
  'thinking',
  'travel',
  'weather',
  'work'
];

export const COMMON_CARD_TAGS = ['business', 'analysis', 'work', 'hotel', 'restaurant', 'daily-life'];

export const STORAGE_KEY = 'iec-learning-history-v1';

function withApiBase(path: string) {
  const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const normalizedBase = rawBase.replace(/\/$/, '');
  if (!normalizedBase) {
    return path;
  }
  return `${normalizedBase}${path}`;
}

export const API_ENDPOINTS = {
  getCards: withApiBase('/api/GetCards'),
  markCard: withApiBase('/api/MarkCard'),
  lookupVocabulary: withApiBase('/api/LookupVocabulary')
} as const;
