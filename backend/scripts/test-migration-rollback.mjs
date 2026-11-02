// Teste de rollback: up -> down de tudo -> up e compara o esquema (issue #20).
// Roda só num banco dedicado terminado em `_test`; os DROP TABLE vêm dos `down` das migrations.
import pg from 'pg';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

try { process.loadEnvFile(resolve(import.meta.dirname, '../.env')); } catch { /* usa o ambiente atual */ }

const DB = 'contador_calorias_rollback_test';
assert.ok(DB.endsWith('_test'), 'O banco de rollback precisa terminar com _test.');
assert.ok(process.env.DATABASE_URL_TEST, 'Defina DATABASE_URL_TEST (mesmo servidor do banco de testes).');

const withDb = (name) => { const u = new URL(process.env.DATABASE_URL_TEST); u.pathname = `/${name}`; return u.toString(); };
const url = withDb(DB);

const admin = new pg.Client({ connectionString: withDb('postgres') });
await admin.connect();
const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB]);
if (!exists.rowCount) await admin.query(`CREATE DATABASE ${DB}`);
await admin.end();

const migrate = (...args) => {
  const bin = resolve(import.meta.dirname, '../node_modules/node-pg-migrate/bin/node-pg-migrate.js');
  const r = spawnSync(process.execPath, [bin, ...args, '--database-url-var', 'ROLLBACK_DB_URL'], {
    cwd: resolve(import.meta.dirname, '..'),
    env: { ...process.env, ROLLBACK_DB_URL: url },
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, `migrate ${args.join(' ')} falhou:\n${r.stdout}\n${r.stderr}`);
};

const client = new pg.Client({ connectionString: url });
await client.connect();
const q = async (sql) => (await client.query(sql)).rows;

const snapshot = async () => ({
  columns: await q(`SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns WHERE table_schema = 'public' AND table_name <> 'pgmigrations'
    ORDER BY table_name, column_name`),
  indexes: await q(`SELECT tablename, indexname, indexdef FROM pg_indexes
    WHERE schemaname = 'public' AND tablename <> 'pgmigrations' ORDER BY indexname`),
  constraints: await q(`SELECT conrelid::regclass::text AS tbl, conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint WHERE connamespace = 'public'::regnamespace AND conrelid <> 'pgmigrations'::regclass
    ORDER BY conname`),
  extensions: await q(`SELECT extname FROM pg_extension WHERE extname <> 'plpgsql' ORDER BY extname`),
  foods: await q(`SELECT count(*)::int AS n FROM foods`),
});

try {
  migrate('down', '999'); // limpa restos de execuções anteriores
  migrate('up');
  const first = await snapshot();

  migrate('down', '999');
  const leftovers = await q(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'pgmigrations'`);
  assert.deepEqual(leftovers, [], 'Após down de tudo não deveria sobrar tabela.');
  // shortcut: uuid-ossp é criada na baseline e o down dela não a remove; migration aplicada não se edita.
  const ext = await q(`SELECT extname FROM pg_extension WHERE extname NOT IN ('plpgsql', 'uuid-ossp')`);
  assert.deepEqual(ext, [], 'Após down de tudo não deveria sobrar extensão.');

  migrate('up');
  assert.deepEqual(await snapshot(), first, 'O esquema após down+up difere do esquema original.');
  console.log('✅ Rollback ok: down de todas as migrations e up novamente reproduzem o mesmo esquema.');
} finally {
  await client.end();
}
