// eslint.config.js — formato "flat config" exigido pelo ESLint 9+.
// Antes deste arquivo, "npm run lint" falhava com
// "ESLint couldn't find an eslint.config.(js|mjs|cjs) file" (achado em 20/10/2026,
// ver docs/casos_de_teste.md) — o projeto tinha a dependencia instalada mas nunca
// teve configuracao nenhuma, nem a antiga (.eslintrc).
const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
      globals: {
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // Decorators do Nest (@Injectable, @Controller, DTOs com class-validator)
      // dependem de parametros/classes "nao usados" em termos de JS puro.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // DTOs e integracoes com Prisma/payloads externos usam `any` com frequencia
      // legitima — manter como aviso, nao erro, pra nao travar o lint por isso.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-function': 'off',
      // `import x = require('supertest')` nos e2e specs e o jeito correto de
      // importar esse pacote CommonJS com a config atual de tsconfig (sem
      // esModuleInterop) — nao reescrever sem rodar os e2e de verdade
      // (precisam de Postgres local; nao disponivel nesta sessao, ver
      // docs/casos_de_teste.md).
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
