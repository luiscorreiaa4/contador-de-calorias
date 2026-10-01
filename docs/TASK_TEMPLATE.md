# Template de Tarefa

**Objetivo:** [Descrição clara e breve do que a tarefa fará]
**Requisito Relacionado:** [ex: RF-001, RNF-002]

## Contexto
[Por que esta tarefa está sendo feita? Explicação rápida.]

## Escopo
- [ ] O que será feito.
- [ ] Quais componentes/telas serão afetados.

## Fora de Escopo
- O que **não** deve ser feito durante esta tarefa (para evitar escopo rastejante).

## Arquivos Prováveis de Mudança
- `/backend/src/...`
- `/frontend/src/...`

## Critérios de Aceite (Verificáveis)
- [ ] Ao clicar em "Salvar", deve enviar request POST para `/api/exemplo`.
- [ ] Em caso de erro, exibir modal/aviso apropriado sem alert nativo (regra UX).

## Plano de Testes e Riscos
- Riscos: [Quebras de layout, banco desatualizado]
- Teste a ser adicionado: [Integração da nova rota]

## Definição de Pronto
- [ ] Funcionalidade atende todos os Critérios de Aceite.
- [ ] Testes automatizados passando (frontend e backend).
- [ ] Nenhuma quebra de tipagem do TypeScript (`npm run build` passa).
- [ ] Linter sem alertas de erro (`npm run lint` passa).
- [ ] Commit atômico gerado e registrado.
