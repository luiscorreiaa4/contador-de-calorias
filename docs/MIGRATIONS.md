# Migrações de banco (`backend/migrations/`)

Migrações versionadas gerenciadas por [`node-pg-migrate`](https://github.com/salsita/node-pg-migrate).
Cada arquivo é aplicado uma única vez e registrado na tabela `pgmigrations`.

## Regras

1. **Migrações aplicadas são imutáveis (D-13).** Nunca edite um arquivo já aplicado.
   Toda correção de esquema deve ser feita por uma **nova** migração versionada com
   prefixo de timestamp maior que o da última existente.
2. **Novas migrações devem usar ESM nativo.** `backend/package.json` declara
   `"type": "module"`, portanto o formato obrigatório é:

   ```js
   export const shorthands = undefined;
   export const up = (pgm) => { /* ... */ };
   export const down = (pgm) => { /* ... */ };
   ```

3. **Sempre implemente `down` reversível** (ou documente explicitamente por que a
   reversão é parcial/ambígua, como em dados já deduplicados).
4. **Nunca use comandos destrutivos** (`DROP TABLE`, `DROP DATABASE`, `TRUNCATE`) sem
   autorização prévia do usuário.

## Migrações legadas congeladas (BL-15 / ARCH-017 / D-13)

As migrações abaixo foram escritas no formato **CommonJS** (`exports.up = ...`) antes
da adoção do ESM e ficam **congeladas** por D-13 (imutabilidade pós-aplicação):

- `1791310642375_history-tables.js`
- `1791390511650_add-food-scale-features.js`

Elas permanecem funcionais no Node atual (v24) porque o detector de sintaxe de módulo
do Node carrega arquivos `.js` sem sintaxe ESM como CommonJS automaticamente
(comportamento estável a partir do Node 20.19 / 22.7, versões mínimas suportadas).

**Não converta esses arquivos para ESM** — isso violaria D-13. A padronização vale
apenas para as migrações novas. Caso uma futura migração precise alterar algo criado por
uma delas, crie uma nova migração.
