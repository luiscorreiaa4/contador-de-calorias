# ROADMAP.md: guia de desenvolvimento daqui pra frente

Documento vivo. Atualize o status ao fechar cada tarefa. Cada item vira uma tarefa no formato `docs/TASK_TEMPLATE.md`.

## 1. Como trabalhamos (resumo)

1. Uma tarefa por vez, pequena e verificável. Uma sessão nova de IA por tarefa, apoiada em `AGENTS.md` e nos docs.
2. A IA propõe o plano, você aprova, depois ela implementa e se autoverifica (`npm run test`, `lint`, `build`).
3. Você revisa o diff e testa o fluxo real nos marcos (seção 5), não em cada passo.
4. Ao fechar a tarefa: commit atômico e atualização do status do RF em `docs/SPEC.md`.
5. Nenhuma feature nova entra antes da Fase 0 estar concluída.

## 2. O que a auditoria mudou na ordem

- **Segredos no histórico do git** (`JWT_SECRET`, `DB_PASSWORD=1234`): é o primeiro item, antes de tudo.
- **Testes usam banco real sem isolamento**: qualquer feature nova com IA pode apagar seus dados de desenvolvimento. Resolver antes de continuar.
- **Lint falhando (4 erros)**: sem lint verde não há CI confiável.
- **Frontend sem testes**: é o que precisa existir antes do redesign e das mudanças no dashboard.
- **O modelo de dados já tem sexo, data de nascimento, peso, altura, gordura corporal e nível de atividade**, então o cálculo de TMB é viável. Faltam histórico de medidas, metas de carboidrato e gordura e um indicador de meta automática vs. manual.
- **25 testes em ~38 s não é "muito rápido".** Vale investigar (custo do bcrypt, reset de banco por teste), pode estar ligado à lentidão que você sente.

## 3. Decisões assumidas (edite se discordar)

| # | Decisão | Padrão adotado |
|---|---------|----------------|
| 1 | CI | GitHub Actions: lint + test + build a cada push/PR |
| 2 | Migrations | `node-pg-migrate` (SQL puro, sem ORM) |
| 3 | Testes de frontend | Vitest + Testing Library + MSW, consultas por role/label (não por classe CSS) |
| 4 | Base de alimentos | Base própria no Postgres, populada por script de importação (ex.: TACO), sem API externa em tempo de uso |
| 5 | Metas | Sugeridas automaticamente (Mifflin-St Jeor / Katch-McArdle) e **sempre editáveis** |

### Decisões tomadas

- **Repositório público.** Os segredos vazados são tratados como comprometidos: rotação primeiro, limpeza do histórico depois.
- **Catálogo de alimentos é somente leitura para usuários.** Usuários só criam refeições escolhendo alimentos existentes. O catálogo muda apenas por script de importação/migration.
- **Meta diária com histórico.** Cada dia é comparado com a meta que valia naquele dia; médias semanais e mensais são calculadas a partir disso.
- **Fonte dos alimentos:** começar pela TACO (algumas centenas de alimentos, boa para validar o fluxo) e avaliar a TBCA-USP (mais de 3 mil alimentos, segundo material da USP) quando precisar de volume. **Não consegui confirmar os termos de redistribuição de nenhuma das duas**, então o arquivo de dados bruto não entra no repositório público até você confirmar (ex.: e-mail para o NEPA/Unicamp).

### Ainda em aberto

- Onde vai hospedar?
- O campo `sex` aceita só dois valores? Como tratar quem não quer informar?
- Regra das médias (ver 2.3b): só dias com refeição registrada, ou todos os dias do período?

---

## 4. Fases

### Fase 0: Fundação (obrigatória antes de features)

