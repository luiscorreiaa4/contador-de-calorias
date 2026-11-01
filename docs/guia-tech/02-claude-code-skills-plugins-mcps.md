# 02 — Claude Code: Skills, Plugins e MCPs

> Itens desta seção: **Superpowers**, **skills.sh** (frontend-design, grill-me), **Design Motion Principles** (kylezantos), **UI UX Pro Max**, **Humanizer**, **Graphify**, **Understand Anything**, **Ponytail**, **Trail of Bits**, **Refero skill**, **GitHub Spec Kit**, **Taskmaster**, **Serena**, **Supabase MCP**, **Vercel plugin**, **Chrome DevTools MCP**, **Apify conector**.
> Ferramentas de pentest (Strix, Shannon) estão em `04-pentest-e-auditoria.md`.

---

## Antes de tudo: o vocabulário

| Termo | O que é | Onde fica |
|---|---|---|
| **Skill** | Pasta com um `SKILL.md` (instruções em Markdown + scripts opcionais). O agente carrega quando a tarefa combina com a descrição. | `~/.claude/skills/<nome>/` (global) ou `.claude/skills/` (projeto) |
| **Plugin** | Pacote que pode trazer várias skills + comandos `/` + hooks + agentes + MCPs. Instalado por *marketplace*. | `/plugin marketplace add <repo>` → `/plugin install <nome>` |
| **MCP (Model Context Protocol)** | Protocolo que conecta o agente a ferramentas/serviços externos (banco, navegador, API). | `claude mcp add ...` ou `.mcp.json` |
| **skills.sh** | Registro/diretório público de skills + CLI `npx skills add <repo>` que instala em vários agentes (Claude Code, Cursor, Codex, etc.). | https://skills.sh |

> ⚠️ **Segurança:** skill e plugin rodam com as permissões do seu agente. Leia o `SKILL.md` e os hooks antes de instalar coisa de terceiros — é código/instrução que entra na sua máquina.

---

## Metodologia e planejamento

### Superpowers (obra/superpowers)
- **O que é:** framework de skills de Jesse Vincent (Prime Radiant) que transforma o Claude Code num "engenheiro disciplinado": brainstorming antes de codar → plano escrito → implementação com **TDD** (teste falhando → código → teste passando) → revisão por subagentes → verificação antes de dizer "pronto".
- **Por que é popular:** reduz o hábito do agente de sair codando sem entender o pedido; permite sessões longas seguindo o plano aprovado.
- **Instalar:** `/plugin install superpowers@claude-plugins-official` (marketplace oficial) ou `/plugin marketplace add obra/superpowers-marketplace` → `/plugin install superpowers@superpowers-marketplace`.
- **Link:** https://github.com/obra/superpowers

### grill-me (Matt Pocock — via skills.sh)
- **O que é:** skill que faz o agente **te entrevistar sem dó** sobre um plano/design, uma pergunta por vez, cada uma com uma resposta recomendada, até cobrir todos os ramos de decisão. Se a resposta pode ser achada no código, ele vai olhar o código em vez de perguntar.
- **Quando usar:** antes de começar uma feature grande, para descobrir o que você ainda não decidiu. Tem a variante `grill-with-docs` (ancorada em documentação).
- **Instalar:** `npx skills add mattpocock/skills --skill grill-me` → depois `/grill-me` descrevendo sua ideia.
- **Link:** https://github.com/mattpocock/skills · https://skills.sh/mattpocock/skills

### frontend-design (Anthropic — via skills.sh)
- **O que é:** skill oficial da Anthropic que orienta o agente a fazer interfaces com **direção estética intencional** (tipografia, paleta, composição) em vez do visual genérico de IA.
- **Instalar:** `npx skills add anthropics/skills --skill frontend-design` ou pelo marketplace oficial de plugins (`/plugin install frontend-design@claude-plugins-official`).
- **Link:** https://github.com/anthropics/skills

### GitHub Spec Kit
- **O que é:** toolkit do GitHub para **Spec-Driven Development**: você escreve a *especificação* (o quê e por quê), o agente gera o *plano técnico*, quebra em *tarefas* e implementa. A spec vira a fonte da verdade, não o prompt solto.
- **Fluxo:** `constitution` (princípios do projeto) → `specify` → `plan` → `tasks` → `implement` (comandos `/speckit.*` dentro do agente).
- **Instalar:** `uvx --from git+https://github.com/github/spec-kit.git specify init <meu-projeto>` (requer `uv`).
- **Link:** https://github.com/github/spec-kit

### Taskmaster (task-master-ai)
- **O que é:** gerenciador de tarefas para desenvolvimento com IA. Você escreve um **PRD** (documento de requisitos), ele quebra em tarefas com dependências, prioridade e subtarefas; o agente vai pegando "a próxima tarefa" e marcando como feita.
- **Instalar:** `npm i -g task-master-ai` → `task-master init` (ou como MCP no editor). Funciona com Claude Code como provedor (sem chave de API extra).
- **Link:** https://github.com/eyaltoledano/claude-task-master · docs: https://docs.task-master.dev

