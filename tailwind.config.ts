import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          foreground: '#ffffff'
        },
        secondary: {
          DEFAULT: '#f97316',
          foreground: '#0f172a'
        }
      }
    }
  },
  plugins: []
};

export default config;
