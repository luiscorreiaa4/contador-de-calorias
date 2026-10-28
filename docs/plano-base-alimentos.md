# Plano: Base de Alimentos para o App de Calorias

> Objetivo: sair de ~15 alimentos para uma base de 300 a 500 itens **práticos**,
> sem alterar o formato JSON / a tabela do banco que já existe.
>
> Última revisão: 28/10/2026

---

## Sumário

1. [O problema e o princípio que resolve](#1-o-problema-e-o-princípio-que-resolve)
2. [O formato atual e como tirar o máximo dele](#2-o-formato-atual-e-como-tirar-o-máximo-dele)
3. [Regras de curadoria](#3-regras-de-curadoria)
4. [Fontes de dados (com links)](#4-fontes-de-dados-com-links)
5. [Passo a passo do pipeline](#5-passo-a-passo-do-pipeline)
6. [Script de conversão (Python)](#6-script-de-conversão-python)
7. [Validações automáticas](#7-validações-automáticas)
8. [Fases de conteúdo e lista inicial](#8-fases-de-conteúdo-e-lista-inicial)
9. [Checklist final](#9-checklist-final)
10. [Cuidados e armadilhas](#10-cuidados-e-armadilhas)

---

## 1. O problema e o princípio que resolve

As tabelas oficiais (TACO, TBCA, IBGE) foram feitas para **pesquisadores e
nutricionistas**. Por isso elas separam variantes que o usuário comum nunca
diferencia. Exemplo da TACO:

- Arroz, integral, cozido
- Arroz, integral, cru
- Arroz, tipo 1, cozido
- Arroz, tipo 1, cru
- Arroz, tipo 2, cozido
- Arroz, tipo 2, cru

O usuário do app não sabe se o arroz é "tipo 1" ou "tipo 2". Ele só sabe se é
**branco ou integral** e, no prato, ele está **cozido**.

### Princípio: "alimento canônico"

> **Uma entrada na base = uma escolha que o usuário realmente faz.**

A tabela oficial vira **matéria-prima**. Para cada alimento canônico você
escolhe **um** código da fonte como o mais representativo e usa os números
dele.

| Alimento canônico (o que vai pro app) | Código escolhido na fonte | Por quê |
|---|---|---|
| Arroz branco cozido | TACO 3 (Arroz, tipo 1, cozido) | Tipo 1 é o mais vendido |
| Arroz integral cozido | TACO 1 (Arroz, integral, cozido) | Única opção relevante |
| Arroz branco cru | TACO 4 (Arroz, tipo 1, cru) | Para quem pesa antes de cozinhar |

Resultado: de 6 itens confusos para 3 itens claros.

---

## 2. O formato atual e como tirar o máximo dele

O formato do banco **não muda**:

```json
{
  "name": "string",
  "calories": number,
  "proteins": number,
  "carbs": number,
  "fats": number,
  "base_unit": "g" | "ml",
  "serving_weight": 100,
  "unit_name": "string",
  "unit_weight": number,
  "source": "string",
  "source_ref": "string",
  "external_id": "string"
}
```

### Como usar cada campo a favor da praticidade

**`name`: o campo mais importante para a busca**

- Comece pelo **nome que a pessoa digitaria**: "Arroz branco cozido", e não
  "Arroz, tipo 1, cozido".
- Coloque **sinônimos regionais entre parênteses**. Se a busca do app procura
  texto contido no nome, isso já funciona como sistema de sinônimos, sem
  mexer em nada:
  - `Mandioca cozida (aipim, macaxeira)`
  - `Pão francês (pão de sal, cacetinho)`
  - `Abóbora cozida (jerimum)`
  - `Charque (carne de sol, carne seca)`. **Atenção:** só junte itens que
    tenham composição parecida. Se não tiverem, crie entradas separadas.
- Coloque o **estado/preparo no final** e de forma consistente: `cozido`,
  `cru`, `grelhado`, `frito`, `assado`.
- Evite vírgulas no estilo das tabelas ("Arroz, tipo 1, cozido").

**`unit_name` + `unit_weight`: a "medida caseira" principal**

Como só existe **uma** unidade por alimento, escolha a **mais usada** para
aquele alimento:

| Alimento | `unit_name` sugerido |
|---|---|
| Arroz, feijão, farofa, cuscuz | colher de sopa cheia / concha / pedaço |
| Feijão | concha média |
| Pão francês, ovo, frutas inteiras | unidade (média) |
| Leite, sucos | copo (americano / 200 ml) |
| Queijo, presunto, pão de forma | fatia |
| Carnes | filé médio / bife médio / pedaço |
| Azeite, óleo, manteiga | colher de sopa / colher de chá |
| Café, açúcar | xícara / colher de chá |

Os **pesos** dessas medidas não devem ser chutados. Use a Tabela de Medidas
Referidas do IBGE (seção 4).

> **Dica:** se para algum alimento duas medidas forem muito comuns (ex.: "ovo
> cozido – unidade" já cobre bem, mas "queijo minas – fatia" e "queijo
> ralado – colher de sopa" são usos bem diferentes), vale criar **duas
> entradas**, porque na prática são alimentos diferentes no dia a dia:
> `Queijo minas frescal` e `Queijo parmesão ralado`.

**`base_unit` + `serving_weight`**

- Mantenha `serving_weight: 100`, porque todas as tabelas oficiais são por
  100 g.
- Use `"ml"` só para líquidos em que o usuário pensa em volume (leite, sucos,
  refrigerante). Se a fonte for por 100 g, a densidade de leite e sucos é
  próxima de 1. Para óleos, prefira `g` com unidade "colher de sopa".

**`source`, `source_ref`, `external_id`: mantenha!**

- Permitem **auditar** qualquer número que um usuário questionar.
- Permitem **atualizar** a base depois sem duplicar (upsert por
  `external_id`).
- São exigência de atribuição em algumas fontes (USDA pede, OFF exige).

Padrão sugerido de `external_id`:

| Fonte | Padrão | Exemplo |
|---|---|---|
| TACO | `taco-<codigo>` | `taco-3` |
| TBCA | `tbca-<codigo>` | `tbca-BRC0018A` (usar o código real da TBCA) |
| USDA | `usda-<fdcId>` | `usda-171705` |
| Rótulo | `<marca>-<produto>` | `growth-whey-conc-80` |
| Open Food Facts | `off-<codigo_de_barras>` | `off-7891000100103` |

---

## 3. Regras de curadoria

Estas são as regras para decidir **o que entra** e **como entra**:

1. **Forma como se come > forma como se compra.** Arroz, feijão, macarrão,
   carnes e tubérculos entram **cozidos/preparados** como item principal.
2. **Cru só quando faz sentido pesar cru:** arroz cru, aveia, macarrão cru,
   carne crua (para quem faz meal prep), frutas e verduras (que já se comem
   cruas).
3. **Uma variante representativa por alimento.** Na dúvida entre variantes, use
   a mais comum no mercado.
4. **Preparos que mudam muito as calorias viram itens separados:** ovo cozido
   e ovo frito, batata cozida e batata frita, frango grelhado e frango
   empanado frito.
5. **Preparos que mudam pouco não viram itens separados:** "feijão carioca
   cozido" serve para quase todos os feijões carioca caseiros.
6. **Nomes curtos, sem jargão.** Nada de "parte comestível", "in natura",
   "tipo 1".
7. **Sinônimos regionais no nome, entre parênteses.**
8. **Nunca invente número.** Todo valor vem de uma fonte rastreável em
   `source_ref`.

---

## 4. Fontes de dados (com links)

### 4.1 TACO – Tabela Brasileira de Composição de Alimentos (NEPA/Unicamp)

- **Papel:** base principal para alimentos básicos e in natura.
- **Prós:** gratuita, brasileira, amplamente usada e citada.
- **Contras:** ~600 itens, 4ª edição de 2011, poucas preparações, muitas
  variantes técnicas.
- **Links:**
  - Página da tabela: https://www.nepa.unicamp.br/taco/tabela.php?ativo=tabela
  - PDF da 4ª edição: http://www.nepa.unicamp.br/taco/contar/taco_4_edicao_ampliada_e_revisada.pdf?arquivo=taco_4_versao_ampliada_e_revisada.pdf
- **Como citar em `source_ref`:** `TACO 4ª ed., código X (nome original na tabela)`
- **Dica:** existem versões da TACO convertidas em CSV/JSON no GitHub (busque
  por "tabela taco csv" ou "taco json"). Elas são úteis para o script, mas
  **confira alguns valores contra o PDF oficial** antes de confiar.

### 4.2 TBCA – Tabela Brasileira de Composição de Alimentos (USP / FoRC)

- **Papel:** complemento para **preparações e pratos brasileiros** (feijoada,
  strogonoff, cuscuz, tapioca, salgados) e para alimentos que faltam na TACO.
- **Prós:** muito maior e mais atual que a TACO; tem crus e cozidos, com e sem
  sal, com óleo e temperos, pratos compostos e consulta por medida caseira.
- **Link:** https://www.tbca.net.br/
- **⚠️ Antes de usar:** leia os **termos de uso** no site. Verifique se o uso
  em app (principalmente comercial) é permitido e como deve ser a atribuição.
  Se houver dúvida, escreva para o contato da TBCA (tbca.contato@usp.br).

### 4.3 IBGE – Tabela de Medidas Referidas para os Alimentos Consumidos no Brasil (POF)

- **Papel:** a fonte **mais valiosa para praticidade**. Ela diz quanto pesa,
  em gramas, "1 concha de feijão", "1 colher de sopa de arroz", "1 fatia de
  mamão" etc. É daqui que devem sair os `unit_weight`.
- **Versões:** POF 2008-2009 (publicada em 2011) e POF 2017-2018 (revisada e
  ampliada, com mais alimentos e medidas). Prefira a 2017-2018.
- **Links:**
  - Biblioteca do IBGE (busque "tabela de medidas referidas"): https://biblioteca.ibge.gov.br/
  - Página da POF no IBGE: https://www.ibge.gov.br/estatisticas/sociais/saude/24786-pesquisa-de-orcamentos-familiares-2.html
- **Bônus:** a POF também publica as "Tabelas de Composição Nutricional dos
  Alimentos Consumidos no Brasil", útil como terceira referência.

### 4.4 USDA FoodData Central (EUA)

- **Papel:** tapar buracos (alimentos importados, castanhas específicas,
  ingredientes fitness genéricos, alguns industrializados).
- **Prós:** domínio público, sem necessidade de permissão; enorme; CSV para
  download e API gratuita.
- **Contras:** nomes em inglês; alimentos e preparos americanos.
- **Links:**
  - Site: https://fdc.nal.usda.gov/
  - Downloads (CSV): https://fdc.nal.usda.gov/download-datasets
- **Atribuição pedida:** citar "USDA FoodData Central" como fonte.
- **Dica:** prefira os tipos "Foundation Foods" e "SR Legacy" para alimentos
  genéricos.

### 4.5 Open Food Facts

- **Papel:** produtos **de marca** por código de barras.
- **Links:**
  - Site / dados: https://world.openfoodfacts.org/data
  - Resumo da licença ODbL: https://wiki.openfoodfacts.org/ODBL_License
  - Guia legal para desenvolvedores: https://openfoodfacts.github.io/openfoodfacts-server/api/tutorials/license-be-on-the-legal-side
- **⚠️ Licença ODbL:** exige **atribuição** ("© Open Food Facts contributors")
  nas telas que mostram esses dados e **compartilhamento** dos dados derivados
  ou misturados. Se não quiser abrir sua base, **não misture** dados do OFF
  nela; use rótulos.
- **Qualidade:** os dados são colaborativos, então confira os valores contra a
  embalagem.

### 4.6 Rótulos (tabela nutricional da embalagem)

- **Papel:** produtos de marca específicos (whey, iogurtes proteicos,
  barrinhas, pães de forma etc.), como você já fez com o Growth.
- **Atenção:** o rótulo informa **por porção**. Converta para 100 g:
  `valor_100g = valor_porcao × 100 / peso_porcao`, e use a porção do rótulo
  como `unit_weight`.

### Resumo de prioridades

| Tipo de alimento | 1ª fonte | 2ª fonte |
|---|---|---|
| Básicos e in natura | TACO | TBCA |
| Preparações e pratos | TBCA | — |
| Pesos de medidas caseiras | IBGE (POF) | TBCA |
| Itens que faltam nas brasileiras | USDA | — |
| Produtos de marca | Rótulo | Open Food Facts (atenção à licença) |

---

## 5. Passo a passo do pipeline

> Regra de ouro: **você decide o mapeamento, o script copia os números.**
> Nunca digite valores nutricionais à mão nem peça para uma IA "gerar" os
> valores, porque ela pode produzir números plausíveis e errados.

### Passo 1 – Baixar as fontes

- [ ] TACO em CSV (ou converter do PDF/planilha oficial).
- [ ] Tabela de Medidas Referidas do IBGE (PDF/planilha).
- [ ] (Opcional) TBCA: consulta item a item no site, respeitando os termos.
- [ ] (Opcional) USDA FoodData Central em CSV.

### Passo 2 – Montar a planilha de curadoria

Crie no Google Sheets/Excel uma planilha `curadoria.csv` com estas colunas:

| coluna | exemplo | quem preenche |
|---|---|---|
| `name` | Arroz branco cozido | você |
| `source` | TACO | você |
| `source_code` | 3 | você (olhando a TACO) |
| `source_original_name` | Arroz, tipo 1, cozido | você (para conferência) |
| `base_unit` | g | você |
| `unit_name` | colher de sopa cheia | você |
| `unit_weight` | (valor da POF) | você (olhando o IBGE) |
| `unit_ref` | IBGE POF 2017-2018 | você |
| `external_id` | taco-3 | gerado (ou você) |

Para **rótulos**, adicione colunas com os valores do rótulo, já que esses
números não vêm de nenhuma tabela.

### Passo 3 – Rodar o script

O script lê `curadoria.csv` + `taco.csv`, busca os números pelo código e gera
`alimentos.json` no formato exato do banco (seção 6).

### Passo 4 – Validar

O script deve rodar as checagens da seção 7 e listar problemas **antes** de
gerar o arquivo final.

### Passo 5 – Revisar uma amostra manualmente

Escolha 10 a 20 itens aleatórios e confira contra o PDF oficial e contra o bom
senso (ex.: 100 g de arroz cozido com 350 kcal? Errado, esse é o valor do
cru).

### Passo 6 – Importar no banco

- Faça **upsert por `external_id`**: se já existe, atualiza; se não existe,
  insere. Assim você pode rodar o pipeline várias vezes sem duplicar.
- Teste primeiro num banco de desenvolvimento.

### Passo 7 – Testar a busca no app

Digite como um usuário: "arroz", "feijao" (sem acento), "macaxeira", "pao",
"frango". Veja se o primeiro resultado faz sentido. Ajuste os `name` se não
fizer.

---

## 6. Script de conversão (Python)

> Os nomes das colunas do `taco.csv` variam conforme a versão que você baixar.
> Ajuste o dicionário `TACO_COLS` para bater com o seu arquivo.

```python
import csv
import json

# Ajuste conforme o cabeçalho do seu taco.csv
TACO_COLS = {
    "code": "codigo",
    "name": "descricao",
    "kcal": "energia_kcal",
    "protein": "proteina_g",
    "carbs": "carboidrato_g",
    "fat": "lipideos_g",
}

def parse_num(value):
    """TACO usa 'Tr' (traço) e 'NA'/'*' (não analisado)."""
    v = (value or "").strip().replace(",", ".")
    if v in ("Tr", "tr"):
        return 0.0
    if v in ("", "NA", "*", "-"):
        return None
    return float(v)

def load_taco(path):
    taco = {}
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            taco[row[TACO_COLS["code"]].strip()] = row
    return taco

def build(curadoria_path, taco_path, out_path):
    taco = load_taco(taco_path)
    foods, problems = [], []

    with open(curadoria_path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["source"] != "TACO":
                continue  # rótulos/outras fontes: tratar em outra função

            code = row["source_code"].strip()
            src = taco.get(code)
            if not src:
                problems.append(f"Código TACO {code} não encontrado ({row['name']})")
                continue

            food = {
                "name": row["name"].strip(),
                "calories": parse_num(src[TACO_COLS["kcal"]]),
                "proteins": parse_num(src[TACO_COLS["protein"]]),
                "carbs": parse_num(src[TACO_COLS["carbs"]]),
                "fats": parse_num(src[TACO_COLS["fat"]]),
                "base_unit": row["base_unit"].strip() or "g",
                "serving_weight": 100,
                "unit_name": row["unit_name"].strip(),
                "unit_weight": float(row["unit_weight"]),
                "source": "TACO",
                "source_ref": f"TACO 4ª ed., código {code} ({src[TACO_COLS['name']].strip()})",
                "external_id": row.get("external_id") or f"taco-{code}",
            }

            # Arredondamento padrão
            for k in ("calories",):
                if food[k] is not None:
                    food[k] = round(food[k])
            for k in ("proteins", "carbs", "fats"):
                if food[k] is not None:
                    food[k] = round(food[k], 1)

            problems.extend(validate(food))
            foods.append(food)

    problems.extend(check_duplicates(foods))

    if problems:
        print("⚠️ Problemas encontrados:")
        for p in problems:
            print(" -", p)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(foods, f, ensure_ascii=False, indent=2)
    print(f"✅ {len(foods)} alimentos gravados em {out_path}")

def validate(food):
    issues = []
    name = food["name"]
    for k in ("calories", "proteins", "carbs", "fats"):
        if food[k] is None:
            issues.append(f"{name}: '{k}' sem valor na fonte")
            return issues

    # Checagem de Atwater: kcal ≈ 4P + 4C + 9G
    estimado = 4 * food["proteins"] + 4 * food["carbs"] + 9 * food["fats"]
    if food["calories"] > 0:
        diff = abs(estimado - food["calories"]) / food["calories"]
        if diff > 0.15:
            issues.append(
                f"{name}: kcal={food['calories']} mas macros somam ~{estimado:.0f} "
                f"({diff:.0%} de diferença) – conferir"
            )

    if food["proteins"] + food["carbs"] + food["fats"] > 100:
        issues.append(f"{name}: macros somam mais de 100 g por 100 g")

    if not (0 < food["unit_weight"] < 1000):
        issues.append(f"{name}: unit_weight suspeito ({food['unit_weight']})")

    return issues

def check_duplicates(foods):
    issues, seen_ids, seen_names = [], set(), set()
    for f in foods:
        if f["external_id"] in seen_ids:
            issues.append(f"external_id duplicado: {f['external_id']}")
        if f["name"].lower() in seen_names:
            issues.append(f"Nome duplicado: {f['name']}")
        seen_ids.add(f["external_id"])
        seen_names.add(f["name"].lower())
    return issues

if __name__ == "__main__":
    build("curadoria.csv", "taco.csv", "alimentos.json")
```

### Exemplo de `curadoria.csv`

```csv
name,source,source_code,source_original_name,base_unit,unit_name,unit_weight,unit_ref,external_id
Arroz branco cozido,TACO,3,"Arroz, tipo 1, cozido",g,colher de sopa cheia,<peso POF>,IBGE POF 2017-2018,taco-3
Arroz integral cozido,TACO,1,"Arroz, integral, cozido",g,colher de sopa cheia,<peso POF>,IBGE POF 2017-2018,taco-1
```

> Substitua `<peso POF>` pelo valor real da Tabela de Medidas Referidas.

### Exemplo de saída

```json
{
  "name": "Arroz branco cozido",
  "calories": 128,
  "proteins": 2.5,
  "carbs": 28.1,
  "fats": 0.2,
  "base_unit": "g",
  "serving_weight": 100,
  "unit_name": "colher de sopa cheia",
  "unit_weight": 25,
  "source": "TACO",
  "source_ref": "TACO 4ª ed., código 3 (Arroz, tipo 1, cozido)",
  "external_id": "taco-3"
}
```

> O `unit_weight: 25` acima é ilustrativo. Confirme na tabela do IBGE.

---

## 7. Validações automáticas

| Checagem | Regra | O que pega |
|---|---|---|
| Atwater | `kcal ≈ 4×P + 4×C + 9×G` (tolerância 10–15%) | Erros de digitação, coluna trocada, código errado |
| Soma de macros | `P + C + G ≤ 100` por 100 g | Valores impossíveis |
| Valores vazios | Nenhum macro nulo | "NA" da fonte não tratado |
| "Tr" | Convertido para 0 | Traço da TACO |
| Peso da unidade | `0 < unit_weight < 1000` | Unidade esquecida ou absurda |
| IDs únicos | `external_id` não repete | Duplicação no upsert |
| Nomes únicos | `name` não repete (ignorando maiúsculas) | Dois "Arroz cozido" na busca |
| Cru vs cozido | Revisão manual: cozido tem kcal bem menor que cru (arroz, macarrão, feijão) | Código do cru usado no lugar do cozido |

> **Observação sobre Atwater:** alimentos com muita fibra ou álcool podem
> divergir mais. Nesses casos o aviso é para **conferir**, não
> necessariamente um erro.

---

## 8. Fases de conteúdo e lista inicial

### Fase 1 – O dia a dia (~150 itens)

Cobre a maior parte do que as pessoas registram. Sugestão de lista para mapear
na TACO:

**Cereais, grãos e massas**
Arroz branco cozido · Arroz integral cozido · Arroz branco cru · Macarrão
cozido · Macarrão cru · Aveia em flocos · Granola · Cuscuz de milho
(flocão) · Farinha de mandioca · Farofa pronta · Tapioca (goma) · Milho verde
cozido · Pipoca

**Leguminosas**
Feijão carioca cozido · Feijão preto cozido · Feijão verde/de corda
cozido · Lentilha cozida · Grão-de-bico cozido · Ervilha

**Pães e similares**
Pão francês (pão de sal, cacetinho) · Pão de forma tradicional · Pão de
forma integral · Torrada · Biscoito cream cracker · Biscoito de maisena ·
Bolacha recheada

**Carnes, aves, peixes e ovos**
Frango, peito grelhado · Frango, coxa/sobrecoxa assada · Carne bovina moída
refogada · Bife (alcatra/patinho) grelhado · Carne de panela (músculo/acém
cozido) · Carne de sol / charque (separar se a composição for diferente) ·
Carne suína (lombo assado) · Linguiça frita · Salsicha · Peixe (tilápia)
grelhado · Sardinha em lata · Atum em lata · Camarão cozido · Ovo
cozido · Ovo frito · Omelete

**Leite e derivados**
Leite integral · Leite desnatado · Leite em pó · Iogurte natural · Queijo
muçarela · Queijo minas frescal · Queijo coalho · Requeijão · Manteiga ·
Margarina · Creme de leite · Leite condensado

**Tubérculos e raízes**
Batata inglesa cozida · Batata frita · Batata-doce cozida · Mandioca cozida
(aipim, macaxeira) · Inhame cozido · Cará cozido

**Frutas**
Banana prata · Banana nanica · Maçã · Laranja · Mamão · Manga ·
Melancia · Melão · Abacaxi · Uva · Morango · Abacate · Goiaba ·
Acerola · Caju · Maracujá (polpa) · Pera · Limão · Coco (polpa)

**Verduras e legumes**
Alface · Tomate · Cebola · Cenoura crua · Cenoura cozida · Pepino ·
Brócolis cozido · Couve refogada · Abobrinha cozida · Abóbora cozida
(jerimum) · Chuchu cozido · Beterraba · Repolho · Quiabo

**Gorduras, açúcares e condimentos**
Azeite de oliva · Óleo de soja · Açúcar refinado · Açúcar mascavo · Mel ·
Achocolatado em pó · Maionese · Ketchup · Sal (0 kcal, útil para evitar
confusão)

**Bebidas**
Café sem açúcar · Café com açúcar · Suco de laranja natural · Refrigerante
(cola) · Refrigerante zero · Água de coco · Cerveja · Vinho tinto

**Oleaginosas**
Amendoim · Castanha-de-caju · Castanha-do-pará · Pasta de amendoim (rótulo
ou USDA)

### Fase 2 – Preparações e lanches (+150 a 200 itens) [CONCLUÍDA]

Principal fonte: **TBCA v7.2** (USP / FoRC). *176 preparações e lanches tradicionais mapeados em `build-curated-phase2.ts`, totalizando 319 alimentos na base curada.*

Feijoada (tradicional completa, vegetariana, frutos do mar) · Strogonoff (frango, carne, camarão) · Lasanha (bolonhesa, quatro queijos, frango, berinjela, abobrinha, legumes) · Macarronada (bolonhesa, alho e óleo, molho branco, frango, calabresa, parisiense, integral) · Arroz com feijão (mistura 50/50 prato feito e pratos comerciais) · Baião de dois · Escondidinho (charque com mandioca, frango) · Moqueca (camarão, frutos do mar) · Vatapá · Acarajé · Pão de queijo · Coxinha · Pastel (carne frito, queijo frito, forno carne, forno queijo, frango requeijão, palmito requeijão) · Esfirra (carne, frango, ricota, catupiry, muçarela) · Empada (frango, queijo minas, carne, camarão) · Empadão de frango · Quibe / Kibe (frito, assado, cru, com abóbora, lentilha) · Hambúrguer e Sanduíches (misto-quente tradicional/integral, bauru, cheeseburguer, x-salada, x-egg, x-bacon, fast food) · Cachorro-quente (simples, completo prensado, molho/batata palha) · Wrap de frango · Crepes · Pizzas (fatias: muçarela, calabresa, frango com requeijão, 4 queijos, portuguesa, marguerita, pepperoni, atum, lombo, rúcula com tomate seco, brigadeiro, banana) · Açaí na tigela com xarope de guaraná · Tapioca (com manteiga, queijo coalho com charque, doce de coco com leite condensado) · Cuscuz (paulista, de tapioca doce, com legumes) · Pamonha (salgada com queijo, doce com coco) · Canjica / Munguzá · Curau de milho verde · Bolos caseiros (trigo simples, fubá, cenoura com chocolate, chocolate com brigadeiro, coco, milho, laranja, mandioca/aipim, abacaxi, chocotone) · Tortas doces e mousses (chocolate, limão, maracujá) · Doces tradicionais (brigadeiro enrolado, beijinho, pudim de leite, pudim de pão, cocada branca, quindim, churros, sonho, bomba, pão de mel, petit gâteau) · Sorvetes e gelados (sorvete de massa, sundae, casquinha, milk-shake).

### Fase 3 – Marcas e fitness

Fonte: **rótulos** (ou Open Food Facts, atento à licença).

Wheys populares · Iogurtes proteicos · Barrinhas de proteína · Pasta de
amendoim de marcas · Pães de forma de marcas · Creatina (0 kcal, mas usuários
procuram) · Bebidas proteicas prontas

### Fase 4 – Contínua

- Itens que os usuários **buscam e não encontram**. Se puder, registre no app
  as buscas sem resultado; é a melhor lista de prioridades possível.
- Itens que os usuários criam manualmente com frequência (se o app permitir).

---

## 9. Checklist final

### Antes de começar
- [x] Baixei a TACO e a Tabela de Medidas Referidas do IBGE.
- [x] Li os termos de uso da TBCA (se for usar).
- [x] Decidi se vou ou não usar Open Food Facts (licença ODbL).

### Curadoria
- [x] Lista da Fase 1 mapeada em `curadoria.csv` e `build-curated-phase1.ts`.
- [x] Cada item tem **um** código de fonte escolhido (`taco-<id>`, `tbca-<codigo>`, `growth-...`).
- [x] Nomes curtos, preparo no final, sinônimos entre parênteses.
- [x] `unit_weight` vindo do IBGE e tabelas oficiais (com referência anotada).

### Geração
- [x] Scripts rodam sem erros (`build-curated-phase1.ts`, `download-tbca.ts`, `build-curated-phase2.ts`).
- [x] Todas as validações da seção 7 passaram (Atwater conferido, soma de macros <= 100.5, sem duplicatas).
- [x] Base ampliada para 319 alimentos canônicos auditáveis.

### Banco e app
- [x] Importação por upsert em `external_id` via `npm run catalog:import-curated -- data/curated-foods.json --apply`.
- [x] Testado em ambiente de desenvolvimento (PostgreSQL com auditoria atômica).
- [x] Busca testada com: "arroz", "feijao", "macaxeira", "pao", "frango", "ovo", "feijoada", "strogonoff", "lasanha", "coxinha", "pizza", "hamburguer".
- [ ] Tela "Sobre" / créditos com as fontes (TACO, IBGE, USDA, TBCA, OFF, conforme
      o que foi usado).

---

## 10. Cuidados e armadilhas

1. **Cru vs cozido é o erro nº 1.** 100 g de arroz cru tem cerca de 2,5× mais
   calorias que 100 g de arroz cozido. Se o usuário pesar o cozido e o app
   usar o cru, o registro sai completamente errado.
2. **Não use IA para gerar valores nutricionais.** Use IA (se quiser) só para
   **sugerir nomes canônicos e sinônimos**. Os números vêm sempre da tabela,
   via script.
3. **Porção de rótulo ≠ 100 g.** Sempre converta.
4. **"Tr" e "NA" da TACO.** "Tr" = traço (use 0); "NA" = não analisado (trate
   como ausente e escolha outro código, ou complete com outra fonte e anote
   em `source_ref`).
5. **Licenças:**
   - USDA: domínio público (peça de atribuição, não obrigação legal).
   - TACO / IBGE: publicações públicas; cite a fonte.
   - TBCA: leia os termos no site.
   - Open Food Facts: ODbL (atribuição + compartilhamento de derivados).
6. **Sinônimos com composição diferente** (ex.: carne de sol vs charque vs
   carne seca) não devem virar uma entrada só se os valores forem muito
   diferentes. Nesse caso, crie entradas separadas.
7. **Menos é mais.** 300 itens bem curados funcionam melhor que 3.000
   confusos. O usuário quer achar "arroz" em 2 segundos.

---

## Links rápidos

| Recurso | Link |
|---|---|
| TACO – tabela online | https://www.nepa.unicamp.br/taco/tabela.php?ativo=tabela |
| TACO – PDF 4ª edição | http://www.nepa.unicamp.br/taco/contar/taco_4_edicao_ampliada_e_revisada.pdf?arquivo=taco_4_versao_ampliada_e_revisada.pdf |
| TBCA (USP) | https://www.tbca.net.br/ |
| IBGE – Biblioteca (medidas referidas) | https://biblioteca.ibge.gov.br/ |
| IBGE – POF | https://www.ibge.gov.br/estatisticas/sociais/saude/24786-pesquisa-de-orcamentos-familiares-2.html |
| USDA FoodData Central | https://fdc.nal.usda.gov/ |
| USDA – downloads CSV | https://fdc.nal.usda.gov/download-datasets |
| Open Food Facts – dados | https://world.openfoodfacts.org/data |
| Open Food Facts – licença | https://wiki.openfoodfacts.org/ODBL_License |