> 💡 Spec Kit, Taskmaster e Superpowers resolvem problemas parecidos (planejar antes de codar). Escolha **um** como fluxo principal para não conflitar. Combina bem com o hábito de **issues + PRs no GitHub** (ver `05-engenharia-qualidade-devops.md`).

---

## Entender a base de código

### Graphify
- **O que é:** skill que transforma uma pasta (código, PDFs, Markdown, imagens, schemas SQL) num **grafo de conhecimento consultável**. O agente passa a consultar o grafo em vez de ficar fazendo `grep` arquivo por arquivo → menos tokens, mais contexto de arquitetura.
- **Saída:** `graphify-out/` com `graph.html` interativo, relatório em Markdown e JSON.
- **Instalar:** `uv tool install graphifyy` (ou `pipx install graphifyy`) → `graphify install` → no Claude Code: `/graphify .` *(o pacote no PyPI tem dois "y")*
- **Link:** https://github.com/safishamsi/graphify

### Understand Anything
- **O que é:** plugin que roda um pipeline de vários agentes sobre o projeto e gera um **grafo interativo + dashboard** de arquivos, funções, classes e dependências.
- **Comandos:** `/understand` (analisa), `/understand-chat` (pergunte sobre a arquitetura), `/understand-diff` (impacto das suas mudanças), `/understand-explain <arquivo>`, `/understand-onboard` (guia para quem chega no time), `/understand-domain` (fluxos de negócio).
- **Instalar:** `/plugin marketplace add Lum1104/Understand-Anything` → `/plugin install understand-anything`
- **Link:** https://github.com/Lum1104/Understand-Anything

### Serena (MCP)
- **O que é:** servidor MCP da Oraios AI que dá ao agente **ferramentas de IDE**: achar símbolo, achar quem referencia, editar o corpo de uma função, renomear — usando *language servers* (LSP). O agente edita por símbolo em vez de ler arquivo inteiro.
- **Quando brilha:** projetos grandes e já estruturados. Em projeto do zero ajuda pouco.
- **Instalar:** `claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)`
- **Link:** https://github.com/oraios/serena

---

## Qualidade do código e do texto gerado

### Ponytail
- **O que é:** skill/plugin de Dietrich Gebert que faz o agente pensar como "o dev sênior mais preguiçoso da sala": antes de escrever código novo, reutilizar o que existe, a biblioteca padrão e recursos nativos da plataforma (ex.: `<input type="date">` em vez de instalar uma lib de datepicker). Mantém validação, segurança e acessibilidade.
- **Números divulgados pelo autor:** em média ~54% menos código em sessões reais (com casos extremos bem maiores), além de custo e tempo menores. São benchmarks do próprio projeto — trate como indicativo.
- **Comandos:** `/ponytail-review`, `/ponytail-audit`, `/ponytail-debt` (lista os atalhos marcados com comentário `ponytail:` para não esquecer de melhorar depois).
- **Instalar:** `/plugin marketplace add DietrichGebert/ponytail` → `/plugin install ponytail@ponytail` (precisa de Node no PATH).
- **Link:** https://github.com/DietrichGebert/ponytail

### Humanizer
- **O que é:** skill que identifica e remove padrões típicos de texto de IA (baseada no guia "Signs of AI writing" da Wikipédia) — útil para copy de site, posts, e-mails.
- **Instalar:** `git clone https://github.com/blader/humanizer.git ~/.claude/skills/humanizer` → `/humanizer <cole o texto>`
- **Link:** https://github.com/blader/humanizer

---

## Design e UI (skills)

### Design Motion Principles (kylezantos)
> No vídeo aparece como "github.com/kylezantos/design-principles"; o repositório correto é **`kylezantos/design-motion-principles`**.
- **O que é:** skill de motion/interação com dois modos: **criar** componentes já com movimento proposital ou **auditar** animações existentes. Aplica três "lentes" inspiradas no trabalho público de Emil Kowalski (animação contida, só onde agrega), Jakub Krehel e Jhey Tompkins (mais lúdico), pesando cada uma conforme o contexto do projeto.
- **Cobre:** skeleton loading, lazy loading, animações de entrada/saída, feedback de carregamento/progresso, hover, transições — tudo explicado em `06-design-ui-ux.md`.
- **Instalar:** `npx skills add kylezantos/design-motion-principles`
- **Link:** https://github.com/kylezantos/design-motion-principles · do mesmo autor: `responsive-craft` (responsividade).

### UI UX Pro Max
- **O que é:** skill de "inteligência de design" com base pesquisável de estilos, paletas, pares de fontes e regras de UX por tipo de produto/setor, além de checklist pré-entrega (contraste, estados de interação, safe areas, acessibilidade).
- **Instalar:** `npx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max` ou `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`
- **Link:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

### Refero Skill (referodesign)
- **O que é:** skill "pesquise antes de desenhar": obriga o agente a buscar referências reais (estilos, telas, fluxos) no Refero antes de gerar UI, com "travas de referência" e checagens anti-AI-slop. Funciona sozinha com referências embutidas; fica completa com o **Refero MCP** (requer assinatura Refero Pro).
- **Instalar:** `npx skills add https://github.com/referodesign/refero_skill --skill refero-design`
- **Link:** https://doc.refero.design/skill/overview · detalhes do Refero em `06-design-ui-ux.md`.

