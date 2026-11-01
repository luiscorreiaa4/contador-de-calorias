# Guia Tech — tudo o que apareceu nos 40+ vídeos salvos

Organizei os **103 itens** da sua lista em **8 setores**, um arquivo por setor. Cada conceito tem: o que é, por que importa, como aplicar e links oficiais. Ferramentas que eram repositórios/skills foram pesquisadas e conferidas (nome correto do repositório, comando de instalação atual).

> Data da pesquisa: novembro/2026. Ferramentas de IA mudam rápido — confira o README do repositório antes de instalar.

---

## Os setores (visão geral)

| # | Arquivo | O setor em uma frase |
|---|---|---|
| 01 | [`01-ia-conceitos.md`](01-ia-conceitos.md) | **IA**: como dar conhecimento (RAG) ou comportamento (fine-tuning) a um modelo, e como não produzir "lixo de IA". |
| 02 | [`02-claude-code-skills-plugins-mcps.md`](02-claude-code-skills-plugins-mcps.md) | **Ferramentas do agente**: skills, plugins e MCPs que deixam o Claude Code mais disciplinado, mais barato e com melhor gosto. |
| 03 | [`03-seguranca-web.md`](03-seguranca-web.md) | **Segurança da aplicação**: segredos, sessão, quem pode acessar o quê, entrada de dados, infraestrutura e lógica de negócio. |
| 04 | [`04-pentest-e-auditoria.md`](04-pentest-e-auditoria.md) | **Provar que está seguro**: pentest com IA (Strix, Shannon), skills de auditoria e roteiro de auto-teste. |
| 05 | [`05-engenharia-qualidade-devops.md`](05-engenharia-qualidade-devops.md) | **Engenharia**: issues/PRs, banco versionado, rollback, observabilidade, qualidade de código e testes. |
| 06 | [`06-design-ui-ux.md`](06-design-ui-ux.md) | **Design**: motion, bibliotecas de componentes, referências reais, mídia leve, onboarding e storytelling. |
| 07 | [`07-seo-geo-presenca-online.md`](07-seo-geo-presenca-online.md) | **Ser encontrado**: SEO técnico, ferramentas do Google, e GEO (ser citado por IAs). |
| 08 | [`08-legal-lgpd-acessibilidade.md`](08-legal-lgpd-acessibilidade.md) | **Estar dentro da lei**: LGPD, documentos obrigatórios, direito do consumidor, direitos autorais e acessibilidade. |

### Explicação por setores

**🧠 IA (01).** RAG busca trechos dos seus documentos na hora e entrega ao modelo — use para conhecimento que muda. Fine-tuning re-treina o modelo com seus exemplos — use para estilo/formato fixo. "AI slop" é o visual e o texto genérico que denunciam produção em massa por IA; quase todo o setor de design (06) existe para combatê-lo.

**🤖 Ferramentas do agente (02).** Três famílias: **planejar** (grill-me, Spec Kit, Taskmaster, Superpowers), **entender código** (Graphify, Understand Anything, Serena) e **produzir melhor** (Ponytail para menos código, Humanizer para texto, UI UX Pro Max / Refero / Motion Principles para interface). Os MCPs (Supabase, Vercel, Chrome DevTools, Apify) conectam o agente ao banco, ao deploy, ao navegador e a dados externos.

**🔐 Segurança (03).** Siga a ordem: segredos fora do código e fora do `NEXT_PUBLIC_` → sessão em cookie `HttpOnly` → toda rota checa usuário **e dono do recurso** (IDOR/BOLA) → RLS em todas as tabelas → validar e sanitizar entradas (SQL e prompt injection, SSRF) → rate limit, captcha, MFA → erros genéricos, logs sem dados sensíveis, CORS restrito, HTTPS → dependências atualizadas → regras de plano checadas no servidor (downgrade).

**🛡️ Pentest (04).** Depois de corrigir, **teste como atacante**: Strix e Shannon rodam agentes que exploram o app de verdade; as skills da Trail of Bits auditam o código. Só em sistemas seus.

