# Auditoria de higiene dos testes — CalorieSync

Data: 16/10/2026. Node v24.14.0, Windows/PowerShell. Trabalho na branch atual, sem commits, conforme instrução posterior do usuário.

## Resultado e ambiente

110 testes de backend passaram em cada uma das dez execuções; frontend: 14 testes em cinco arquivos. Lint e build passaram. Nenhum runner de teste ficou rodando após a verificação. Foram mantidos os processos de desenvolvimento e demais processos preexistentes.

A porta 5433 solicitada inicialmente recusou conexão (ECONNREFUSED). O Docker tinha somente caloriesync_postgres em 5432. O usuário autorizou explicitamente usar contador_calorias_test nesse container na porta 5432. Nenhum reset, DROP TABLE/DATABASE/SCHEMA ou TRUNCATE foi executado. A suíte existente de rollback usa ALTER TABLE com restrições temporárias apenas no banco de testes; isso não foi ampliado.

Diretórios confirmados: backend, frontend, docs, docker, data, .agents, .github e node_modules. Configurações examinadas: package.json da raiz/backend/frontend, frontend/vite.config.ts, frontend/src/setupTests.ts, frontend/src/mocks/server.ts, frontend/src/tests/setup/test-utils.tsx, backend/tests/helpers/db.ts, backend/src/database/pool.ts, backend/src/config/env.ts, backend/src/app.ts, backend/src/server.ts e .github/workflows/ci.yml.

## Hipóteses e reproduções

- **H1 específica descartada:** meal_items_batch.test.ts já tinha after com pool.end em finally. Passou no inventário isolado. **Risco geral confirmado:** db_cleanup.test.ts não fechava o pool; password_security.test.ts também fazia login/consulta por import transitivo sem encerramento. Ambos terminavam depois do idleTimeout de aproximadamente 30 s, sem reproduzir as quatro horas do incidente.
- **H2 descartada para o estado encontrado:** pool.ts e env.ts já carregavam backend/.env por caminho absoluto. Havia uma segunda leitura dependente do CWD e credenciais silenciosas no pool; foram removidas. R1/R2 abriram conexão no mesmo banco tanto com CWD backend quanto raiz. Não houve 28P01 por troca de CWD. A autenticação incorreta foi medida separadamente: retornou 28P01 rapidamente, sem evidência de conexão presa.
- **H3 descartada:** test:backend:file e test:frontend:file já existiam. Foram preservados e passaram a usar o wrapper; test:file e test:strict foram acrescentados.
- **R1 confirmado:** probe descartável com pool.connect, SELECT current_database, client.release e sem pool.end abriu contador_calorias_test e atingiu o timeout de 5 s nas duas pastas. O idleTimeout original era 30 s; isso comprova permanência do handle além de 5 s, não um travamento infinito.
- **R3:** todos os 21 arquivos existentes terminaram, sem alcançar o teto individual de 45 s. Dois demoraram cerca de 30 s. Portanto, o travamento de quatro horas não foi reproduzido.

O inventário com banco acessível executou as versões originais dos testes/pool/config obtidas de HEAD, restaurando as versões corrigidas em finally. O primeiro inventário em 5433 registrou falhas rápidas de conexão; os dados definitivos abaixo correspondem à repetição autorizada em 5432. A inicialização de tsx dentro do sandbox falhou com uv_os_get_passwd/ENOMEM; as execuções válidas ocorreram fora dele, com autorização e sob o wrapper.

Comando de inventário: node scripts/audit-test-baseline.mjs, via wrapper de processo. Comando por arquivo: node --import <URL absoluta do loader tsx> --test <arquivo absoluto>, CWD backend, ambiente test e timeout de 45 s. Esse uso direto foi restrito ao diagnóstico controlado; uso cotidiano exige os scripts oficiais. Probes R1/R2 usaram o mesmo loader, sem --test, com teto de 5 s.

## Inventário por arquivo — antes/depois