| ID | Tarefa | Status |
|----|--------|--------|
| 0.1 | **Segredos (repo público)**: Rotação de `JWT_SECRET` e `DB_PASSWORD`, `.env.example` criado, fail-fast via Zod, `.env` ignorado no git. | [x] Concluído |
| 0.2 | **Banco de testes isolado**: `contador_calorias_test`, fail-safe no pool abortando processos fora de `_test`. | [x] Concluído |
| 0.3 | **Lint verde**: correção dos 4 erros de linting (`NewMealModal`, `any` em `meal.service.ts`). | [x] Concluído |
| 0.4 | **Segurança básica**: `helmet`, `express-rate-limit` nas rotas de autenticação e CORS restrito via `.env`. | [x] Concluído |
| 0.4b | **Catálogo de alimentos somente-leitura**: rotas de escrita removidas para usuários finais; inserção apenas por script. | [x] Concluído |
| 0.5 | **Migrations**: migração baseline estruturada e padronização com `node-pg-migrate`. | [x] Concluído |
| 0.6 | **CI mínimo**: pipeline GitHub Actions configurado com serviço Postgres (`.github/workflows/ci.yml`). | [x] Concluído |
| 0.7 | **Testes de frontend**: suíte Vitest + RTL + MSW cobrindo Login, Cadastro, NewMealModal e StatsPage. | [x] Concluído |
| 0.8 | **Baseline de performance**: medição inicial de bundle size registrada em `docs/PERFORMANCE_BASELINE.md`. | [x] Concluído |
| 0.9 | Investigação da suíte do backend: suíte isolada rodando com Node Native Test Runner. | [x] Concluído |
| 0.10 | **Padronização de Branding (CalorieSync)**: Padronização da marca em toda a documentação, header, footer e regras. | [x] Concluído |

Pronto da fase: lint, test e build verdes no CI; segredos rotacionados; testes rodam só em banco de teste; naming e branding 100% padronizados.

### Fase 1: Cálculo técnico e metas editáveis (RF-005, RF-004) [Concluída]

Requisito: estimar o gasto a partir do cadastro; permitir metas manuais; poder editar metas e dados corporais a qualquer momento com recálculo.

- [x] **1.0 Fuso horário (pré-requisito do histórico)**: padronizado (`TIMESTAMPTZ` com fuso `America/Sao_Paulo`).
- [x] **1.1 Migration**: tabelas `body_measurements` e `user_goals` com vigência `(user_id, effective_from DATE)`.
- [x] **1.2 Service puro e testado**: `calculateEnergyTargets(profile)` com TMB (Mifflin-St Jeor / Katch-McArdle) e TDEE em `nutrition.service.ts`.
- [x] **1.3 Endpoints**: `/api/users/goals` com leitura e atualização de perfil e metas com histórico.
- [x] **1.4 Tela de perfil/metas**: edição de dados corporais e metas automáticas/manuais em `GoalSettingsCard.tsx`.
- [x] **1.5 Dashboard**: consumo do dia comparado diretamente com a meta vigente.
- [x] **Regra do histórico**: alteração de meta cria nova vigência em `user_goals` a partir de hoje.

### Fase 2: Dashboard enxuto + página de estatísticas [Concluída]

- [x] **2.1** Dashboard enxuto com consumo de hoje vs. meta, barras de macros, refeições e modal de registro.
- [x] **2.2** Página `/estatisticas` (`StatsPage.tsx`) com gráficos de histórico (7 e 30 dias) e distribuição de macros via Recharts.
- [x] **2.3** Backend: `/api/meals/stats` com parâmetros de período e agregação SQL via `LATERAL JOIN`.
- [x] **2.3b Médias**: médias de calorias e macros calculadas considerando apenas os dias com registros.
- [x] **2.4** Testes de UI cobrindo Dashboard e Estatísticas.

### Fase 3: Base de alimentos em escala (centenas a milhares) [Concluída]

- [x] **3.1 Migration**: colunas `source`, `external_id`, `active`, extensões `pg_trgm`, `unaccent` e índice GIN trigram.
- [x] **3.2 Busca no backend**: busca tolerante a acento e caixa com `LIMIT 50`. Catálogo protegido como somente-leitura para usuários.
- [x] **3.3 Frontend**: busca com debounce (~250 ms) no `NewMealModal.tsx`.
- [x] **3.4 Script de importação**: script idempotente `backend/scripts/import-foods.ts` para importação da tabela TACO.

### Fase 4: Passe de performance (guiado por medição)

Primeiro medir, depois mexer. Registrar os números antes e depois.

