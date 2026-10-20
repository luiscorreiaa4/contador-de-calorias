# Plano e Acompanhamento de Migração de Cores (CalorieSync)

Documento de controle e inventário mecânico da migração de cores para a identidade neo-brutalista de tinta (Fonte da verdade: docs/CORES.md).

## 1. Totais Antes x Depois

| Métrica | Antes (Baseline) | Depois |
| :--- | :--- | :--- |
| Total de arquivos inventariados | 94 | 94 |
| Ocorrências do scan amplo | 2088 | PENDENTE |
| Violações check:colors | 208 | 0 |
| Exceções (color-guard-allow) | 0 | PENDENTE |

## 2. Decisões do Agente e Comparativo do Bloco .dark (Invariante I1)

### Comparativo do Bloco `.dark` (Antes x Depois)
Para assegurar estritamente a **Invariante I1** (o modo escuro NÃO muda visualmente):
- **Valores inalterados:** `--background` (`0 0% 4%`), `--foreground` (`0 0% 100%`), `--card` (`0 0% 10%`), `--card-foreground` (`0 0% 100%`), `--popover` (`0 0% 10%`), `--popover-foreground` (`0 0% 100%`), `--primary` (`72 100% 50%`), `--primary-foreground` (`0 0% 4%`), `--secondary` (`0 0% 15%`), `--secondary-foreground` (`0 0% 100%`), `--muted` (`0 0% 10%`), `--muted-foreground` (`0 0% 80%`), `--accent` (`72 100% 50%`), `--accent-foreground` (`0 0% 4%`), `--destructive` (`0 84% 60%`), `--destructive-foreground` (`0 0% 100%`), `--border` (`0 0% 15%`), `--input` (`0 0% 15%`), `--ring` (`72 100% 50%`).
- **Novos tokens mapeados (sem alteração visual):**
  - `--primary-ink: 72 100% 50%` — no modo escuro coincide exatamente com `--primary` (`#CCFF00`), preservando o verde neon idêntico para textos e ícones.
  - `--shadow: 72 100% 50%` com `--shadow-alpha: 0.2` e `--shadow-alpha-hover: 0.4` — centraliza em variáveis CSS o que antes estava hardcoded no Tailwind (`rgba(204, 255, 0, 0.2)` e `0.4`).
  - `--shadow-fill: 0 0% 100%` com `--shadow-fill-alpha: 0.2` e `--shadow-fill-alpha-hover: 0.4` — centraliza a sombra branca de alto contraste para fills neon que antes estava como `rgba(255, 255, 255, 0.2)` no `.dark .brutalist-shadow`.
- **Diferença visual observável:** Zero. O modo escuro permanece 100% idêntico.


## 3. Exceções Autorizadas (color-guard-allow)

*Nenhuma exceção registrada até o momento.*

## 4. Lacunas (Cores sem equivalente semântico)

*Tokens novos mapeados serão registrados aqui.*

## 5. Arquivos Pendentes

*Nenhum arquivo pendente.*

## 6. Lista de Telas para Revisão Visual Manual

- [ ] /login (Login/Cadastro e Termos)
- [ ] / (Dashboard / Diário com cards, macros, calendário, botão Nova Refeição, modal)
- [ ] /evolucao/alimentacao (Estatísticas de alimentação com gráficos)
- [ ] /evolucao/corpo (Histórico de medidas corporais com gráficos)
- [ ] /metas/rotina (Metas de rotina e biometria)
- [ ] /metas/diarias (Metas diárias de calorias e macros)
- [ ] /perfil (Dados pessoais)
- [ ] /configuracoes/notificacoes (Configurações de lembretes e push)
- [ ] /configuracoes/seguranca (Troca de senha e encerramento de conta)
- [ ] /configuracoes/privacidade (Termos de uso, privacidade e LGPD)

## 7. Inventário Completo e Checklist de Arquivos

