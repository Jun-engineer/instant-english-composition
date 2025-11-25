import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { STORAGE_KEY } from '@/lib/constants';
import type {
  DeckState,
  DeckCard,
  ReviewStatus,
  DeckFilters,
  VocabularyEntry,
  VocabularyFavorite,
  SentenceFavorite,
  VocabularyUsageExample
} from '@/lib/types';

const DEFAULT_CARD_LIMIT = 12;
const STORE_VERSION = 5;

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function sanitizeFilters(filters: DeckFilters): DeckFilters {
  const levels = unique(filters.levels);
  const tags = unique(filters.tags);
  const rawLimit = Number.isFinite(filters.limit) ? Math.round(filters.limit) : DEFAULT_CARD_LIMIT;
  const limit = Math.min(Math.max(rawLimit, 0), 100);
  return {
    levels,
    tags,
    limit
  };
}

interface DeckActions {
  setDeck: (cards: DeckCard[]) => void;
  markResult: (status: ReviewStatus) => void;
  toggleFlip: () => void;
  setFilters: (filters: DeckFilters) => void;
  resetSession: () => void;
  addFavorite: (entry: VocabularyEntry) => void;
  removeFavorite: (word: string) => void;
  addSentenceFavorite: (card: DeckCard) => void;
  removeSentenceFavorite: (cardId: string) => void;
}

const initialState: DeckState = {
  filters: sanitizeFilters({ levels: [], tags: [], limit: DEFAULT_CARD_LIMIT }),
  currentCardIndex: 0,
  history: [],
  deck: [],
  isFlipped: false,
  session: {
    total: 0,
    successes: 0,
    retries: 0,
    streak: 0
  },
  vocabularyFavorites: [],
  sentenceFavorites: []
};

function getNextIndex(state: DeckState) {
  if (!state.deck.length) return 0;
  const next = (state.currentCardIndex + 1) % state.deck.length;
  return next;
}

const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined
};

type Store = DeckState & DeckActions;

type SetState = (partial: Store | Partial<Store> | ((state: Store) => Store | Partial<Store>), replace?: boolean) => void;
type PersistedStore = Pick<Store, 'filters' | 'history' | 'vocabularyFavorites' | 'sentenceFavorites'>;

function upgradeUsageExamples(examples: unknown): VocabularyUsageExample[] | undefined {
  if (!Array.isArray(examples)) {
    return undefined;
  }
  const upgraded = examples
    .map((example) => {
      if (typeof example === 'string') {
        return example.trim().length ? { english: example.trim() } : null;
      }
      if (example && typeof example === 'object') {
        const english = typeof (example as { english?: string }).english === 'string'
          ? (example as { english?: string }).english?.trim()
          : undefined;
        const japanese = typeof (example as { japanese?: string }).japanese === 'string'
          ? (example as { japanese?: string }).japanese?.trim()
          : undefined;
        if (english) {
          return { english, japanese: japanese || undefined } satisfies VocabularyUsageExample;
        }
      }
      return null;
    })
    .filter((item): item is VocabularyUsageExample => Boolean(item));
  return upgraded.length ? upgraded : undefined;
}

function upgradeFavorites(favorites: VocabularyFavorite[] | undefined): VocabularyFavorite[] {
  if (!Array.isArray(favorites)) {
    return [];
  }
  return favorites.map((favorite) => ({
    ...favorite,
    usageExamples: upgradeUsageExamples(favorite.usageExamples) ?? undefined
  }));
}

