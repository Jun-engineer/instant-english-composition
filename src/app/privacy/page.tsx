import Link from 'next/link';

export const metadata = {
  title: 'プライバシーポリシー | SpeedSpeak',
  description: 'SpeedSpeak のプライバシーポリシーについてご説明します。'
};

export default function PrivacyPage() {
  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-4 py-12 text-slate-900 sm:py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <header className="rounded-3xl bg-white/90 p-8 shadow-lg backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Privacy Policy</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">プライバシーポリシー</h1>
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
            <h2 className="text-xl font-bold">1. はじめに</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              SpeedSpeak（以下「本サービス」）は、Jun Nammoku（以下「運営者」）が運営する英語瞬間作文トレーニングサービスです。
              本プライバシーポリシーは、本サービスにおけるユーザー情報の取り扱いについて定めるものです。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">2. 収集する情報</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              本サービスでは、以下の情報を取得する場合があります。
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-slate-600">
              <li>アクセスログ情報（IPアドレス、ブラウザ種類、アクセス日時等）</li>
              <li>Cookie およびローカルストレージに保存される学習進捗データ</li>
              <li>Google Analytics により収集される利用状況データ</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">3. 情報の利用目的</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              取得した情報は、以下の目的で利用します。
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-slate-600">
              <li>本サービスの提供・運営・改善</li>
              <li>利用状況の分析およびサービス品質の向上</li>
              <li>広告の配信および効果測定</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">4. 第三者サービスの利用</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              本サービスでは、以下の第三者サービスを利用しています。各サービスのプライバシーポリシーもあわせてご確認ください。
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm text-slate-600">
              <li>
                <strong>Google Analytics</strong> — アクセス解析のために利用しています。
                Google Analytics は Cookie を使用してデータを収集します。
                詳細は{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Google のプライバシーポリシー
                </a>
                をご参照ください。
              </li>
              <li>
                <strong>Google AdSense</strong> — 広告配信のために利用しています。
                Google AdSense は Cookie を使用してユーザーの興味に基づく広告を表示します。
                詳細は{' '}
                <a
                  href="https://policies.google.com/technologies/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Google の広告ポリシー
                </a>
                をご参照ください。
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">5. Cookie について</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              本サービスでは、ユーザー体験の向上および分析のために Cookie を使用しています。
              ブラウザの設定により Cookie の受け入れを拒否することが可能ですが、
              一部の機能が正しく動作しなくなる場合があります。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">6. データの保存</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              本サービスの学習進捗データは、ユーザーのブラウザのローカルストレージに保存されます。
              サーバー側にユーザーの個人情報を保存することはありません。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">7. プライバシーポリシーの変更</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              本ポリシーは予告なく変更される場合があります。変更後のポリシーは本ページに掲載した時点から効力を生じるものとします。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">8. お問い合わせ</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              本ポリシーに関するお問い合わせは、本サービスのウェブサイト上でご連絡ください。
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
