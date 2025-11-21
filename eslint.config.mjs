import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: ['.next/**/*', 'out/**/*', 'node_modules/**/*']
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      globals: globals.browser
    },
    plugins: {
      '@next/next': nextPlugin
    },
    rules: {
      ...nextPlugin.configs.recommended.rules
    }
  }
];

export default config;
