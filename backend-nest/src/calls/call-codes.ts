// Codigos aceitos no SOS. O app manda o codigo; o painel mostra o rotulo.
// Mudou aqui, muda tambem em web-admin/src/App.jsx (callNeedLabels)
// e nos textos do app (mobile/src/i18n, chaves help.need_*).
// Nao existe mais lista de "o que esta acontecendo" (dado de saude; 29/10).
export const CALL_NEEDS = ['wheelchair', 'stretcher', 'mobility', 'visual', 'hearing', 'companion'] as const;
