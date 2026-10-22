import dotenv from 'dotenv';
dotenv.config();

import { pool } from '../src/database/pool.js';
import * as AdminUserService from '../src/services/admin-user.service.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const email = args[1];
  const hasYesFlag = args.includes('--yes');

  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'contador_calorias';
  const nodeEnv = process.env.NODE_ENV || 'development';

  console.log(`[CalorieSync Admin CLI] Ambiente: ${nodeEnv} | Alvo: ${host}:${port} | Banco: ${dbName}`);

  if (nodeEnv === 'production' && !hasYesFlag && (command === 'promote' || command === 'demote')) {
    console.error('ERRO: Em ambiente de produção, é obrigatório passar o argumento "--yes" para confirmar a operação.');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'promote': {
        if (!email || !email.includes('@')) {
          console.error('Uso: npm run admin:promote <email> [--yes]');
          process.exit(1);
        }
        const user = await AdminUserService.promoteUserToAdmin(email);
        console.log(`SUCESSO: Usuário "${user.name}" (${user.email}) agora é ADMINISTRADOR.`);
        break;
      }

      case 'demote': {
        if (!email || !email.includes('@')) {
          console.error('Uso: npm run admin:demote <email> [--yes]');
          process.exit(1);
        }
        const user = await AdminUserService.demoteAdminToUser(email);
        console.log(`SUCESSO: Administrador "${user.name}" (${user.email}) foi rebaixado para usuário comum.`);
        break;
      }

      case 'list': {
        const admins = await AdminUserService.listAdmins();
        console.log(`\nTotal de administradores ativos: ${admins.length}\n`);
        if (admins.length === 0) {
          console.log('Nenhum administrador encontrado no banco.');
        } else {
          admins.forEach((admin, idx) => {
            console.log(`  ${idx + 1}. ${admin.name} <${admin.email}> (ID: ${admin.id})`);
          });
        }
        console.log('');
        break;
      }

      default:
        console.error('Comando inválido. Comandos disponíveis: promote, demote, list.');
        console.error('Exemplos:');
        console.error('  npm run admin:promote usuario@email.com');
        console.error('  npm run admin:demote usuario@email.com');
        console.error('  npm run admin:list');
        process.exit(1);
    }
  } catch (error) {
    console.error('ERRO:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void main();
