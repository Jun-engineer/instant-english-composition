import type { CEFRLevel } from './types';

export interface CEFRLevelSummary {
  level: CEFRLevel;
  label: string;
  headline: string;
  canDo: string[];
  recommendedFocus: string;
}

export const CEFR_LEVEL_SUMMARIES: CEFRLevelSummary[] = [
  {
    level: 'A1',
    label: 'Beginner',
    headline: '基本的な日常表現を理解できる。',
    canDo: [
      'あいさつや自己紹介など、よく使う表現をやり取りできる',
      'ゆっくりとはっきり話されれば、簡単な質問に答えられる',
      '旅行中に最低限必要な質問ができる'
    ],
    recommendedFocus:
      '初めて英語学習をする人向け。単語や短いフレーズの丸暗記より、状況別に基本文を反復するトレーニングがおすすめです。'
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
    recommendedFocus:
      'A1 で学んだ型を土台に、頻出の動詞・時制・疑問文の幅を広げましょう。短い会話のロールプレイが効果的です。'
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
    recommendedFocus:
      '自分の経験や考えを「理由つき」で語る練習が鍵。SpeedSpeak の復習モードを使い、言い換えを増やしていきましょう。'
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
    recommendedFocus:
      'ディスカッションやプレゼンを想定したアウトプット練習が効果的。反復の際は、接続表現や強調表現を取り入れて精度を高めましょう。'
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
    recommendedFocus:
      '英語で考えを組み立てる癖が付いている段階。多様な話題を即興で扱い、語彙の精度とニュアンスを磨きましょう。'
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
    recommendedFocus:
      '英語を使った専門的な活動が中心。自分の専門領域の資料作成や、英語での思考プロセスを鍛えるプロジェクト型学習が向いています。'
  }
];
