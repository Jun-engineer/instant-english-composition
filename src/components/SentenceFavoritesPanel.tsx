'use client';

import { useMemo } from 'react';
import { useDeckStore } from '@/state/useDeckStore';

interface SentenceFavoritesPanelProps {
  onClose: () => void;
}

export function SentenceFavoritesPanel({ onClose }: SentenceFavoritesPanelProps) {
  const favorites = useDeckStore((state) => state.sentenceFavorites);
  const removeFavorite = useDeckStore((state) => state.removeSentenceFavorite);

  const orderedFavorites = useMemo(
    () => [...favorites].sort((a, b) => b.savedAt - a.savedAt),
    [favorites]
  );

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/30 px-4 py-8 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Favorites</p>
            <h2 className="text-lg font-semibold text-slate-900">お気に入り例文リスト</h2>
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
        <div className="max-h-[calc(90vh-4rem)] overflow-y-auto px-6 py-6">
          <p className="mb-4 text-sm text-slate-500">気に入った瞬間英作文を再確認できます。</p>
          {orderedFavorites.length === 0 ? (
            <p className="text-center text-sm text-slate-500">まだお気に入りの例文が登録されていません。</p>
          ) : (
            <ul className="space-y-4 pr-1">
              {orderedFavorites.map((favorite) => (
                <li
                  key={`${favorite.cardId}-${favorite.savedAt}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prompt</p>
                      <p className="text-base font-medium text-slate-800">{favorite.prompt}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Answer</p>
                      <p className="text-base font-semibold text-emerald-700">{favorite.answer}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                        {favorite.cefrLevel}
                      </span>
                      {favorite.tags.map((tag) => (
                        <span
                          key={`${favorite.cardId}-${tag}`}
                          className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium uppercase text-slate-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="mt-4 w-full rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                    onClick={() => removeFavorite(favorite.cardId)}
                  >
                    この例文を削除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