- Frontend: Lighthouse/Web Vitals, React Query Devtools (refetches excessivos), aba Network (chamadas duplicadas ou pesadas).
- Backend: log do tempo por requisição, `EXPLAIN ANALYZE` nas consultas de `/meals/stats` e listagem de refeições, procurar N+1.
- Candidatos prováveis: code-splitting por rota com `React.lazy` (o build já avisa de chunk > 500 kB), índices (`meal_items(meal_id)`, `meals(user_id, meal_time)`), `staleTime` adequado, custo do bcrypt em ambiente de teste.
- Critério: cada otimização precisa de um número que melhorou.

### Fase 5: Redesign completo do CSS

Só começa com a Fase 0.7 concluída e as telas das fases 1 e 2 estáveis.

1. **Direção visual** primeiro: escolha 2–3 referências e defina o estilo (posso ajudar a montar o briefing).
2. **Design tokens**: cores, tipografia, espaçamento, raios e sombras centralizados no tema do Tailwind/variáveis CSS. Trocar o visual depois vira editar tokens.
3. **Componentes base** (Button, Input, Card, Modal, Select) antes das telas.
4. **Tela por tela**, uma tarefa por tela: Login → Dashboard → Estatísticas → Perfil → demais.
5. Regra: o comportamento não muda. Os testes de UI devem continuar passando (por isso consultas por role/label, não por classe).
6. Verificar contraste, foco de teclado e dark mode em cada tela.

### Fase 6: Profissionalização e Segurança (Padrão Ouro)

O que transforma um projeto pessoal em um SaaS pronto para produção, garantindo segurança, antispam e retenção.

1. **Validação de E-mail (Verificação em 2 Etapas)**: Cadastro gera status `is_verified: false` e envia um código OTP (6 dígitos) ou link de confirmação por e-mail (usando Resend, SendGrid ou AWS SES). Bloqueia acesso até a confirmação.
2. **Social Login (Google & Apple)**: Autenticação rápida e sem senha (OAuth2). *Nota: O Login com a Apple é um requisito obrigatório da App Store caso o app ofereça Login com o Google.* O backend receberá o token nativo (Web/React Native) e validará diretamente com os provedores, gerando nosso JWT em seguida.
3. **Esqueci Minha Senha**: Fluxo completo: usuário digita e-mail -> backend gera token temporário criptografado (validade de 30min) -> envia link por e-mail -> usuário redefine.
4. **Proteção contra Bots (Anti-Spam)**: Implementar Cloudflare Turnstile (invisível e grátis) ou reCAPTCHA nas rotas de Auth (Login, Cadastro, Reset).
5. **Rate Limiting Estrito**: Limitar o número de e-mails enviados por IP para evitar custos inesperados com disparo de e-mails.

### Fase 7: Adequação Legal (LGPD & UX)

Dados de peso, altura, dieta e biometria são considerados **dados sensíveis** pela LGPD. Proteção legal é obrigatória.

1. **Termos de Uso e Políticas de Privacidade**: Criação das páginas públicas. *(Nota: A IA pode gerar a base completa desses documentos para você revisar).*
2. **Aceite Explícito (Opt-in)**: Checkbox no formulário de cadastro, e registro no banco de dados (`terms_accepted_at TIMESTAMPTZ`) comprovando quando o usuário aceitou.
3. **Exportação de Dados**: Opção para o usuário baixar um `.json` ou `.csv` com todo o seu histórico (Right to Portability da LGPD).
4. **Exclusão Transparente**: Garantir que a função atual de "Excluir Perfil" apague definitivamente o registro físico do banco de dados (Right to be Forgotten).

### Fase 8: Prontidão para Escala (Observabilidade e Deploy)

Colocar a aplicação no ar de forma profissional, sabendo o que acontece com ela.

