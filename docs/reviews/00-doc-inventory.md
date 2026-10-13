# Inventário e Auditoria de Documentação do Repositório

**Data da Auditoria:** 13 de outubro de 2026  
**Ambiente:** Google Antigravity IDE / Desktop  
**Escopo:** Todos os arquivos de documentação, regras e rascunhos do repositório (raiz, `/docs`, `/.agents`, etc.), comparados contra a implementação real de código no backend e frontend.

---

## 1. Contexto e Mecanismos Oficiais de Leitura do Antigravity

Consultamos a documentação oficial do Antigravity através de consulta online aos endpoints oficiais e aos guias nativos do sistema:
- **Fontes consultadas:**
  - `https://antigravity.google/docs/rules`
  - `https://antigravity.google/docs/ide/workflows`
  - `https://antigravity.google/docs/migration/workflows-to-skills`
  - `https://antigravity.google/docs/skills`
  - Habilidades integradas do ambiente: `agy-customizations` e `antigravity-guide` (`~/.gemini/antigravity-ide/builtin/skills/`).

### O que o Antigravity lê automaticamente e onde cada tipo deve residir:

1. **Regras Globais e Hierárquicas de Diretório (`AGENTS.md` / `GEMINI.md`):**
   - **Localização:** Raiz do projeto (`/AGENTS.md` ou `/GEMINI.md`) ou em qualquer subdiretório (também suporta `<dir>/.agents/AGENTS.md`).
   - **Formato:** Markdown puro. **Não utiliza YAML frontmatter**.
   - **Comportamento:** Sempre ativo (`always_on`) para o diretório em que reside e todos os seus subdiretórios. Ao abrir ou editar arquivos, o Antigravity sobe a árvore de diretórios até a raiz do repositório carregando cumulativamente todos os arquivos de regras encontrados.
   - **Ordem de precedência:** Diretórios mais específicos têm precedência sobre os da raiz; regras de workspace têm precedência sobre configurações globais de máquina (`~/.gemini/AGENTS.md`).

2. **Regras Modulares do Workspace (`.agents/rules/*.md`):**
   - **Localização:** Diretório `.agents/rules/` na raiz do projeto (apenas arquivos `.md` imediatos; subdiretórios são ignorados a menos que declarados em `.agents/rules.json`).
   - **Formato:** **Exige obrigatoriamente YAML frontmatter** com o campo `trigger:` (`always_on`, `model_decision`, `glob` ou `manual`) e `description:`.
   - **Regra Crítica:** Se o arquivo `.md` em `.agents/rules/` não possuir YAML frontmatter ou contiver um trigger inválido, a documentação oficial alerta que o Antigravity descarta a regra silenciosamente.

3. **Agent Skills (`.agents/skills/<skill_name>/SKILL.md`):**
   - **Localização:** Pasta individual por skill dentro de `.agents/skills/`.
   - **Formato:** Inicia com `SKILL.md` contendo frontmatter `name:` e `description:`. Pode conter pastas auxiliares (`scripts/`, `examples/`, `references/`).
   - **Comportamento:** Carregamento progressivo (progressive disclosure). Apenas nome e descrição são indexados inicialmente; o conteúdo completo só é carregado quando o modelo decide ou quando invocado via slash command `/<skill-name>`.

4. **Workflows Legados (`.agents/workflows/*.md`):**
   - **Localização:** `.agents/workflows/<workflow-name>.md`.
   - **Formato:** Arquivo Markdown único (limite de 12.000 caracteres), acionado via slash command `/<workflow-name>`.
   - **Status Oficial:** A documentação oficial do Antigravity anuncia que os workflows legados de arquivo único serão **descontinuados em 19 de outubro de 2026** e substituídos integralmente pelo padrão aberto de **Agent Skills** (`.agents/skills/`), disponibilizando inclusive o comando `/migrate-workflows`. Podem ser utilizados no momento, mas com transição planejada para skills.

---

## 2. Inventário Completo dos Documentos

