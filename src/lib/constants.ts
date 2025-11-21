import type { CEFRLevel } from './types';

export const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const CARD_TAGS = [
  'travel',
  'business',
  'daily-life',
  'presentations',
  'negotiation',
  'socializing',
  'exam'
];

export const STORAGE_KEY = 'iec-learning-history-v1';

export const API_ENDPOINTS = {
  getCards: '/api/GetCards',
  markCard: '/api/MarkCard'
} as const;