1. **Monitoramento (Error Tracking)**: Integrar **Sentry** (grátis) no Frontend e Backend. Se a tela de um usuário quebrar, você recebe a linha exata do erro no seu e-mail, sem depender dele te avisar.
2. **Analytics e SEO Oculto**: Configuração de meta tags estruturadas para quando o link for compartilhado no WhatsApp/Twitter, e integração com PostHog ou Google Analytics.
3. **Segurança Avançada de Sessão (HTTP-Only Cookies)**: Mudar o JWT que hoje fica vulnerável no LocalStorage para Cookies HTTP-Only + Refresh Token. (Previne ataques de XSS onde extensões do navegador roubam o token).
4. **Pipeline de CI/CD Completo**: Configurar o GitHub Actions para fazer deploy automático a cada push na main (ex: Vercel/Netlify para frontend, Render/Railway para Node+Postgres).

---

## 5. Onde a IA vai sozinha e onde você entra

| Autonomia alta (você confere no fim) | Seu checkpoint obrigatório |
|---|---|
| Services puros com testes, refactors cobertos por teste, correções de lint, componentes de UI com teste | Migrations, autenticação/segurança, fórmulas de saúde, importação de dados em massa, qualquer `DELETE`/`DROP`, mudanças de CI e dependências |

## 6. Ciclo de cada tarefa

1. Preencher `docs/TASK_TEMPLATE.md` (peça à IA um rascunho e você ajusta).
2. Sessão nova: a IA lê `AGENTS.md`, `docs/SPEC.md` e a tarefa, e **propõe o plano sem codar**.
3. Você aprova o plano. Implementação com testes (nos pontos críticos, testes primeiro).
4. A IA roda `test`, `lint`, `build` e só então reporta.
5. Você revisa o diff e testa o fluxo real.
6. Commit atômico + atualizar status do RF no `docs/SPEC.md` + remover o item resolvido do `docs/TECH_DEBT.md`.

### Prompt para iniciar uma tarefa

```markdown
Leia AGENTS.md, docs/SPEC.md, docs/ARCHITECTURE.md e docs/ROADMAP.md.
Tarefa: [ID e descrição do ROADMAP]. Critérios de aceite: [cole].
Primeiro, proponha um plano curto (arquivos a mudar, riscos, testes a escrever) e PARE para minha aprovação. Não escreva código ainda.
Depois de aprovado: implemente, rode test/lint/build e reporte o resultado real.
Não mexa em nada fora do escopo. Se algo estiver ambíguo, pergunte.
```

### Primeira tarefa (0.1, segredos)

````markdown
Tarefa 0.1. NÃO reescreva o histórico do git e NÃO apague nada do banco.
1. Crie .env.example com todas as variáveis necessárias e valores fictícios.
2. Confirme que .env está no .gitignore e que não está rastreado (se estiver, git rm --cached).
3. Adicione validação das variáveis de ambiente com Zod no backend, falhando ao iniciar se faltar algo ou se JWT_SECRET tiver menos de 32 caracteres.
4. Liste, sem executar, os passos manuais para eu rotacionar DB_PASSWORD e JWT_SECRET.
Proponha o plano antes de alterar arquivos.
````

## 7. Backlog (sem prioridade ainda)

- Recuperação de senha (exige serviço de e-mail e rota no backend)
- Refresh token em cookie HTTP-only (hoje o JWT dura 7 dias)
- LGPD: dados de saúde são dados sensíveis; revisar consentimento, política de privacidade e exportação/exclusão de dados (a exclusão de conta já existe)
- Favoritos, alimentos recentes, refeições salvas/modelos
- Hospedagem e deploy automatizado
- Repo público: adicionar `LICENSE` e `README` (e reavaliar se `TECH_DEBT.md` deve ficar público enquanto houver falhas de segurança abertas)
- Logs estruturados e monitoramento de erros
- **[Futuro] Engajamento e Retenção**: Notificações Push (ex: lembrar de registrar refeição) via Firebase ou OneSignal (foco no React Native).
- **[Futuro] Monetização**: Integração de propagandas (Ads) ou funcionalidades premium.

## 8. Manutenção dos documentos

- `docs/SPEC.md`: atualizar o status do RF ao fechar cada tarefa.
- `docs/TECH_DEBT.md`: remover o que foi resolvido, acrescentar o que for descoberto.
- `docs/ARCHITECTURE.md`: atualizar o diagrama ER a cada migration.
- `AGENTS.md`: manter na raiz como fonte única de diretrizes e regras dos agentes especialistas do workspace.