Abaixo está o inventário de todos os 21 arquivos de documentação, regras e rascunhos mapeados no repositório, sua classificação frente ao código real e a ação recomendada.

| Arquivo | Propósito Original | Estado | Ação Proposta | Justificativa |
| :--- | :--- | :--- | :--- | :--- |
| `README.md` | Apresentação do projeto, arquitetura, setup, guia de instalação e comandos. | **Parcialmente desatualizado** | Atualizar e manter na raiz (`/README.md`) | Contém referências a portas antigas (`3000` em vez de `3001`), pastas inexistentes (`backend/database/` em vez de `backend/migrations/`, `frontend/src/hooks/`), nome de banco divergente (`contador_de_calorias` vs `contador_calorias`) e branding antigo. |
| `CLAUDE.md` | Guia de instruções operacionais para o agente Claude Code. | **Obsoleto / Duplicado** | **Unificar e Apagar** | Criado para outra ferramenta; cita script inexistente (`backend/init-db.js`), omite testes do frontend e duplica diretrizes já existentes em `.agents/rules/`. Suas boas regras operacionais devem ser incorporadas ao `AGENTS.md` da raiz. |
| `ROADMAP.md` | Guia de planejamento das fases, tarefas históricas e decisões técnicas. | **Parcialmente desatualizado** | **Mover para `docs/ROADMAP.md`** e atualizar | Documento estratégico vivo. As Fases 0, 1, 2 e 3 já estão prontas no código, mas seus checkpoints constam desmarcados no texto. Cita a si mesmo como `docs/ROADMAP.md`, devendo residir na pasta `docs/`. |
| `PERFORMANCE_BASELINE.md` | Registrar baseline de tamanho de bundle e latências antes da Fase 4. | **Parcialmente desatualizado** | **Mover para `docs/PERFORMANCE_BASELINE.md`** | Foi criado como baseline inicial (06/10/2026), mas deixou métricas de Lighthouse e latência com campos vazios `[ ]`. Deve morar em `docs/` junto com a documentação técnica. |
| `prompt de hospedagem.txt` | Rascunho solto de prompt sobre opções de hospedagem gratuita para closed beta. | **Sem utilidade** | **Apagar da raiz** (ou extrair para nota em `docs/`) | É um arquivo de texto avulso com pergunta pessoal do usuário, não faz parte da documentação formal do sistema. |
| `prompt de mobile.txt` | Rascunho de prompt para instruir criação do app Expo / React Native. | **Sem utilidade como doc de raiz** | **Converter para workflow** (`.agents/workflows/mobile-setup.md`) e apagar `.txt` | Contém um excelente roteiro de prompt para expansão mobile, ideal para ser transformado em workflow reutilizável em vez de ficar como `.txt` solto na raiz. |
| `prompt de versionamento.txt` | Rascunho de prompt solicitando criação de workflow de releases e Conventional Commits. | **Sem utilidade como doc de raiz** | **Converter para regra/workflow** e apagar `.txt` | Instrução reutilizável de padronização de versão e commits. Deve virar regra `.agents/rules/versioning-rules.md` ou workflow `.agents/workflows/release-version.md`. |
| `docs/ARCHITECTURE.md` | Visão geral da arquitetura, fluxo de dados e diagrama ER. | **Parcialmente desatualizado** | Atualizar e manter em `docs/` | Diagrama ER está defasado: faltam as tabelas `body_measurements` e `user_goals`, e novas colunas de `foods`. Cita `init-db.js` e `backend/database/` em vez de `node-pg-migrate`. |
| `docs/OPEN_QUESTIONS.md` | Dúvidas de infraestrutura, testes e regras de negócio. | **Obsoleto** | **Apagar** | 4 das 5 perguntas já foram integralmente resolvidas e implementadas no código (migrations, Vitest, TACO, cálculo TMB). A pendência de hospedagem já consta no `ROADMAP.md`. |
| `docs/SPEC.md` | Especificação funcional (RFs), não-funcionais (RNFs) e regras. | **Parcialmente desatualizado** | Atualizar e manter em `docs/` | RF-004 e RF-005 constam como "Parciais" com itens pendentes que já foram implementados (comparação visual com meta e cálculo TMB). Falta documentar o RF da página de Estatísticas (`StatsPage.tsx`). |
| `docs/TASK_TEMPLATE.md` | Template para abertura de novas tarefas. | **Atualizado** | Manter em `docs/TASK_TEMPLATE.md` | Template neutro, conciso e aderente às regras de qualidade do projeto. |
| `docs/TECH_DEBT.md` | Registro de dívidas técnicas e vulnerabilidades. | **Parcialmente desatualizado** | Atualizar e manter em `docs/` | Ainda lista como pendências os erros de linter (já corrigidos) e ausência de Helmet/Rate Limit (já instalados e configurados). Deve ser enxugado mantendo apenas dívidas ativas. |
| `docs/TESTING.md` | Documento de status dos testes e plano de caracterização. | **Obsoleto / Fortemente desatualizado** | **Reescrever por completo** em `docs/` | Congelado no passado pré-auditoria: diz que o lint falha, que o front não tem testes e que os testes do backend apagam o banco de dev. O código real já tem Vitest, MSW, banco `_test` isolado e lint verde. |
| `.agents/AGENTS.md` | Definição de personas de agentes especialistas e seus checklists. | **Atualizado (porém fora da raiz)** | **Mover para a raiz (`/AGENTS.md`)** | O Antigravity busca primordialmente `AGENTS.md` na raiz do projeto como regra principal de workspace. O conteúdo está alinhado com o código. |
| `.agents/rules/backend-rules.md` | Regras obrigatórias de arquitetura, camadas, banco e segurança do backend. | **Atualizado** | Manter em `.agents/rules/` | Possui frontmatter válido (`trigger: always_on`). Cita regras vitais (sem ORM, Zod obrigatório, sem exclusão destrutiva de banco). |
| `.agents/rules/react-rules.md` | Regras obrigatórias do frontend React (React Query, sem useEffect para fetch). | **Atualizado** | Manter em `.agents/rules/` | Possui frontmatter válido (`trigger: always_on`). Alinhado com as práticas atuais do frontend. |
| `.agents/rules/style-rules.md` | Regras visuais brutalistas, uso de CSS variables e acessibilidade WCAG. | **Atualizado** | Manter em `.agents/rules/` | Possui frontmatter válido (`trigger: model_decision`). Respeitado pela estilização atual do app. |
| `.agents/skills/backend-middlewares/SKILL.md` | Template e implementação de middlewares de validação, auth e erro. | **Atualizado** | Manter em `.agents/skills/` | Código dos templates é fiel à implementação real em `backend/src/middlewares/`. |
| `.agents/skills/backend-testing-guide/SKILL.md` | Instruções e templates para testes do backend. | **Parcialmente desatualizado** | Atualizar exemplos da skill | Ensina a usar `Vitest` no backend (`import { describe, it, expect, vi } from 'vitest'`), mas o backend real utiliza `node:test` e `node:assert` via `tsx --test`. |
| `.agents/skills/connect-react-to-backend/SKILL.md` | Guia de conexão React com backend via React Query. | **Atualizado (leve inconsistência)** | Manter e alinhar checklist | Alinhado com o cliente `apiFetch` e React Query, mas o checklist contradiz `style-rules.md` ao sugerir prefixos manuais `dark:` em vez de tokens de CSS variables. |
| `.agents/skills/create-backend-resource/SKILL.md` | Guia de criação de novos módulos no backend (MVC + Services). | **Atualizado** | Manter em `.agents/skills/` | Padrão arquitetural 100% aderente ao código em `backend/src/`. |

