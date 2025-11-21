'use client';

import { useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { CEFR_LEVELS, CARD_TAGS } from '@/lib/constants';
import { useDeckStore } from '@/state/useDeckStore';
import type { CEFRLevel } from '@/lib/types';

interface DeckFiltersProps {
  onSubmit?: () => void;
  loading?: boolean;
}

export function DeckFilters({ onSubmit, loading = false }: DeckFiltersProps) {
  const filters = useDeckStore((state) => state.filters);
  const setFilters = useDeckStore((state) => state.setFilters);
  const hasLevelSelected = filters.levels.length > 0;

  const toggleLevel = useCallback(
    (level: CEFRLevel) => {
      const levels = filters.levels.includes(level)
        ? filters.levels.filter((item) => item !== level)
        : [...filters.levels, level];
      setFilters({ ...filters, levels });
    },
    [filters, setFilters]
  );

  const toggleTag = useCallback(
    (tag: string) => {
      const tags = filters.tags.includes(tag)
        ? filters.tags.filter((item) => item !== tag)
        : [...filters.tags, tag];
      setFilters({ ...filters, tags });
    },
    [filters, setFilters]
  );

  const levelChips = useMemo(
    () =>
      CEFR_LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          className={classNames(
            'rounded-full border px-4 py-2 text-sm font-semibold transition',
            filters.levels.includes(level)
              ? 'border-blue-400 bg-blue-500/20 text-blue-200'
              : 'border-slate-600 text-slate-400 hover:border-blue-400 hover:text-blue-200'
          )}
          onClick={() => toggleLevel(level)}
        >
          {level}
        </button>
      )),
    [filters.levels, toggleLevel]
  );

  const tagChips = useMemo(
    () =>
      CARD_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          className={classNames(
            'rounded-full border px-3 py-2 text-xs uppercase tracking-wide transition',
            filters.tags.includes(tag)
              ? 'border-amber-400 bg-amber-500/20 text-amber-200'
              : 'border-slate-600 text-slate-400 hover:border-amber-400 hover:text-amber-200'
          )}
          onClick={() => toggleTag(tag)}
        >
          {tag}
        </button>
      )),
    [filters.tags, toggleTag]
  );

  return (
    <section className="flex w-full flex-col gap-6 rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 backdrop-blur">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">トレーニング設定</h2>
        <p className="mt-2 text-sm text-slate-400">練習したいレベルとトピックを選んでください。</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">CEFR レベル</p>
        <div className="mt-3 flex flex-wrap gap-2">{levelChips}</div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">トピック</p>
        <div className="mt-3 flex flex-wrap gap-2">{tagChips}</div>
      </div>
      {onSubmit ? (
        <button
          type="button"
          className="mt-2 w-full rounded-2xl bg-blue-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onSubmit}
          disabled={loading || !hasLevelSelected}
        >
          {loading ? 'カードを準備中…' : 'カードを準備する'}
        </button>
      ) : null}
    </section>
  );
}
