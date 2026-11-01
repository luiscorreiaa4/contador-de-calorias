# 05 — Engenharia, qualidade, testes e operação

> Itens desta seção: **issues no GitHub para todas as tarefas + PRs para gerenciar deploys** · **migrations** · **rollback** · **observabilidade** (Sentry, Datadog, New Relic, OpenTelemetry) · **qualidade** (archcontract/ArchUnit, Biome, commitlint, Knip, Stryker) · **testes unitários, de integração e end-to-end** (Codecov, Playwright).
> Variáveis de ambiente na Vercel estão em `03-seguranca-web.md`.

---

## 1. Fluxo de trabalho: Issues + Pull Requests

### Criar issues no GitHub para todas as tarefas (correção, melhoria ou nova função)
- **Toda** mudança nasce como **issue**: bug, melhoria ou feature. Isso cria histórico, permite priorizar e dá contexto para o agente de IA.
- **Labels sugeridas:** `bug`, `enhancement`, `feature`, `security`, `priority:high`.
- **Templates** em `.github/ISSUE_TEMPLATE/` (bug report com "passos para reproduzir / esperado / obtido").
- **GitHub Projects** (quadro Kanban) para acompanhar.
- O Claude Code cria issues com `gh issue create`; o Taskmaster e o Spec Kit podem gerar tarefas que viram issues.

### Fazer PRs para gerenciar deploys
- Ninguém (nem a IA) faz *push* direto na `main`. Fluxo:
  1. Branch a partir da issue (`git checkout -b fix/123-login-error`).
  2. Commits pequenos e descritivos.
  3. **Pull Request** com `Closes #123` na descrição (fecha a issue ao fazer merge).
  4. **CI roda**: lint, type-check, testes, build.
  5. **Preview deploy** automático (a Vercel cria uma URL por PR) → você testa ali.
  6. Revisão (humana e/ou agente — Claude Code Review, CodeRabbit, Trail of Bits `differential-review`).
  7. Merge → deploy de produção automático.
- **Proteja a `main`**: *Settings → Branches → Branch protection / Rulesets*: exigir PR, exigir CI verde, bloquear force-push.
- Links: https://docs.github.com/issues · https://vercel.com/docs/deployments/preview-deployments

---

## 2. Banco de dados: migrations e rollback

### Migrations
- **O que são:** arquivos versionados que descrevem **cada mudança no schema** do banco (criar tabela, adicionar coluna, criar índice, política RLS). Ficam no Git junto com o código e são aplicados em ordem em todos os ambientes.
- **Por quê:** sem migrations, o banco de produção vira "o que alguém clicou no painel" — impossível reproduzir, revisar ou desfazer.
- **Ferramentas:**
  - Supabase CLI: `supabase migration new add_orders` → edita o SQL → `supabase db push` (ou `supabase db diff` para gerar a partir das mudanças locais).
  - Prisma: `prisma migrate dev` / `prisma migrate deploy`.
  - Drizzle: `drizzle-kit generate` / `drizzle-kit migrate`.
- **Boas práticas:**
  - Uma migration por mudança lógica; nunca editar migration já aplicada em produção.
  - Mudanças **compatíveis com versão anterior** (*expand → migrate → contract*): primeiro adiciona a coluna nova, depois o código passa a usar, só depois remove a antiga. Assim um rollback do código não quebra.
  - Testar em staging com cópia anonimizada dos dados.
- Links: https://supabase.com/docs/guides/deployment/database-migrations · https://www.prisma.io/docs/orm/prisma-migrate

### Rollback
- **O que é:** voltar rapidamente para a última versão que funcionava quando um deploy quebra algo.
- **Código (Vercel):** *Deployments → deployment anterior → "Instant Rollback"* (ou `vercel rollback`). Leva segundos.
- **Banco:** mais difícil — dados não "voltam". Por isso:
  - Tenha **migrations reversíveis** ou um plano de "migration de correção".
  - **Backups** automáticos + **PITR** (*Point-in-Time Recovery*) no Supabase/Neon/RDS — teste a restauração pelo menos uma vez.
  - **Feature flags** (PostHog, LaunchDarkly, Vercel Flags, Statsig) para desligar uma funcionalidade sem novo deploy.
- Link: https://vercel.com/docs/instant-rollback

---

## 3. Observabilidade

**O que é:** a capacidade de entender o que está acontecendo em produção a partir de três sinais: **logs** (o que aconteceu), **métricas** (quanto/quantas vezes) e **traces** (o caminho de uma requisição entre serviços). Mais: **error tracking** e **monitoramento de uptime**.

| Ferramenta | Foco | Quando escolher |
|---|---|---|
| **Sentry** | Erros + performance + session replay | Primeiro passo para quase todo app web/mobile; plano grátis generoso; integra com Next.js e Expo em minutos (`npx @sentry/wizard@latest -i nextjs`) |
| **Datadog** | Plataforma completa (infra, APM, logs, RUM, segurança) | Empresas com várias aplicações/servidores; caro em escala |
| **New Relic** | APM e observabilidade completa | Alternativa ao Datadog, com cota gratuita mensal |
| **OpenTelemetry (OTel)** | **Padrão aberto** para gerar logs/métricas/traces | Instrumente uma vez e envie para qualquer backend (Datadog, New Relic, Grafana, Honeycomb, Axiom) sem ficar preso a um fornecedor. Next.js tem suporte via `@vercel/otel` |

**Mínimo recomendado para um app pequeno:** Sentry (erros + source maps privados) + Vercel Analytics/Speed Insights + um monitor de uptime (Better Stack, UptimeRobot) + logs centralizados com alerta.

