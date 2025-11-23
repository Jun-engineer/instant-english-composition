import Link from 'next/link';
import { CEFR_LEVEL_SUMMARIES } from '@/lib/cefr';

export const metadata = {
  title: 'CEFR レベルの目安 | SpeedSpeak',
  description: 'CEFR 各レベルの習得目安と SpeedSpeak でのトレーニングの活かし方をまとめました。'
};

export default function CEFRPage() {
  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-4 py-12 text-slate-900 sm:py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-12">
        <header className="rounded-3xl bg-white/90 p-8 shadow-lg backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">CEFR Benchmarks</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">レベル別の目安と学習戦略</h1>
          <p className="mt-4 text-sm text-slate-600">
            CEFR (Common European Framework of Reference for Languages) は、言語運用力を 6 段階で示す国際指標です。
            現在の到達度を把握し、SpeedSpeak のトレーニングをどこから始めるかの参考にしてください。
          </p>
          <div className="mt-6 inline-flex flex-wrap gap-3 text-sm">
            <Link
              href="/"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
            >
              トレーニングに戻る
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {CEFR_LEVEL_SUMMARIES.map((level) => (
            <article
              key={level.level}
              className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur"
            >
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">{level.level}</h2>
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-500">{level.label}</span>
                </div>
                <p className="text-sm text-slate-600">{level.headline}</p>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">できることの目安</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {level.canDo.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden className="mt-1 inline-block h-2 w-2 rounded-full bg-blue-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">おすすめの学習方針</span>
                <span className="mt-2 block leading-relaxed">{level.recommendedFocus}</span>
              </p>
            </article>
          ))}
        </section>

        <footer className="flex flex-col gap-4 rounded-3xl bg-blue-50/80 p-6 text-sm text-slate-600">
          <p>
            SpeedSpeak ではカードのタグやレベルを組み合わせることで、現在の CEFR レベルに合ったトレーニング強度を選べます。
            目標レベルが一段上の場合は、トレーニング枚数を絞りつつ「復習」カードを重点的にやり直すのがおすすめです。
          </p>
          <p className="text-xs text-slate-500">
            参考: Council of Europe, Common European Framework of Reference for Languages (2020 edition)
          </p>
        </footer>
      </div>
    </main>
  );
}