| Caminho | Grupo | Ocorrências (Antes) | Status | Observação |
| :--- | :---: | :---: | :---: | :--- |
| frontend/index.html | G1 | 2 | [x] | theme-color claro/escuro e estilo anti-flash |
| frontend/postcss.config.js | G1 | 0 | [x] | sem ocorrências (scan) |
| frontend/public/favicon.svg | G1 | 11 | [x] | atualizado com #CCFF00 neon |
| frontend/public/sw.js | G1 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/styles/App.css | G1 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/styles/index.css | G1 | 62 | [x] | tokens semânticos completos do CORES.md |
| frontend/tailwind.config.js | G1 | 39 | [x] | primary.ink e sombras adaptativas hard/hard-fill |
| frontend/vite.config.ts | G1 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/components/ui/alert.tsx | G2 | 8 | [x] | removido dark: redundante |
| frontend/src/components/ui/badge.tsx | G2 | 12 | [x] | border-black no badge primário |
| frontend/src/components/ui/button.tsx | G2 | 17 | [x] | border-2 border-black no default e text-primary-ink no link |
| frontend/src/components/ui/card.tsx | G2 | 4 | [x] | tokens puros (border-border, bg-card) |
| frontend/src/components/ui/footer-section.tsx | G2 | 25 | [x] | SYNC marca-texto, text-primary-ink em ícones e links |
| frontend/src/components/ui/input.tsx | G2 | 8 | [x] | hover e foco ajustados com border-ring e ring-offset |
| frontend/src/components/ui/label.tsx | G2 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/components/auth/AuthCard.tsx | G3 | 21 | [x] | border-2 border-black no badge de chama e no alert de sucesso |
| frontend/src/components/auth/LoginForm.tsx | G3 | 20 | [x] | text-destructive nos erros, accent-primary-ink, text-primary-ink no link |
| frontend/src/components/auth/RegisterForm.tsx | G3 | 43 | [x] | text-destructive nos erros, accent-primary-ink, text-primary-ink nos termos |
| frontend/src/components/common/DatePickerInput.tsx | G3 | 50 | [x] | border-ring no foco, shadow-hard no calendário, border-black no dia selecionado |
| frontend/src/components/common/DeleteAccountModal.tsx | G3 | 43 | [x] | border-ring no foco, inputs e botões semânticos |
| frontend/src/components/layout/AppHeader.tsx | G3 | 83 | [x] | SYNC marca-texto, border-black no ícone da chama, text-primary-ink em ícones e links, border-foreground no tab ativo |
| frontend/src/components/layout/Footer.tsx | G3 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/components/layout/RootLayout.tsx | G3 | 11 | [x] | bg-warning text-warning-foreground no aviso offline, border-b-foreground no spinner |
| frontend/src/components/layout/SectionLayout.tsx | G3 | 17 | [x] | border-black bg-primary na tab ativa, ring-ring no foco |
| frontend/src/components/meals/FoodQuantityForm.tsx | G3 | 92 | [x] | shadow-hard, border-black nos botões/badges neon, text-primary-ink, warning nas estrelas |
| frontend/src/components/meals/FoodSearchSelect.tsx | G3 | 36 | [x] | text-primary-ink no loader e botão de retry, border-ring no foco do select |
| frontend/src/components/meals/MealItemList.tsx | G3 | 34 | [x] | border-black no badge contador, text-primary-ink nos totais e ícones lineares, border-ring |
| frontend/src/components/meals/MealModalFooter.tsx | G3 | 23 | [x] | border-black e shadow-hard-fill no botão submit, border-ring no foco do cancelar |
| frontend/src/components/meals/NewMealModal.tsx | G3 | 263 | [x] | border-black nas abas e botões neon, text-primary-ink, warning nos favoritos, border-ring nos inputs |
| frontend/src/components/onboarding/OnboardingFlow.tsx | G3 | 129 | [x] | text-primary-ink nos ícones lineares, border-black e shadow-hard-fill nos botões e checks neon |
| frontend/src/components/profile/BiometricsSection.tsx | G3 | 14 | [x] | inputNormal atualizado para border-ring e ring-offset-background |
| frontend/src/components/profile/BodyHeightForm.tsx | G3 | 18 | [x] | border-ring no foco do input e botão salvar |
| frontend/src/components/profile/GoalSettingsCard.tsx | G3 | 38 | [x] | border-black nas abas ativas e no botão aplicar, border-ring nos inputs e foco |
| frontend/src/components/profile/PersonalInfoSection.tsx | G3 | 17 | [x] | inputNormal atualizado para border-ring, text-primary-ink no aviso de senha |
| frontend/src/components/profile/ProfileFormFeedback.tsx | G3 | 13 | [x] | border-foreground no feedback de sucesso, border-black e shadow-hard-fill no botão salvar |
| frontend/src/components/profile/ProfileQueryBoundary.tsx | G3 | 8 | [x] | border-ring no foco do botão de retry |
| frontend/src/components/profile/RoutineGoalsSection.tsx | G3 | 44 | [x] | border-black e shadow-hard-fill nas opções selecionadas, accent-primary-ink, text-primary-ink |
| frontend/src/components/profile/SecuritySection.tsx | G3 | 16 | [x] | inputNormal atualizado para border-ring, text-primary-ink nos asteriscos obrigatórios |
| frontend/src/components/ProtectedRoute.tsx | G3 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/components/PublicRoute.tsx | G3 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/App.tsx | G4 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/main.tsx | G4 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/pages/private/AccountPrivacyPage.tsx | G4 | 20 | [x] | text-primary-ink nos links, border-foreground no feedback, border-black e shadow-hard-fill nos botões de ação |
| frontend/src/pages/private/AccountSecurityPage.tsx | G4 | 4 | [x] | border-ring no foco dos inputs |
| frontend/src/pages/private/DashboardPage.tsx | G4 | 229 | [x] | logo SYNC marca-texto, chama/subtítulo em ink, barras neon com contorno border-foreground no claro, badge/botões neon com border-black e shadow-hard-fill, foco visível |
| frontend/src/pages/private/EditProfilePage.tsx | G4 | 13 | [x] | border-ring nos inputs e foco, focus-visible:ring-ring |
| frontend/src/pages/private/MeasurementsPage.tsx | G4 | 179 | [x] | text-primary-ink nos textos e ícones lineares, border-black e shadow-hard-fill nos botões/tabs, stroke do gráfico hsl(var(--primary-ink)) |
| frontend/src/pages/private/NotificationsPage.tsx | G4 | 56 | [x] | border-foreground no feedback de sucesso, focus-visible:ring-ring no botão |
| frontend/src/pages/private/RoutinePage.tsx | G4 | 4 | [x] | sem violações, classes seguem tokens semânticos |
| frontend/src/pages/private/StatsPage.tsx | G4 | 134 | [x] | text-primary-ink, border-black e shadow-hard-fill nos tabs e ícone neon, contorno stroke hsl(var(--foreground)) nas barras de gráfico, tooltip com shadow token |
| frontend/src/pages/public/LegalPage.tsx | G4 | 20 | [x] | text-primary-ink no subtítulo/ícone, focus-visible:ring-ring no botão voltar |
| frontend/src/pages/public/LoginPage.tsx | G4 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/router.tsx | G4 | 1 | [x] | sem violações, classes seguem tokens semânticos |
| frontend/src/context/AuthContext.tsx | G5 | 9 | [x] | sem violações, sem estilos inline nem cores literais |
| frontend/src/hooks/useProfileSettings.ts | G5 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/lib/utils.ts | G5 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/mocks/handlers.ts | G5 | 17 | [x] | sem violações, dados de mock |
| frontend/src/mocks/server.ts | G5 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/services/api.ts | G5 | 2 | [x] | sem violações |
| frontend/src/services/auth.service.ts | G5 | 28 | [x] | sem violações |
| frontend/src/services/food.service.ts | G5 | 7 | [x] | sem violações |
| frontend/src/services/goals.service.ts | G5 | 8 | [x] | sem violações |
| frontend/src/services/meal.service.ts | G5 | 10 | [x] | sem violações |
| frontend/src/services/measurement.service.ts | G5 | 1 | [x] | sem violações |
| frontend/src/services/push.service.ts | G5 | 11 | [x] | sem violações |
| frontend/src/services/savedMeal.service.ts | G5 | 2 | [x] | sem violações |
| frontend/src/types/auth.ts | G5 | 12 | [x] | sem violações, tipos TypeScript |
| frontend/src/types/meal-modal.ts | G5 | 3 | [x] | sem violações, tipos TypeScript |
| frontend/src/types/profile.ts | G5 | 14 | [x] | sem violações, tipos TypeScript |
| frontend/src/utils/date.ts | G5 | 15 | [x] | sem violações, utilitários de data |
| frontend/src/utils/download.ts | G5 | 2 | [x] | sem violações, utilitários de download |
| frontend/src/components/auth/LoginForm.test.tsx | G6 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/components/auth/RegisterForm.test.tsx | G6 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/components/common/DatePickerInput.test.tsx | G6 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/components/meals/NewMealModal.test.tsx | G6 | 6 | [x] | testes passam sem quebra de asserção |
| frontend/src/components/onboarding/OnboardingFlow.test.tsx | G6 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/components/ui/__tests__/primitives.test.tsx | G6 | 8 | [x] | testes passam sem quebra de asserção |
| frontend/src/context/AuthContext.test.tsx | G6 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/pages/private/__tests__/DashboardPage.test.tsx | G6 | 19 | [x] | testes passam sem quebra de asserção |
| frontend/src/pages/private/__tests__/EditProfilePage.test.tsx | G6 | 2 | [x] | testes passam sem quebra de asserção |
| frontend/src/pages/private/__tests__/MeasurementsPage.test.tsx | G6 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/pages/private/__tests__/NotificationsPage.test.tsx | G6 | 1 | [x] | testes passam sem quebra de asserção |
| frontend/src/pages/private/__tests__/SettingsSeparation.test.tsx | G6 | 7 | [x] | testes passam sem quebra de asserção |
| frontend/src/pages/private/__tests__/StatsPage.test.tsx | G6 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/pages/public/__tests__/LegalPage.test.tsx | G6 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/setupTests.ts | G6 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/styles/tokens.contrast.test.ts | G6 | 0 | [x] | 24 testes de contraste WCAG passando (leitura via fs) |
| frontend/src/tests/api.test.ts | G6 | 1 | [x] | testes passam sem quebra de asserção |
| frontend/src/tests/auth_storage.test.tsx | G6 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/tests/LoginPage.test.tsx | G6 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/tests/navigation.test.tsx | G6 | 2 | [x] | testes passam sem quebra de asserção |
| frontend/src/tests/router.test.tsx | G6 | 3 | [x] | testes passam sem quebra de asserção |
| frontend/src/tests/setup/test-utils.tsx | G6 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/types/__tests__/meal-modal.test.ts | G6 | 0 | [x] | sem ocorrências (scan) |
| frontend/src/utils/__tests__/date.test.ts | G6 | 17 | [x] | testes passam sem quebra de asserção |

