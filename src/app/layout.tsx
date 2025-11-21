import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Instant English Composition Coach',
  description: 'CEFR-based instant English composition practice with adaptive feedback.'
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
