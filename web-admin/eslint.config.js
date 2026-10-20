// eslint.config.js — config padrão de projeto Vite + React (flat config, ESLint 9+).
// Objetivo principal: pegar bug antes de rodar (variável/componente indefinido,
// regra de hooks quebrada). Rode com `npm run lint`.
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Sem eslint-plugin-react, o ESLint não sabe que <Componente /> "usa" o
      // import — sem este padrão, todo componente importado vira falso positivo.
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Regras do React Compiler (não usado neste projeto) — aviso, não erro.
      // Mesmo critério do mobile/eslint.config.js.
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
];
