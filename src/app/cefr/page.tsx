import Link from 'next/link';

const LEVEL_SUMMARIES = [
  {
    level: 'A1',
    label: 'Beginner',
    headline: '基本的な日常表現を理解できる。',
    canDo: [
      'あいさつや自己紹介など、よく使う表現をやり取りできる',
      'ゆっくりとはっきり話されれば、簡単な質問に答えられる',
      '旅行中に最低限必要な質問ができる'
    ],
    recommendedFocus: '初めて英語学習をする人向け。単語や短いフレーズの丸暗記より、状況別に基本文を反復するトレーニングがおすすめです。'
  },
  {
    level: 'A2',
    label: 'Elementary',
    headline: 'やさしい日常会話ができる。',
    canDo: [
      '家族・買い物・仕事など身近な話題について簡単に説明できる',
      '決まりきった業務であれば、単純な指示を理解して対応できる',
      '宿泊や食事の場面で、必要な質問や依頼ができる'
    ],
    recommendedFocus: 'A1 で学んだ型を土台に、頻出の動詞・時制・疑問文の幅を広げましょう。短い会話のロールプレイが効果的です。'
  },
  {
    level: 'B1',
    label: 'Intermediate',
    headline: '見知った状況なら自信を持って会話できる。',
    canDo: [
      '仕事・学校・旅行など馴染みのある話題なら、要点を説明できる',
      '自分の意見や計画について、理由を挙げながら話すことができる',
      '突発的な出来事が起きても、概ね対応できる'
    ],
    recommendedFocus: '自分の経験や考えを「理由つき」で語る練習が鍵。SpeedSpeak の復習モードを使い、言い換えを増やしていきましょう。'
  },
  {
    level: 'B2',
    label: 'Upper Intermediate',
    headline: '専門的なテーマでも議論に参加できる。',
    canDo: [
      '抽象的な話題や専門分野でも、要点をまとめて議論できる',
      'ネイティブスピーカーと自然なテンポでやりとりできる',
      '複雑な文章の主旨と詳細を理解し、要約できる'
    ],
    recommendedFocus: 'ディスカッションやプレゼンを想定したアウトプット練習が効果的。反復の際は、接続表現や強調表現を取り入れて精度を高めましょう。'
  },
  {
    level: 'C1',
    label: 'Advanced',
    headline: '高度な話題でも柔軟かつ自然に表現できる。',
    canDo: [
      '複雑な話題でも即座に適切な表現を選んで話せる',
      '長い文章でも裏にある含意や対比を理解できる',
      '読み書き・会話ともに、ほとんど負担なく英語でこなせる'
    ],
    recommendedFocus: '英語で考えを組み立てる癖が付いている段階。多様な話題を即興で扱い、語彙の精度とニュアンスを磨きましょう。'
  },
  {
    level: 'C2',
    label: 'Proficient',
    headline: '母語話者と遜色ない運用力。',
    canDo: [
      'あらゆる情報源から得た内容を整理・統合して議論できる',
      '状況に応じて語調やレジスターを自在に切り替えられる',
      '高度な専門領域でも、正確かつ説得力のある表現ができる'
    ],
    recommendedFocus: '英語を使った専門的な活動が中心。自分の専門領域の資料作成や、英語での思考プロセスを鍛えるプロジェクト型学習が向いています。'
  }
];

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
          {LEVEL_SUMMARIES.map((level) => (
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
