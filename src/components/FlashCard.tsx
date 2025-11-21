'use client';

import classNames from 'classnames';
import type { KeyboardEvent } from 'react';
import type { DeckCard } from '@/lib/types';

interface FlashCardProps {
  card: DeckCard | null;
  isFlipped: boolean;
  onToggle: () => void;
}

export function FlashCard({ card, isFlipped, onToggle }: FlashCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      className={classNames(
        'relative h-80 w-full max-w-xl cursor-pointer select-none rounded-3xl border border-slate-700 bg-slate-900/70 p-8 shadow-2xl transition-transform duration-500',
        {
          'rotate-y-180 perspective preserve-3d': isFlipped
        }
      )}
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
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
            {isFlipped ? card.answer : 'クリックして解答を見る'}
          </p>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-400">
          <p>学習するカードが読み込まれていません。</p>
          <p className="text-sm">フィルターを変更するか、データソースを確認してください。</p>
        </div>
      )}
    </div>
  );
}
