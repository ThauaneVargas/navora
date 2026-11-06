// PostToolUse (Edit/Write) no mobile:
// - arquivo de tradução editado → roda o teste de i18n (mesmas chaves em pt/en/es);
// - tela/componente importando `colors` de theme/colors → quebra o modo noturno.
// Saída 2 devolve a mensagem pro Claude corrigir.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  let filePath = '';
  try {
    filePath = JSON.parse(input).tool_input?.file_path || '';
  } catch {
    process.exit(0);
  }
  const normalized = filePath.replace(/\\/g, '/');
  const mobileIndex = normalized.indexOf('/mobile/src/');
  if (mobileIndex === -1) process.exit(0);
  const mobileDir = normalized.slice(0, mobileIndex + '/mobile'.length);

  if (/\/mobile\/src\/i18n\/(pt|en|es)\.js$/.test(normalized)) {
    try {
      execFileSync(process.execPath, [
        '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', '--test', 'src/i18n/i18n.test.mjs',
      ], { cwd: mobileDir, stdio: 'pipe', timeout: 60000 });
    } catch (error) {
      const output = `${error.stdout || ''}${error.stderr || ''}`.split('\n').filter((line) => /not ok|missing|faltando|expected|actual|Error/i.test(line)).slice(0, 25).join('\n');
      process.stderr.write(`Teste de i18n falhou depois de editar ${path.basename(filePath)} — as chaves precisam existir em pt.js, en.js e es.js:\n${output}\n`);
      process.exit(2);
    }
    process.exit(0);
  }

  if (/\/mobile\/src\/(screens|components)\/.+\.js$/.test(normalized) && fs.existsSync(filePath)) {
    const source = fs.readFileSync(filePath, 'utf8');
    if (/import\s+(\{[^}]*\bcolors\b[^}]*\}|colors)\s+from\s+['"](\.\.\/)+theme\/colors['"]/.test(source)) {
      process.stderr.write(
        `${path.basename(filePath)} importa \`colors\` de theme/colors — isso fixa a paleta clara e quebra o modo noturno. `
        + 'Use appColors do useApp() com createStyles(colors) + useThemeStyles() (ver CareAreaChoiceScreen.js). `shadows` pode continuar importado.\n',
      );
      process.exit(2);
    }
  }
  process.exit(0);
});