---

## 3. Lista de Todas as Contradições Identificadas

### A. Contradições entre Documentos e Código Real

1. **Comando de Setup e Inicialização do Banco de Dados:**
   - *Documentos:* `CLAUDE.md` (L15) e `docs/ARCHITECTURE.md` (L103) afirmam que o banco é inicializado por `backend/init-db.js` ou scripts em `backend/database/`.
   - *Código Real:* `init-db.js` não existe. O comando `npm run setup` no `package.json` da raiz roda `npm --prefix backend run migrate up`, executando migrações SQL via `node-pg-migrate` dentro de `backend/migrations/`.

2. **Porta do Servidor Backend e URL da API:**
   - *Documentos:* `README.md` (L110, L135) instrui configurar `PORT=3000` e diz que a API responde em `http://localhost:3000`.
   - *Código Real:* `backend/src/config/env.ts` define a porta default como `3001`; `backend/.env.example` define `PORT=3001`; e `frontend/src/services/api.ts` aponta para `http://localhost:3001/api`. Se o usuário seguir o README na porta 3000, o frontend não consegue se comunicar com a API.

3. **Nome do Banco de Dados PostgreSQL:**
   - *Documentos:* `README.md` (L111) sugere a string com `contador_de_calorias` (com "_de_"), enquanto na L120 manda criar `CREATE DATABASE contador_calorias;`.
   - *Código Real:* O schema de ambiente e pool utilizam `contador_calorias` como padrão.

