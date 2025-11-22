import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SpeedSpeak',
    short_name: 'SpeedSpeak',
    description: 'SpeedSpeakで瞬時に英語フレーズを組み立てて、反応速度と表現力を鍛えましょう。',
    start_url: '/',
    display: 'standalone',
    background_color: '#f59e0b',
    theme_color: '#f59e0b',
    lang: 'ja',
    icons: [
      {
        src: '/icons/speedspeak-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/speedspeak-512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  };
}
