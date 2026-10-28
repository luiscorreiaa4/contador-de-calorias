# Manual de Curadoria do Catálogo de Alimentos (CalorieSync)

Este documento orienta o processo de curadoria, limpeza e enriquecimento do catálogo global de alimentos, em conformidade com as diretrizes da decisão **D-22** (B9 e B10).

---

## 1. Princípios Inegociáveis (D-22 / B9 & B10)

1. **PROIBIDO Inventar Dados Nutricionais (B9):**
   - Todo alimento adicionado ao catálogo oficial exige os campos `source` e `source_ref`.
   - Exemplos de referências válidas:
     - `"TACO 4ª edição rev., código 001"`
     - `"IBGE - Tabela de Medidas Referidas para Alimentos Consumidos no Brasil"`
     - `"Rótulo do Fabricante X, Lote Y (informação nutricional por 100 g)"`
2. **Imutabilidade e Proteção de Alimentos Curados (B10):**
   - Alimentos que foram editados ou curados manualmente recebem o marcador `admin_edited_at = NOW()`.
   - A rotina de reimportação massiva (`import-foods.ts`) ignora alimentos com `admin_edited_at IS NOT NULL` e **nunca reativa** alimentos com `active = false`.
3. **Sem Exclusão Física (B4):**
   - Alimentos duplicados, impróprios ou descontinuados nunca são apagados via `DELETE`. Eles são **desativados** (`active = false`). Dessa forma, nenhuma refeição histórica de usuários perde integridade.

---

## 2. Fluxo Operacional: Exportar → Decidir → Aplicar

O fluxo de revisão do catálogo é 100% reproduzível, auditável e versionado no Git:

```
[ Banco de Dados ] 
       │ (npm run catalog:export)
       ▼
[ backend/data/catalog-review.csv ] ───▶ (Revisão manual das decisões)
                                                  │
                                                  ▼
                                     [ backend/data/catalog-decisions.csv ]
                                                  │
                                                  ▼ (npm run catalog:apply -- --apply)
                                         [ Banco de Dados + Auditoria ]
```

### Passo 1: Exportar o Catálogo para Análise
Execute a partir da raiz do projeto:
```bash
npm run catalog:export
```
- Gera o arquivo `backend/data/catalog-review.csv` codificado em UTF-8 com BOM e separador `;`.
- Colunas: `id;external_id;source;nome;kcal;proteina;carboidrato;gordura;ativo;sugestao;decisao;novo_nome`.
- A coluna `sugestao` exibe heurísticas automatizadas de possíveis duplicatas (ex.: variantes por tipo 1/tipo 2 ou variações de preparo cru/cozido). **A sugestão nunca é aplicada automaticamente.**

### Passo 2: Registrar Decisões
Abra o arquivo no seu editor de planilhas ou texto e preencha as colunas de ação:
- **`decisao`**:
  - `ocultar`: desativa o alimento (`active = false`).
  - `renomear`: altera o nome do alimento para o texto da coluna `novo_nome`.
  - `reativar`: reativa um alimento previamente desativado (`active = true`).
  - *(em branco)*: nenhuma alteração é feita (linha ignorada).
- **`novo_nome`**: obrigatório apenas quando `decisao` for `renomear`.

Salve o arquivo revisado em `backend/data/catalog-decisions.csv` (versionado no Git).

### Passo 3: Simular as Alterações (Dry-Run)
Antes de alterar o banco, valide a simulação:
```bash
npm run catalog:apply backend/data/catalog-decisions.csv
```
O script exibirá um relatório com:
- Total de linhas analisadas;
- Decisões válidas;
- Modificações simuladas;
- Registros inalterados (idempotência);
- Erros ou alertas (ex.: ID inexistente ou novo nome inválido).

### Passo 4: Efetivar no Banco de Dados
Para gravar no PostgreSQL:
```bash
npm run catalog:apply -- --apply backend/data/catalog-decisions.csv
```
- Executa em transação atômica (`BEGIN / COMMIT`).
- Atualiza `name` e `active`.
- Preenche `admin_edited_at = NOW()`.
- Registra cada operação na tabela `admin_audit_log` com `actor_type: 'cli'`.

---

## 3. Inclusão de Novos Alimentos Curados (`curated-foods.json`)

Para adicionar lotes de alimentos padronizados e conferidos com fontes oficiais, utilize o arquivo `backend/data/curated-foods.json`.

### Formato do Arquivo
O arquivo deve conter um array JSON de objetos:

```json
[
  {
    "name": "Arroz Integral Cozido",
    "calories": 124,
    "proteins": 2.58,
    "carbs": 25.8,
    "fats": 1.0,
    "base_unit": "g",
    "serving_weight": 100,
    "unit_name": "colher de sopa cheia",
    "unit_weight": 25,
    "source": "TACO",
    "source_ref": "TACO 4ª edição rev., código 004",
    "external_id": "taco-004-curated"
  }
]
```

### Regras de Validação (Zod / D-22):
1. **Unidade base e 100 g:** Todos os macros referem-se à porção de 100 g ou 100 ml (`calories <= 900`, cada macro `<= 100 g`, soma P+C+G `<= 100.5 g`).
2. **Fontes obrigatórias:** `source` (ex.: "TACO", "IBGE", "Rótulo") e `source_ref` com detalhes do documento consultado.
3. **Divergência Calórica:** Se o cálculo calórico teórico `(4*P + 4*C + 9*G)` divergir mais de 25% do valor informado em `calories`, o importador sinaliza o item como `[REVISAR]` no relatório, mas não impede a gravação se os dados da fonte original forem fidedignos.

### Execução da Importação Curada
- **Simulação:**
  ```bash
  npm run catalog:import-curated backend/data/curated-foods.json
  ```
- **Gravação Definitiva:**
  ```bash
  npm run catalog:import-curated -- --apply backend/data/curated-foods.json
  ```
