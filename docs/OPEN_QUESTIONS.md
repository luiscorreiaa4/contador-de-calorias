# Dúvidas e Questões em Aberto (OPEN_QUESTIONS.md)

## Infraestrutura e Setup
1. [DÚVIDA] Onde a aplicação será hospedada? Haverá integração contínua (CI/CD)?
2. [DÚVIDA] O banco de dados no futuro utilizará alguma ferramenta formal de migração (ex: Prisma, ou scripts Knex), ou seguiremos com scripts `.js` ad-hoc em `backend/database/`?

## Testes e Qualidade
3. [DÚVIDA] O frontend não possui configuração de testes. Devemos introduzir `Vitest` + `Testing Library` imediatamente para os **Testes de Caracterização** antes de adicionar novas features?

## Produto e Regras de Negócio
4. [DÚVIDA] Como será a alimentação da base de Alimentos? Usaremos uma tabela externa (ex: TACO, USDA API) ou a base dependerá apenas dos registros manuais feitos pelos usuários no aplicativo?
5. [DÚVIDA] A meta calórica diária do usuário será estática (definida pelo usuário) ou o sistema terá uma lógica para calcular o TMB (Taxa Metabólica Basal) no futuro?
