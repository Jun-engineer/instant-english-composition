'use client';

import { useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { CEFR_LEVELS, CARD_TAGS } from '@/lib/constants';
import { useDeckStore } from '@/state/useDeckStore';
import type { CEFRLevel } from '@/lib/types';

export function DeckFilters() {
  const filters = useDeckStore((state) => state.filters);
  const setFilters = useDeckStore((state) => state.setFilters);

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
    <section className="w-full max-w-3xl rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-100">トレーニング設定</h2>
      <div className="mt-4">
        <p className="text-sm uppercase tracking-wide text-slate-400">CEFR レベル</p>
        <div className="mt-3 flex flex-wrap gap-2">{levelChips}</div>
      </div>
      <div className="mt-6">
        <p className="text-sm uppercase tracking-wide text-slate-400">トピック</p>
        <div className="mt-3 flex flex-wrap gap-2">{tagChips}</div>
      </div>
    </section>
  );
}