4. **Credenciais Hardcoded vs. Regra de Segurança:**
   - *Documentos:* `backend-rules.md` e `CLAUDE.md` proíbem terminantemente qualquer credencial hardcoded no código.
   - *Código Real:* No `backend/package.json` (L13), o script `db:reset:test` contém a string com senha de banco exposta: `postgresql://postgres:vN7qL2xR9mK4zP8wT6aB3@localhost:5432/contador_calorias_test`.

5. **Test Runner do Backend (Vitest vs. Node Native Runner):**
   - *Documentos:* `backend-testing-guide/SKILL.md` instrui o uso de Vitest: `import { describe, it, expect, vi } from 'vitest';`.
   - *Código Real:* O backend não possui Vitest instalado. O script de teste é `tsx --test tests/**/*.test.ts`, e os testes utilizam nativamente `import { describe, it } from 'node:test'` e `import assert from 'node:assert'`.

6. **Existência de Testes no Frontend:**
   - *Documentos:* `docs/TESTING.md` (L22-29) e `docs/OPEN_QUESTIONS.md` (L8) afirmam que o frontend não possui testes e perguntam se devem introduzir Vitest.
   - *Código Real:* O frontend possui suíte completa e funcional com `Vitest`, `@testing-library/react` e `MSW` (mock service worker) em `frontend/src/tests/` e nas pastas de componentes (`LoginForm.test.tsx`, `StatsPage.test.tsx`, etc.).

7. **Isolamento do Banco de Testes:**
   - *Documentos:* `docs/TESTING.md` (L9) alerta sobre risco crítico de desenvolvedor, afirmando que os testes rodam no banco de dados local comum e apagam dados reais.
   - *Código Real:* `backend/src/database/pool.ts` possui guarda fail-safe obrigatória: se `NODE_ENV === 'test'` e o banco não terminar em `_test`, o processo é abortado imediatamente. E `backend/package.json` injeta `DB_NAME=contador_calorias_test`.

8. **Status dos Erros de Linter:**
   - *Documentos:* `docs/TESTING.md` e `docs/TECH_DEBT.md` registram que o comando `npm run lint` falha com 4 erros (`NewMealModal.tsx`, `meal.service.ts`).
   - *Código Real:* O linter passa com 0 erros (já foi corrigido na Fase 0.3).

9. **Tabelas do Modelo de Dados (Diagrama ER Defasado):**
   - *Documentos:* `docs/ARCHITECTURE.md` lista apenas 4 tabelas (`users`, `foods`, `meals`, `meal_items`).
   - *Código Real:* As migrations criaram `body_measurements` e `user_goals`, e adicionaram colunas `source`, `external_id` e `active` à tabela `foods`.