**⚙️ Engenharia (05).** Toda tarefa vira issue; toda mudança vira PR com CI e preview deploy. Banco muda só por migration; deploy ruim volta com Instant Rollback. Sentry/OpenTelemetry mostram o que acontece em produção. Biome, Knip, commitlint, ArchUnitTS e Stryker mantêm o código limpo; Vitest + Playwright + Codecov garantem que funciona.

**🎨 Design (06).** Skeleton, lazy loading e animações curtas fazem o app parecer rápido. 21st.dev, Cult UI e Spell UI dão componentes prontos; ShaderGradient, fundos animados; expo-glass-effect, o Liquid Glass no iOS. Refero, Inspora e Coolors dão referências reais. Imagens WebP < 300 KB, vídeos WebM, fotos reais e cases contados como história.

**🔎 SEO/GEO (07).** Base técnica (HTTPS, PageSpeed, sitemap, robots liberado, 404 real), conteúdo (title/meta description, Schema), ferramentas do Google (Search Console, Analytics, Meu Negócio) e a nova frente: GEO + `llms.txt` para aparecer nas respostas de ChatGPT/Perplexity/Gemini.

**⚖️ Jurídico e acessibilidade (08).** LGPD (só dados necessários, formulários com finalidade e consentimento, tracking só após aceite no banner de cookies), documentos (privacidade, termos, reembolso com 7 dias de arrependimento), dados da empresa no rodapé, nada de avaliação falsa, imagens licenciadas, e WCAG AA (alt, contraste, teclado).

---

## Por onde começar (ordem sugerida para um projeto novo)

1. **Planejar:** `grill-me` → issues no GitHub (02, 05)
2. **Base segura:** env vars + RLS + auth em todas as rotas (03)
3. **Construir com qualidade:** Biome, testes, CI com PR + preview (05)
4. **Design com referência:** Refero/Inspora + skills de UI + motion (06)
5. **Antes de lançar:** checklists de `03`, `07` e `08` + pentest em staging (04)
6. **Depois de lançar:** Sentry, Search Console, Analytics com consentimento, Google Meu Negócio (05, 07)

---

## Índice completo — onde está cada item da sua lista

