import type { CEFRLevel } from './types';

export const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const CARD_TAGS = [
  'culture',
  'daily-life',
  'economy',
  'entertainment',
  'environment',
  'ethics',
  'family',
  'food',
  'future',
  'greetings',
  'health',
  'history',
  'opinion',
  'planning',
  'politics',
  'psychology',
  'research',
  'school',
  'service',
  'shopping',
  'social',
  'sports',
  'technology',
  'travel',
  'weather',
  'work'
];

export const COMMON_CARD_TAGS = ['daily-life', 'travel', 'food', 'work', 'school', 'shopping'];

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
