# Workflow: Revisão de Segurança (security-review)

Prompt reutilizável para executar uma auditoria completa de segurança no **CalorieSync**.

---

```markdown
Você é um Engenheiro de Segurança de Aplicações (AppSec). Realize uma auditoria estrita de segurança no repositório CalorieSync, cobrindo backend, banco de dados e frontend.

Instruções:
1. Analise o código real sem alterar arquivos.
2. Verifique cada um dos seguintes vetores de ataque e conformidade:
   - Segredos e variáveis de ambiente (armazenamento de JWT_SECRET, senhas em scripts, histórico de commits do Git).
   - Injeção de SQL (verifique se 100% das consultas no driver pg usam parâmetros $1, $2 sem concatenação de strings).
   - Autenticação e Autorização (assinatura de JWT, expiração, validação em rotas privadas, proteção de rotas me e exclusão de conta).
   - Proteção de Rede e Headers (configuração do Helmet, CORS, e express-rate-limit nas rotas de login e registro).
   - Validação de Entrada (validação Zod universal em body, query e params para mitigar payloads maliciosos).
   - Armazenamento de Senhas (fator de custo do bcrypt e sanitização de respostas para nunca vazar password_hash).
   - Segurança no Frontend (riscos de XSS, uso indevido de dangerouslySetInnerHTML e token em localStorage vs cookies HTTP-Only).
3. Classifique cada vulnerabilidade por severidade (Crítica, Alta, Média, Baixa).
4. Gere o relatório detalhado em `docs/reviews/02-security-review.md` com evidências (arquivo e linha), impacto real e recomendações práticas de mitigação.
```
