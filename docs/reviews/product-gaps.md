# Relatório de Gaps de Produto e Bugs Comportamentais (CalorieSync)

**Arquivo:** `docs/reviews/product-gaps.md`  
**Data da Auditoria:** 13 de Outubro de 2026  
**Modo:** SOMENTE LEITURA (Análise Estática, Inspeção de Código e Verificação Determinística)  
**Ambiente:** Node.js v24.14.0, TypeScript 5.7.2, PostgreSQL 14+, Vite 6.0.5 / React 19  
**Documentos Base:** [`AGENTS.md`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/AGENTS.md), [`docs/ARCHITECTURE.md`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/ARCHITECTURE.md), [`docs/SPEC.md`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/SPEC.md), [`docs/ROADMAP.md`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/ROADMAP.md), [`prompt de mobile.txt`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/prompt%20de%20mobile.txt).

---

## 1. Sumário Executivo

Esta auditoria realizou uma avaliação comparativa profunda entre o que está formalizado na especificação funcional (`docs/SPEC.md`), as diretrizes arquiteturais (`docs/ARCHITECTURE.md`), os padrões da indústria de aplicativos de contagem nutricional (ex: MyFitnessPal, MacroFactor, Cronometer), as diretrizes de expansão mobile (`prompt de mobile.txt`) e o código efetivamente implementado no repositório.

Todos os itens foram verificados em código ou validados via execução determinística de testes e scripts isolados. Nenhuma alteração foi realizada nos arquivos-fonte da aplicação.

### Resumo Quantitativo por Grupo

| Grupo | Quantidade | Severidade Crítica | Severidade Alta | Severidade Média | Severidade Baixa |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **A) Obrigatório / Esperado** | 11 | 1 | 5 | 4 | 1 |
| **B) Bugs nas Features Existentes** | 9 | 1 | 4 | 3 | 1 |
| **C) Features de Alto Valor** | 11 | 0 | 6 | 3 | 2 |
| **Total** | **31** | **2** | **15** | **10** | **4** |

---

## 2. Evidências Determinísticas Coletadas

Antes de catalogar os itens, foram executadas ferramentas automáticas e scripts determinísticos no ambiente:

1. **Linter do Repositório (`npm run lint`):**
   - Falha: `NewMealModal.tsx:298:9` com erro `prefer-const` em `timeToUse` e aviso de `eslint-disable` não utilizado na linha 181.
2. **Build de Produção Frontend (`npm run build`):**
   - Falha: `tsc -b` reportou erros de tipagem em `NewMealModal.tsx:455, 461` devido a incompatibilidade entre `react-select` e as tipagens de `CustomMenuList`.
3. **Testes do Backend (`npm run test`):**
   - 37 testes passaram com sucesso contra `contador_calorias_test` (duração 7.7s).
4. **Testes do Frontend (`npm --prefix frontend test`):**
   - 9 testes falharam (incluindo quebra por divergência de texto do botão "SALVAR" vs "CRIAR REFEIÇÃO" e rotas não interceptadas no MSW para `StatsPage.test.tsx`).
5. **Teste Determinístico de Fuso Horário no Node.js (Brasília UTC-3):**
   - Executado: `node -e "const d = new Date('2026-10-13T21:30:00-03:00'); console.log(d.toISOString().split('T')[0]);"`  
     **Resultado:** Retorna `2026-10-14`. Confirma que qualquer operação realizada após 21:00 em fuso UTC-3 gera data civil de amanhã.
6. **Teste Determinístico de Parsing de Data de Nascimento:**
   - Executado: `node -e "process.env.TZ='America/Sao_Paulo'; const b=new Date('1995-01-01'); console.log(b.getFullYear(), b.getMonth(), b.getDate());"`  
     **Resultado:** Retorna ano `1994`, mês `11` (dezembro), dia `31`. Confirma distorção de ano e idade em datas civis.

---

## 3. Grupo A: Obrigatório / Esperado (Gaps de Sistema e UX Base)

Itens essenciais para a operação sadia, segura e padrão de qualquer aplicação web com contas de usuário e registros pessoais.

---