Links: https://docs.sentry.io · https://opentelemetry.io/docs/ · https://nextjs.org/docs/app/guides/open-telemetry · https://www.datadoghq.com · https://newrelic.com

---

## 4. Qualidade de código

### "archcontract" → Testes de arquitetura (ArchUnit / ArchUnitTS)
> Não existe uma ferramenta conhecida exatamente chamada "archcontract"; o vídeo provavelmente se refere à ideia de **arquitetura como contrato executável** — regras de arquitetura escritas como testes que quebram o CI se forem violadas. É o que as ferramentas abaixo fazem.

- **ArchUnit** (Java): https://www.archunit.org — a ferramenta original.
- **ArchUnitTS** (TypeScript/JavaScript, pacote `archunit`): verifica direção de dependências, ciclos, camadas (ex.: "a pasta `presentation` não pode importar de `database`"), convenções de nomes e métricas (coesão, acoplamento). `npm i -D archunit`. https://github.com/LukasNiessen/ArchUnitTS
- Alternativas: **tsarch** (https://github.com/ts-arch/ts-arch), **dependency-cruiser** (https://github.com/sverweij/dependency-cruiser).
- **Por que importa com IA:** agentes tendem a "atalhar" importando o que estiver perto; testes de arquitetura impedem que o projeto vire espaguete.

Exemplo (ArchUnitTS + Vitest):
```ts
import { projectFiles } from 'archunit';

it('UI não acessa o banco direto', async () => {
  const rule = projectFiles().inFolder('src/components/**')
    .shouldNot().dependOnFiles().inFolder('src/db/**');
  await expect(rule).toPassAsync();
});
```

### Biome
- **O que é:** *linter + formatador* tudo-em-um para JS/TS/JSON/CSS, escrito em Rust — substitui ESLint + Prettier na maioria dos projetos e é muito mais rápido.
- `npm i -D -E @biomejs/biome` → `npx biome init` → `npx biome check --write .`
- Link: https://biomejs.dev

### commitlint ("comilint")
- **O que é:** valida se as mensagens de commit seguem um padrão, geralmente **Conventional Commits**: `feat: adiciona login com Google`, `fix(api): corrige IDOR em /pedidos`, `chore: atualiza deps`.
- **Por quê:** histórico legível, geração automática de changelog e versão (semantic-release, release-please).
- Setup: `npm i -D @commitlint/cli @commitlint/config-conventional` + hook com **Husky** ou **Lefthook**.
- Links: https://commitlint.js.org · https://www.conventionalcommits.org/pt-br/

### Knip
- **O que é:** encontra **arquivos, exports e dependências não usados** (e dependências usadas mas não declaradas) em projetos JS/TS. Excelente para limpar o que a IA gerou e abandonou.
- `npx knip`
- Link: https://knip.dev

### Stryker ("stryke") — Mutation testing
- **O que é:** **teste de mutação**. O Stryker altera seu código de propósito (troca `>` por `>=`, `true` por `false`, apaga uma linha) e roda seus testes. Se os testes continuam passando, o "mutante sobreviveu" → seus testes não pegam aquele erro.
- **Por quê:** cobertura de 90% não significa testes bons; o *mutation score* mede se os testes realmente verificam algo. Muito útil quando a IA escreveu os testes.
- `npm init stryker@latest` → `npx stryker run`
- Link: https://stryker-mutator.io

> Também vale ter: **TypeScript em modo `strict`**, `tsc --noEmit` no CI, e **ESLint** com plugins de segurança se não usar Biome.

---

## 5. Testes

### Os três níveis (pirâmide de testes)

| Tipo | Testa | Velocidade | Ferramentas | Proporção típica |
|---|---|---|---|---|
| **Unitário** | Uma função/componente isolado (ex.: cálculo de frete, validação de CPF) | Milissegundos | **Vitest**, Jest; React Testing Library | Maioria (~70%) |
| **Integração** | Partes juntas: rota de API + banco, componente + hook + API mockada | Segundos | Vitest + banco de teste (Supabase local, Testcontainers), **MSW** para mockar APIs | ~20% |
| **End-to-end (E2E)** | O fluxo inteiro num navegador real, como o usuário: cadastrar → logar → comprar | Segundos a minutos | **Playwright**, Cypress; **Maestro**/Detox para mobile | Poucos, nos fluxos críticos (~10%) |

### Playwright
- Framework da Microsoft para testes E2E em Chromium, Firefox e WebKit (Safari). Grava testes clicando (`npx playwright codegen`), tira screenshots/vídeos, roda em paralelo no CI e tem *trace viewer* para depurar.
- `npm init playwright@latest`
- Há também o **Playwright MCP** para o agente navegar e testar.
- Link: https://playwright.dev

### Codecov
- Serviço que recebe os relatórios de **cobertura de testes** do CI e mostra no PR quanto do código novo está coberto, com gráfico e comentário automático. Dá para exigir cobertura mínima para aprovar o PR.
- Funciona com Vitest/Jest (`--coverage`) + GitHub Action `codecov/codecov-action`.
- Link: https://about.codecov.io · alternativa: Coveralls.

### Pipeline de CI sugerido (GitHub Actions)
```
on: pull_request
jobs:
  - biome check
  - tsc --noEmit
  - knip
  - vitest run --coverage  → upload Codecov
  - testes de arquitetura (archunit)
  - playwright test (contra o preview deploy)
  - (semanal) stryker run
  - (opcional) strix -n --scan-mode quick
```