10. **Requisitos Funcionais de Metas e Dashboard:**
    - *Documentos:* `docs/SPEC.md` lista o comparativo visual de calorias do dashboard (RF-004) e o cálculo automático de TMB (RF-005) como incompletos/parciais.
    - *Código Real:* Ambos foram implementados (`nutrition.service.ts`, `GoalSettingsCard.tsx`, `DashboardPage.tsx`).

### B. Contradições entre Documentos

11. **Localização do ROADMAP:**
    - `ROADMAP.md` (L181) instrui a IA nos prompts a ler `docs/ROADMAP.md`, mas o arquivo físico reside na raiz (`/ROADMAP.md`).

12. **Branding do Projeto (Contador de Calorias vs. CalorieSync):**
    - `README.md` e `package.json` intitulam o app como "Contador de Calorias".
    - `ROADMAP.md` (item 0.10) e a interface visual (`AppHeader.tsx`, `Footer.tsx`) registram a transição de marca para "CalorieSync".

13. **Uso de Classes `dark:` vs. CSS Variables Tokens:**
    - `style-rules.md` proíbe o espalhamento de classes `dark:` fixas no HTML/JSX, exigindo uso exclusivo dos tokens padronizados (`bg-background`, `text-foreground`).
    - `connect-react-to-backend/SKILL.md` orienta o uso de classes utilitárias diretas como `dark:text-red-400`.

---

## 4. Proposta de Estrutura Final

A reorganização proposta segue as diretrizes do Antigravity e a arquitetura solicitada pelo usuário:

```text
contador-de-calorias/
├── README.md                      # [ATUALIZAR] Vitrine do projeto, comandos reais (porta 3001, migrations, CalorieSync)
├── AGENTS.md                      # [MOVER DA .AGENTS/ + UNIFICAR CLAUDE.md] Regra mestre de workspace do Antigravity
│
├── docs/
│   ├── ARCHITECTURE.md            # [ATUALIZAR] Diagrama ER com as 6 tabelas atuais e stack real
│   ├── SPEC.md                    # [ATUALIZAR] RFs atualizados com TMB, Metas e Estatísticas
│   ├── ROADMAP.md                 # [MOVIDO DA RAIZ] Checkpoints das fases 0-3 atualizados, fases futuras 4-8
│   ├── TESTING.md                 # [REESCREVER] Guia real dos testes: node:test (backend) e Vitest/MSW (frontend)
│   ├── TECH_DEBT.md               # [ATUALIZAR] Débitos reais (segredos no histórico git, refresh token, audit)
│   ├── TASK_TEMPLATE.md           # [MANTER] Template padronizado de especificação de tarefas
│   ├── PERFORMANCE_BASELINE.md    # [MOVIDO DA RAIZ] Métricas de referência para a Fase 4
│   └── reviews/
│       └── 00-doc-inventory.md    # Este relatório de auditoria
│
├── .agents/
│   ├── rules/                     # REGRAS OBRIGATÓRIAS (com YAML frontmatter)
│   │   ├── backend-rules.md       # Regras de arquitetura e segurança backend (trigger: always_on ou glob)
│   │   ├── react-rules.md         # Regras de frontend e React Query (trigger: always_on ou glob)
│   │   ├── style-rules.md         # Regras de identidade brutalista e WCAG (trigger: model_decision)
│   │   └── versioning-rules.md    # [NOVA REGRA] Criada a partir de 'prompt de versionamento.txt'
│   │
│   ├── skills/                    # PROCEDIMENTOS E RUNBOOKS (Agent Skills padrão Antigravity)
│   │   ├── backend-middlewares/   # Middlewares padrão
│   │   ├── backend-testing-guide/ # [ATUALIZAR] Corrigir templates para node:test
│   │   ├── connect-react-to-backend/ # Integração React + React Query
│   │   └── create-backend-resource/  # Scaffold de recurso backend
│   │
│   └── workflows/                 # PROMPTS REUTILIZÁVEIS
│       ├── task-start.md          # [NOVO] Prompt para iniciar tarefas do roadmap
│       └── mobile-setup.md        # [NOVO] Prompt de kickoff do app mobile (extraído de prompt de mobile.txt)
│
├── backend/                       # Código da API Node.js + Express
└── frontend/                      # Código da SPA React 19 + Vite
```

