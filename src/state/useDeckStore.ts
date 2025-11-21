import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { STORAGE_KEY, CEFR_LEVELS } from '@/lib/constants';
import type { DeckState, DeckCard, ReviewStatus, DeckFilters } from '@/lib/types';

interface DeckActions {
  setDeck: (cards: DeckCard[]) => void;
  markResult: (status: ReviewStatus) => void;
  toggleFlip: () => void;
  setFilters: (filters: DeckFilters) => void;
  resetSession: () => void;
}

const initialState: DeckState = {
  filters: {
    levels: [...CEFR_LEVELS],
    tags: []
  },
  currentCardIndex: 0,
  history: [],
  deck: [],
  isFlipped: false,
  session: {
    total: 0,
    successes: 0,
    retries: 0,
    streak: 0
  }
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
type PersistedStore = Pick<Store, 'filters' | 'history'>;

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
      setFilters: (filters: DeckFilters) => set({ filters }),
      resetSession: () => set({
        session: initialState.session,
        history: initialState.history,
        currentCardIndex: initialState.currentCardIndex,
        isFlipped: false
      })
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage<PersistedStore>(() => (typeof window !== 'undefined' ? window.localStorage : memoryStorage)),
      partialize: (state: Store) => ({
        filters: state.filters,
        history: state.history
      })
    }
  )
);
