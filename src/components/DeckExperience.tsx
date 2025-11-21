'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlashCard } from './FlashCard';
import { DeckFilters } from './DeckFilters';
import { useDeckStore } from '@/state/useDeckStore';
import { fetchCards } from '@/lib/api';
import type { DeckCard, ReviewStatus } from '@/lib/types';

type Step = 'intro' | 'filters' | 'training' | 'results';

export function DeckExperience() {
  const filters = useDeckStore((state) => state.filters);
  const setDeck = useDeckStore((state) => state.setDeck);
  const markResult = useDeckStore((state) => state.markResult);
  const toggleFlip = useDeckStore((state) => state.toggleFlip);
  const resetSession = useDeckStore((state) => state.resetSession);
  const deck = useDeckStore((state) => state.deck);
  const currentIndex = useDeckStore((state) => state.currentCardIndex);
  const isFlipped = useDeckStore((state) => state.isFlipped);
  const session = useDeckStore((state) => state.session);
  const history = useDeckStore((state) => state.history);

  const [step, setStep] = useState<Step>('intro');
  const [activeCards, setActiveCards] = useState<DeckCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [swipeFeedback, setSwipeFeedback] = useState<ReviewStatus | null>(null);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentCard = deck[currentIndex] ?? null;
  const totalCards = activeCards.length;
  const displayPosition = totalCards ? Math.min(session.total + 1, totalCards) : 0;

  useEffect(() => {
    if (step === 'training' && totalCards > 0 && session.total >= totalCards) {
      setStep('results');
    }
  }, [step, session.total, totalCards]);

  useEffect(() => {
    return () => {
      if (feedbackTimeout.current) {
        clearTimeout(feedbackTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (step !== 'training' && swipeFeedback) {
      setSwipeFeedback(null);
    }
  }, [step, swipeFeedback]);

  const statusByCard = useMemo(() => {
    const map = new Map<string, ReviewStatus>();
    for (const record of history) {
      if (!map.has(record.cardId)) {
        map.set(record.cardId, record.status);
      }
    }
    return map;
  }, [history]);

  const retryCards = useMemo(
    () => activeCards.filter((card) => statusByCard.get(card.id) === 'retry'),
    [activeCards, statusByCard]
  );

  const handleFetchCards = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const cards = await fetchCards(filters);
      if (!cards.length) {
        setErrorMessage('選択した条件のカードが見つかりませんでした。');
        return;
      }
      resetSession();
      setDeck(cards);
      setActiveCards(cards);
      setStep('training');
    } catch (fetchError) {
      console.error(fetchError);
      setErrorMessage('カードの取得に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  }, [filters, resetSession, setDeck]);

  const handleStart = useCallback(() => {
    setErrorMessage(null);
    setStep('filters');
  }, []);

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!currentCard || loading || step !== 'training') return;
      const status: ReviewStatus = direction === 'right' ? 'success' : 'retry';
      markResult(status);
      if (feedbackTimeout.current) {
        clearTimeout(feedbackTimeout.current);
      }
      setSwipeFeedback(status);
      feedbackTimeout.current = setTimeout(() => setSwipeFeedback(null), 650);
    },
    [currentCard, loading, markResult, step]
  );

  const handleEditSelection = useCallback(() => {
    resetSession();
    setDeck([]);
    setActiveCards([]);
    setStep('filters');
  }, [resetSession, setDeck]);

  const handleBackHome = useCallback(() => {
    if (feedbackTimeout.current) {
      clearTimeout(feedbackTimeout.current);
    }
    resetSession();
    setDeck([]);
    setActiveCards([]);
    setErrorMessage(null);
    setStep('intro');
  }, [resetSession, setDeck]);

  const handleReview = useCallback(() => {
    if (!retryCards.length) {
      handleBackHome();
      return;
    }
    resetSession();
    setDeck(retryCards);
    setActiveCards(retryCards);
    setStep('training');
  }, [handleBackHome, resetSession, retryCards, setDeck]);

  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center gap-8 px-4 py-10 text-slate-50">
      {step === 'intro' ? (
        <section className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold sm:text-4xl">瞬間英作文トレーニング</h1>
            <p className="text-sm text-slate-300">
              レベルとトピックを選んで、スワイプ操作でテンポよく瞬間英作文を鍛えましょう。
            </p>
          </div>
          <button
            type="button"
            className="w-full rounded-2xl bg-blue-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-400"
            onClick={handleStart}
          >
            始める
          </button>
        </section>
      ) : null}

      {step === 'filters' ? (
        <section className="flex w-full max-w-lg flex-col items-stretch gap-4 text-center sm:text-left">
          <DeckFilters onSubmit={handleFetchCards} loading={loading} />
          {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}
          <button
            type="button"
            className="text-sm font-medium text-slate-400 underline decoration-slate-600 hover:text-slate-200"
            onClick={handleBackHome}
          >
            トップに戻る
          </button>
        </section>
      ) : null}

      {step === 'training' ? (
        <section className="flex w-full max-w-lg flex-col items-center gap-5 text-center">
          <div className="text-sm text-slate-300">
            {totalCards ? (
              <span>
                {displayPosition} / {totalCards} 枚目
              </span>
            ) : (
              <span>カードを読み込み中…</span>
            )}
          </div>
          <FlashCard
            card={currentCard}
            isFlipped={isFlipped}
            onToggle={toggleFlip}
            onSwipe={handleSwipe}
            interactive={!loading && !!currentCard}
          />
          <div className="space-y-1 text-xs text-slate-400">
            <p>タップで解答表示 / 右にスワイプで正解 / 左にスワイプで復習</p>
            {swipeFeedback === 'success' ? (
              <p className="text-emerald-300">正解として記録しました！</p>
            ) : null}
            {swipeFeedback === 'retry' ? <p className="text-rose-300">復習に追加しました。</p> : null}
          </div>
          <div className="flex w-full flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:justify-between">
            <button
              type="button"
              className="underline decoration-slate-600 hover:text-slate-200"
              onClick={handleEditSelection}
            >
              条件を変更する
            </button>
          </div>
        </section>
      ) : null}

      {step === 'results' ? (
        <section className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">セッション結果</h2>
            <p className="text-sm text-slate-300">お疲れさまでした！結果を確認して次のアクションを選びましょう。</p>
          </div>
          <div className="w-full rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-3xl font-bold text-slate-50">{session.successes}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">正解</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-300">{session.retries}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">復習</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-100">{totalCards}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">総カード</p>
              </div>
            </div>
            {retryCards.length ? (
              <p className="mt-4 text-sm text-amber-200">
                復習が必要なカード: {retryCards.length} 枚
              </p>
            ) : (
              <p className="mt-4 text-sm text-emerald-200">素晴らしい！すべてのカードをクリアしました。</p>
            )}
          </div>
          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              className="w-full rounded-2xl bg-blue-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-400"
              onClick={retryCards.length ? handleReview : handleBackHome}
            >
              {retryCards.length ? '復習する' : 'トップに戻る'}
            </button>
            <button
              type="button"
              className="w-full rounded-2xl border border-slate-700 px-6 py-3 text-base font-semibold text-slate-100 transition hover:border-slate-500"
              onClick={handleBackHome}
            >
              トップに戻る
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
