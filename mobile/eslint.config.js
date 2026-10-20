// eslint.config.js — config padrão do Expo (flat config, ESLint 9+).
// Objetivo principal: pegar bug antes de rodar (ex.: componente usado no JSX
// sem import — foi o que derrubou o PatientIdentificationScreen, ver item 13
// do CLAUDE.md). Rode com `npm run lint`.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Estas 4 regras são do React Compiler, que este projeto NÃO usa (nada em
    // app.json/babel.config.js). A maior parte dos alertas é o idioma padrão de
    // animação do RN — `useRef(new Animated.Value(0)).current` — que não é bug.
    // Ficam como aviso (continuam visíveis) em vez de erro, pra `npm run lint`
    // falhar só no que é bug de verdade (import faltando, variável indefinida,
    // regra de hooks quebrada).
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
  {
    // Builds e artefatos gerados — não são código-fonte.
    ignores: ['dist/*', 'android/*', 'ios/*', 'verify-android/*', 'verify-web/*', 'review-dist/*'],
  },
]);
