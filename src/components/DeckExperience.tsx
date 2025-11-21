'use client';

import { useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { FlashCard } from './FlashCard';
import { DeckControls } from './DeckControls';
import { DeckFilters } from './DeckFilters';
import { HistoryPanel } from './HistoryPanel';
import { useDeckStore } from '@/state/useDeckStore';
import { fetcher } from '@/lib/api';
import type { DeckCard } from '@/lib/types';
import { API_ENDPOINTS } from '@/lib/constants';

interface CardsResponse {
  cards: DeckCard[];
}

const buildKey = (levels: string[], tags: string[]) => {
  const params = new URLSearchParams();
  if (levels.length && levels.length < 6) {
    params.set('levels', levels.join(','));
  }
  if (tags.length) {
    params.set('tags', tags.join(','));
  }
  const base = API_ENDPOINTS.getCards;
  return params.toString() ? `${base}?${params.toString()}` : base;
};

export function DeckExperience() {
  const filters = useDeckStore((state) => state.filters);
  const setDeck = useDeckStore((state) => state.setDeck);
  const toggleFlip = useDeckStore((state) => state.toggleFlip);
  const deck = useDeckStore((state) => state.deck);
  const currentIndex = useDeckStore((state) => state.currentCardIndex);
  const isFlipped = useDeckStore((state) => state.isFlipped);

  const key = useMemo(() => buildKey(filters.levels, filters.tags), [filters.levels, filters.tags]);
  const { data, error, isLoading } = useSWR<CardsResponse>(key, fetcher);

  useEffect(() => {
    if (data?.cards) {
      setDeck(data.cards);
    }
  }, [data, setDeck]);

  const currentCard = deck[currentIndex] ?? null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 lg:flex-row">
      <div className="flex flex-1 flex-col items-center gap-8">
        <div className="w-full text-center">
          <h1 className="text-3xl font-bold text-slate-50 sm:text-4xl">瞬間英作文トレーニング</h1>
          <p className="mt-3 text-base text-slate-300">CEFR レベルとトピックを組み合わせたカスタム練習セットで、瞬間英作文を鍛えましょう。</p>
        </div>
        {error ? (
          <div className="w-full max-w-xl rounded-2xl border border-rose-400/60 bg-rose-950/40 p-6 text-rose-200">
            <p className="font-semibold">カードの取得に失敗しました。</p>
            <p className="mt-2 text-sm text-rose-200/80">API やネットワーク設定を確認し、再度お試しください。</p>
          </div>
        ) : null}
        <FlashCard card={currentCard} isFlipped={isFlipped} onToggle={toggleFlip} />
        <DeckControls disabled={isLoading || !currentCard} />
        <p className="text-xs text-slate-500">スペース: 解答表示 / F: 正解 / J: 再挑戦</p>
      </div>
      <div className="flex flex-1 flex-col gap-6">
        <DeckFilters />
        <HistoryPanel />
        {isLoading ? (
          <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-slate-300">カードを読み込んでいます...</div>
        ) : null}
      </div>
    </div>
  );
}
