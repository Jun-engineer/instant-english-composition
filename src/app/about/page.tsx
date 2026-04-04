import Link from 'next/link';

export const metadata = {
  title: 'SpeedSpeak について | SpeedSpeak',
  description: 'SpeedSpeak は瞬間英作文メソッドに基づいた英語トレーニングアプリです。コンセプトや使い方をご紹介します。'
};

export default function AboutPage() {
  return (
    <main className="min-h-[100svh] bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-4 py-12 text-slate-900 sm:py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <header className="rounded-3xl bg-white/90 p-8 shadow-lg backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">About</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">SpeedSpeak について</h1>
          <p className="mt-4 text-sm text-slate-600">
            瞬間英作文メソッドで英語の反射力を鍛えるトレーニングアプリ
          </p>
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
            <h2 className="text-xl font-bold">SpeedSpeak とは</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              SpeedSpeak は、「瞬間英作文」の学習メソッドをベースにした Web トレーニングアプリです。
              日本語の文を見て、瞬時に英語に変換する練習を繰り返すことで、
              英語の反射的なアウトプット力を鍛えることを目的としています。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">瞬間英作文とは</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              瞬間英作文とは、日本語の文を見てできるだけ素早く英語に訳すトレーニング方法です。
              文法や語彙の知識を「知っている」状態から「使える」状態に昇華させることが最大の特徴です。
              繰り返し練習することで、英語を組み立てるスピードが格段に上がり、
              会話や文章作成に自信が持てるようになります。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">主な機能</h2>
            <ul className="list-inside list-disc space-y-2 text-sm text-slate-600">
              <li>
                <strong>フラッシュカードトレーニング</strong> —
                日本語文を見て英語に変換し、スワイプで「できた / できなかった」を記録します。
              </li>
              <li>
                <strong>CEFR レベル別カード</strong> —
                A1（初級）〜C2（最上級）まで、自分のレベルに合ったカードでトレーニングできます。
              </li>
              <li>
                <strong>タグ分類</strong> —
                文法カテゴリやシーン別のタグでカードを絞り込み、弱点を集中的に鍛えられます。
              </li>
              <li>
                <strong>辞書機能</strong> —
                カード内の英単語をタップすると、意味・品詞・発音を即座に確認できます。
                JMdict（和英辞典データ）を活用した日本語訳にも対応しています。
              </li>
              <li>
                <strong>お気に入り</strong> —
                気になった英単語やフレーズをお気に入り登録し、いつでも見直せます。
              </li>
              <li>
                <strong>音声読み上げ</strong> —
                Web Speech API を使い、英語フレーズの発音を確認できます。
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">使い方</h2>
            <ol className="list-inside list-decimal space-y-2 text-sm text-slate-600">
              <li>トップページで「トレーニングを始める」を選択します。</li>
              <li>CEFR レベルやタグ、カード枚数を設定してスタートします。</li>
              <li>日本語文を見て、頭の中で英語に変換します。</li>
              <li>カードをタップして英語の正解を確認します。</li>
              <li>正解できたら右スワイプ（緑）、もう少しなら左スワイプ（赤）。</li>
              <li>すべてのカードが終わると結果サマリーが表示されます。</li>
            </ol>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">対象ユーザー</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              英語の基礎文法を学んだものの、スピーキングやライティングで「すぐに英語が出てこない」と
              感じている方に最適です。TOEIC や英検対策にも効果的で、実践的な英語運用力を伸ばしたい
              すべての英語学習者にお使いいただけます。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">技術について</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              SpeedSpeak は Next.js で構築された Web アプリケーションです。
              辞書データには JMdict（Electronic Dictionary Research and Development Group 提供）を利用しており、
              高精度な和英変換を実現しています。学習データはブラウザのローカルストレージに保存されるため、
              アカウント登録は不要です。
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold">運営者</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              本サービスは Jun Nammoku が個人で運営しています。
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
