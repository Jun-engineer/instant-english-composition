import Link from 'next/link';
import { DeckExperience } from '@/components/DeckExperience';

export default function HomePage() {
  return (
    <>
      <DeckExperience />

      {/* Static content for SEO / AdSense — rendered below the interactive area */}
      <section className="bg-gradient-to-b from-white to-slate-50 px-4 py-16 text-slate-900">
        <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">瞬間英作文とは？</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              瞬間英作文は、日本語の文を見て瞬時に英語に変換するトレーニング方法です。
              文法知識を「知っている」から「使える」に変え、英語の反射的なアウトプット力を鍛えます。
              SpeedSpeak ではフラッシュカード形式で手軽に練習でき、通勤・通学のスキマ時間にも最適です。
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">CEFR レベル対応</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              カードは国際基準 CEFR（A1〜C2）に分類されています。
              初級者は基本的な日常表現から、上級者は抽象的なトピックまで、
              自分のレベルに合った難易度で効率よくトレーニングできます。
            </p>
            <Link href="/cefr" className="inline-block text-sm text-blue-600 underline hover:text-blue-800">
              CEFR レベルの詳細を見る →
            </Link>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">辞書機能で即座に確認</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              トレーニング中に分からない単語があれば、タップするだけで意味・品詞・発音を確認できます。
              JMdict（和英辞典データベース）を活用し、正確な日本語訳を表示します。
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">アカウント不要・無料</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              会員登録やログインは必要ありません。ブラウザを開いてすぐにトレーニングを開始できます。
              学習進捗はブラウザに自動保存されるので、続きからいつでも再開可能です。
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
