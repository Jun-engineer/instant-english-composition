'use client';

import { useMemo } from 'react';
import { useDeckStore } from '@/state/useDeckStore';

interface FavoritesPanelProps {
  onClose: () => void;
}

export function FavoritesPanel({ onClose }: FavoritesPanelProps) {
  const favorites = useDeckStore((state) => state.vocabularyFavorites);
  const removeFavorite = useDeckStore((state) => state.removeFavorite);

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
            <h2 className="text-lg font-semibold text-slate-900">お気に入り単語リスト</h2>
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
          <p className="mb-4 text-sm text-slate-500">復習したい単語をいつでも確認できます。</p>
          {orderedFavorites.length === 0 ? (
            <p className="text-center text-sm text-slate-500">まだお気に入りが登録されていません。</p>
          ) : (
            <ul className="space-y-4 pr-1">
              {orderedFavorites.map((favorite) => (
                <li
                  key={`${favorite.word}-${favorite.savedAt}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{favorite.word}</p>
                      {favorite.phonetic ? <p className="text-xs text-slate-500">{favorite.phonetic}</p> : null}
                    </div>
                    <button
                      type="button"
                      className="self-start rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                      onClick={() => removeFavorite(favorite.word)}
                    >
                      削除
                    </button>
                  </div>
                  <div className="mt-3 space-y-3 text-sm text-slate-700">
                    {favorite.meanings.slice(0, 2).map((meaning, meaningIndex) => (
                      <div key={`${favorite.word}-meaning-${meaningIndex}`}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {meaning.partOfSpeech}
                        </p>
                        <ul className="mt-1 space-y-1">
                          {meaning.definitions.slice(0, 2).map((definition, definitionIndex) => (
                            <li key={`${favorite.word}-def-${meaningIndex}-${definitionIndex}`}>
                              <p className="font-medium text-slate-800">{definition.definition}</p>
                              {definition.example ? (
                                <p className="text-xs italic text-slate-500">例: {definition.example}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
