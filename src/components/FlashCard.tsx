'use client';

import classNames from 'classnames';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { DeckCard } from '@/lib/types';

type SwipeDirection = 'left' | 'right';

interface FlashCardProps {
  card: DeckCard | null;
  isFlipped: boolean;
  onToggle: () => void;
  onSwipe?: (direction: SwipeDirection) => void;
  interactive?: boolean;
}

const SWIPE_THRESHOLD = 80;

export function FlashCard({ card, isFlipped, onToggle, onSwipe, interactive = true }: FlashCardProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const dragStart = useRef<number | null>(null);
  const pointerId = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resetDrag = useCallback(() => {
    setDragOffset(0);
    dragStart.current = null;
    pointerId.current = null;
    setIsDragging(false);
  }, []);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || !card) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerId.current = event.pointerId;
    dragStart.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [card, interactive]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || pointerId.current !== event.pointerId || dragStart.current === null) return;
    setDragOffset(event.clientX - dragStart.current);
  }, [interactive]);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || pointerId.current !== event.pointerId || dragStart.current === null) {
      resetDrag();
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    const delta = event.clientX - dragStart.current;
    const absDelta = Math.abs(delta);

    if (absDelta > SWIPE_THRESHOLD && onSwipe) {
      onSwipe(delta > 0 ? 'right' : 'left');
    } else if (absDelta < 12) {
      onToggle();
    }

    resetDrag();
  }, [interactive, onSwipe, onToggle, resetDrag]);

  const transformStyle = useMemo(() => {
    const translate = `translateX(${dragOffset}px)`;
    const tilt = `rotate(${dragOffset / 40}rad)`;
    return {
      transform: `${translate} ${tilt}`,
      transition: isDragging ? 'none' : 'transform 0.25s ease-out'
    } satisfies CSSProperties;
  }, [dragOffset, isDragging]);

  return (
    <div
      className={classNames(
        'relative h-80 w-full max-w-md select-none rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-2xl text-left',
        interactive ? 'cursor-pointer' : 'cursor-default opacity-70'
      )}
      role="button"
      tabIndex={interactive ? 0 : -1}
      style={{ ...transformStyle, touchAction: 'pan-y' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={resetDrag}
      onKeyDown={(event) => {
        if (!interactive) return;
        if (event.key === 'ArrowLeft' && onSwipe) {
          event.preventDefault();
          onSwipe('left');
        }
        if (event.key === 'ArrowRight' && onSwipe) {
          event.preventDefault();
          onSwipe('right');
        }
        if ((event.key === 'Enter' || event.key === ' ') && card) {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      {card ? (
        <div className="flex h-full flex-col justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-sm uppercase tracking-wide text-slate-400">
              <span className="rounded-full border border-blue-500/50 px-3 py-1 text-blue-300">{card.cefrLevel}</span>
              {card.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-slate-600 px-2 py-1 text-xs uppercase text-slate-400">
                  {tag}
                </span>
              ))}
            </div>
            <p className={classNames('text-2xl font-semibold leading-snug text-slate-50 transition-opacity duration-200', { 'opacity-0': isFlipped })}>
              {card.prompt}
            </p>
            {card.hint && !isFlipped ? <p className="mt-4 text-sm text-slate-400">ヒント: {card.hint}</p> : null}
          </div>
          <p className={classNames('text-xl font-medium text-emerald-200 transition-opacity duration-200', { 'opacity-0': !isFlipped })}>
            {isFlipped ? card.answer : 'タップして解答を見る'}
          </p>

          <div className="pointer-events-none absolute inset-y-6 left-4 flex items-center text-sm font-semibold text-rose-200/70">
            <span className="hidden sm:inline">← 再挑戦</span>
          </div>
          <div className="pointer-events-none absolute inset-y-6 right-4 flex items-center text-sm font-semibold text-emerald-200/70">
            <span className="hidden sm:inline">正解 →</span>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-400">
          <p>学習するカードが読み込まれていません。</p>
          <p className="text-sm">条件を調整するか、データソースを確認してください。</p>
        </div>
      )}
    </div>
  );
}
