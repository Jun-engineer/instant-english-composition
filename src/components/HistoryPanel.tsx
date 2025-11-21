'use client';

import { useMemo } from 'react';
import { useDeckStore } from '@/state/useDeckStore';
import type { ReviewRecord } from '@/lib/types';

const RESULT_LABEL: Record<ReviewRecord['status'], string> = {
  success: '正解',
  retry: '再挑戦'
};

const RESULT_COLOR: Record<ReviewRecord['status'], string> = {
  success: 'text-emerald-300',
  retry: 'text-amber-300'
};

export function HistoryPanel() {
  const history = useDeckStore((state) => state.history);
  const session = useDeckStore((state) => state.session);

  const latestHistory = useMemo(() => history.slice(0, 15), [history]);

  return (
    <section className="w-full max-w-sm rounded-3xl border border-slate-800/60 bg-slate-900/50 p-6 backdrop-blur">
      <h2 className="text-lg font-semibold text-slate-100">セッション統計</h2>
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-3xl font-bold text-slate-100">{session.total}</p>
          <p className="text-xs uppercase tracking-wide text-slate-400">回答数</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-emerald-300">{session.successes}</p>
          <p className="text-xs uppercase tracking-wide text-slate-400">正解</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-amber-300">{session.retries}</p>
          <p className="text-xs uppercase tracking-wide text-slate-400">再挑戦</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-400">現在の連続正解: <span className="font-semibold text-blue-200">{session.streak}</span></p>
      <div className="mt-6">
        <h3 className="text-sm uppercase tracking-wide text-slate-400">直近のフィードバック</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {latestHistory.length === 0 ? (
            <li className="text-slate-500">まだ履歴がありません。</li>
          ) : (
            latestHistory.map((record) => (
              <li key={`${record.cardId}-${record.timestamp}`} className="flex items-center justify-between rounded-lg border border-slate-800/70 bg-slate-950/40 px-3 py-2">
                <span className="font-medium text-slate-200">{record.cefrLevel}</span>
                <span className={RESULT_COLOR[record.status]}>{RESULT_LABEL[record.status]}</span>
                <span className="text-xs text-slate-500">{new Intl.DateTimeFormat('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(record.timestamp)}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