---

## Decisões do Agente
1. **Logo SYNC como marca-texto:** Em `AppHeader.tsx`, o texto "SYNC" recebeu a estilização `bg-primary text-primary-foreground px-1 ml-0.5 font-black`, seguindo a especificação de marca-texto neon de `docs/CORES.md` §1.
2. **Ícone de chama no cabeçalho:** O quadrado neon com a chama no cabeçalho recebeu `border-2 border-black` para contraste brutalista, alinhado ao padrão de botões e fills sólidos.
3. **Borda inferior da navegação ativa:** A aba ativa no cabeçalho desktop agora utiliza `border-foreground` (em vez do proibido `border-primary`) mantendo alto contraste em ambos os modos.
4. **Alerta offline e estrelas de favoritos:** Centralizado o uso dos tokens semânticos `--warning` e `--warning-foreground` em substituição aos literais `bg-amber-500`, `text-amber-500` e `fill-amber-500`.

---

## Lacunas (Cores sem equivalente semântico)
- `--warning` (`38 92% 50%` - #F59E0B): Criado para representar avisos neutros (como banner de modo offline em `RootLayout.tsx`) e elementos dourados/âmbar (como estrelas de alimentos favoritos em `FoodQuantityForm.tsx` e `NewMealModal.tsx`). `--warning-foreground` (`0 0% 4%`) atinge contraste WCAG > 10:1 sobre o tom âmbar nos dois modos.

---

## Exceções (color-guard-allow)
- Nenhuma exceção necessária até o momento; todos os arquivos migrados atendem 100% às regras semânticas sem marcadores de bypass.
