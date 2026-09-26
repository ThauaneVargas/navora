import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

// ESLint 9 exige configuracao "flat". Usa apenas dependencias ja declaradas no package.json.
export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  ...tsPlugin.configs['flat/recommended'],
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: false, sourceType: 'module' },
    },
    rules: {
      // O codigo usa `any` de forma pontual em mapeamentos do Prisma e nos testes.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Testes usam require() para supertest e inspecionam metadados com o tipo Function.
    files: ['src/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },
];