---

## Segurança (skills)

### Trail of Bits Skills
- **O que é:** marketplace de plugins da **Trail of Bits** (empresa de auditoria de segurança respeitada) com skills para revisão de código, análise de variantes de bugs, CodeQL/Semgrep, auditoria de cadeia de suprimentos, *defaults* inseguros, GitHub Actions, criptografia (tempo constante) e mais.
- **Instalar:** `/plugin marketplace add trailofbits/skills` → `/plugin` para escolher quais instalar.
- **Plugins úteis para web:** `insecure-defaults`, `differential-review`, `supply-chain-risk-auditor`, `agentic-actions-auditor`, `audit-context-building`.
- **Link:** https://github.com/trailofbits/skills
- Mais sobre auditoria em `04-pentest-e-auditoria.md`.

---

## MCPs e plugins de plataforma

### Supabase MCP
- **O que é:** servidor MCP oficial que deixa o agente consultar e gerenciar seu projeto Supabase: listar tabelas, rodar SQL, criar **migrations**, ver logs, gerar tipos TypeScript, checar *advisors* de segurança (ex.: tabela sem RLS).
- **Uso seguro (importante!):**
  - Conecte a um projeto de **desenvolvimento/staging**, nunca direto à produção.
  - Use **modo somente leitura** (`read_only=true`) e restrinja a um projeto (`project_ref=...`).
  - Dados das tabelas podem conter prompt injection — revise cada chamada de ferramenta antes de aprovar.
- **Instalar:** `claude mcp add --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<ref>&read_only=true"`
- **Link:** https://supabase.com/docs/guides/getting-started/mcp

### Vercel plugin
- **O que é:** plugin oficial da Vercel que injeta conhecimento da plataforma (Next.js, AI SDK, env vars, domínios, funções, Sandbox…) no contexto do agente via hooks e valida padrões obsoletos. Há também o plugin de deploy com `/deploy`, `/vercel-logs`, `/vercel-setup`.
- **Instalar:** `/plugin install vercel` (marketplace oficial) ou `npx plugins add vercel/vercel-plugin`
- **Atenção:** em 2026 houve críticas públicas sobre a telemetria do plugin coletar dados de sessões fora de projetos Vercel. Revise as configurações de telemetria e instale no escopo do projeto se isso te preocupar.
- **Link:** https://vercel.com/docs/agent-resources/vercel-plugin

### Chrome DevTools MCP
- **O que é:** MCP oficial do time do Chrome que deixa o agente **controlar e inspecionar um Chrome real**: abrir páginas, clicar, ler console, ver requisições de rede, tirar screenshot e gravar *performance traces* (LCP, CLS…) — ótimo para o agente depurar o próprio front-end e medir PageSpeed.
- **Instalar:** `claude mcp add chrome-devtools npx chrome-devtools-mcp@latest`
- **Cuidado:** o agente vê tudo que está no navegador — use o perfil isolado que ele cria, não seu perfil logado em banco/e-mail. Para desativar estatísticas de uso: `--no-usage-statistics`.
- **Link:** https://github.com/ChromeDevTools/chrome-devtools-mcp

### Apify (conector MCP)
- **O que é:** o Apify é uma plataforma com milhares de "Actors" (robôs prontos de scraping/automação: Google Maps, Instagram, sites, LinkedIn…). O **conector MCP** expõe esses Actors como ferramentas para o Claude rodar e ler o resultado no chat.
- **Como o vídeo provavelmente usou ("html disparo de mensagem"):** coletar leads/dados com um Actor (ex.: empresas do Google Maps) e gerar um HTML/painel para disparo de mensagens.
- **Conectar:** no Claude, *Settings → Connectors → Add custom connector* com `https://mcp.apify.com` (login OAuth); no Claude Code: `claude mcp add --transport http apify https://mcp.apify.com`.
- **⚠️ Legal/LGPD:** raspar dados pessoais e disparar mensagens em massa sem consentimento pode violar a LGPD, os termos do WhatsApp/Instagram (risco de banimento) e o CDC. Use base legal adequada (ex.: consentimento/opt-in) e ofereça descadastro. Ver `08-legal-lgpd-acessibilidade.md`.
- **Link:** https://docs.apify.com/integrations/mcp · https://mcp.apify.com

---

## Resumo rápido — qual usar para quê

| Objetivo | Ferramenta |
|---|---|
| Planejar antes de codar | grill-me → Spec Kit **ou** Taskmaster **ou** Superpowers |
| Entender projeto grande | Graphify, Understand Anything, Serena |
| Menos código inchado | Ponytail |
| UI com cara de produto real | frontend-design, Refero skill, UI UX Pro Max, Design Motion Principles |
| Texto menos "robótico" | Humanizer |
| Segurança | Trail of Bits skills (+ Strix/Shannon em `04`) |
| Banco/infra | Supabase MCP, Vercel plugin |
| Testar no navegador | Chrome DevTools MCP |
| Coleta de dados externos | Apify |
