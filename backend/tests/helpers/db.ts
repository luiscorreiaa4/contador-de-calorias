import { pool } from '../../src/database/pool.js';

/**
 * Validador de segurança em runtime: garante que o banco termina com o sufixo '_test'
 * antes de permitir a exclusão de dados de teste (conforme D-11 e AGENTS.md §4).
 */
export function assertIsTestDatabase(dbName: string | undefined): void {
  if (!dbName || !dbName.endsWith('_test')) {
    throw new Error(
      `Segurança D-11 violada: tentativa de executar limpeza fora do banco de testes! Banco atual: '${dbName || 'desconhecido'}'`
    );
  }
}

/**
 * Limpeza determinística do banco de testes (PC-14 / D-11).
 * Exclui exclusivamente os usuários cujo e-mail inicia com 'tester-'.
 * Suporta filtro por padrão (ex: 'tester-user-%', 'tester-food-%') para isolamento concorrente entre suítes de teste.
 * Pelo ON DELETE CASCADE do banco, todas as tabelas filhas (meals, meal_items, user_goals, body_measurements) são limpas automaticamente.
 */
export async function cleanupTestData(pattern = 'tester-%'): Promise<void> {
  if (!pattern.startsWith('tester-')) {
    throw new Error(
      `Segurança D-11 violada: padrão de limpeza deve iniciar com 'tester-'. Padrão fornecido: '${pattern}'`
    );
  }

  const result = await pool.query<{ db_name: string }>('SELECT current_database() as db_name');
  const currentDb = result.rows[0]?.db_name;

  assertIsTestDatabase(currentDb);

  await pool.query('DELETE FROM users WHERE email LIKE $1', [pattern]);
}
