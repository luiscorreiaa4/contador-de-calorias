// Backup/restauração do Postgres via pg_dump/pg_restore. Uso:
//   node scripts/backup-db.mjs backup <arquivo.dump>
//   node scripts/backup-db.mjs verify <arquivo.dump>   (restaura em banco temporário *_restore_test e confere)
// Requer pg_dump/pg_restore/psql no PATH e DATABASE_URL no ambiente. Enviar o arquivo ao storage é com o operador.
import { execFileSync } from 'node:child_process';

const [cmd, file] = process.argv.slice(2);
const url = process.env.DATABASE_URL;
if (!url || !file || !['backup', 'verify'].includes(cmd)) {
  console.error('Uso: backup-db.mjs <backup|verify> <arquivo.dump> (com DATABASE_URL definido)');
  process.exit(1);
}
const run = (bin, args) => execFileSync(bin, args, { stdio: 'inherit' });

if (cmd === 'backup') {
  run('pg_dump', ['--format=custom', '--no-owner', '--file', file, url]);
  console.log(`Backup gravado em ${file}`);
} else {
  const target = new URL(url);
  const tempDb = `${target.pathname.slice(1)}_restore_test`;
  const admin = new URL(url);
  admin.pathname = '/postgres';
  target.pathname = `/${tempDb}`;
  run('psql', [admin.href, '-c', `CREATE DATABASE "${tempDb}"`]);
  try {
    run('pg_restore', ['--no-owner', '--dbname', target.href, file]);
    run('psql', [target.href, '-tAc', 'SELECT count(*) AS users FROM users']);
    console.log('Restauração verificada.');
  } finally {
    run('psql', [admin.href, '-c', `DROP DATABASE IF EXISTS "${tempDb}"`]);
  }
}
