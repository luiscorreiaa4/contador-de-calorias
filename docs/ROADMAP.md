# Roadmap de Desenvolvimento (ROADMAP.md)

Este documento registra o planejamento estratégico e a evolução do **CalorieSync**, organizando as fases concluídas e os próximos ciclos de desenvolvimento.

---

## 1. Diretrizes de Execução

1. **Desenvolvimento Direto e Focado:** Implementações alinhadas aos requisitos e fórmulas em [docs/SPEC.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/SPEC.md).
2. **Qualidade e Estabilidade:** Toda alteração é acompanhada de verificação via `npm run test`, `npm --prefix frontend test`, `npm run lint` e `npm run build`.
3. **Padrão Brutalista:** Respeito integral aos tokens semânticos e regras de interface em [docs/CORES.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/CORES.md).

---

## 2. Fases Concluídas ✅

- **Fase 0: Fundação e Qualidade:** Monorepo configurado, banco de dados isolado para testes (`contador_calorias_test`), migrações com `node-pg-migrate`, ESLint e CI.
- **Fase 1: Motor Nutricional e Metas:** Fórmulas de TMB (Mifflin-St Jeor / Katch-McArdle), TDEE, pisos calóricos, divisão de macronutrientes e vigência temporal de metas por data.
- **Fase 2: Diário e Estatísticas:** Visão diária, consumo vs. metas, agregações analíticas (`LATERAL JOIN`), médias inteligentes e visualização de macronutrientes.
- **Fase 3: Catálogo de Alimentos em Escala:** Busca tolerante com trigram (`pg_trgm`) e `unaccent`, catálogo protegido e importação de tabelas nutricionais (TACO).
- **Fase 4: Robustez e Performance:** Roteamento com React Router 7, code-splitting por rota com `React.lazy`, compressão HTTP, cache, inserção multi-row e testes de integração de autorização multiusuário.
- **Fase 4.5: Produtividade do Diário:** Navegação histórica por data, cópia rápida de refeições, histórico de recentes/favoritos e refeições prontas/combos salvos.
- **Fase 5: Design Brutalista e Refatoração:** Migração completa para tokens semânticos e CSS variables (Neo-Brutalismo de Tinta), conformidade de acessibilidade (WCAG AA), formulários com `react-hook-form` + Zod e decomposição de componentes.
- **Fase 5.5: Pacote Compartilhado (`shared`):** Contratos DTO, schemas Zod e cálculos matemáticos compartilhados como fonte única entre backend e frontend.

---

## 3. Próximos Ciclos de Desenvolvimento ⏳

### ⏳ Fase 6: Autenticação Avançada e Recuperação de Acesso
- [ ] Confirmação de e-mail em duas etapas (código OTP ou link de verificação).
- [ ] Fluxo de recuperação de senha ("Esqueci minha senha") com envio de e-mail e token temporário assinado (expiração de 30 minutos).
- [ ] Login social (OAuth2 via Google e Apple) integrado à autenticação do backend.
- [ ] Proteção contra automação maliciosa nas rotas públicas de autenticação (ex: Cloudflare Turnstile).

### ⏳ Fase 7: Adequação à LGPD e Privacidade
- [x] Exportação completa e portabilidade dos dados do usuário em JSON.
- [x] Consentimento explícito no cadastro (`terms_accepted_at`) e termos legais.
- [ ] Rotina agendada para expurgo seguro de contas inativas há mais de 2 anos.

### ⏳ Fase 8: Sessão Segura e Observabilidade em Produção
- [ ] Migração de JWT armazenado no cliente para cookies seguros `HttpOnly` com Refresh Tokens rotacionados em banco.
- [x] Habilitação de `trust proxy` e rate limiting por IP + e-mail.
- [x] Content Security Policy (CSP) e cabeçalhos de segurança via Helmet.
- [x] Logging HTTP estruturado com correlation ID (`X-Request-Id`).
- [ ] Monitoramento e rastreamento de erros em tempo real (ex: Sentry).
- [ ] Pipeline automatizado de deploy contínuo (CI/CD).

---

## 4. Backlog de Funcionalidades Futuras

- Aplicativo mobile dedicado em React Native / Expo (consumindo o pacote `@caloriesync/shared`).
- Registro diário de ingestão de água com meta personalizada e progresso visual.
- Leitor de código de barras integrado com a API do Open Food Facts.
- Distribuição de metas nutricionais segmentadas por tipo de refeição (ex: café, almoço, jantar).