Em todos os arquivos abaixo: nenhum import de server.ts, nenhum listen explícito, timer, intervalo ou fila criado pelo próprio teste. HTTP indica servidor efêmero gerenciado pelo Supertest. “Pool” indica import direto do módulo; “DB” inclui acesso transitivo real. Antes, afterEach de mocks não equivalia a encerramento. Agora os arquivos que alcançam o pool registram closeTestPool; os puramente isolados dispensam o helper.

| Arquivo | Pool / app / DB / HTTP | Hook antes / pool.end antes | Isolado antes (s / código) | Depois |
|---|---|---|---|---|
| backend/tests/integration/authorization.test.ts | sim / sim / sim / sim | sim / sim | 1.109 / 0 | helper central; passou nas 10 suítes |
| backend/tests/integration/compression.test.ts | não / sim / não / sim | não / não | 1.035 / 0 | helper central; passou nas 10 suítes |
| backend/tests/integration/database_indexes.test.ts | sim / não / sim / não | sim / sim | 0.396 / 0 | helper central; passou nas 10 suítes |
| backend/tests/integration/food.routes.test.ts | sim / sim / sim / sim | sim / sim | 1.344 / 0 | helper central; passou nas 10 suítes |
| backend/tests/integration/health_and_resilience.test.ts | sim / sim / sim / sim | sim / sim | 1.019 / 0 | helper central; passou nas 10 suítes |
| backend/tests/integration/meal.routes.test.ts | sim / sim / sim / sim | sim / sim | 1.064 / 0 | helper central; passou nas 10 suítes |
| backend/tests/integration/meal_items_batch.test.ts | sim / não / sim / não | sim / sim | 0.455 / 0 | helper central; passou nas 10 suítes |
| backend/tests/integration/transactions_rollback.test.ts | sim / não / sim / não | sim / sim | 0.772 / 0 | helper central; passou nas 10 suítes |
| backend/tests/integration/user.routes.test.ts | sim / sim / sim / sim | sim / sim | 1.152 / 0 | helper central; passou nas 10 suítes |
| backend/tests/meal.test.ts | não / não / não / não | não / não | 0.386 / 0 | helper central; passou nas 10 suítes |
| backend/tests/unit/auth.middleware.test.ts | não / não / não / não | não / não | 0.378 / 0 | sem acesso ao pool; passou nas 10 suítes |
| backend/tests/unit/date.util.test.ts | não / não / não / não | não / não | 0.280 / 0 | sem acesso ao pool; passou nas 10 suítes |
| backend/tests/unit/db_cleanup.test.ts | sim / não / sim / não | não / não | 30.549 / 0 | helper central; passou nas 10 suítes |
| backend/tests/unit/input.limits.test.ts | não / sim / não / sim | não / não | 1.973 / 0 | helper central; passou nas 10 suítes |
| backend/tests/unit/nutrition.service.test.ts | não / não / não / não | não / não | 0.422 / 0 | sem acesso ao pool; passou nas 10 suítes |
| backend/tests/unit/password_security.test.ts | não / não / sim / não | não / não | 30.767 / 0 | helper central; passou nas 10 suítes |
| backend/tests/unit/pool.ssl.test.ts | sim / não / não / não | não / não | 0.366 / 0 | helper central; passou nas 10 suítes |
| backend/tests/unit/reset_db_guard.test.ts | não / não / não / não | não / não | 0.326 / 0 | helper central; passou nas 10 suítes |
| backend/tests/unit/routes_registration.test.ts | não / sim / não / não | não / não | 0.827 / 0 | helper central; passou nas 10 suítes |
| backend/tests/unit/validate.middleware.test.ts | não / não / não / não | não / não | 0.631 / 0 | sem acesso ao pool; passou nas 10 suítes |
| backend/tests/user.test.ts | não / não / não / não | não / não | 0.285 / 0 | sem acesso ao pool; passou nas 10 suítes |

Todos podem ser executados pelo script oficial de arquivo isolado; a suíte antiga usava tsx --test tests/**/*.test.ts. O runner novo descobre os arquivos recursivamente, incluindo testes diretamente em tests/, sem depender da expansão de glob pelo shell.

### Frontend

- frontend/src/components/auth/LoginForm.test.tsx
- frontend/src/components/auth/RegisterForm.test.tsx
- frontend/src/components/meals/NewMealModal.test.tsx
- frontend/src/pages/private/__tests__/StatsPage.test.tsx
- frontend/src/tests/LoginPage.test.tsx

