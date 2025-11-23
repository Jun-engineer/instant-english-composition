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
  return (
    <html lang="ja">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
