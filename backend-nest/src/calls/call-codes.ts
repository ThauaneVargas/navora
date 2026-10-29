// Codigos aceitos no SOS. O app manda o codigo; o painel mostra o rotulo.
// Mudou aqui, muda tambem em web-admin/src/App.jsx (callNeedLabels/callProblemLabels)
// e nos textos do app (mobile/src/i18n, chaves help.need_* e help.problem_*).
export const CALL_NEEDS = ['wheelchair', 'stretcher', 'mobility', 'visual', 'hearing', 'companion'] as const;

export const CALL_PROBLEMS = [
  'chest_pain',
  'breathing',
  'fainting',
  'fall',
  'bleeding',
  'seizure',
  'unwell',
  'other',
] as const;
