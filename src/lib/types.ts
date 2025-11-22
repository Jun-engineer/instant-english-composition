export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ReviewStatus = 'success' | 'retry';

export interface DeckCard {
  id: string;
  prompt: string;
  answer: string;
  cefrLevel: CEFRLevel;
  tags: string[];
  hint?: string;
}

export interface ReviewRecord {
  cardId: string;
  status: ReviewStatus;
  timestamp: number;
  cefrLevel: CEFRLevel;
}

export interface DeckFilters {
  levels: CEFRLevel[];
  tags: string[];
  limit: number;
}

export interface SessionStats {
  total: number;
  successes: number;
  retries: number;
  streak: number;
}

export interface DeckState {
  filters: DeckFilters;
  currentCardIndex: number;
  history: ReviewRecord[];
  deck: DeckCard[];
  isFlipped: boolean;
  session: SessionStats;
}
