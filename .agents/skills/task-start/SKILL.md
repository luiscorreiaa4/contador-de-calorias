---
name: task-start
description: "Inicia o ciclo padrão de execução de uma tarefa do roadmap: leitura de contexto, proposta de plano e pausa para aprovação do usuário."
---

# Procedimento para Iniciar uma Tarefa (Task Start)

Siga este procedimento sempre que o usuário solicitar iniciar ou planejar uma tarefa do roadmap.

## Passo a Passo

1. **Leitura de Contexto:**
   - Leia [AGENTS.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/AGENTS.md) para verificar regras e papéis.
   - Leia [docs/SPEC.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/SPEC.md) para entender os requisitos de negócio relacionados.
   - Leia [docs/ARCHITECTURE.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/ARCHITECTURE.md) para mapear modelos e fluxo de dados.
   - Leia [docs/ROADMAP.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/ROADMAP.md) para identificar a tarefa e seus checkpoints.

2. **Proposta do Plano (SEM Código):**
   - Apresente um resumo claro:
     - Escopo e objetivo da tarefa.
     - Arquivos a serem alterados ou criados.
     - Riscos técnicos e impactos colaterais.
     - Testes automatizados que serão desenvolvidos.
   - **PARE IMEDIATAMENTE e aguarde a aprovação do usuário.** Não edite nem crie código nesta etapa.

3. **Execução Após Aprovação:**
   - Escreva o código e os testes correspondentes (em backend com `node:test` e/ou frontend com `Vitest` + `MSW`).
   - Execute a suíte de verificação:
     - `npm run test` (backend)
     - `npm --prefix frontend test` (frontend)
     - `npm run lint` (ESLint)
     - `npm run build` (build do frontend)
   - Realize commit atômico.
   - Atualize os checkboxes em [docs/SPEC.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/SPEC.md) e [docs/ROADMAP.md](file:///c:/Users/Luis/Documents/Contador%20de%20Calorias/my-app/docs/ROADMAP.md).
