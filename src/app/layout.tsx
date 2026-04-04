import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import Link from 'next/link';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#f59e0b',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://speedspeak.jp'),
  title: {
    default: 'SpeedSpeak | 瞬間英作文トレーニング',
    template: '%s | SpeedSpeak',
  },
  description: 'SpeedSpeakで瞬時に英語フレーズを組み立てて、反応速度と表現力を鍛えましょう。CEFR対応の2,000問以上で初心者から上級者まで。',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
    shortcut: '/icon.png'
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'SpeedSpeak',
    title: 'SpeedSpeak | 瞬間英作文トレーニング',
    description: '瞬間英作文メソッドで英語の反応速度を鍛えるトレーニングアプリ。CEFR A1〜C2対応、2,000問以上収録。',
    url: 'https://speedspeak.jp',
  },
  twitter: {
    card: 'summary',
    title: 'SpeedSpeak | 瞬間英作文トレーニング',
    description: '瞬間英作文メソッドで英語の反応速度を鍛えるトレーニングアプリ。',
  },
  alternates: {
    canonical: 'https://speedspeak.jp',
  },
  verification: {
    google: 'mpPz7TCgmd9mqTr7Tvy5__my_UvJIwx92pvK3C2DfjM',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear();
  return (
    <html lang="ja">
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-6KBG29MQ91"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-6KBG29MQ91');
          `}
        </Script>
      </head>
      <body>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5434162081070782"
          crossOrigin="anonymous"
        />
        <main>{children}</main>
        <footer className="app-footer">
          <nav className="mb-3 flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/about" className="text-slate-600 underline hover:text-slate-800">SpeedSpeak について</Link>
            <Link href="/cefr" className="text-slate-600 underline hover:text-slate-800">CEFR レベル</Link>
            <Link href="/privacy" className="text-slate-600 underline hover:text-slate-800">プライバシーポリシー</Link>
            <Link href="/terms" className="text-slate-600 underline hover:text-slate-800">利用規約</Link>
          </nav>
          <small>© {currentYear} Jun Nammoku. All rights reserved.</small>
        </footer>
      </body>
    </html>
  );
}
