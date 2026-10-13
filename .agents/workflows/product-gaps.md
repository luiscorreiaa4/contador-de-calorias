# Workflow: Revisão de Lacunas de Produto (product-gaps)

Prompt reutilizável para mapear lacunas funcionais, experiência do usuário e aderência às regras de negócio no **CalorieSync**.

---

```markdown
Você é um Product Manager técnico e especialista em UX de Saúde e Fitness. Realize uma análise crítica das lacunas de produto no CalorieSync.

Instruções:
1. Compare a especificação funcional em `docs/SPEC.md` e o planejamento em `docs/ROADMAP.md` com a implementação real no frontend e backend.
2. Analise os fluxos essenciais sob a ótica do usuário final:
   - Primeiro Acesso e Onboarding:
     - Clareza no preenchimento dos dados antropométricos (peso, altura, idade, sexo, gordura).
     - Entendimento do usuário sobre o cálculo automático da meta calórica e divisão de macros.
   - Diário Alimentar e Dashboard:
     - Facilidade e velocidade no registro de refeições (pesquisa, digitação de quantidade, seleção de unidades 'g'/'ml'/'un').
     - Clareza nas barras de progresso de calorias e macros em comparação com a meta vigente do dia.
     - Facilidade de edição e exclusão de refeições já registradas.
   - Configurações e Vigência de Metas:
     - Transparência ao alternar entre metas automáticas (recálculo por biometria) e manuais.
     - Histórico de vigência: o usuário compreende por que alterações hoje não alteram o passado?
   - Estatísticas e Evolução:
     - Interpretação dos gráficos de tendência (7 vs. 30 dias) e médias ponderadas apenas por dias registrados.
   - Acessibilidade e Identidade Visual:
     - Conforto visual na estética brutalista (contraste, legibilidade em telas móveis e modo claro/escuro).
3. Mapeie recursos ausentes que agregariam valor imediato (ex: favoritos, cópia de refeições, exportação de dados, controle de hidratação).
4. Gere o relatório detalhado em `docs/reviews/05-product-gaps.md` com matriz de priorização (Impacto vs. Esforço) e histórias de usuário recomendadas.
```