MSW já tinha server.close em afterAll e resetHandlers em afterEach. O QueryClient é limpo em afterEach. Nenhum dos cinco arquivos declara setTimeout/setInterval ou fake timers. Antes, o script já era vitest run; agora continua em run com limites explícitos e teto global. Vitest efetivamente instalado: 5.0.3; as versões antigas citadas nos documentos históricos não correspondiam mais ao package.json.

### App, middleware e conexões

Importar app.ts apenas constrói o Express; listen é exclusivo de server.ts. Não foi necessário alterar essa separação. O MemoryStore do express-rate-limit instalado usa interval.unref(); seu timer não mantém o processo vivo. O pool compartilhado é o único pool da aplicação alcançado pelos testes. reset_db_guard importa o módulo do script de reset, mas não executa resetDb: a chamada é protegida pela checagem de execução direta. Seu pool importado também passou a ser encerrado.

## Correções e limites

- Helper backend/tests/helpers/lifecycle.ts: after registrado antes da execução, limpeza opcional em try, pool.end no finally. Todos os acessos diretos e transitivos encontrados foram adaptados. Compressão foi convertida para describe/it.
- Pool: credenciais e porta obrigatórias via Zod; sem defaults de host/usuário/senha/banco. connectionTimeoutMillis=2000 e statement_timeout=10000 foram preservados, assim como idleTimeoutMillis=30000. allowExitOnIdle só em test, desabilitado explicitamente por TEST_STRICT=1 nos modos strict/file.
- Backend: --test-timeout=30000, herdado pelas suítes e subtestes, limita também a suíte de um arquivo. Margem superior aos 10 s de statement_timeout e às durações medidas. --test-concurrency=1 evita competição de DDL temporário da suíte de rollback e crescimento desnecessário de conexões.
- Padrão usa --test-force-exit só como proteção extra; strict/file não usam. A opção apenas encerra após os testes conhecidos e pode mascarar handles, por isso strict é obrigatório no CI. Referência oficial: https://nodejs.org/download/release/v24.0.2/docs/api/cli.html#--test-timeout e https://nodejs.org/download/release/v24.0.2/docs/api/cli.html#--test-force-exit . As flags foram verificadas e executadas no Node local 24.14.0.
- Frontend: testTimeout=10000, hookTimeout=10000, teardownTimeout=5000. Limites maiores que os casos medidos e adequados para MSW/RTL em CI.
- Wrapper sem dependências: teto padrão 300000 ms, configurável por TEST_PROCESS_TIMEOUT_MS entre 1 e 3600000. Windows usa taskkill /PID /T /F; POSIX cria grupo próprio e envia SIGKILL ao grupo. Timeout sai com 124; erros normais preservam o código do runner. SIGINT/SIGTERM também solicitam encerramento da árvore.
- Guarda AST (TypeScript já instalado): percorre imports estáticos locais transitivos e exige import e chamada reais do helper; comentário não satisfaz a guarda. Ligada ao npm run lint.
- CI usa Node 24, modo strict e teto de 15 min no job. Scripts de frontend também passam pelo wrapper. Documentação e backend-testing-guide foram atualizados, corrigindo a alegação imprecisa de que AssertionError ignora automaticamente hooks já registrados.

## Verificação final

Execuções sequenciais, sem mudanças funcionais entre repetições; tempos incluem npm e runner. Todas as dez suítes tiveram 110 testes aprovados.

| Comando | Tempo (s) | Código |
|---|---|---|
| npm test #1 | 15.267 | 0 |
| npm run test:strict #1 | 12.979 | 0 |
| npm test #2 | 11.649 | 0 |
| npm run test:strict #2 | 10.669 | 0 |
| npm test #3 | 10.766 | 0 |
| npm run test:strict #3 | 10.047 | 0 |
| npm test #4 | 10.056 | 0 |
| npm run test:strict #4 | 12.009 | 0 |
| npm test #5 | 11.910 | 0 |
| npm run test:strict #5 | 13.792 | 0 |
| negative missing helper: guard | 0.394 | 1 |
| negative missing helper: strict | 4.662 | 124 |
| CWD root with valid environment | 0.715 | 0 |
| negative CWD root with DB_PASSWORD empty | 0.308 | 1 |
| negative authentication: PostgreSQL 28P01 | 0.334 | 1 |
| npm run lint | 6.963 | 0 |
| npm run build | 18.344 | 0 |
| npm run test:frontend | 8.409 | 0 |

