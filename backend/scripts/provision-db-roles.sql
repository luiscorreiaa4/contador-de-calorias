-- Separa o papel da aplicação (só DML) do papel de migração (DDL). Idempotente.
-- Executar como superusuário ou dono do banco (Neon: neondb_owner), uma vez por banco:
--   psql "$ADMIN_DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -v app_password="'<senha_app>'" -v migration_password="'<senha_migracao>'" \
--     -v dbname=contador_calorias -f backend/scripts/provision-db-roles.sql
-- Depois: DB_USER/DB_PASSWORD = app_user (API) e DATABASE_URL = migration_user (migrate up).

SELECT 'CREATE ROLE app_user LOGIN' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') \gexec
SELECT 'CREATE ROLE migration_user LOGIN' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'migration_user') \gexec
ALTER ROLE app_user PASSWORD :app_password;
ALTER ROLE migration_user PASSWORD :migration_password;
-- Atributos só quando necessário: no Neon (dono do banco não é superusuário) mexer em
-- SUPERUSER falha mesmo para remover. Papel com SUPERUSER exige rodar como superusuário.
SELECT format('ALTER ROLE %I NOSUPERUSER NOCREATEDB NOCREATEROLE', rolname)
  FROM pg_roles
 WHERE rolname IN ('app_user', 'migration_user')
   AND (rolsuper OR rolcreatedb OR rolcreaterole) \gexec

REVOKE ALL ON DATABASE :"dbname" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"dbname" TO app_user, migration_user;
GRANT CREATE ON DATABASE :"dbname" TO migration_user; -- CREATE EXTENSION (uuid-ossp, unaccent, pg_trgm; exigem trusted ext. ou superusuário)

-- Objetos já existentes (criados por postgres ou por migration_user).
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT USAGE, CREATE ON SCHEMA public TO migration_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Objetos futuros criados pelas migrations rodando como migration_user.
-- Sem superusuário (Neon), ALTER DEFAULT PRIVILEGES FOR ROLE e ALTER ... OWNER TO migration_user
-- exigem que o executor herde e possa assumir o papel: equivale a GRANT migration_user TO neondb_owner.
-- (No PG16 quem cria o papel já é membro com ADMIN OPTION, mas sem INHERIT/SET; por isso USAGE + SET.)
SELECT format('GRANT migration_user TO %I', current_user)
 WHERE NOT (SELECT rolsuper FROM pg_roles WHERE rolname = current_user)
   AND NOT (pg_has_role(current_user, 'migration_user', 'USAGE')
            AND pg_has_role(current_user, 'migration_user', 'SET')) \gexec
ALTER DEFAULT PRIVILEGES FOR ROLE migration_user IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES FOR ROLE migration_user IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- admin_audit_log é append-only (B5): a aplicação não edita nem apaga logs.
REVOKE UPDATE, DELETE ON admin_audit_log FROM app_user;