### Resumo das Ações Físicas Propostas:
1. **O que Unir:**
   - Incorporar as regras operacionais de `CLAUDE.md` em `AGENTS.md` na raiz do repositório.
   - Extrair `prompt de versionamento.txt` para uma nova regra em `.agents/rules/versioning-rules.md`.
2. **O que Mover:**
   - Mover `.agents/AGENTS.md` → `/AGENTS.md`.
   - Mover `/ROADMAP.md` → `docs/ROADMAP.md`.
   - Mover `/PERFORMANCE_BASELINE.md` → `docs/PERFORMANCE_BASELINE.md`.
   - Mover o prompt de `prompt de mobile.txt` → `.agents/workflows/mobile-setup.md`.
3. **O que Apagar:**
   - `CLAUDE.md` (após unificação no `AGENTS.md`).
   - `docs/OPEN_QUESTIONS.md` (todas as dúvidas já foram resolvidas e implementadas).
   - `prompt de hospedagem.txt` (rascunho avulso sem relação com o código).
   - `prompt de mobile.txt` (após conversão para workflow).
   - `prompt de versionamento.txt` (após conversão para regra).
4. **O que Criar:**
   - `docs/reviews/00-doc-inventory.md` (este relatório).
   - `.agents/workflows/task-start.md` (prompt reutilizável do ciclo de tarefas).
   - `.agents/workflows/mobile-setup.md` (prompt reutilizável de mobile).
   - `.agents/rules/versioning-rules.md` (regra formal de versionamento e commits).

---

## 5. Perguntas que Dependem de Decisão do Usuário

Antes de qualquer alteração, exclusão ou movimentação de arquivos, confirme as seguintes decisões:

1. **Branding e Nomenclatura Oficial:**
   - Devemos oficializar a marca **CalorieSync** em todos os documentos (`README.md`, `package.json`, `index.html`), mantendo "Contador de Calorias" apenas como descrição explicativa, ou prefere manter "Contador de Calorias"?

2. **Senha Hardcoded no script `db:reset:test` (`backend/package.json`):**
   - No script `db:reset:test` consta a string `postgresql://postgres:vN7qL2xR9mK4zP8wT6aB3@localhost:5432/...`. Autoriza alterar esse script para consumir a variável de ambiente `DATABASE_URL` (ou usar parâmetros sem senha hardcoded), eliminando o segredo exposto?

3. **Exclusão dos Arquivos Temporários de Rascunho e `CLAUDE.md`:**
   - Aprova a remoção definitiva dos 3 arquivos `.txt` da raiz (`prompt de hospedagem.txt`, `prompt de mobile.txt`, `prompt de versionamento.txt`) após extrairmos seus conteúdos úteis para workflows/rules?
   - Aprova a exclusão de `CLAUDE.md` e `docs/OPEN_QUESTIONS.md` após unificação?

4. **Runner de Testes no Backend:**
   - Confirmamos que o backend continuará utilizando o **Node Native Test Runner (`node:test` + `node:assert`)** via `tsx --test`? Se sim, autoriza corrigir a skill `backend-testing-guide` para remover menções a Vitest no backend?

5. **Destino dos Prompts Reutilizáveis (`.agents/workflows` vs. `.agents/skills`):**
   - Conforme a documentação oficial do Antigravity, workflows legados (`.agents/workflows/`) serão descontinuados em 19 de outubro de 2026. Prefere que os prompts reutilizáveis fiquem em `.agents/workflows/` (conforme seu pedido) ou prefere que já sejam criados como Agent Skills modernas em `.agents/skills/`?
