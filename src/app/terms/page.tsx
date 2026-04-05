import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約',
  description: 'SpeedSpeak の利用規約をご確認ください。',
  alternates: { canonical: 'https://speedspeak.jp/terms' },
};

export default function TermsPage() {
  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-4 py-12 text-slate-900 sm:py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <header className="rounded-3xl bg-white/90 p-8 shadow-lg backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Terms of Service</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">利用規約</h1>
          <p className="mt-4 text-sm text-slate-500">最終更新日: 2026年4月4日</p>
          <div className="mt-6">
            <Link
              href="/"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
            >
              トップに戻る
            </Link>
          </div>
        </header>

        <section className="space-y-8 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur">
          <div className="space-y-3">
            <h2 className="text-xl font-bold">第1条（適用）</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              本規約は、Jun Nammoku（以下「運営者」）が提供する SpeedSpeak（以下「本サービス」）の利用に関する
              条件を定めるものです。ユーザーは本規約に同意の上、本サービスを利用するものとします。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">第2条（サービスの内容）</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              本サービスは、瞬間英作文メソッドに基づいた英語トレーニングを Web 上で提供するものです。
              フラッシュカード形式の学習コンテンツ、辞書機能、学習進捗の記録機能を含みます。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">第3条（利用料金）</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              本サービスは無料でご利用いただけます。ただし、通信料等はユーザーの負担となります。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">第4条（禁止事項）</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              ユーザーは、本サービスの利用にあたり以下の行為を行ってはなりません。
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-slate-600">
              <li>法令または公序良俗に違反する行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>本サービスのコンテンツを無断で複製・転載・販売する行為</li>
              <li>他のユーザーまたは第三者に不利益を与える行為</li>
              <li>本サービスのサーバーやネットワークに過度な負荷をかける行為</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">第5条（知的財産権）</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              本サービスに関する知的財産権は運営者または正当な権利者に帰属します。
              本サービスで使用している辞書機能は、AI（Azure OpenAI）を活用しています。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">第6条（免責事項）</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              運営者は、本サービスの内容の正確性、完全性、有用性等について保証するものではありません。
              本サービスの利用により生じた損害について、運営者は一切の責任を負いません。
              また、本サービスは予告なくサービス内容の変更、中断、終了を行う場合があります。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">第7条（広告の表示）</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              本サービスでは、Google AdSense 等の広告配信サービスを利用して広告を表示する場合があります。
              広告の表示にあたり、Cookie 等の技術が使用される場合があります。
              詳細は{' '}
              <Link href="/privacy" className="text-blue-600 underline">
                プライバシーポリシー
              </Link>
              をご参照ください。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">第8条（規約の変更）</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              運営者は必要に応じて本規約を変更できるものとします。
              変更後の規約は本ページに掲載した時点から効力を生じるものとします。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">第9条（準拠法・管轄）</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              本規約の解釈にあたっては日本法を準拠法とします。
              本サービスに関する紛争が生じた場合、運営者の所在地を管轄する裁判所を
              第一審の専属的合意管轄裁判所とします。
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
