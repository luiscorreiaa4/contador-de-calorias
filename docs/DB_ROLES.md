# Papéis de banco e RLS (issues #9 e #10)

## Papéis (#9)

| Papel | Uso | Privilégios |
|---|---|---|
| `app_user` | API (`DB_USER`/`DB_PASSWORD`), CLIs `admin:*` e `catalog:*` | `SELECT/INSERT/UPDATE/DELETE` e uso de sequences. Sem DDL. Sem `UPDATE/DELETE` em `admin_audit_log`. |
| `migration_user` | `npm run setup` (`DATABASE_URL`), `backup-db.mjs` | Dono dos objetos: DDL, `CREATE EXTENSION`. Nunca usado pela API. |

A separação já existia no código: a API lê `DB_*` e as migrations leem `DATABASE_URL`. Faltava só criar os papéis.

### Provisionar (uma vez por banco, como superusuário)
```bash
psql "$ADMIN_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -v app_password="'<senha_app>'" -v migration_password="'<senha_migracao>'" \
  -v dbname=contador_calorias -f backend/scripts/provision-db-roles.sql
```
Depois: `DB_USER=app_user` (+ senha) para a API e `DATABASE_URL=postgresql://migration_user:...` para as migrations. Rode o script também depois da **primeira** migration se o banco já tinha tabelas criadas por outro dono (o script cobre as existentes e, via `ALTER DEFAULT PRIVILEGES`, as futuras criadas por `migration_user`).

Observações:
- Tabelas já criadas por `postgres` continuam dele; para que `migration_user` as altere, faça `REASSIGN OWNED BY postgres TO migration_user` no banco (decisão do operador, não feita no script).
- `CREATE EXTENSION` de `unaccent`/`pg_trgm`/`uuid-ossp` é permitido a não superusuário por serem *trusted* (PG13+), com `CREATE` no banco.
- Em dev e nos testes segue valendo o usuário `postgres` do docker-compose; o script é para staging/produção.

## RLS (#10): avaliação

**Recomendação: não adotar agora.**

- Os models usam `pool.query` direto. RLS com `SET LOCAL app.user_id` exige transação por requisição (ou `set_config` por conexão) em todo acesso: reescrita ampla da camada de models e uma conexão presa por request.
- Falha de configuração é silenciosa e perigosa: sem `app.user_id` a policy devolve vazio ou, com o papel errado (dono da tabela, `BYPASSRLS`, superusuário), ignora a policy.
- Admin, CLIs e catálogo global (alimentos sem `user_id`) precisam de policies/bypass próprios.
- O isolamento por usuário já é coberto por `WHERE user_id = $n` e pela suíte `authorization.test.ts` (IDOR/BOLA).

Reavaliar se surgir acesso ao banco fora da API (BI, suporte) ou mais de uma aplicação no mesmo schema. Nesse caso: começar pelas tabelas de saúde (`meals`, `body_measurements`, `user_goals`), `FORCE ROW LEVEL SECURITY`, `app_user` sem `BYPASSRLS`.
