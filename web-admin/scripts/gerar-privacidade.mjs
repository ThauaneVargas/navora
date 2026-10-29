// Gera public/privacidade.html a partir da política do app
// (mobile/src/data/privacyPolicy.js), pra que o link público exigido pelas
// lojas (App Store / Play Store) mostre exatamente o mesmo texto do app.
// Rodar depois de mudar a política: npm run privacidade
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const policyFile = path.resolve(here, '../../mobile/src/data/privacyPolicy.js');
const { getPrivacyPolicy, PRIVACY_POLICY_VERSION } = await import(pathToFileURL(policyFile).href);

const LANGUAGES = [
  { id: 'pt', label: 'Português', title: 'Política de privacidade', updated: 'Atualizada em', consent: 'Ao criar a conta, você confirma:' },
  { id: 'en', label: 'English', title: 'Privacy policy', updated: 'Updated on', consent: 'When creating an account, you confirm:' },
  { id: 'es', label: 'Español', title: 'Política de privacidad', updated: 'Actualizada el', consent: 'Al crear la cuenta, confirmas:' },
];

const escape = (text) => String(text)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const sectionsHtml = LANGUAGES.map(({ id, label, title, updated, consent }) => {
  const policy = getPrivacyPolicy(id);
  const note = policy.translationNote ? `\n      <p class="note">${escape(policy.translationNote)}</p>` : '';
  const items = policy.sections.map((section) => `
      <section>
        <h3>${escape(section.title)}</h3>
        <p>${escape(section.body)}</p>
      </section>`).join('');
  return `
    <article id="${id}" lang="${id === 'pt' ? 'pt-BR' : id}">
      <p class="eyebrow">${escape(label)}</p>
      <h2>${escape(title)}</h2>
      <p class="meta">${escape(updated)} ${escape(policy.updatedLabel)}</p>${note}${items}
      <section class="consent">
        <h3>${escape(consent)}</h3>
        <p>${escape(policy.consentText)}</p>
      </section>
    </article>`;
}).join('\n');

const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Navora · Política de privacidade</title>
  <meta name="description" content="Política de privacidade do app Navora (navegação hospitalar).">
  <!-- Gerado por web-admin/scripts/gerar-privacidade.mjs (versão ${PRIVACY_POLICY_VERSION}). Não editar à mão. -->
  <style>
    :root {
      --bg: #FBF4F5; --surface: #FFFFFF; --text: #171417; --muted: #6D6870;
      --primary: #7A1021; --border: #E8E3E5; --soft: #F5E8EB;
      color-scheme: light;
    }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #101014; --surface: #1A1A21; --text: #FFFFFF; --muted: #C6C6CF;
        --primary: #FF6B7F; --border: #30303A; --soft: #331D23; color-scheme: dark; }
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text);
      font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
    header, main, footer { max-width: 720px; margin: 0 auto;
      padding-left: max(20px, env(safe-area-inset-left)); padding-right: max(20px, env(safe-area-inset-right)); }
    header { padding-block: 40px 8px; }
    .brand { color: var(--primary); font-weight: 800; font-size: 28px; margin: 0; }
    .lead { color: var(--muted); margin: 4px 0 16px; }
    nav { display: flex; gap: 8px; flex-wrap: wrap; }
    nav a { color: var(--primary); text-decoration: none; font-weight: 600; font-size: 14px;
      padding: 6px 14px; border-radius: 999px; background: var(--soft); }
    nav a:focus-visible, a:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
    main { padding-block: 8px 24px; display: grid; gap: 24px; }
    article { background: var(--surface); border: 1px solid var(--border); border-radius: 24px; padding: 24px; }
    .eyebrow { margin: 0; color: var(--primary); font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    h2 { margin: 4px 0 0; font-size: 24px; line-height: 1.25; text-wrap: balance; }
    .meta { margin: 4px 0 8px; color: var(--muted); font-size: 14px; }
    .note { margin: 0 0 8px; padding: 10px 14px; border-radius: 14px; background: var(--soft); font-size: 14px; }
    section { padding-top: 16px; }
    h3 { margin: 0 0 4px; font-size: 17px; }
    section p { margin: 0; max-width: 65ch; }
    .consent { margin-top: 16px; border-top: 1px solid var(--border); }
    footer { padding-block: 0 40px; color: var(--muted); font-size: 14px; }
  </style>
</head>
<body>
  <header>
    <p class="brand">Navora</p>
    <p class="lead">Navegação dentro do hospital para pacientes e visitantes.</p>
    <nav aria-label="Idioma">
      ${LANGUAGES.map(({ id, label }) => `<a href="#${id}">${escape(label)}</a>`).join('\n      ')}
    </nav>
  </header>
  <main>
${sectionsHtml}
  </main>
  <footer>
    <p>Versão ${escape(PRIVACY_POLICY_VERSION)}. O mesmo texto aparece no app, em Menu › Privacidade.</p>
  </footer>
</body>
</html>
`;

const outFile = path.resolve(here, '../public/privacidade.html');
mkdirSync(path.dirname(outFile), { recursive: true });
writeFileSync(outFile, html);
console.log(`Gerado ${path.relative(process.cwd(), outFile)} (versão ${PRIVACY_POLICY_VERSION})`);