| Item que você anotou | Arquivo |
|---|---|
| RAG | 01 |
| Fine-tuning | 01 |
| AI slops | 01 (conceito), 06 (design) |
| Humanizer | 02 (skill), 01 (contexto) |
| Skills Superpowers (Claude Code) | 02 |
| skills.sh (frontend-design e grill-me) | 02 |
| Skill motion principles (kylezantos) | 02 (skill), 06 (padrões: skeleton, lazy loading, entrada/saída, progresso) |
| UI UX Pro Max | 02 |
| Graphify | 02 |
| Understand Anything | 02 |
| Ponytail | 02 |
| GitHub Spec Kit | 02 |
| Taskmaster | 02 |
| Serena | 02 |
| Trail of Bits | 02 (instalação), 04 (uso em auditoria) |
| Supabase MCP | 02 |
| Vercel plugin | 02 |
| Chrome DevTools MCP | 02 |
| Apify conector (HTML disparo de mensagem) | 02 (+ alerta legal em 08) |
| Variáveis de produção dentro da Vercel | 03 |
| Nenhuma chave de acesso `NEXT_PUBLIC_` | 03 |
| Proteger source maps | 03 |
| localStorage sem token e dados pessoais (httpOnly) | 03 |
| sessionStorage limpo ao fechar aba | 03 |
| Variáveis de ambiente fora do código | 03 |
| Secrets fora do código | 03 |
| Caçar env exposta | 03 |
| Rota debug | 03 |
| Rota pública livre de SQL injection / prompt injection | 03 |
| IDOR, SSRF, BOLA | 03 |
| Rate limit nos endpoints (IP, usuário, token) / Rate Limit | 03 |
| Proteger as rotas | 03 |
| Rotas de API com autenticação | 03 |
| Captchas | 03 |
| MFA | 03 |
| Quantidade de tentativas de login | 03 |
| Expiração de sessão | 03 |
| Controle de acesso | 03 |
| Princípio do menor privilégio | 03 |
| Políticas de RLS nas tabelas | 03 |
| Validação de inputs | 03 |
| Sanitização de dados | 03 |
| Esconder infos do sistema em mensagens de erro | 03 |
| CORS | 03 |
| LOGS | 03 (+ observabilidade em 05) |
| Criptografia de dados sensíveis | 03 |
| Dependências | 03 |
| HTTPS | 03 (segurança), 07 (SEO) |
| Domínio com certificado SSL | 03, 07 |
| .htaccess | 03 |
| Downgrade | 03 |
| Onboarding | 06 (UX), 03 (segurança do fluxo) |
| Strix | 04 |
| Pentester | 04 |
| Criar issues no GitHub + PRs para deploys | 05 |
| Migrations | 05 |
| Rollback | 05 |
| Observabilidade (Sentry, Datadog, New Relic, OpenTelemetry) | 05 |
| Qualidade (archcontract, ArchUnit, Biome, commitlint, Knip, Stryker) | 05 |
| Testes unitários, integração e E2E (Codecov, Playwright) | 05 |
| expo-glass-effect | 06 |
| referodesign / stylesrefero | 06 (+ skill em 02) |
| Cult UI | 06 |
| ShaderGradient | 06 |
| Coolors | 06 |
| 21st.dev ("21dev.st") | 06 |
| Spell UI | 06 |
| Inspora | 06 |
| Imagens < 300 KB em WebP | 06 |
| Vídeos WebM | 06 |
| Imagens reais para confiabilidade | 06 |
| Cases com storytelling | 06 |
| Página 404 própria | 06 (design), 07 (técnico) |
| PageSpeed | 07 |
| sitemap.xml | 07 |
| robots.txt não bloqueando a produção | 07 |
| Meta descriptions | 07 |
| Google Search Console | 07 |
| Google Analytics | 07 |
| Google Meu Negócio | 07 |
| Cookies | 07 (técnico), 08 (aviso/consentimento) |
| Rodapé com dados | 07 (SEO), 08 (exigência legal) |
| llms.txt | 07 |
| SEO motores de pesquisa | 07 |
| GEO pesquisa de IA | 07 |
| Políticas de privacidade | 08 |
| Termos de serviço | 08 |
| Aviso de cookies | 08 |
| Política de reembolso | 08 |
| Formulários na LGPD | 08 |
| Só dados necessários | 08 |
| Scripts de tracking | 08 |
| Conformidade LGPD ("lgpt") | 08 |
| Riscos jurídicos | 08 |
| Dados da empresa | 08 |
| Sem avaliações falsas | 08 |
| Copyright das imagens | 08 |
| Auditoria de acessibilidade | 08 |
| Alt nas imagens | 08 |
| Contraste | 08 |
| Navegação por teclado | 08 |

### Notas sobre nomes que estavam diferentes nos vídeos
- **"kylezantos/design-principles"** → o repositório é `kylezantos/design-motion-principles`.
- **"21dev.st"** → `21st.dev`.
- **"comilint"** → `commitlint`. **"stryke"** → `Stryker` (mutation testing).
- **"archcontract"** → não achei ferramenta com esse nome exato; é o conceito de *arquitetura como contrato executável*, implementado por ArchUnit/ArchUnitTS, tsarch e dependency-cruiser (explicado em 05).
- **"pentester"** → genérico; o projeto mais provável é o **Shannon** (KeygraphHQ), que se apresenta como "AI Pentester". Listei alternativas em 04.
- **"stylesrefero" / "referodesign"** → `styles.refero.design` e o GitHub `referodesign/refero_skill`.
- **"downgrade"** e **"onboarding"** estavam no bloco de segurança → expliquei os sentidos de segurança (downgrade de plano, de TLS e de dependência; pular etapas do onboarding) e também o lado de UX do onboarding.
- **"lgpt"** → LGPD.
