# Manual do Administrador e Curadoria do Catálogo (CalorieSync)

Este documento centraliza as diretrizes, procedimentos e segurança operacional para administração do CalorieSync, conforme a especificação arquitetural **D-22** (decisões B1 a B12).

---

## 1. Criação e Gestão de Administradores (B1, B2 & B3)

### 1.1 Princípio de Segurança: Zero Contas Padrão (B2)
- É **estritamente proibido** criar contas de administrador via migrações de banco de dados, sementes (seeds), variáveis de ambiente (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) ou código-fonte.
- O sistema não possui credenciais administrativas pré-configuradas.

### 1.2 Como Criar o Primeiro Administrador
Para criar o primeiro administrador com total segurança:
1. Acesse o sistema como um usuário normal via tela de cadastro (`/cadastro`) ou registre-se via API.
2. Complete a confirmação de e-mail (fluxo BL-12 de verificação de 6 dígitos enviado por e-mail).
3. No servidor de aplicação, com acesso shell, execute o comando CLI de promoção:
   ```bash
   npm run admin:promote <email-do-usuario>
   ```
4. O script valida que o usuário existe e possui `email_verified_at` preenchido. Em seguida:
   - Altera `role` para `'admin'` no PostgreSQL;
   - Incrementa `token_version` do usuário para invalidar sessões anteriores;
   - Grava a auditoria em `admin_audit_log` com `actor_type: 'cli'`.
5. No próximo login, o usuário terá acesso imediato às rotas administrativas e verá a aba **"Catálogo"** no menu principal.

### 1.3 Gestão de Administradores via CLI (B3)
A gestão de papéis administrativos é realizada **exclusivamente via linha de comando** no servidor:

- **Promover usuário:**
  ```bash
  npm run admin:promote <email>
  ```
- **Rebaixar administrador para usuário comum:**
  ```bash
  npm run admin:demote <email>
  ```
  *Trava de segurança:* O script impede o rebaixamento se a operação for deixar o sistema com **zero administradores**.
- **Listar administradores:**
  ```bash
  npm run admin:list
  ```

Em ambiente de produção (`NODE_ENV=production`), os comandos de promoção e rebaixamento exigem a confirmação explícita `--yes`.

### 1.4 Autorização Dinâmica por Requisição (B1)
- O papel (`role`) do usuário é consultado **diretamente no banco de dados por chave primária** (`users.id`) a cada requisição autenticada através do middleware `authenticate`.
- **Nunca** confie em claims do JWT para conceder permissões administrativas.
- O JWT armazena apenas `{ userId, tv }` (versão do token). Quando um admin é rebaixado ou promovido, `token_version` é incrementado e a alteração tem efeito imediato.

---

## 2. Escopo de Acesso do Administrador (B3)

- O painel administrativo é restrito **exclusivamente à curadoria e gestão do Catálogo Global de Alimentos** (`user_id IS NULL`).
- Nenhum endpoint ou interface administrativa permite visualizar, listar, exportar ou editar dados pessoais de outros usuários, como refeições, medidas corporais, metas ou histórico de navegação.

---

## 3. Integridade e Histórico de Alimentos (B4, B6, B7)

1. **Sem Deleção Física (B4):**
   - Não existe rota `DELETE` para alimentos no catálogo global.
   - Alimentos indesejados, duplicados ou descontinuados são **desativados** (`active = false`).
2. **Imutabilidade do Histórico de Refeições (B6):**
   - A tabela `meal_items` persiste um **snapshot numérico** completo de calorias e macronutrientes calculados no momento do lançamento.
   - A edição de nutrientes no catálogo global não afeta retroativamente nenhuma refeição lançada no passado.
   - Consultas de histórico diário não filtram por `active = true`, garantindo que refeições passadas continuem sendo exibidas integralmente.
3. **Novas Refeições com Alimentos Inativos (B7):**
   - Tentar adicionar um alimento inativo a uma nova refeição retorna `422 Unprocessable Entity` com feedback claro para o usuário.
   - Em edições de refeições pré-existentes, itens que já continham o alimento inativo são preservados.

---

## 4. Trilha Imutável de Auditoria (B5)

Todas as ações de escrita administrativa (via API web ou via scripts CLI) gravam uma entrada na tabela `admin_audit_log` **dentra da mesma transação atômica** (`BEGIN / COMMIT`):

- `id`: Identificador único UUID;
- `actor_user_id`: UUID do administrador (quando executado via API) ou `NULL` (quando via CLI);
- `actor_type`: `'user'` (pela web) ou `'cli'` (pelo terminal);
- `action`: Código da ação executada (ex.: `'food_create'`, `'food_update'`, `'food_status_toggle'`, `'admin_promote'`, `'admin_demote'`, `'catalog_curation_apply'`);
- `entity_type`: Entidade afetada (`'food'`, `'user'`);
- `entity_id`: ID do registro afetado;
- `before`: Snapshot em JSONB do estado anterior;
- `after`: Snapshot em JSONB do novo estado;
- `created_at`: Data e hora com fuso horário da gravação.

Não existem rotas para edição ou exclusão do log de auditoria.

---

## 5. Ferramentas de Curadoria do Catálogo (B9, B10)

O catálogo dispõe de ferramentas automatizadas para revisão e enriquecimento em lote:

1. **Exportar Catálogo para Revisão:**
   ```bash
   npm run catalog:export
   ```
   Gera `backend/data/catalog-review.csv` (UTF-8 com BOM e separador `;`) contendo heurísticas de duplicatas na coluna `sugestao`.

2. **Aplicar Decisões de Revisão:**
   - **Simulação (Dry-Run padrão):**
     ```bash
     npm run catalog:apply backend/data/catalog-decisions.csv
     ```
   - **Gravação Efetiva:**
     ```bash
     npm run catalog:apply -- --apply backend/data/catalog-decisions.csv
     ```
   Marca os registros alterados com `admin_edited_at = NOW()` e grava auditoria.

3. **Importar Alimentos Curados Oficiais:**
   - **Simulação:**
     ```bash
     npm run catalog:import-curated backend/data/curated-foods.json
     ```
   - **Gravação Efetiva:**
     ```bash
     npm run catalog:import-curated -- --apply backend/data/curated-foods.json
     ```
   Exige `source` e `source_ref` obrigatórios (B9) e valida limites nutricionais por 100 g.

4. **Proteção da Importação TACO (B10):**
   A rotina `import-foods.ts` nunca reativa alimentos inativos (`active = foods.active`) e nunca sobrescreve registros que possuam o marcador `admin_edited_at IS NOT NULL`.

---

## 6. Diretrizes de Segurança em Produção (Nota Arquitetural / Fase 8)

Para ambientes de produção:
1. **Princípio do Menor Privilégio no Banco de Dados:**
   - A aplicação web Express (`DATABASE_URL`) DEVE conectar ao PostgreSQL utilizando um usuário dedicado de banco que possua **apenas privilégios de DML** (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) nas tabelas da aplicação.
   - O usuário da aplicação **NÃO deve ter privilégios de superusuário (superuser)** nem permissões de DDL (`CREATE TABLE`, `DROP TABLE`, `ALTER TABLE`).
2. **Execução de Migrações Isolada:**
   - As migrações (`node-pg-migrate`) devem ser executadas em etapa isolada de pipeline de implantação (CI/CD) utilizando credenciais de banco separadas com permissão de DDL.