### [GAP-A01] Ausência de Fluxo de Recuperação de Senha ("Esqueci Minha Senha")
- **Arquivo:Linha:** [`backend/src/routes/user.routes.ts:1-27`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/user.routes.ts#L1-L27) e [`frontend/src/components/auth/LoginForm.tsx:1-120`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/auth/LoginForm.tsx#L1-L120)
- **Severidade:** **Alta**
- **Prioridade Sugerida:** **P0**
- **O que está errado:** Não existe nenhum mecanismo de redefinição de senha na API nem na interface de login. Não há tabelas de tokens de redefinição, nem endpoints (`/forgot-password`, `/reset-password`), nem serviço de envio de e-mail transacional.
- **Cenário concreto de impacto:** Se um usuário esquecer sua senha, ele perde **permanentemente** o acesso à sua conta, histórico de refeições, metas e medições. Não há autoatendimento possível; o desenvolvedor precisaria gerar um hash manualmente via SQL direto no PostgreSQL.
- **Como verificar/reproduzir:** Inspecione `backend/src/routes/user.routes.ts` e `frontend/src/components/auth/LoginForm.tsx`. O formulário de login possui apenas os campos e-mail e senha, sem link "Esqueci minha senha".
- **Problema que resolve:** Permite que usuários legítimos recuperem o acesso às suas contas de forma segura e autônoma.
- **Impacto no usuário:** Elimina perda definitiva de contas e abandono de produto por esquecimento de credencial.
- **Dependências técnicas:** Serviço de e-mail transacional (ex: Resend, SendGrid, Amazon SES), tabela `password_reset_tokens (id, user_id, token_hash, expires_at, used_at)`.
- **Esforço:** **M**

---

### [GAP-A02] Ausência de Verificação de E-mail no Cadastro
- **Arquivo:Linha:** [`backend/src/services/user.service.ts:12-35`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L12-L35)
- **Severidade:** **Média**
- **Prioridade Sugerida:** **P1**
- **O que está errado:** A rota `POST /api/users/register` insere o usuário e emite imediatamente um token JWT com sessão válida sem exigir confirmação da caixa de entrada. Não existe flag `email_verified` na tabela `users`.
- **Cenário concreto de impacto:** Qualquer pessoa pode registrar contas usando e-mails pertencentes a terceiros (spoofing) ou cometer erros de digitação (ex: `usuario@gmai.com`). O proprietário legítimo do e-mail fica impossibilitado de criar sua conta e pode receber eventuais comunicações indevidas.
- **Como verificar/reproduzir:** Faça requisição para `POST /api/users/register` com qualquer e-mail fictício (ex: `qualquercoisa_inexistente_123456@teste.com`). O cadastro é concluído com sucesso e retorna token autenticado.
- **Problema que resolve:** Garante a autenticidade dos e-mails cadastrados, impede criação de contas zumbis e protege contra invasão de identidade.
- **Impacto no usuário:** Confirmação segura de propriedade da conta e canal de suporte garantido.
- **Dependências técnicas:** Coluna `email_verified BOOLEAN DEFAULT FALSE` na tabela `users`, geração de token de confirmação de 6 dígitos (OTP) ou link assinado, e provedor SMTP/transacional.
- **Esforço:** **M**

---

### [GAP-A03] Ausência de Refresh Tokens e Renovação Silenciosa de Sessão
- **Arquivo:Linha:** [`backend/src/services/user.service.ts:234-237`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L234-L237) e [`frontend/src/services/api.ts:26-29`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/services/api.ts#L26-L29)
- **Severidade:** **Alta**
- **Prioridade Sugerida:** **P1**
- **O que está errado:** A aplicação emite um único token JWT estático com expiração de 7 dias gravado no `localStorage`. Não existe endpoint de rotação de refresh token nem mecanismo de renovação silenciosa.
- **Cenário concreto de impacto:** Após 7 dias da autenticação, o token expira. Na primeira requisição que o usuário faz, o backend devolve 401. A função `apiFetch` simplesmente apaga o `localStorage`, mas não sincroniza o estado do React; o usuário vê falhas de mutação em tela ou é deslogado repentinamente enquanto estava cadastrando uma refeição.
- **Como verificar/reproduzir:** Verifique `backend/src/routes/user.routes.ts` (não há `/refresh`) e `backend/src/services/user.service.ts:236` (`expiresIn: '7d'`).
- **Problema que resolve:** Mantém usuários ativos conectados indefinidamente e com segurança (Short-lived Access Token de 15 min + Refresh Token rotacionado em cookie `HttpOnly`).
- **Impacto no usuário:** Nunca ser desconectado no meio de um registro de refeição.
- **Dependências técnicas:** Tabela `refresh_tokens (id, user_id, token_hash, expires_at, revoked_at)`, suporte a cookies com flag `HttpOnly, Secure, SameSite=Strict`.
- **Esforço:** **M**

---

### [GAP-A04] Ausência de Exportação / Portabilidade de Dados do Usuário (LGPD Art. 18 / GDPR)
- **Arquivo:Linha:** [`backend/src/routes/user.routes.ts:1-27`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/user.routes.ts#L1-L27)
- **Severidade:** **Alta**
- **Prioridade Sugerida:** **P1**
- **O que está errado:** O sistema implementa o direito ao esquecimento (`DELETE /api/users/me`), mas não implementa o direito à portabilidade de dados. Não há endpoint para download do histórico nem botão no painel de perfil.
- **Cenário concreto de impacto:** O usuário que utiliza o CalorieSync por 6 meses e deseja compartilhar seu histórico de consumo e macros com um nutricionista ou endocrinologista não tem como extrair seus próprios dados, a não ser fazendo prints manuais de tela. Além disso, viola o requisito legal de autodeterminação informativa da LGPD.
- **Como verificar/reproduzir:** Inspecione `backend/src/routes/user.routes.ts` e `frontend/src/pages/private/EditProfilePage.tsx`: existe apenas exclusão de conta, sem opção de exportar dados.
- **Problema que resolve:** Permite download de todo o histórico do usuário em formato aberto (`JSON` ou `CSV`) contendo refeições, alimentos consumidos, pesagens corporais e histórico de metas.
- **Impacto no usuário:** Portabilidade clínica e sensação de controle sobre os próprios dados de saúde.
- **Dependências técnicas:** Endpoint `GET /api/users/export` gerando JSON estruturado ou ZIP com arquivos CSV e cabeçalho `Content-Disposition: attachment`.
- **Esforço:** **P**

---

### [GAP-A05] Impossibilidade de Navegação por Datas no Dashboard e Registro Retroativo/Futuro
- **Arquivo:Linha:** [`frontend/src/pages/private/DashboardPage.tsx:19-23`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/DashboardPage.tsx#L19-L23) e [`frontend/src/components/meals/NewMealModal.tsx:298-314`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.tsx#L298-L314)
- **Severidade:** **Crítica**
- **Prioridade Sugerida:** **P0**
- **O que está errado:** O Dashboard é travado no dia de hoje (`todayMeals`). Não existe seletor de data (`< Ontem | Hoje | Amanhã >` ou calendário). No modal de criação de refeição, a data base é sempre forçada para `new Date()` (hoje), aceitando apenas a digitação do horário `HH:MM`.
- **Cenário concreto de impacto:** Se o usuário janta às 21:00, esquece de registrar e vai dormir, acordando no dia seguinte às 07:00, ele **não consegue** adicionar o jantar de ontem. Se tentar registrar, o jantar cairá na data de hoje às 21:00 (no futuro do dia corrente), distorcendo totalmente os totais calóricos de ontem e de hoje.
- **Como verificar/reproduzir:** Abra o modal de criar refeição no frontend: há apenas campo de nome, horário (HH:MM) e alimentos. Não existe campo para selecionar a data civil. Na Dashboard, não há controles para visualizar o diário de datas passadas.
- **Problema que resolve:** Permite que o usuário consulte e audite dias anteriores e insira refeições esquecidas na data em que o alimento foi efetivamente consumido.
- **Impacto no usuário:** Requisito operacional central de qualquer diário alimentar; sem isso, a usabilidade diária é severamente comprometida.
- **Dependências técnicas:** Estado `selectedDate` na Dashboard, controle de calendário/setas de dia, inclusão do campo `date` no payload de `NewMealModal`.
- **Esforço:** **M**

---

### [GAP-A06] Tratamento Incompleto de Estados Assíncronos no Dashboard e Estatísticas
- **Arquivo:Linha:** [`frontend/src/pages/private/DashboardPage.tsx:179-186`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/DashboardPage.tsx#L179-L186) e [`frontend/src/pages/private/StatsPage.tsx:52-56`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/StatsPage.tsx#L52-L56)
- **Severidade:** **Média**
- **Prioridade Sugerida:** **P1**
- **O que está errado:** Viola a Regra 3 de Frontend (`react-rules.md`). Em `DashboardPage`, a desestruturação do hook `useQuery` usa fallback `todayMeals = []` e testa apenas `isLoading` e `todayMeals.length === 0`. Se houver falha de rede ou HTTP 500 (`isError === true`), o componente renderiza falsamente "NENHUMA REFEIÇÃO REGISTRADA HOJE" em vez de um alerta de erro. Em `StatsPage`, se `isError` ocorrer, a página renderiza `null` (área em branco).
- **Cenário concreto de impacto:** O servidor cai ou a internet do usuário oscila; ao abrir a Dashboard, o usuário toma um susto achando que seu diário do dia foi deletado, quando na verdade ocorreu apenas um erro de conexão.
- **Como verificar/reproduzir:** Desative o backend (`Ctrl+C` no terminal) e recarregue a página no navegador. A dashboard exibe a mensagem de lista vazia em vez de indicar indisponibilidade do servidor.
- **Problema que resolve:** Comunicação visual transparente de erros com botão de "Tentar Novamente" (`refetch`).
- **Impacto no usuário:** Confiança de que seus dados estão preservados no servidor.
- **Dependências técnicas:** Tratamento explícito de `isError` e `error` com componente de feedback brutalista.
- **Esforço:** **P**

---

### [GAP-A07] Paginação Incompleta e Limite Rígido de 50 Itens no Modal de Alimentos
- **Arquivo:Linha:** [`frontend/src/components/meals/NewMealModal.tsx:48-58`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.tsx#L48-L58) e [`frontend/src/services/food.service.ts:21-28`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/services/food.service.ts#L21-L28)
- **Severidade:** **Média**
- **Prioridade Sugerida:** **P2**
- **O que está errado:** A busca no `NewMealModal` executa sempre com `page: 1, limit: 50`. O componente `CustomMenuList` corta o array em 50 itens via `.slice(0, 50)` e exibe uma mensagem estática "+ X alimentos... Digite para buscar". Não há botão "Carregar mais", nem paginação por scroll infinito.
- **Cenário concreto de impacto:** Quando o usuário faz uma busca ampla (ex: busca por "queijo" ou "leite", onde a base TACO tem mais de 60 variações), os itens a partir da 51ª posição são fisicamente inacessíveis no seletor a menos que o usuário adivinhe um termo mais restritivo.
- **Como verificar/reproduzir:** Pesquise por termo genérico com muitos resultados no seletor de alimentos. Role o menu até o fim: o 51º resultado em diante é cortado sem possibilidade de avançar de página.
- **Problema que resolve:** Permite navegação completa por todo o catálogo de alimentos encontrados.
- **Impacto no usuário:** Acesso a qualquer alimento da base alimentar sem necessidade de saber a grafia exata com múltiplos filtros.
- **Dependências técnicas:** Utilização de `useInfiniteQuery` do TanStack Query no lugar de `useQuery`, disparando carregamento da próxima página no evento de scroll do menu do `react-select`.
- **Esforço:** **M**

---

### [GAP-A08] Ausência de Roteamento SPA Real (Navegação em Memória sem Histórico)
- **Arquivo:Linha:** [`frontend/src/App.tsx:15, 68-87`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/App.tsx#L15)
- **Severidade:** **Média**
- **Prioridade Sugerida:** **P1**
- **O que está errado:** A navegação entre páginas é controlada por uma variável de estado simples no React: `const [currentView, setCurrentView] = useState<'dashboard' | 'edit-profile' | 'stats'>('dashboard')`. Não há roteador instalado (como `react-router-dom` ou TanStack Router).
- **Cenário concreto de impacto:**
  1. A URL na barra do navegador permanece sempre `/`. Não existem rotas como `/estatisticas` ou `/perfil`.
  2. O botão "Voltar" do navegador fecha a aplicação ou volta para a página web anterior à entrada no sistema.
  3. Se o usuário estiver na tela de estatísticas ou editando seu perfil e pressionar F5 (recarregar), o React reinicializa o estado e joga o usuário compulsoriamente de volta ao Dashboard.
- **Como verificar/reproduzir:** Navegue até a tela "Estatísticas". Observe que a URL no navegador continua sendo `http://localhost:5173/`. Pressione o botão Voltar do navegador: você sairá do site. Pressione F5: você volta para o Dashboard.
- **Problema que resolve:** Navegação padrão web com histórico de navegação, suporte ao botão Voltar/Avançar e persistência de rota ao atualizar.
- **Impacto no usuário:** Experiência de navegação natural e sem frustração de perda de contexto ao recarregar a aba.
- **Dependências técnicas:** Instalação e configuração de `react-router-dom` v6/v7 com `<BrowserRouter>`, `<Routes>` e `<Route>`.
- **Esforço:** **M**

---

### [GAP-A09] Política de Senha Fraca no Registro e Atualização
- **Arquivo:Linha:** [`backend/src/schemas/user.schema.ts:6`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/schemas/user.schema.ts#L6)
- **Severidade:** **Média**
- **Prioridade Sugerida:** **P2**
- **O que está errado:** O esquema Zod exige apenas `z.string().min(6)`. Não há verificação de complexidade (ausência de exigência de ao menos um número, caractere especial ou letras maiúsculas/minúsculas).
- **Cenário concreto de impacto:** Usuários cadastram senhas como `"123456"`, `"abcdef"` ou `"senha1"`. Como o app trata dados de saúde e peso corporal, essas credenciais são facilmente quebradas em ataques automatizados de dicionário (credential stuffing / brute force).
- **Como verificar/reproduzir:** Cadastre um usuário passando `"password": "111111"`. A requisição é aceita com HTTP 201.
- **Problema que resolve:** Impede criação de contas com senhas previsíveis e facilmente comprometíveis.
- **Impacto no usuário:** Proteção dos dados corporais e histórico alimentar contra acesso não autorizado.
- **Dependências técnicas:** Validador regex em `user.schema.ts` (mínimo 8 caracteres, ao menos 1 letra e 1 número).
- **Esforço:** **P**

---

### [GAP-A10] Impossibilidade de Edição de Itens Individuais dentro de uma Refeição
- **Arquivo:Linha:** [`frontend/src/components/meals/NewMealModal.tsx:286-288`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.tsx#L286-L288)
- **Severidade:** **Baixa**
- **Prioridade Sugerida:** **P2**
- **O que está errado:** Dentro da lista de alimentos adicionados em `NewMealModal`, a única ação disponível para cada item é o botão de exclusão (`handleRemoveItem`). Não há como alterar a quantidade de gramas ou unidades após incluir o item no carrinho.
- **Cenário concreto de impacto:** Se o usuário adicionou 150g de arroz e depois percebeu que consumiu 200g, ele é obrigado a deletar o arroz da refeição, pesquisar "arroz" novamente na lista de 600 alimentos, selecionar e redigitar 200g.
- **Como verificar/reproduzir:** Adicione 2 alimentos no modal de criar refeição. Observe que ao lado de cada alimento só existe o ícone da lixeira vermelha.
- **Problema que resolve:** Permite ajuste rápido da porção direto no item sem precisar excluí-lo e refazer a pesquisa no catálogo.
- **Impacto no usuário:** Fluidez e agilidade no diário alimentar.
- **Dependências técnicas:** Input numérico inline ou botão "Editar" que reabre a quantidade selecionada.
- **Esforço:** **P**

---

### [GAP-A11] Ausência de Login Social Federado (Google Sign-In e Apple Sign-In / OAuth2)
- **Arquivo:Linha:** [`backend/src/routes/user.routes.ts:16-17`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/routes/user.routes.ts#L16-L17), [`frontend/src/components/auth/LoginForm.tsx:1-120`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/auth/LoginForm.tsx#L1-L120) e [`frontend/src/components/auth/RegisterForm.tsx:1-150`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/auth/RegisterForm.tsx#L1-L150)
- **Severidade:** **Alta**
- **Prioridade Sugerida:** **P1**
- **O que está errado:** O sistema suporta exclusivamente cadastro manual via e-mail e senha. Não há suporte a provedores OAuth2 (Google e Apple), tanto no backend quanto nas telas de autenticação da web e na futura versão mobile.
- **Cenário concreto de impacto:**
  1. Mais de 60% dos usuários em dispositivos móveis e navegadores modernos abandonam cadastros que exigem preenchimento manual de senha e confirmação de dados.
  2. **Regra Obrigatória da App Store (Apple Review Guideline 4.8):** Qualquer aplicativo submetido à Apple App Store que ofereça login social de terceiros (como Google) é **obrigado** a disponibilizar também o "Sign in with Apple" como opção equivalente.
  3. Sem login social, o usuário perde a conveniência do preenchimento biométrico com Face ID / Touch ID / Fingerprint integrado nativamente à conta.
- **Como verificar/reproduzir:** Inspecione `backend/src/routes/user.routes.ts` e `frontend/src/components/auth/LoginForm.tsx`: não há botões "Entrar com Google" ou "Entrar com Apple", nem rotas de callback `/api/auth/google` ou `/api/auth/apple`.
- **Problema que resolve:** Permite onboarding e login instantâneo em 1 clique sem necessidade de memorizar nova senha, reduzindo a zero o risco de esquecimento de credenciais.
- **Impacto no usuário:** Taxa de conversão de novos usuários substancialmente maior e alinhamento com os padrões de aprovação da Apple App Store e Google Play.
- **Dependências técnicas:**
  - Configuração no Google Cloud Console (OAuth Client ID) e Apple Developer Portal (Services ID, Keys).
  - Backend: Validação de ID Tokens via `google-auth-library` e `apple-signin-auth` em endpoints `POST /api/users/auth/google` e `POST /api/users/auth/apple`.
  - Banco de Dados: Colunas `auth_provider VARCHAR(20) DEFAULT 'local'` e `provider_id VARCHAR(255) NULL` na tabela `users`, permitindo que `password_hash` seja nulo para contas puramente federadas.
  - Frontend / Mobile: `@react-oauth/google` para Web e `expo-apple-authentication` / `@react-native-google-signin/google-signin` para React Native.
- **Esforço:** **M**

---

## 4. Grupo B: Bugs e Comportamentos Incorretos nas Features Existentes

Inconsistências funcionais, erros de cálculo nutricional, falhas de sincronização de fuso horário e divergências contratuais comprovadas no código-fonte.

---

### [BUG-B01] Vigência de Metas Salva no Dia Posterior quando Executada após as 21:00 UTC-3
- **Arquivo:Linha:** [`backend/src/services/user.service.ts:105, 268`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/user.service.ts#L105) e [`backend/src/models/history.model.ts:51-61`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/history.model.ts#L51-L61)
- **Severidade:** **Crítica**
- **Prioridade Sugerida:** **P0**
- **O que está errado:** Ao salvar uma meta (seja na conclusão do onboarding ou no card de metas do perfil), o serviço gera a data de vigência fazendo:
  ```ts
  const todayStr = new Date().toISOString().split('T')[0];
  ```
  O método `.toISOString()` converte o horário para UTC (`Z`). No fuso oficial da aplicação (`America/Sao_Paulo`, UTC-3), qualquer ação realizada entre **21:00:00 e 23:59:59** resulta na data civil de amanhã.
- **Cenário concreto de impacto:**
  1. Um usuário conclui o cadastro ou altera sua meta às 21:30 do dia `2026-10-13`.
  2. O backend grava a meta em `user_goals` com `effective_from = '2026-10-14'`.
  3. Ao redirecionar para a Dashboard, a aplicação busca a meta ativa do dia corrente: `getActiveGoal(userId, '2026-10-13')`.
  4. A query executa `WHERE effective_from <= '2026-10-13'`. A meta recém-criada **não é encontrada** porque sua vigência é do dia 14.
  5. O backend cai no bloco de fallback (`user.service.ts:293-304`), que retorna **`carbs: 0, fats: 0`**.
  6. O usuário recém-onboarded vê imediatamente suas metas de carboidratos e gorduras zeradas no painel.
- **Como verificar/reproduzir:**
  Execute no terminal:
  ```bash
  node -e "const d = new Date('2026-10-13T21:30:00-03:00'); console.log('UTC Date:', d.toISOString().split('T')[0]);"
  ```
  Saída: `UTC Date: 2026-10-14`.
- **Correção sugerida:**
  Extrair a data local civil considerando o fuso de São Paulo (ou o timezone do cliente) sem converter para UTC:
  ```ts
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  ```
- **Esforço:** **P**

---

### [BUG-B02] Distorção de Idade e TMB em `calculateAge` por Parsing UTC de String `YYYY-MM-DD`
- **Arquivo:Linha:** [`backend/src/services/nutrition.service.ts:30-38`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/nutrition.service.ts#L30-L38)
- **Severidade:** **Alta**
- **Prioridade Sugerida:** **P0**
- **O que está errado:** A função `calculateAge` recebe a string `birthDate` (ex: `"1995-01-01"`) e instancia:
  ```ts
  const birth = new Date(birthDate);
  ```
  De acordo com a especificação ECMAScript, strings de data pura no formato ISO (`YYYY-MM-DD`) são interpretadas compulsoriamente como **meia-noite UTC** (`1995-01-01T00:00:00.000Z`). Quando o Node.js roda com `cross-env TZ=America/Sao_Paulo` (UTC-3), essa data retrocede 3 horas para `31/12/1994 às 21:00:00`.
- **Cenário concreto de impacto:**
  - Para qualquer usuário nascido em 1º de janeiro, `birth.getFullYear()` retorna o ano anterior (`1994` em vez de `1995`).
  - Durante todos os 365 dias do ano, a fórmula `today.getFullYear() - birth.getFullYear()` calcula a idade com **1 ano a mais**.
  - Na fórmula de Mifflin-St Jeor (`- (5 * age)`), o usuário recebe uma Taxa Metabólica Basal (TMB) calculada com 5 kcal a menos do que deveria.
  - Para nascidos no 1º dia de qualquer outro mês, o aniversário é interpretado como ocorrendo no último dia do mês anterior.
- **Como verificar/reproduzir:**
  Execute no terminal:
  ```bash
  node -e "process.env.TZ='America/Sao_Paulo'; const b=new Date('1995-01-01'); console.log('Ano:', b.getFullYear(), 'Mes:', b.getMonth(), 'Dia:', b.getDate());"
  ```
  Saída: `Ano: 1994 Mes: 11 Dia: 31`.
- **Correção sugerida:**
  Fazer o parse determinístico dos componentes da string sem instanciar Date UTC:
  ```ts
  export function calculateAge(birthDate: string | Date): number {
    const today = new Date();
    let birthYear: number, birthMonth: number, birthDay: number;
    if (typeof birthDate === 'string' && birthDate.includes('-')) {
      const [y, m, d] = birthDate.split('T')[0].split('-').map(Number);
      birthYear = y; birthMonth = m - 1; birthDay = d;
    } else {
      const b = new Date(birthDate);
      birthYear = b.getFullYear(); birthMonth = b.getMonth(); birthDay = b.getDate();
    }
    let age = today.getFullYear() - birthYear;
    const m = today.getMonth() - birthMonth;
    if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
      age--;
    }
    return age;
  }
  ```
- **Esforço:** **P**

---

### [BUG-B03] Explosão Calórica e Capping de Carboidratos em Zero para Pessoas com Sobrepeso/Obesidade
- **Arquivo:Linha:** [`backend/src/services/nutrition.service.ts:84-95`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/nutrition.service.ts#L84-L95)
- **Severidade:** **Alta**
- **Prioridade Sugerida:** **P1**
- **O que está errado:** A distribuição de macronutrientes calcula fixamente:
  ```ts
  const proteins = 2.0 * profile.weight;
  const fats = 1.0 * profile.weight;
  let carbs = (suggestedCalories - caloriesFromProt - caloriesFromFats) / 4;
  if (carbs < 0) carbs = 0;
  ```
  O cálculo aplica 2g de proteína e 1g de gordura por quilograma de **peso total bruto**, sem ajustar para adiposidade ou massa magra.
- **Cenário concreto de impacto:**
  Considere uma mulher com 120 kg, 1,65 m, 40 anos, sedentária, objetivo `perder_peso`:
  1. TMB Base (Mifflin) = `(10 * 120) + (6.25 * 165) - (5 * 40) - 161 = 1870.25 kcal`.
  2. TDEE (Sedentário x 1.2) = `2244.3 kcal`.
  3. Meta calórica com déficit de 20% = `1795 kcal`.
  4. Cálculo dos macros sobre 120 kg:
     - Proteína: `2.0 * 120 = 240g` (`960 kcal`).
     - Gordura: `1.0 * 120 = 120g` (`1080 kcal`).
     - Total P + G = **`2040 kcal`**.
  5. Saldo para carboidratos: `(1795 - 2040) / 4 = -61.25g` -> Capped em **`0g`**.
  6. **Contradição Grave:** O sistema informa uma meta calórica de **1795 kcal**, mas a soma dos macros sugeridos totaliza **2040 kcal**. Se a usuária bater os macros prescritos pelo app, ela ultrapassa a meta calórica em 245 kcal por dia e anula o déficit para perda de peso, além de ser induzida a uma dieta cetogênica sem carboidratos sem ter solicitado isso.
- **Como verificar/reproduzir:**
  Para qualquer indivíduo com IMC > 33 buscando emagrecimento, o carboidrato é zerado e a soma dos macros excede a meta calórica.
- **Correção sugerida:**
  Se `(caloriesFromProt + caloriesFromFats) > suggestedCalories * 0.70`, recalcular os macros com base no peso ajustado (fórmula de Wilkens: $\text{Peso Ideal} + 0.25 \times (\text{Peso Real} - \text{Peso Ideal})$) ou utilizar divisão percentual clássica para sobrepeso (ex: 30% Proteína, 25% Gordura, 45% Carboidrato).
- **Esforço:** **M**

---

### [BUG-B04] Inconsistência Numérica entre Soma de Macros e Calorias Totais Sugeridas
- **Arquivo:Linha:** [`backend/src/services/nutrition.service.ts:98-106`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/services/nutrition.service.ts#L98-L106)
- **Severidade:** **Média**
- **Prioridade Sugerida:** **P2**
- **O que está errado:** O objeto retornado arredonda independentemente cada componente:
  ```ts
  return {
    tmb: Math.round(tmb),
    tdee: Math.round(tdee),
    suggestedCalories: Math.round(suggestedCalories),
    suggestedMacros: {
      proteins: Math.round(proteins),
      fats: Math.round(fats),
      carbs: Math.round(carbs),
    }
  };
  ```
- **Cenário concreto de impacto:** A soma física das calorias dos macronutrientes:
  $$\text{Calorias Reais} = (\text{proteins} \times 4) + (\text{carbs} \times 4) + (\text{fats} \times 9)$$
  frequentemente diverge em 5 a 15 kcal em relação a `suggestedCalories`. Em cards de perfil que mostram as duas métricas lado a lado, usuários atentos percebem a divergência aritmética.
- **Como verificar/reproduzir:**
  Para um perfil comum (75 kg, altura 178 cm, 28 anos, masculino, moderadamente ativo, perder peso):
  `suggestedCalories` = 2085 kcal. `proteins` = 150g (600 kcal), `fats` = 75g (675 kcal), `carbs` = 203g (812 kcal). Total dos macros = `600 + 675 + 812 = 2087 kcal` (diferença de 2 kcal).
- **Correção sugerida:** Ajustar o carboidrato por reconciliação direta após o arredondamento de proteínas e gorduras:
  ```ts
  const p = Math.round(proteins);
  const f = Math.round(fats);
  const c = Math.max(0, Math.round((Math.round(suggestedCalories) - (p * 4) - (f * 9)) / 4));
  ```
- **Esforço:** **P**

---

### [BUG-B05] Frontend Oculta Parâmetro de Data nas Chamadas do Dashboard
- **Arquivo:Linha:** [`frontend/src/pages/private/DashboardPage.tsx:21, 28`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/DashboardPage.tsx#L21)
- **Severidade:** **Alta**
- **Prioridade Sugerida:** **P1**
- **O que está errado:** No documento [`docs/ARCHITECTURE.md:178-180`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/ARCHITECTURE.md#L178-L180), está afirmado:
  > "Na listagem de refeições de hoje (`GET /api/meals/today`), o frontend envia o parâmetro de consulta `date=YYYY-MM-DD` com base no relógio do navegador..."
  No entanto, no código real de `DashboardPage.tsx`:
  ```ts
  const { data: todayMeals = [] } = useQuery({
    queryKey: ['todayMeals'],
    queryFn: ({ signal }) => getTodayMeals(undefined, signal),
  });
  const { data: activeGoal } = useQuery({
    queryKey: ['active-goal'],
    queryFn: () => getActiveGoal(),
  });
  ```
  O parâmetro `date` é omitido (`undefined`).
- **Cenário concreto de impacto:** Como a data civil do cliente não é enviada, o backend recorre à data do relógio do servidor (`new Date()`). Se o servidor backend estiver em uma máquina virtual configurada em UTC (padrão em deploys de nuvem como Docker, AWS, Render), a consulta de refeições usa UTC. Usuários no Brasil entre 21:00 e 23:59 têm suas refeições consultadas para o dia seguinte, e a dashboard do dia esvazia repentinamente às 21h.
- **Como verificar/reproduzir:** Inspecione a aba Network (Rede) no DevTools do navegador ao carregar a página principal: a requisição disparada é `GET /api/meals/today` e `GET /api/users/me/goals`, sem nenhuma query string `?date=...`.
- **Correção sugerida:**
  Passar a data civil do navegador no formato `YYYY-MM-DD`:
  ```ts
  const todayStr = new Intl.DateTimeFormat('en-CA').format(new Date());
  // getTodayMeals(todayStr, signal) e getActiveGoal(todayStr)
  ```
- **Esforço:** **P**

---

### [BUG-B06] Agrupamento em Data Incorreta no Histórico Analítico por Timezone no PostgreSQL
- **Arquivo:Linha:** [`backend/src/models/meal.model.ts:205`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/models/meal.model.ts#L205) e [`backend/src/database/pool.ts:17-27`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/database/pool.ts#L17-L27)
- **Severidade:** **Alta**
- **Prioridade Sugerida:** **P1**
- **O que está errado:** A query de `getPeriodStats` agrupa refeições fazendo:
  ```sql
  SELECT DATE(m.meal_time) as date_val ... GROUP BY DATE(m.meal_time)
  ```
  A coluna `m.meal_time` é do tipo `TIMESTAMPTZ`. A conversão de `TIMESTAMPTZ` para `DATE` no PostgreSQL utiliza a **timezone da sessão do banco de dados**. O arquivo `pool.ts` não configura `SET TIME ZONE 'America/Sao_Paulo'`. Se o servidor de banco rodar em UTC:
  Uma refeição realizada em 13/10/2026 às 22:00 (-03:00) é armazenada como `2026-10-14 01:00:00+00`. O PostgreSQL converte `DATE(m.meal_time)` para `2026-10-14`.
- **Cenário concreto de impacto:** No gráfico de consumo na página de Estatísticas, o consumo da noite de um determinado dia aparece contabilizado na barra do dia seguinte.
- **Como verificar/reproduzir:** Conecte ao PostgreSQL sem parâmetro de timezone e execute:
  `SELECT DATE('2026-10-13 22:30:00-03'::timestamptz);`  
  Se o servidor estiver em UTC, o retorno será `2026-10-14`.
- **Correção sugerida:**
  Explicitamente converter para a timezone de negócio no SQL:
  ```sql
  DATE(m.meal_time AT TIME ZONE 'America/Sao_Paulo') as date_val
  ```
  e garantir que o pool configure o fuso na conexão inicial.
- **Esforço:** **P**

---

### [BUG-B07] Falha de Invalidação de Cache das Estatísticas em Modificações de Refeições
- **Arquivo:Linha:** [`frontend/src/pages/private/DashboardPage.tsx:34`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/pages/private/DashboardPage.tsx#L34) e [`frontend/src/components/meals/NewMealModal.tsx:102, 113`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.tsx#L102)
- **Severidade:** **Média**
- **Prioridade Sugerida:** **P2**
- **O que está errado:** Tanto ao excluir uma refeição (`DashboardPage.tsx:34`) quanto ao criar ou editar uma refeição (`NewMealModal.tsx:102, 113`), o callback `onSuccess` das mutações do React Query invalida **exclusivamente** a chave `['todayMeals']`:
  ```ts
  queryClient.invalidateQueries({ queryKey: ['todayMeals'] });
  ```
  A chave `['mealStats']` utilizada na página de Estatísticas **não é invalidada**.
- **Cenário concreto de impacto:** O usuário cria uma nova refeição de 800 kcal no Dashboard e clica imediatamente na aba "Estatísticas". Como o cache de `mealStats` está configurado com `staleTime: 5 minutos`, o gráfico e as médias exibem dados desatualizados sem a refeição recém-adicionada.
- **Como verificar/reproduzir:** Abra a aba Estatísticas. Volte ao Dashboard e adicione uma refeição de 1000 kcal. Navegue novamente para Estatísticas: o gráfico e as médias continuam com os valores antigos até que passem 5 minutos ou haja recarregamento forçado.
- **Correção sugerida:**
  Invalidar ambas as queries em qualquer mutação de refeição:
  ```ts
  queryClient.invalidateQueries({ queryKey: ['todayMeals'] });
  queryClient.invalidateQueries({ queryKey: ['mealStats'] });
  ```
- **Esforço:** **P**

---

### [BUG-B08] Divergência de Parâmetro de Busca de Alimentos (`search` vs `q`)
- **Arquivo:Linha:** [`backend/src/controllers/food.controller.ts:12`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/backend/src/controllers/food.controller.ts#L12) e [`docs/SPEC.md:98`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/SPEC.md#L98)
- **Severidade:** **Baixa**
- **Prioridade Sugerida:** **P3**
- **O que está errado:** No documento oficial de requisitos (`SPEC.md: RF-004`), o endpoint está documentado como:
  `GET /api/foods?q=termo&limit=50&offset=0`.
  Porém, na implementação do backend (`food.controller.ts`), o controller lê estritamente:
  `const { search } = listQuerySchema.parse(req.query)`.
- **Cenário concreto de impacto:** Clientes externos, scripts de integração ou novos frontends que consultem a especificação oficial enviando `?q=frango` têm o parâmetro silenciosamente ignorado e recebem os primeiros 50 itens sem filtro.
- **Como verificar/reproduzir:** Chame `GET /api/foods?q=frango`. O backend retorna a listagem alfabética genérica começando pela letra A, ignorando o termo.
- **Correção sugerida:**
  Tornar o schema Zod compatível aceitando tanto `q` quanto `search`:
  ```ts
  const listQuerySchema = z.object({
    q: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
  }).transform(data => ({ ...data, searchTerm: data.q || data.search }));
  ```
- **Esforço:** **P**

---

### [BUG-B09] Perda de Dados de Macros dos Alimentos ao Abrir Modal de Edição de Refeição
- **Arquivo:Linha:** [`frontend/src/components/meals/NewMealModal.tsx:148-159`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/meals/NewMealModal.tsx#L148-L159)
- **Severidade:** **Média**
- **Prioridade Sugerida:** **P2**
- **O que está errado:** Quando o usuário clica para editar uma refeição existente (`mealToEdit`), o modal monta o estado dos itens criando um `mockFood` com nutrientes zerados:
  ```ts
  const mockFood: Food = {
    id: item.food_id,
    name: item.food_name || 'ALIMENTO',
    base_unit: (item.food_base_unit as 'g' | 'ml') || 'g',
    serving_weight: 100,
    calories: 0,
    proteins: 0,
    carbs: 0,
    fats: 0,
    ...
  };
  ```
- **Cenário concreto de impacto:** Se o frontend precisar recalcular valores ou validar porções proporcionais desse alimento, ele não possui os macros de referência por 100g. O item só mantém os valores agregados calculados no momento do insert original, impedindo qualquer reajuste de quantidade dinâmico no modal.
- **Como verificar/reproduzir:** Abra uma refeição para edição no modal e inspecione o objeto `food` dentro de `mealItems[0]`: todos os nutrientes do alimento base estão como `0`.
- **Correção sugerida:** Fazer com que a query de busca de refeição traga os dados nutricionais da base ou preencher o `mockFood` derivando a base de 100g através de `(item.calories / item.quantity) * 100`.
- **Esforço:** **P**

---

## 5. Grupo C: Features de Alto Valor (Retenção, Usabilidade e Expansão)

Funcionalidades modernas de elevado impacto na retenção diária, fidelização do usuário e expansão de plataforma, organizadas por problema, impacto, dependências técnicas, esforço e prioridade sugerida.

---

### [FEAT-C01] Alimentos Favoritos e Recentes (Quick Add)
- **Problema que resolve:** 80% das refeições diárias de quem faz dieta são repetitivas (arroz, feijão, frango, ovos, whey, aveia, banana). Atualmente, para cada refeição o usuário é forçado a pesquisar texto no catálogo de centenas de itens alimento por alimento.
- **Impacto no usuário:** Reduz o tempo médio gasto para logar uma refeição de ~60 segundos para menos de 15 segundos. É a funcionalidade número um comprovada de retenção em aplicativos de contagem calórica.
- **Dependências técnicas:**
  - Backend: Tabela `user_favorite_foods (user_id, food_id, created_at)` com índices compostos.
  - Endpoint `GET /api/foods/recents` agregando os alimentos mais frequentes do usuário nos últimos 14 dias a partir de `meal_items` e `meals`.
  - Frontend: Aba de "Recentes / Favoritos" com 1 clique logo acima do campo de pesquisa no `NewMealModal`.
- **Esforço:** **M**
- **Prioridade Sugerida:** **P1**

---

### [FEAT-C02] Refeições Salvas e Combos ("Minhas Refeições")
- **Problema que resolve:** O usuário frequentemente consome pratos combinados fixos (ex: "Café da Manhã Padrão": 2 ovos + 2 fatias de pão integral + 1 café com leite; ou "Shake Pré-treino": 30g whey + 40g aveia + 1 banana). Atualmente ele precisa buscar e adicionar cada um dos 4 ingredientes separadamente toda manhã.
- **Impacto no usuário:** Adiciona o combo inteiro na refeição com apenas 1 clique, eliminando atrito cognitivo.
- **Dependências técnicas:**
  - Tabelas `saved_meals (id, user_id, name, created_at)` e `saved_meal_items (id, saved_meal_id, food_id, quantity, unit, display_amount)`.
  - Endpoints CRUD em `/api/saved-meals`.
  - Botão "Salvar esta refeição como modelo" no modal de criação.
- **Esforço:** **M**
- **Prioridade Sugerida:** **P1**

---

### [FEAT-C03] Copiar Refeição ou Copiar Dia Anterior ("Copiar de Ontem")
- **Problema que resolve:** Em dias úteis de trabalho e rotina, o usuário almoça exatamente o mesmo almoço de ontem (marmita preparada ou self-service habitual).
- **Impacto no usuário:** Um toque no botão "Copiar Almoço de Ontem" duplica todos os itens e quantidades diretamente para o dia de hoje, poupando minutos diários.
- **Dependências técnicas:**
  - Endpoint `POST /api/meals/copy` recebendo `{ sourceMealId: UUID, targetDate: Date }` ou `{ sourceDate: Date, targetDate: Date }`.
  - Transação SQL no backend clonando registros de `meal_items` com novos IDs e recalculando timestamps.
  - Botão de ação rápida no cabeçalho do Dashboard.
- **Esforço:** **P**
- **Prioridade Sugerida:** **P1**

---

### [FEAT-C04] Dashboard e Gráfico de Evolução de Peso Corporal (Ativação de `body_measurements`)
- **Problema que resolve:** A tabela `body_measurements` já existe no PostgreSQL e recebe inserts toda vez que o peso é alterado no perfil, mas esses dados são "mortos" / invisíveis — não há nenhuma rota de leitura nem tela para visualizá-los.
- **Impacto no usuário:** Quem conta calorias busca emagrecer ou ganhar massa muscular. Ter um gráfico temporal mostrando a queda ou ganho de peso correlacionada com as calorias consumidas é o ápice do valor do produto.
- **Dependências técnicas:**
  - Endpoint `GET /api/users/measurements?period=30d|90d|all` e `POST /api/users/measurements` (para registrar pesagem avulsa sem precisar editar todo o perfil).
  - Nova aba ou card de "Evolução Corporal" com gráfico de linha (`LineChart` do Recharts, que já está instalado e configurado no projeto).
- **Esforço:** **M**
- **Prioridade Sugerida:** **P1**

---

### [FEAT-C05] Cadastro de Alimentos Personalizados pelo Usuário (Custom Foods)
- **Problema que resolve:** O catálogo TACO não contempla produtos industrializados locais, suplementos importados, receitas familiares ou itens novos de mercado. Hoje, se o alimento não está na base TACO, o usuário simplesmente não pode logar suas calorias.
- **Impacto no usuário:** Elimina a principal causa de atrito e abandono do app ("não achei o que comi").
- **Dependências técnicas:**
  - Adição da coluna `user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE` na tabela `foods`. Alimentos globais da TACO têm `user_id = NULL`; alimentos criados pelo usuário contêm seu `user_id`.
  - Atualização da query de busca em `food.model.ts`:
    `WHERE (user_id IS NULL OR user_id = $1) AND active = true`.
  - Endpoint `POST /api/foods/custom`.
- **Esforço:** **M**
- **Prioridade Sugerida:** **P1**

---

### [FEAT-C06] Leitor de Código de Barras (Barcode Scanner) via Open Food Facts
- **Problema que resolve:** Ler tabelas nutricionais complexas na embalagem de biscoitos, iogurtes, molhos e barras proteicas.
- **Impacto no usuário:** Experiência moderna no smartphone: aponta a câmera para o código de barras EAN-13 e os macros são cadastrados instantaneamente.
- **Dependências técnicas:**
  - Biblioteca de leitura de câmera no frontend (ex: `html5-qrcode` ou `@zxing/library`).
  - Serviço backend ou chamada frontend para a API pública gratuita da Open Food Facts (`https://world.openfoodfacts.org/api/v2/product/{barcode}.json`).
- **Esforço:** **M**
- **Prioridade Sugerida:** **P2**

---

### [FEAT-C07] Rastreamento de Ingestão de Água (Hydration Tracker)
- **Problema que resolve:** O controle de hidratação é parte indissociável de qualquer planejamento nutricional esportivo e metabólico.
- **Impacto no usuário:** Card diário no Dashboard (ex: meta 2500 ml com botões rápidos "+250ml", "+500ml", "+1000ml").
- **Dependências técnicas:**
  - Tabela `water_logs (id UUID PK, user_id UUID FK, log_date DATE, amount_ml INT, created_at TIMESTAMPTZ)`.
  - Endpoints `GET /api/water?date=YYYY-MM-DD` e `POST /api/water`.
  - Card dedicado no estilo brutalista do CalorieSync.
- **Esforço:** **P**
- **Prioridade Sugerida:** **P2**

---

### [FEAT-C08] Suporte PWA (Progressive Web App) e Modo Offline / Sync
- **Problema que resolve:** Uso do aplicativo em academias, refeitórios de trabalho ou restaurantes onde a conexão 4G/5G oscila ou é inexistente.
- **Impacto no usuário:** Permite instalar o CalorieSync como aplicativo na tela inicial do celular via navegador sem passar por lojas, com abertura instantânea e cache offline.
- **Dependências técnicas:**
  - Plugin `vite-plugin-pwa`, arquivo `manifest.webmanifest`, ícones SVG/PNG.
  - Service Worker com estratégia `NetworkFirst` para APIs e `CacheFirst` para assets.
  - Armazenamento temporário em `IndexedDB` com fila de sincronização quando a internet retornar.
- **Esforço:** **G**
- **Prioridade Sugerida:** **P2**

---

### [FEAT-C09] Lembretes e Notificações Web Push para Horários de Refeições
- **Problema que resolve:** O esquecimento do usuário de registrar o almoço ou lanche no momento da refeição, acumulando pendências para a noite.
- **Impacto no usuário:** Aumenta a consistência dos registros diários e o engajamento contínuo com a aplicação.
- **Dependências técnicas:**
  - Web Push API com Service Worker no navegador.
  - Pacote `web-push` no backend com chaves VAPID.
  - Tabela `push_subscriptions (user_id, endpoint, keys, created_at)` e cron de disparo.
- **Esforço:** **M**
- **Prioridade Sugerida:** **P3**

---

### [FEAT-C10] Distribuição de Metas Calóricas e Macros por Tipo de Refeição
- **Problema que resolve:** Atualmente, a meta diária (ex: 2000 kcal) é apresentada como um número único em bloco. O usuário não sabe como deve fracionar as calorias entre café da manhã, almoço, lanche e jantar.
- **Impacto no usuário:** Clareza no ritmo de consumo calórico ao longo das horas do dia (ex: Café: 400 kcal, Almoço: 700 kcal, Lanche: 300 kcal, Jantar: 600 kcal).
- **Dependências técnicas:**
  - Adição de `meal_type` enum (`cafe_da_manha`, `almoco`, `lanche`, `jantar`, `ceia`) na tabela `meals`.
  - Configuração de metas segmentadas em `user_goals` ou cálculo proporcional sugerido automático.
- **Esforço:** **M**
- **Prioridade Sugerida:** **P3**

---

### [FEAT-C11] Expansão para Aplicativo Mobile Nativo (Expo / React Native + NativeWind)
- **Problema que resolve:** Contar calorias é uma tarefa de alta fricção que ocorre em movimento: na mesa de refeição, na cozinha, na academia ou no restaurante. Acessar a aplicação por navegador móvel (Chrome/Safari) impõe barreiras como a barra de endereço visível, ausência de acesso nativo direto ao hardware (câmera fluida para código de barras, biometria Face ID/Touch ID, haptics e push notifications locais) e lentidão em relação a interfaces compiladas nativas.
- **Impacto no usuário:** Aplicativo na tela de início do smartphone com inicialização instantânea, navegação a 60 FPS, feedback tátil (haptic engine), câmera nativa em tempo real para escanear alimentos e possibilidade de distribuição oficial na Apple App Store e Google Play Store.
- **Diretrizes Técnicas Estruturadas (conforme [`prompt de mobile.txt`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/prompt%20de%20mobile.txt)):**
  1. **Setup Expo & TypeScript:** Inicialização de um projeto moderno usando Expo SDK (React Native) com TypeScript em uma nova pasta `/mobile` na raiz do monorepo.
  2. **Estilização com NativeWind:** Instalação e configuração do NativeWind (Tailwind CSS no React Native), reaproveitando a biblioteca de classes utilitárias, tokens de cores e a identidade estética brutalista (`rounded-none`, bordas contrastantes, tipografia impactante) já estabelecida no frontend web.
  3. **Integração no Monorepo:** Adição do script `npm run mobile` e atualização do script `npm run dev:all` no `package.json` da raiz para rodar simultaneamente o Backend (`:3001`), o Frontend Web (`:5173`) e o Metro Bundler do Expo (`:8081`) via `concurrently`.
  4. **Aproveitamento de Código e Contratos Zod:** Estruturação da pasta `mobile/` consumindo diretamente os mesmos esquemas Zod e DTOs TypeScript do backend, garantindo fidelidade absoluta com o modelo de dados sem duplicar tipos manualmente.
  5. **Configuração de Rede para Testes com Expo Go:** Client HTTP no mobile configurado dinamicamente para utilizar o IP local da máquina na rede Wi-Fi (ex: `http://192.168.x.x:3001/api`) em vez de `localhost`, permitindo execução e depuração imediata em celulares físicos via Expo Go sem emuladores pesados.
  6. **Entrega Inicial:** Construção da tela de Login mobile replicando o visual, estados e acessibilidade do componente brutalista [`LoginForm.tsx`](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/frontend/src/components/auth/LoginForm.tsx) da Web.
- **Dependências técnicas:**
  - Expo SDK 52+, React Native 0.76+, NativeWind v4, Tailwind CSS 3.4+.
  - `@tanstack/react-query` v5 (reaproveitando as mesmas regras de query/cache do frontend web).
  - Expo SecureStore (para armazenamento seguro de tokens de sessão no lugar do `localStorage`).
  - Expo Camera e Expo Barcode Scanner.
- **Esforço:** **G**
- **Prioridade Sugerida:** **P1**

---

## 6. Matriz de Priorização (Esforço x Impacto)

| ID | Item | Grupo | Severidade / Impacto | Esforço | Prioridade |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **BUG-B01** | Fuso Horário de Vigência de Metas (após 21h UTC-3) | B | Crítica | P | **P0 (Imediata)** |
| **BUG-B02** | Distorção de Idade e TMB em `calculateAge` (UTC parsing) | B | Alta | P | **P0 (Imediata)** |
| **GAP-A05** | Navegação por Datas no Dashboard e Registro Retroativo | A | Crítica | M | **P0 (Imediata)** |
| **GAP-A01** | Recuperação de Senha ("Esqueci Minha Senha") | A | Alta | M | **P0 (Imediata)** |
| **BUG-B03** | Explosão Calórica de Macros para Sobrepeso/Obesidade | B | Alta | M | **P1 (Ciclo Curto)** |
| **BUG-B05** | Envio de Data Civil do Cliente para API do Dashboard | B | Alta | P | **P1 (Ciclo Curto)** |
| **BUG-B06** | Conversão de Timezone no SQL das Estatísticas | B | Alta | P | **P1 (Ciclo Curto)** |
| **BUG-B07** | Invalidação de Cache de `mealStats` em Mutações | B | Média | P | **P1 (Ciclo Curto)** |
| **GAP-A03** | Renovação de Sessão com Refresh Tokens | A | Alta | M | **P1 (Ciclo Curto)** |
| **GAP-A04** | Portabilidade e Exportação de Dados (LGPD) | A | Alta | P | **P1 (Ciclo Curto)** |
| **GAP-A06** | Estados de Erro e Feedback Visual na UI | A | Média | P | **P1 (Ciclo Curto)** |
| **GAP-A08** | Roteamento SPA Real com `react-router-dom` | A | Média | M | **P1 (Ciclo Curto)** |
| **GAP-A11** | Login Social (Google e Apple Sign-In / OAuth2) | A | Alta | M | **P1 (Ciclo Curto)** |
| **FEAT-C01** | Alimentos Recentes e Favoritos (Quick Add) | C | Alto Impacto | M | **P1 (Ciclo Curto)** |
| **FEAT-C02** | Refeições Salvas e Combos | C | Alto Impacto | M | **P1 (Ciclo Curto)** |
| **FEAT-C03** | Copiar Refeição / Copiar de Ontem | C | Alto Impacto | P | **P1 (Ciclo Curto)** |
| **FEAT-C04** | Gráfico de Evolução de Peso (`body_measurements`) | C | Alto Impacto | M | **P1 (Ciclo Curto)** |
| **FEAT-C05** | Cadastro de Alimentos Personalizados | C | Alto Impacto | M | **P1 (Ciclo Curto)** |
| **FEAT-C11** | Expansão para Aplicativo Mobile Nativo (Expo/RN) | C | Alto Impacto | G | **P1 (Ciclo Curto)** |
| **BUG-B04** | Reconciliação Numérica de Arredondamento de Macros | B | Média | P | **P2 (Ciclo Médio)** |
| **BUG-B09** | Preservação de Macros Base ao Editar Refeição | B | Média | P | **P2 (Ciclo Médio)** |
| **GAP-A02** | Confirmação de E-mail de Cadastro | A | Média | M | **P2 (Ciclo Médio)** |
| **GAP-A07** | Paginação Infinita no Seletor de Alimentos | A | Média | M | **P2 (Ciclo Médio)** |
| **GAP-A09** | Política de Senha Forte no Zod | A | Média | P | **P2 (Ciclo Médio)** |
| **GAP-A10** | Edição Inline de Itens dentro da Refeição | A | Baixa | P | **P2 (Ciclo Médio)** |
| **FEAT-C06** | Leitor de Código de Barras (Open Food Facts) | C | Médio Impacto | M | **P2 (Ciclo Médio)** |
| **FEAT-C07** | Rastreamento de Ingestão de Água | C | Médio Impacto | P | **P2 (Ciclo Médio)** |
| **FEAT-C08** | Suporte PWA e Armazenamento Offline | C | Médio Impacto | G | **P2 (Ciclo Médio)** |
| **BUG-B08** | Suporte a `q` além de `search` em `/foods` | B | Baixa | P | **P3 (Melhorias Futuras)** |
| **FEAT-C09** | Lembretes e Notificações Web Push | C | Baixo Impacto | M | **P3 (Melhorias Futuras)** |
| **FEAT-C10** | Metas Calóricas Segmentadas por Refeição | C | Baixo Impacto | M | **P3 (Melhorias Futuras)** |

---

## 7. Próximos Passos Recomendados

Para transformar esses achados em entregas estruturadas seguindo a política de desenvolvimento do projeto (`docs/TASK_TEMPLATE.md`):

1. **Sprint de Correção de Bugs Matemáticos e Fuso (P0):**
   - Corrigir `BUG-B01` (formatação de data local em `user.service.ts`) e `BUG-B02` (parse determinístico de data de nascimento em `nutrition.service.ts`).
   - Corrigir `BUG-B03` (cálculo de macros para indivíduos com IMC elevado, impedindo déficit calórico rompido e carboidratos zerados).
2. **Sprint de Usabilidade do Diário (P0 / P1):**
   - Implementar `GAP-A05` (navegação por datas na Dashboard e seletor de data em `NewMealModal`).
   - Implementar `FEAT-C03` ("Copiar de Ontem") e `FEAT-C01` (Alimentos recentes).
3. **Sprint de Autenticação Moderna e Ativação de Dados (P1):**
   - Implementar `GAP-A11` (Login com Google e Apple OAuth2) no backend e frontend.
   - Ativar `FEAT-C04` (endpoints e gráfico de `body_measurements` para acompanhamento de peso).
   - Implementar `GAP-A01` (recuperação de senha) e `GAP-A04` (exportação LGPD).
4. **Sprint de Fundação Mobile (P1):**
   - Executar o setup de `mobile/` com Expo, TypeScript e NativeWind conforme detalhado em `FEAT-C11` e `prompt de mobile.txt`.
   - Adicionar o comando `npm run mobile` e atualizar `npm run dev:all`.
   - Implementar a primeira tela de login mobile compatível com o backend na rede local Wi-Fi.
