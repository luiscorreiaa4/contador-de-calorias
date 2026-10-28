---
name: browser-inspection
description: "Instruções mandatórias para inspeções visuais no navegador (Claude in Chrome, navegador integrado ou Playwright), restritas a casos estritamente necessários e utilizando a conta de teste pré-existente sem onboarding."
---

# Inspeções no Navegador e Testes Visuais

Este guia define os critérios de uso e o passo a passo obrigatório para automações, capturas de tela ou inspeções utilizando o navegador (Claude in Chrome, navegador integrado ou Playwright) no frontend do **CalorieSync**.

---

## 1. Critério de Acionamento: Apenas em Casos Estritamente Necessários

- ❌ **PROIBIDO Abrir Navegador para Alterações Simples de CSS/Estilo:** NUNCA abra o navegador (Claude in Chrome, navegador integrado ou Playwright) para verificar alterações de layout comuns, cores, bordas, paddings ou classes utilitárias CSS. Isso consome excessivo tempo e tokens.
- ✅ **Casos Permitidos para Abrir o Navegador:**
  1. O usuário **solicitou expressamente** abrir o navegador, tirar prints ou validar a tela no Chrome.
  2. Validação indispensável de comportamento interativo complexo ou quebra crítica de tela que não possa ser verificada por inspeção de código ou testes existentes.

---

## 2. Regra Fundamental: Não Criar Contas e Não Passar pelo Onboarding

Quando for estritamente necessário abrir o navegador:
- ❌ **PROIBIDO Acessar `/cadastro`:** Não crie novas contas durante inspeções no navegador.
- ❌ **PROIBIDO Passar pelo `/onboarding`:** Não preencha as 5 etapas do assistente de onboarding (dados corporais, objetivos, rotina).
- ✅ **OBRIGATÓRIO Fazer Login com a Conta Pré-Existente:** O banco de dados do projeto já possui contas de teste configuradas com `onboarding_completed: true` e dados completos.

---

## 3. Credenciais Oficiais de Teste

| Campo | Valor Principal | Valor Alternativo |
| :--- | :--- | :--- |
| **E-mail** | `teste@teste.com` | `test@example.com` |
| **Senha** | `123456` | `Senha123!` |
| **Nome** | `testador123` | `Test User` |
| **Onboarding** | `true` (concluído) | `true` (concluído) |

---

## 4. Passo a Passo do Prompt para o navegador (Claude in Chrome, navegador integrado ou Playwright)

Ao invocar o navegador (Claude in Chrome, navegador integrado ou Playwright), estruture as instruções do agente de forma a realizar o login imediato antes da verificação visual:

```markdown
1. Navegue para "http://localhost:5173/login".
2. Certifique-se de que a aba "ENTRAR" está selecionada (se estiver na aba de cadastro, clique em "ENTRAR").
3. Preencha o campo de e-mail (#login-email) com: teste@teste.com
4. Preencha o campo de senha (#login-password) com: 123456
5. Clique no botão de submissão "ENTRAR".
6. Aguarde o redirecionamento para o Diário ("http://localhost:5173/").
7. Agora navegue diretamente até a rota solicitada:
   - Diário: "/"
   - Evolução / Estatísticas: "/evolucao"
   - Metas: "/metas"
   - Configurações: "/configuracoes"
   - Perfil: "/perfil"
8. Realize as validações solicitadas e capture os screenshots.
```

---

## 5. Dicas de Resolução de Tela para Inspeções

- **Desktop padrão:** `1280x800` ou `1440x900`.
- **Mobile padrão:** `375x667` (iPhone SE) ou `390x844` (iPhone 12/13/14).
- O design do CalorieSync é brutalista e responsivo; sempre verifique submenus e barras de navegação em ambas as larguras quando solicitado pelo usuário.
