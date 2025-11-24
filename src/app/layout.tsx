import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://speedspeak.jp'),
  title: 'SpeedSpeak | 瞬間英作文トレーニング',
  description: 'SpeedSpeakで瞬時に英語フレーズを組み立てて、反応速度と表現力を鍛えましょう。',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
    shortcut: '/icon.png'
  },
  manifest: '/manifest.webmanifest',
  themeColor: '#f59e0b'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const currentYear = new Date().getFullYear();
  return (
    <html lang="ja">
      <head />
      <body>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5434162081070782"
          crossOrigin="anonymous"
        />
        <main>{children}</main>
        <footer className="app-footer">
          <small>© {currentYear} Jun Nammoku. All rights reserved.</small>
        </footer>
      </body>
    </html>
  );
}
