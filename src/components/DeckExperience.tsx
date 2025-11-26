'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlashCard } from './FlashCard';
import { DeckFilters } from './DeckFilters';
import { FavoritesPanel } from './FavoritesPanel';
import { SentenceFavoritesPanel } from './SentenceFavoritesPanel';
import { VocabularyModal } from './VocabularyModal';
import { useDeckStore } from '@/state/useDeckStore';
import { fetchCards } from '@/lib/api';
import type { DeckCard, ReviewStatus } from '@/lib/types';

type Step = 'intro' | 'filters' | 'training' | 'results';

function shuffleDeck(cards: DeckCard[]) {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

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
  const favorites = useDeckStore((state) => state.vocabularyFavorites);
  const sentenceFavorites = useDeckStore((state) => state.sentenceFavorites);
  const addSentenceFavorite = useDeckStore((state) => state.addSentenceFavorite);
  const removeSentenceFavorite = useDeckStore((state) => state.removeSentenceFavorite);

  const [step, setStep] = useState<Step>('intro');
  const [activeCards, setActiveCards] = useState<DeckCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [swipeFeedback, setSwipeFeedback] = useState<ReviewStatus | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showSentenceFavorites, setShowSentenceFavorites] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const currentCard = deck[currentIndex] ?? null;
  const totalCards = activeCards.length;
  const displayPosition = totalCards ? Math.min(session.total + 1, totalCards) : 0;
  const requestedLimit = filters.limit > 0 ? filters.limit : null;
  const limitedByAvailability = requestedLimit !== null && totalCards > 0 && totalCards < requestedLimit;

  const isCurrentSentenceFavorite = useMemo(() => {
    if (!currentCard) {
      return false;
    }
    return sentenceFavorites.some((favorite) => favorite.cardId === currentCard.id);
  }, [currentCard, sentenceFavorites]);

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

  useEffect(() => {
    if (feedbackTimeout.current) {
      clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = null;
    }
    setSwipeFeedback(null);
  }, [currentCard?.id]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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
      const randomized = shuffleDeck(cards);
      setDeck(randomized);
      setActiveCards(randomized);
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
    setLoading(false);
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
    setLoading(false);
    setStep('intro');
  }, [resetSession, setDeck]);

  const handleReview = useCallback(() => {
    if (!retryCards.length) {
      handleBackHome();
      return;
    }
    resetSession();
    const randomized = shuffleDeck(retryCards);
    setDeck(randomized);
    setActiveCards(randomized);
    setStep('training');
  }, [handleBackHome, resetSession, retryCards, setDeck]);

  const handleWordSelect = useCallback((word: string) => {
    setSelectedWord(word);
  }, []);

  const handleSentenceFavoriteToggle = useCallback(() => {
    if (!currentCard) {
      return;
    }
    const alreadyFavorited = sentenceFavorites.some((favorite) => favorite.cardId === currentCard.id);
    if (alreadyFavorited) {
      removeSentenceFavorite(currentCard.id);
      return;
    }
    addSentenceFavorite(currentCard);
  }, [addSentenceFavorite, currentCard, removeSentenceFavorite, sentenceFavorites]);

  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center gap-8 bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-4 py-12 text-slate-900 sm:py-16">
      <div className="fixed top-6 right-6 z-40 flex flex-col items-end" ref={menuRef}>
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow-lg backdrop-blur transition hover:bg-slate-100"
          aria-label="メニュー"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span className="text-2xl">☰</span>
        </button>
        {isMenuOpen ? (
          <div className="mt-3 w-56 rounded-2xl border border-slate-200 bg-white/95 p-3 text-sm text-slate-700 shadow-xl backdrop-blur">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 transition hover:bg-slate-100"
              onClick={() => {
                setShowFavorites(true);
                setIsMenuOpen(false);
              }}
            >
              <span>お気に入り単語</span>
              <span className="text-xs text-slate-400">{favorites.length}</span>
            </button>
            <button
              type="button"
              className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2 transition hover:bg-slate-100"
              onClick={() => {
                setShowSentenceFavorites(true);
                setIsMenuOpen(false);
              }}
            >
              <span>お気に入り例文</span>
              <span className="text-xs text-slate-400">{sentenceFavorites.length}</span>
            </button>
            <a
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-blue-600 transition hover:bg-blue-50"
              href="mailto:jun.nammoku@gmail.com"
              onClick={() => setIsMenuOpen(false)}
            >
              <span aria-hidden>✉️</span>
              <span>Contact</span>
            </a>
          </div>
        ) : null}
      </div>

      {step === 'intro' ? (
        <section className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-white/80 p-6 text-center shadow-lg backdrop-blur">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold sm:text-4xl">瞬間英作文トレーニング</h1>
            <p className="text-sm text-slate-600">
              レベルとトピックを選んで、スワイプ操作でテンポよく瞬間英作文を鍛えましょう。
            </p>
          </div>
          <button
            type="button"
            className="w-full rounded-2xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-500"
            onClick={handleStart}
          >
            始める
          </button>
        </section>
      ) : null}

      {step === 'filters' ? (
        <section className="flex w-full max-w-lg flex-col items-stretch gap-4 text-center sm:text-left">
          <DeckFilters
            onSubmit={handleFetchCards}
            loading={loading}
          />
          {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
          <button
            type="button"
            className="text-sm font-medium text-slate-500 underline decoration-slate-300 hover:text-slate-700"
            onClick={handleBackHome}
          >
            トップに戻る
          </button>
        </section>
      ) : null}

      {step === 'training' ? (
        <section className="flex w-full max-w-lg flex-col items-center gap-5 rounded-3xl bg-white/85 p-6 text-center shadow-lg backdrop-blur">
          <div className="text-sm text-slate-600">
            {totalCards ? (
              <span>
                {displayPosition} / {totalCards} 枚目
              </span>
            ) : (
              <span>カードを読み込み中…</span>
            )}
          </div>
          {limitedByAvailability ? (
            <p className="text-xs text-amber-600">
              選択した条件に合うカードが {totalCards} 枚のため、指定枚数より少なく表示されています。
            </p>
          ) : null}
          <FlashCard
            card={currentCard}
            isFlipped={isFlipped}
            onToggle={toggleFlip}
            onSwipe={handleSwipe}
            interactive={!loading && !!currentCard}
            onWordSelect={handleWordSelect}
            swipeFeedback={swipeFeedback}
          />
          <div className="space-y-1 text-xs text-slate-500">
            <p>タップで解答表示 / 右にスワイプで正解 / 左にスワイプで復習</p>
            {swipeFeedback === 'success' ? (
              <p className="text-emerald-600">正解として記録しました！</p>
            ) : null}
            {swipeFeedback === 'retry' ? <p className="text-rose-600">復習に追加しました。</p> : null}
          </div>
          <div className="flex w-full flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="underline decoration-slate-300 hover:text-slate-700"
              onClick={handleEditSelection}
            >
              条件を変更する
            </button>
            <button
              type="button"
              className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
              onClick={handleSentenceFavoriteToggle}
              disabled={!currentCard}
            >
              {isCurrentSentenceFavorite ? '例文のお気に入りを解除' : 'この例文をお気に入りに追加'}
            </button>
          </div>
        </section>
      ) : null}

      {step === 'results' ? (
        <section className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-white/85 p-6 text-center shadow-lg backdrop-blur">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">セッション結果</h2>
            <p className="text-sm text-slate-600">お疲れさまでした！結果を確認して次のアクションを選びましょう。</p>
          </div>
          <div className="w-full rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-inner">
            <div className="grid grid-cols-3 gap-4 text-sm text-slate-600">
              <div>
                <p className="text-3xl font-bold text-slate-900">{session.successes}</p>
                <p className="mt-1 text-xs uppercase tracking-wide">正解</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-500">{session.retries}</p>
                <p className="mt-1 text-xs uppercase tracking-wide">復習</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{totalCards}</p>
                <p className="mt-1 text-xs uppercase tracking-wide">総カード</p>
              </div>
            </div>
            {retryCards.length ? (
              <p className="mt-4 text-sm text-amber-600">
                復習が必要なカード: {retryCards.length} 枚
              </p>
            ) : (
              <p className="mt-4 text-sm text-emerald-600">素晴らしい！すべてのカードをクリアしました。</p>
            )}
          </div>
          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              className="w-full rounded-2xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-500"
              onClick={retryCards.length ? handleReview : handleBackHome}
            >
              {retryCards.length ? '復習する' : 'トップに戻る'}
            </button>
            {retryCards.length ? (
              <button
                type="button"
                className="w-full rounded-2xl border border-slate-200 px-6 py-3 text-base font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
                onClick={handleBackHome}
              >
                トップに戻る
              </button>
            ) : null}
            <button
              type="button"
              className="w-full rounded-2xl border border-emerald-200 px-6 py-3 text-base font-semibold text-emerald-600 transition hover:bg-emerald-50"
              onClick={() => setShowFavorites(true)}
            >
              お気に入りを見る ({favorites.length})
            </button>
            <button
              type="button"
              className="w-full rounded-2xl border border-amber-200 px-6 py-3 text-base font-semibold text-amber-600 transition hover:bg-amber-50"
              onClick={() => setShowSentenceFavorites(true)}
            >
              お気に入り例文を見る ({sentenceFavorites.length})
            </button>
          </div>
        </section>
      ) : null}

      {selectedWord ? (
        <VocabularyModal word={selectedWord} onClose={() => setSelectedWord(null)} />
      ) : null}

      {showFavorites ? <FavoritesPanel onClose={() => setShowFavorites(false)} /> : null}
      {showSentenceFavorites ? <SentenceFavoritesPanel onClose={() => setShowSentenceFavorites(false)} /> : null}
    </div>
  );
}
