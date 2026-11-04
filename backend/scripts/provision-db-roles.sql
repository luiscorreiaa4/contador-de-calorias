-- Separa o papel da aplicação (só DML) do papel de migração (DDL). Idempotente.
-- Executar como superusuário/dono do banco, uma vez por banco:
--   psql "$ADMIN_DATABASE_URL" -v ON_ERROR_STOP=1 \
--     -v app_password="'<senha_app>'" -v migration_password="'<senha_migracao>'" \
--     -v dbname=contador_calorias -f backend/scripts/provision-db-roles.sql
-- Depois: DB_USER/DB_PASSWORD = app_user (API) e DATABASE_URL = migration_user (migrate up).

SELECT 'CREATE ROLE app_user LOGIN' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') \gexec
SELECT 'CREATE ROLE migration_user LOGIN' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'migration_user') \gexec
ALTER ROLE app_user PASSWORD :app_password NOSUPERUSER NOCREATEDB NOCREATEROLE;
ALTER ROLE migration_user PASSWORD :migration_password NOSUPERUSER NOCREATEDB NOCREATEROLE;

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
ALTER DEFAULT PRIVILEGES FOR ROLE migration_user IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES FOR ROLE migration_user IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- admin_audit_log é append-only (B5): a aplicação não edita nem apaga logs.
REVOKE UPDATE, DELETE ON admin_audit_log FROM app_user;
