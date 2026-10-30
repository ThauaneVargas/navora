// Gera public/baixar-qr.svg: o QR Code que leva para a página de download do
// app (public/baixar.html). Imprimir e deixar na recepção.
// Uso: npm run qr-download -- https://<endereço do painel>/baixar.html
// Rodar de novo sempre que o endereço mudar (ex.: domínio próprio).
// O codificador (toqr, MIT) vem junto com o Expo em mobile/node_modules.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2];
if (!url || !/^https:\/\//.test(url)) {
  console.error('Informe o endereço https da página: npm run qr-download -- https://.../baixar.html');
  process.exit(1);
}

const requireFromMobile = createRequire(path.resolve(here, '../../mobile/package.json'));
const { toQR } = requireFromMobile('toqr');

const modules = toQR(url);
const size = Math.sqrt(modules.length);
const quiet = 4; // margem branca exigida pelos leitores de QR
const total = size + quiet * 2;

let pathData = '';
for (let y = 0; y < size; y += 1) {
  for (let x = 0; x < size; x += 1) {
    if (modules[y * size + x]) pathData += `M${x + quiet} ${y + quiet}h1v1h-1z`;
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" aria-label="QR Code para baixar o Navora">
  <title>${url.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>
  <rect width="${total}" height="${total}" fill="#FFFFFF"/>
  <path d="${pathData}" fill="#000000"/>
</svg>
`;

const outFile = path.resolve(here, '../public/baixar-qr.svg');
writeFileSync(outFile, svg);
console.log(`Gerado ${path.relative(process.cwd(), outFile)} para ${url}`);
