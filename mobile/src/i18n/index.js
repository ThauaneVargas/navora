import pt from './pt';
import en from './en';
import es from './es';

// Idiomas do app. Português é o padrão e também a reserva: chave que faltar
// em en/es aparece em português (melhor que mostrar a chave crua).
// Telas ainda não traduzidas continuam com texto fixo em português — a
// tradução está sendo feita por etapas (ver CLAUDE.md, item 20).
export const LANGUAGES = [
  { code: 'pt', label: 'Português', short: 'PT' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'es', label: 'Español', short: 'ES' },
];

export const DEFAULT_LANGUAGE = 'pt';

const DICTIONARIES = { pt, en, es };

const lookup = (dictionary, key) =>
  key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), dictionary);

// Formato de data/hora de cada idioma (toLocaleDateString etc.).
const LOCALES = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };
export function localeFor(language) {
  return LOCALES[language] || LOCALES.pt;
}

export function isSupportedLanguage(code) {
  return Boolean(DICTIONARIES[code]);
}

// translate('help.sosTitle') ou translate('search.count', { n: 3 }) — "{n}" no texto vira o valor.
export function translate(language, key, params) {
  const value = lookup(DICTIONARIES[language], key) ?? lookup(pt, key) ?? key;
  if (typeof value !== 'string' || !params) return value;
  return value.replace(/\{(\w+)\}/g, (match, name) => (params[name] ?? match));
}
