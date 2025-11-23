'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchVocabularyEntry } from '@/lib/dictionary';
import { useDeckStore } from '@/state/useDeckStore';
import type { VocabularyEntry } from '@/lib/types';

interface VocabularyModalProps {
  word: string;
  onClose: () => void;
}

export function VocabularyModal({ word, onClose }: VocabularyModalProps) {
  const favorites = useDeckStore((state) => state.vocabularyFavorites);
  const addFavorite = useDeckStore((state) => state.addFavorite);
  const removeFavorite = useDeckStore((state) => state.removeFavorite);

  const [entry, setEntry] = useState<VocabularyEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizedWord = useMemo(() => word.trim().toLowerCase(), [word]);
  const isFavorite = useMemo(
    () => favorites.some((favorite) => favorite.word.toLowerCase() === normalizedWord),
    [favorites, normalizedWord]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setEntry(null);
    fetchVocabularyEntry(word)
      .then((result) => {
        if (!cancelled) {
          setEntry(result);
        }
      })
      .catch((lookupError: unknown) => {
        if (!cancelled) {
          setError(lookupError instanceof Error ? lookupError.message : '定義を取得できませんでした。');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [word]);

  const handleFavoriteToggle = useCallback(() => {
    if (isFavorite) {
      removeFavorite(entry?.word ?? word);
      return;
    }
    if (entry) {
      addFavorite(entry);
    }
  }, [addFavorite, entry, isFavorite, removeFavorite, word]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          onClick={onClose}
        >
          閉じる
        </button>
        <div className="space-y-4">
          <header className="space-y-2 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-400">Vocabulary Detail</p>
            <h2 className="text-3xl font-bold text-slate-900">
              {entry?.word ?? word}
            </h2>
            {entry?.phonetic ? <p className="text-sm text-slate-500">{entry.phonetic}</p> : null}
            {entry?.audioUrl ? (
              <audio className="mx-auto mt-2" controls src={entry.audioUrl} preload="none">
                Your browser does not support the audio element.
              </audio>
            ) : null}
            <button
              type="button"
              className="mt-3 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
              onClick={handleFavoriteToggle}
              disabled={loading && !isFavorite}
            >
              {isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
            </button>
          </header>

          {loading ? <p className="text-center text-sm text-slate-500">読み込み中…</p> : null}
          {error ? <p className="text-center text-sm text-rose-600">{error}</p> : null}

          {!loading && !error && entry ? (
            <div className="space-y-4">
              {entry.meanings.map((meaning, meaningIndex) => (
                <section key={`${meaning.partOfSpeech}-${meaningIndex}`} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-left">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {meaning.partOfSpeech}
                  </p>
                  <ul className="mt-2 space-y-3 text-sm text-slate-700">
                    {meaning.definitions.map((definition, definitionIndex) => (
                      <li key={definitionIndex}>
                        <p className="font-medium text-slate-800">{definition.definition}</p>
                        {definition.example ? (
                          <p className="mt-1 text-xs italic text-slate-500">例: {definition.example}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
