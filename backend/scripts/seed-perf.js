import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

if (!process.env.DB_PASSWORD) {
  console.error('Erro: DB_PASSWORD não definida nas variáveis de ambiente.');
  process.exit(1);
}

const user = process.env.DB_USER || 'postgres';
const pass = process.env.DB_PASSWORD;
const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '5432', 10);
const dbName = process.env.DB_NAME || 'contador_calorias_perf';

if (!dbName.endsWith('_perf') && !dbName.endsWith('_test')) {
  console.error('Erro: script de performance só pode rodar em banco com sufixo _perf ou _test.');
  process.exit(1);
}

const pool = new Pool({
  host,
  port,
  user,
  password: pass,
  database: dbName,
  max: 10,
});

async function seedPerf() {
  const client = await pool.connect();
  try {
    console.log(`--- Iniciando Seed de Performance (10k meal_items) em ${dbName} ---`);

    await client.query('BEGIN');

    // 0. Limpeza prévia do usuário de performance para garantir idempotência
    await client.query(`DELETE FROM users WHERE email = 'perf-user@example.com'`);

    // 1. Criar usuário de teste de performance
    const userRes = await client.query(
      `INSERT INTO users (name, email, password_hash, goal, daily_calories_goal, daily_proteins_goal)
       VALUES ('Perf User', 'perf-user@example.com', 'hash', 'perder_peso', 2200, 150)
       RETURNING id`
    );
    const userId = userRes.rows[0].id;

    // 2. Criar metas históricas (user_goals) para cobrir 1 ano
    const goalsToInsert = [
      { date: '2025-01-01', cal: 2400, prot: 140, carbs: 260, fats: 70 },
      { date: '2025-06-01', cal: 2200, prot: 150, carbs: 220, fats: 65 },
      { date: '2026-01-01', cal: 2000, prot: 160, carbs: 180, fats: 60 },
    ];
    for (const g of goalsToInsert) {
      await client.query(
        `INSERT INTO user_goals (user_id, effective_from, calories, proteins, carbs, fats, mode)
         VALUES ($1, $2, $3, $4, $5, $6, 'manual')`,
        [userId, g.date, g.cal, g.prot, g.carbs, g.fats]
      );
    }

    // 3. Buscar foods disponíveis para associar aos meal_items
    const foodsRes = await client.query('SELECT id FROM foods LIMIT 10');
    const foodIds = foodsRes.rows.map(r => r.id);
    if (foodIds.length === 0) {
      throw new Error('Nenhum alimento cadastrado na tabela foods.');
    }

    // 4. Gerar 2.500 refeições ao longo de 365 dias (de 2025-10-15 a 2026-10-15)
    // Cada refeição terá exatamente 4 meal_items -> total: 10.000 meal_items
    console.log('Inserindo 2.500 refeições e 10.000 meal_items...');

    const baseDate = new Date('2026-10-15T12:00:00-03:00').getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    // Inserção em blocos para alta performance
    const mealBatchSize = 500;
    let totalMeals = 0;
    let totalItems = 0;

    for (let b = 0; b < 5; b++) {
      const mealValues = [];
      const mealParams = [];

      for (let i = 0; i < mealBatchSize; i++) {
        const mealIndex = b * mealBatchSize + i;
        // Distribui entre 365 dias, 6-7 refeições por dia
        const dayOffset = Math.floor(mealIndex / 7);
        const mealTime = new Date(baseDate - dayOffset * dayMs + (mealIndex % 7) * 2 * 3600 * 1000);
        
        const idx = i * 3;
        mealValues.push(`($${idx + 1}, $${idx + 2}, $${idx + 3})`);
        mealParams.push(userId, `Refeição ${mealIndex + 1}`, mealTime);
      }

      const insertedMeals = await client.query(
        `INSERT INTO meals (user_id, name, meal_time) VALUES ${mealValues.join(', ')} RETURNING id`,
        mealParams
      );

      totalMeals += insertedMeals.rows.length;

      // Inserir 4 itens por refeição inserida (500 * 4 = 2.000 itens por bloco)
      const itemValues = [];
      const itemParams = [];
      let pCount = 1;

      for (const meal of insertedMeals.rows) {
        for (let k = 0; k < 4; k++) {
          const foodId = foodIds[(totalItems + k) % foodIds.length];
          itemValues.push(
            `($${pCount}, $${pCount + 1}, $${pCount + 2}, $${pCount + 3}, $${pCount + 4}, $${pCount + 5}, $${pCount + 6}, $${pCount + 7})`
          );
          itemParams.push(
            meal.id,
            foodId,
            150, // quantity
            'g', // unit
            250, // calories
            20,  // proteins
            30,  // carbs
            5    // fats
          );
          pCount += 8;
          totalItems++;
        }
      }

      await client.query(
        `INSERT INTO meal_items (meal_id, food_id, quantity, unit, calories, proteins, carbs, fats)
         VALUES ${itemValues.join(', ')}`,
        itemParams
      );

      console.log(`Bloco ${b + 1}/5 concluído: ${totalMeals} refeições, ${totalItems} itens.`);
    }

    await client.query('COMMIT');
    console.log(`✅ Seed concluído com sucesso: ${totalMeals} refeições e ${totalItems} itens inseridos para userId = ${userId}`);
    return { userId, totalMeals, totalItems };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro no seed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedPerf().then(res => {
  console.log('Perf seed finished:', JSON.stringify(res));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
