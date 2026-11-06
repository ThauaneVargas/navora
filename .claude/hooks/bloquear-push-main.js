// PreToolUse (Bash/PowerShell): push pra main = deploy de produção no Render.
// Só a usuária faz. Bloqueia o comando e devolve o motivo pro Claude.
let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  let command = '';
  try {
    command = JSON.parse(input).tool_input?.command || '';
  } catch {
    process.exit(0);
  }
  const pushesMain = /\bgit\b[^\n;|&]*\bpush\b[^\n;|&]*(\s|:|\/)main(\s|$|;|&|\|)/.test(command)
    || /\bgit\b[^\n;|&]*\bpush\b[^\n;|&]*--all\b/.test(command);
  if (pushesMain) {
    process.stderr.write(
      'Bloqueado: push pra main dispara o deploy de produção no Render. '
      + 'Quem faz é a usuária (git push origin <branch>:main). Mostre o comando pra ela em vez de rodar.\n',
    );
    process.exit(2);
  }
  process.exit(0);
});
