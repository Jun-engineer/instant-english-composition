'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import classNames from 'classnames';
import { CEFR_LEVELS, CARD_TAGS, COMMON_CARD_TAGS } from '@/lib/constants';
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
  const limitValue = Number.isFinite(filters.limit) ? filters.limit : 12;
  const [showAllTags, setShowAllTags] = useState(false);

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

  const handleLimitChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const raw = Number.parseInt(event.target.value, 10);
      const next = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 100) : 0;
      setFilters({ ...filters, limit: next });
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
              ? 'border-blue-300 bg-blue-100 text-blue-700 shadow-sm'
              : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
          )}
          onClick={() => toggleLevel(level)}
        >
          {level}
        </button>
      )),
    [filters.levels, toggleLevel]
  );

  const tagChipClass = useCallback(
    (isActive: boolean) =>
      classNames(
        'rounded-full border px-3 py-2 text-xs uppercase tracking-wide transition',
        isActive
          ? 'border-amber-300 bg-amber-100 text-amber-700 shadow-sm'
          : 'border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600'
      ),
    []
  );

  const commonTagChips = useMemo(
    () =>
      COMMON_CARD_TAGS.map((tag) => (
        <button
          key={`common-${tag}`}
          type="button"
          className={tagChipClass(filters.tags.includes(tag))}
          onClick={() => toggleTag(tag)}
        >
          {tag}
        </button>
      )),
    [filters.tags, tagChipClass, toggleTag]
  );

  const otherTags = useMemo(
    () => CARD_TAGS.filter((tag) => !COMMON_CARD_TAGS.includes(tag)),
    []
  );

  const otherTagChips = useMemo(
    () =>
      otherTags.map((tag) => (
        <button
          key={`other-${tag}`}
          type="button"
          className={tagChipClass(filters.tags.includes(tag))}
          onClick={() => toggleTag(tag)}
        >
          {tag}
        </button>
      )),
    [filters.tags, otherTags, tagChipClass, toggleTag]
  );

  return (
    <section className="flex w-full flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">トレーニング設定</h2>
        <p className="mt-2 text-sm text-slate-600">練習したいレベルとトピックを選んでください。</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">CEFR レベル</p>
        <div className="mt-3 flex flex-wrap gap-2">{levelChips}</div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">トピック</p>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {commonTagChips}
          </div>
          {otherTags.length ? (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="self-start text-xs font-semibold text-blue-600 underline decoration-dotted"
                onClick={() => setShowAllTags((prev) => !prev)}
              >
                {showAllTags ? 'その他のトピックを隠す' : 'その他のトピックを見る'}
              </button>
              {showAllTags ? (
                <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white/70 p-3">
                  <div className="flex flex-wrap gap-2">{otherTagChips}</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">カード枚数 (0〜100)</p>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={1}
            className="w-32 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={limitValue}
            onChange={handleLimitChange}
          />
          <span className="text-xs text-slate-500">0 のままにすると標準枚数（12枚）になります。</span>
        </div>
      </div>
      {onSubmit ? (
        <button
          type="button"
          className="mt-2 w-full rounded-2xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onSubmit}
          disabled={loading || !hasLevelSelected}
        >
          {loading ? 'カードを準備中…' : 'カードを準備する'}
        </button>
      ) : null}
    </section>
  );
}
