// Falha se o build publicar arquivos que expõem código ou segredos (guia 03-seguranca-web, seção 1).
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist', import.meta.url));
// Source maps, .env*, .git, dumps SQL e backups/arquivos compactados.
const FORBIDDEN = /\.(map|sql|bak|old|swp|zip|tar|gz|7z|rar)$|(^|[\\/])\.(env|git)/i;

const leaks = readdirSync(dist, { recursive: true }).filter((f) => FORBIDDEN.test(String(f)));

if (leaks.length > 0) {
  console.error(`❌ ${leaks.length} arquivo(s) proibido(s) em dist/:\n${leaks.join('\n')}`);
  process.exit(1);
}
console.log('✓ dist/ sem source maps, .env, .git, .sql ou backups.');