Negativo 1: removida temporariamente a chamada do helper de db_cleanup.test.ts. A guarda apontou o arquivo (código 1); strict executou o teste, mas atingiu o teto reduzido de 4000 ms, imprimiu a mensagem de encerramento da árvore e saiu 124. O arquivo foi restaurado em finally e o lint posterior passou.

Negativo 2: probe iniciado da raiz, com ambiente válido, retornou contador_calorias_test. DB_PASSWORD vazia falhou via Zod, nomeando DB_PASSWORD sem mostrar o valor. A variável foi passada vazia no processo filho, pois removê-la do processo permitiria carregá-la legitimamente do .env. Senha propositalmente inválida retornou 28P01 em segundos. O .env não foi alterado.

Teste do wrapper: node scripts/bounded-command.mjs node scripts/verify-process-timeout.mjs. Um processo com intervalo e um descendente também com intervalo foi interrompido em 1708 ms para teto de 1500 ms; a checagem de existência do descendente retornou ESRCH. Também foram conferidos códigos normais 0/7 e ENOENT para comando inexistente.

Processos: docs/test-hygiene-processes.json contém PIDs, pais, datas e classificação sem linhas de comando ou segredos. Nenhum TestRunner permaneceu. Os processos anteriores de desenvolvimento foram preservados; um filho de tsx watch reiniciou ao observar as alterações e foi identificado como DevServer, não como órfão da suíte. Os processos de inspeção encerraram normalmente.

Evidências detalhadas: [baseline](test-hygiene-baseline.json), [verificação](test-hygiene-verification.json), [processos](test-hygiene-processes.json). Os logs registram saídas resumidas dos runners e nenhum conteúdo do .env. A primeira consulta de processos via CIM foi bloqueada pelo sandbox; a inspeção final usou a execução externa autorizada com timeout.

## Uso e riscos residuais

Use npm test, npm run test:strict, npm run test:file -- tests/...test.ts e npm run test:frontend. Os aliases antigos continuam válidos. Todos fixam caminhos e usam teto global. Para repetir a verificação integral deste ambiente: node scripts/bounded-command.mjs node scripts/verify-test-hygiene.mjs; o script de auditoria registra o estado corrente se executado novamente, portanto preserve as evidências originais.

Nenhuma ferramenta garante encerramento sob falha do sistema operacional ou processo que deliberadamente escape de seu grupo/árvore. O timeout do Node também não interrompe JavaScript síncrono bloqueado; o watchdog externo é a proteção para esse caso. A guarda estática cobre imports locais estáticos, não caminhos computados, require dinâmico ou uso malicioso; revisões devem verificar novos recursos e imports. Um client não liberado pode fazer pool.end esperar; o teto global permanece necessário. Force-exit e allowExitOnIdle podem esconder vazamentos no modo padrão; strict é a verificação obrigatória. A morte forçada pode impedir teardown, deixando dados tester-* ou restrições temporárias no banco de testes; não foi utilizado reset para contornar esse risco. No Linux o caminho de encerramento por grupo foi revisado, mas o teste real de árvore desta sessão ocorreu no Windows.

Sem decisão pendente. Sem branch nova, commits, push, merge, rebase ou reset --hard.

Verificação adicional do comando oficial: `npm run test:file -- tests/integration/meal_items_batch.test.ts` passou com 2 testes, código 0, runner em 560 ms. A tentativa no sandbox encontrou novamente a restrição de `uv_os_get_passwd`; a execução externa autorizada passou.

Tipagem adicional do backend: `node scripts/bounded-command.mjs node backend/node_modules/typescript/bin/tsc --noEmit -p backend/tsconfig.json` terminou em 4,9 s, código 0.
