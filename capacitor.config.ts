import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'jp.speedspeak.app',
  appName: 'SpeedSpeak',
  webDir: 'out',
  server: {
    // In production the app loads from the bundled static export.
    // During development you can uncomment the url below to live-reload
    // against the Next.js dev server running on your machine's IP.
    // url: 'http://192.168.x.x:3000',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: '#f59e0b',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#f59e0b',
    },
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: false,
  },
};

export default config;