export const useDeckStore = create<Store>()(
  persist<Store, [], [], PersistedStore>(
    (set: SetState, get: () => Store) => ({
      ...initialState,
      setDeck: (cards: DeckCard[]) => {
        set({ deck: cards, currentCardIndex: 0, isFlipped: false });
      },
      markResult: (status: ReviewStatus) => {
        const { deck, currentCardIndex, session, history } = get();
        const card = deck[currentCardIndex];
        if (!card) return;

        const now = Date.now();
        const updatedHistory = [
          {
            cardId: card.id,
            status,
            timestamp: now,
            cefrLevel: card.cefrLevel
          },
          ...history
        ].slice(0, 1000);

        const nextIndex = getNextIndex(get());
        const successes = status === 'success' ? session.successes + 1 : session.successes;
        const retries = status === 'retry' ? session.retries + 1 : session.retries;
        const streak = status === 'success' ? session.streak + 1 : 0;

        set({
          history: updatedHistory,
          currentCardIndex: nextIndex,
          isFlipped: false,
          session: {
            total: session.total + 1,
            successes,
            retries,
            streak
          }
        });
      },
      toggleFlip: () => set((state: Store) => ({ isFlipped: !state.isFlipped })),
      setFilters: (filters: DeckFilters) => set({ filters: sanitizeFilters(filters) }),
      resetSession: () => set({
        session: initialState.session,
        history: initialState.history,
        currentCardIndex: initialState.currentCardIndex,
        isFlipped: false
      }),
      addFavorite: (entry: VocabularyEntry) => set((state: Store) => {
        const normalized = entry.word.trim().toLowerCase();
        if (!normalized) {
          return {};
        }
        const alreadySaved = state.vocabularyFavorites.some((favorite) => favorite.word.toLowerCase() === normalized);
        if (alreadySaved) {
          return {};
        }
        const favorite: VocabularyFavorite = {
          ...entry,
          word: entry.word.trim(),
          savedAt: Date.now()
        };
        return {
          vocabularyFavorites: [favorite, ...state.vocabularyFavorites].slice(0, 300)
        } satisfies Partial<Store>;
      }),
      removeFavorite: (word: string) => set((state: Store) => {
        const normalized = word.trim().toLowerCase();
        if (!normalized) {
          return {};
        }
        return {
          vocabularyFavorites: state.vocabularyFavorites.filter((favorite) => favorite.word.toLowerCase() !== normalized)
        } satisfies Partial<Store>;
      }),
      addSentenceFavorite: (card: DeckCard) => set((state: Store) => {
        if (!card?.id) {
          return {};
        }
        const alreadySaved = state.sentenceFavorites.some((favorite) => favorite.cardId === card.id);
        if (alreadySaved) {
          return {};
        }
        const favorite: SentenceFavorite = {
          cardId: card.id,
          prompt: card.prompt,
          answer: card.answer,
          cefrLevel: card.cefrLevel,
          tags: [...card.tags],
          savedAt: Date.now()
        };
        return {
          sentenceFavorites: [favorite, ...state.sentenceFavorites].slice(0, 300)
        } satisfies Partial<Store>;
      }),
      removeSentenceFavorite: (cardId: string) => set((state: Store) => {
        if (!cardId) {
          return {};
        }
        return {
          sentenceFavorites: state.sentenceFavorites.filter((favorite) => favorite.cardId !== cardId)
        } satisfies Partial<Store>;
      })
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage<PersistedStore>(() => (typeof window !== 'undefined' ? window.localStorage : memoryStorage)),
      partialize: (state: Store) => ({
        filters: state.filters,
        history: state.history,
        vocabularyFavorites: state.vocabularyFavorites,
        sentenceFavorites: state.sentenceFavorites
      }),
      migrate: (persistedState, version) => {
        const state = (persistedState as PersistedStore | undefined) ?? {
          filters: initialState.filters,
          history: initialState.history,
          vocabularyFavorites: initialState.vocabularyFavorites,
          sentenceFavorites: initialState.sentenceFavorites
        };
        if (version < STORE_VERSION) {
          return {
            ...state,
            filters: initialState.filters,
            vocabularyFavorites: upgradeFavorites(state.vocabularyFavorites) ?? initialState.vocabularyFavorites,
            sentenceFavorites: state.sentenceFavorites ?? initialState.sentenceFavorites
          } satisfies PersistedStore;
        }
        return {
          ...state,
          vocabularyFavorites: upgradeFavorites(state.vocabularyFavorites)
        } satisfies PersistedStore;
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedStore | undefined;
        return {
          ...currentState,
          filters: sanitizeFilters(persisted?.filters ?? currentState.filters),
          history: persisted?.history ?? currentState.history,
          vocabularyFavorites: upgradeFavorites(persisted?.vocabularyFavorites) ?? currentState.vocabularyFavorites,
          sentenceFavorites: persisted?.sentenceFavorites ?? currentState.sentenceFavorites
        };
      }
    }
  )
);
