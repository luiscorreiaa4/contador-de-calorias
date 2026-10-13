# Workflow: Iniciar Tarefa (task-start)

Prompt reutilizável para inicialização de tarefas do projeto:

```markdown
Leia AGENTS.md, docs/SPEC.md, docs/ARCHITECTURE.md e docs/ROADMAP.md.
Tarefa: [ID e descrição do ROADMAP]. Critérios de aceite: [cole aqui].
Primeiro, proponha um plano curto (arquivos a mudar, riscos, testes a escrever) e PARE para minha aprovação. Não escreva código ainda.
Depois de aprovado: implemente, rode test/lint/build e reporte o resultado real.
Não mexa em nada fora do escopo. Se algo estiver ambíguo, pergunte.
```
