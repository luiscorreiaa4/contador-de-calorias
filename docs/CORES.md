# Guia de Cores e Identidade Visual — CalorieSync

Este documento documenta de forma completa todas as cores, variáveis, códigos hexadecimais e regras de sombra do projeto **CalorieSync** (extraídos do Dashboard, `tailwind.config.js`, `index.css` e da identidade brutalista da aplicação).

> **Revisão v2 — "Neo-Brutalismo de Tinta":** o modo claro foi redesenhado porque o verde neon `#CCFF00` tinha contraste de apenas **1,17 : 1** sobre o branco (praticamente invisível). O modo escuro permanece como estava.
>
> **Revisão v3 — "Ajuste de Acessibilidade Destructive":** no modo claro, `--destructive` foi ajustado para `#B91C1C` (`hsl(0, 74%, 42%)`) porque `#EF4343` dava apenas ~3,8:1 sobre branco (reprovando WCAG AA para texto normal). No modo escuro permanece `#EF4343` (`hsl(0, 84%, 60%)`).

---

## 🧭 Regra de Ouro do Verde Neon

> **O `#CCFF00` é uma cor de PREENCHIMENTO (fill), não de TINTA.**
>
> - **Fill (`bg-primary`):** botões, barras de progresso, badges, marca-texto do logo — sempre com **texto preto** e, no modo claro, **borda preta de 2px**. Idêntico nos dois temas.
> - **Tinta (`text-primary-ink`):** textos e ícones verdes sobre o fundo. No modo escuro é o próprio `#CCFF00`; no modo claro vira o verde-oliva **`#4D6600`**.
> - **Nunca** use `text-primary` para texto/ícone sobre fundo claro.

---

## ⚡ Resumo Direto: A sombra dos cards é outra cor ou é a mesma com transparência?

> **Depende do tema (agora controlado por variáveis CSS):**
>
> - **Modo Escuro:** EXATAMENTE o verde neon `#CCFF00` com transparência — `rgba(204, 255, 0, 0.2)` normal e `rgba(204, 255, 0, 0.4)` no hover.
> - **Modo Claro:** preto sólido `#0A0A0A` (100% de opacidade) — sombra brutalista clássica, visível sobre o fundo osso.
>
> Deslocamentos: `4px 4px 0px 0px` (normal) e `6px 6px 0px 0px` (hover), nos dois temas.

---

## 📊 Contraste (WCAG)

| Combinação | Contraste | Resultado |
| :--- | :--- | :--- |
| `#CCFF00` sobre `#0A0A0A` (escuro) | 16,9 : 1 | ✅ AAA |
| `#CCFF00` sobre `#FFFFFF` (claro — **antigo**) | 1,17 : 1 | ❌ Invisível |
| `#4D6600` sobre `#FFFFFF` (card claro) | 6,5 : 1 | ✅ AA |
| `#4D6600` sobre `#F5F5F0` (fundo claro) | 6,0 : 1 | ✅ AA |
| `#0A0A0A` sobre `#CCFF00` (texto em fill) | 16,9 : 1 | ✅ AAA |
| `#525252` sobre `#F5F5F0` (muted claro) | ≈ 7 : 1 | ✅ AAA |
| `#B91C1C` sobre `#FFFFFF` (destrutivo claro) | 6,2 : 1 | ✅ AA |
| `#EF4343` sobre `#1A1A1A` (destrutivo escuro) | 5,2 : 1 | ✅ AA |

---

## 🎨 Tabela Geral de Códigos Hexadecimais (HEX) e Valores

| Token / Papel Semântico | Variável CSS | HSL | HEX | RGB / RGBA |
| :--- | :--- | :--- | :--- | :--- |
| **Verde Neon Principal (Fill)** | `--primary`, `--accent` | `72 100% 50%` | **`#CCFF00`** | `rgb(204, 255, 0)` |
| **Verde Tinta (Modo Claro)** | `--primary-ink` | `75 100% 20%` | **`#4D6600`** | `rgb(77, 102, 0)` |
| **Verde Tinta (Modo Escuro)** | `--primary-ink` | `72 100% 50%` | **`#CCFF00`** | `rgb(204, 255, 0)` |
| **Sombra dos Cards (Claro)** | `--shadow` + `--shadow-alpha` | `0 0% 4%` / `1` | **`#0A0A0A`** | `rgba(10, 10, 10, 1)` |
| **Sombra dos Cards (Escuro, Normal)** | `--shadow` + `--shadow-alpha` | `72 100% 50%` / `0.2` | **`#CCFF00` (20% alfa)** | `rgba(204, 255, 0, 0.2)` |
| **Sombra dos Cards (Escuro, Hover)** | `--shadow` + `--shadow-alpha-hover` | `72 100% 50%` / `0.4` | **`#CCFF00` (40% alfa)** | `rgba(204, 255, 0, 0.4)` |
| **Fundo da Página (Modo Claro)** | `--background` | `60 20% 95%` | **`#F5F5F0`** | `rgb(245, 245, 240)` |
| **Fundo da Página (Modo Escuro)** | `--background` | `0 0% 4%` | **`#0A0A0A`** | `rgb(10, 10, 10)` |
| **Fundo dos Cards (Modo Claro)** | `--card` | `0 0% 100%` | **`#FFFFFF`** | `rgb(255, 255, 255)` |
| **Fundo dos Cards (Modo Escuro)** | `--card` | `0 0% 10%` | **`#1A1A1A`** | `rgb(26, 26, 26)` |
| **Texto Principal (Modo Claro)** | `--foreground` | `0 0% 4%` | **`#0A0A0A`** | `rgb(10, 10, 10)` |
| **Texto Principal (Modo Escuro)** | `--foreground` | `0 0% 100%` | **`#FFFFFF`** | `rgb(255, 255, 255)` |
| **Texto Secundário / Muted (Claro)** | `--muted-foreground` | `0 0% 32%` | **`#525252`** | `rgb(82, 82, 82)` |
| **Texto Secundário / Muted (Escuro)** | `--muted-foreground` | `0 0% 80%` | **`#CCCCCC`** | `rgb(204, 204, 204)` |
| **Bordas e Inputs (Modo Claro)** | `--border`, `--input` | `0 0% 4%` | **`#0A0A0A`** | `rgb(10, 10, 10)` |
| **Bordas e Inputs (Modo Escuro)** | `--border`, `--input` | `0 0% 15%` | **`#262626`** | `rgb(38, 38, 38)` |
| **Anel de Foco (Modo Claro)** | `--ring` | `0 0% 4%` | **`#0A0A0A`** | `rgb(10, 10, 10)` |
| **Anel de Foco (Modo Escuro)** | `--ring` | `72 100% 50%` | **`#CCFF00`** | `rgb(204, 255, 0)` |
| **Superfície de Apoio / Tag (Claro)** | `--secondary` | `60 10% 88%` | **`#E3E3DC`** | `rgb(227, 227, 220)` |
| **Superfície de Apoio / Tag (Escuro)**| `--secondary` | `0 0% 15%` | **`#262626`** | `rgb(38, 38, 38)` |
| **Vermelho Destrutivo (Modo Claro)** | `--destructive` | `0 74% 42%` | **`#B91C1C`** | `rgb(185, 28, 28)` |
| **Vermelho Destrutivo (Modo Escuro)** | `--destructive` | `0 84% 60%` | **`#EF4343`** | `rgb(239, 67, 67)` |
| **Texto sobre Destrutivo** | `--destructive-foreground`| `0 0% 100%` | **`#FFFFFF`** | `rgb(255, 255, 255)` |
| **Texto sobre Primário** | `--primary-foreground` | `0 0% 4%` | **`#0A0A0A`** | `rgb(10, 10, 10)` |

---

## 🔎 Detalhamento por Elemento do Dashboard

### 1. Cor Verde Principal (Primary / Accent / Neon)
- **Código HEX:** `#CCFF00`
- **RGB:** `rgb(204, 255, 0)`
- **HSL:** `hsl(72, 100%, 50%)`
- **Variante de tinta (modo claro):** `#4D6600` — `hsl(75, 100%, 20%)`, via `--primary-ink`.
- **Onde aparece no Dashboard e como aplicar:**

| Elemento | Classe / Tratamento | Modo Claro | Modo Escuro |
| :--- | :--- | :--- | :--- |
| Logo `CALORIE`**`SYNC`** | "SYNC" como **marca-texto**: `bg-primary text-primary-foreground px-1` | Bloco neon, letra preta | Bloco neon, letra preta |
| Ícone de chama do cabeçalho | `text-primary-ink` | Oliva `#4D6600` | Neon `#CCFF00` |
| Subtítulo "PAINEL DE PERFORMANCE" | `text-primary-ink` | Oliva | Neon |
| Barras de progresso (Calorias, Proteínas, Carboidratos, Gorduras) | Trilho `bg-secondary`, fill `bg-primary`, `border-2 border-foreground` no claro | Neon com contorno preto | Neon |
| Ícones dos cards de métricas | `text-primary-ink` | Oliva | Neon |
| Badge de contagem de refeições | `bg-primary text-primary-foreground border-2 border-black` | Neon + borda preta | Neon + borda preta |
| Botão **"NOVA REFEIÇÃO"** | `bg-primary text-primary-foreground border-2 border-black shadow-hard` | Neon, borda e sombra pretas | Neon, sombra neon |
| Linha de realce do cabeçalho | `bg-primary` + `border-b-2 border-foreground` | Faixa neon com base preta | Faixa neon |
| Foco de teclado | `ring-ring` / `focus:border-ring` | Preto | Neon |
| Seleção de texto (`::selection`) | Fundo `--primary`, texto `--primary-foreground` | Neon + preto | Neon + preto |

---

### 2. Sombra dos Cards e Botões (`box-shadow`)

O CalorieSync segue a estética **Brutalista** (bordas rígidas retas sem raio de curvatura `rounded-none`, bordas firmes de 2px e sombras duras sem desfoque/blur).

#### A. Sombra Padrão dos Cards (`shadow-hard`) — agora adaptativa ao tema
Definida em `frontend/tailwind.config.js`, consumindo variáveis CSS:
```css
box-shadow: 4px 4px 0px 0px hsl(var(--shadow) / var(--shadow-alpha));
```
- **Modo Claro:** preto `#0A0A0A` a 100% → `4px 4px 0px 0px rgba(10, 10, 10, 1)`.
- **Modo Escuro:** verde neon `#CCFF00` a 20% → `4px 4px 0px 0px rgba(204, 255, 0, 0.2)`.
- **Hover (`shadow-hard-hover`):**
  ```css
  box-shadow: 6px 6px 0px 0px hsl(var(--shadow) / var(--shadow-alpha-hover));
  ```
  - **Modo Claro:** permanece preto sólido, expandindo 2px.
  - **Modo Escuro:** neon sobe para 40% de opacidade, expandindo 2px.
- **Utilizada em:**
  - Cards de métricas diárias (Calorias, Proteínas, Carboidratos, Gorduras).
  - Navegador diário de datas ("Dia anterior / Próximo dia").
  - Card de chamada para ação rápida ("Registrar Refeição").
  - Cards individuais de cada refeição registrada (`hover:shadow-hard`).
  - Modais (modal de nova refeição, confirmação de exclusão e cópia).

#### B. Sombra Brutalista de Alto Contraste (Elementos com fill neon)
Para elementos que já têm o fundo totalmente verde neon (como abas selecionadas ou avatares), uma sombra neon transparente perderia o contraste. Por isso, utiliza-se a sombra brutalista neutra:
- **Modo Claro:** `4px 4px 0px 0px rgba(0, 0, 0, 1)` (Preto puro `#000000`) — agora coincide com o `shadow-hard` padrão.
- **Modo Escuro:** `4px 4px 0px 0px rgba(255, 255, 255, 0.2)` (Branco `#FFFFFF` a 20%).

---

### 3. Fundo da Página (`--background`)
- **Modo Claro:**
  - **HEX:** `#F5F5F0`
  - **RGB:** `rgb(245, 245, 240)`
  - **Sensação:** Off-white "osso"/papel. Tira o branco hospitalar e cria separação clara para os cards brancos com contorno preto.
- **Modo Escuro:**
  - **HEX:** `#0A0A0A`
  - **RGB:** `rgb(10, 10, 10)`
  - **Sensação:** Preto profundo/chumbo ("Deep Black"), ideal para destacar o verde neon `#CCFF00`.

---

### 4. Fundo dos Cards (`--card`)
- **Modo Claro:**
  - **HEX:** `#FFFFFF`
  - **RGB:** `rgb(255, 255, 255)`
  - **Diferença para o fundo:** Branco puro que "salta" do fundo osso `#F5F5F0`, reforçado pela borda preta de 2px e pela sombra preta.
- **Modo Escuro:**
  - **HEX:** `#1A1A1A`
  - **RGB:** `rgb(26, 26, 26)`
  - **Diferença para o fundo:** Um tom de cinza escuro que se eleva visualmente em relação ao fundo preto `#0A0A0A`.

---

### 5. Bordas dos Cards e Divisórias (`--border`)
- **Espessura Obrigatória:** `border-2` (2 pixels de contorno sólido).
- **Modo Claro:** `#0A0A0A` (`rgb(10, 10, 10)`) — contorno preto, brutalismo "de tinta".
- **Modo Escuro:** `#262626` (`rgb(38, 38, 38)`).
- **Fills neon:** use `border-black` (fixo) quando quiser o contorno preto também no modo escuro.

---

### 6. Tipografia e Textos
- **Texto Principal (`--foreground`):**
  - **Modo Claro:** `#0A0A0A` (Preto quase absoluto).
  - **Modo Escuro:** `#FFFFFF` (Branco puro).
- **Texto Secundário / Legendas / Labels (`--muted-foreground`):**
  - **Modo Claro:** `#525252` (Cinza escuro, ≈ 7 : 1 sobre o fundo osso).
  - **Modo Escuro:** `#CCCCCC` (Cinza claro).
- **Texto/Ícone em verde (`--primary-ink`):**
  - **Modo Claro:** `#4D6600` (Verde-oliva).
  - **Modo Escuro:** `#CCFF00` (Verde neon).
- **Texto sobre o Botão Verde Primário (`--primary-foreground`):**
  - Sempre `#0A0A0A` (Preto absoluto) para leitura nítida e contraste acessível (WCAG AAA) sobre o verde neon.

---

### 7. Ações Destrutivas e Erros (`--destructive`)
- **Código HEX:** `#EF4343`
- **RGB:** `rgb(239, 67, 67)`
- **Fundo com transparência (Alertas e banners):** `bg-destructive/10` (`rgba(239, 67, 67, 0.1)`).
- **Onde aparece no Dashboard:**
  - Botão e ícone de lixeira para exclusão de refeição.
  - Modal de confirmação "EXCLUIR REFEIÇÃO".
  - Banner de erro quando as refeições falham em carregar.

---

## 💻 Como as Cores São Configuradas no Código

1. **Tokens Semânticos (Variáveis CSS):**
   - Arquivo: `frontend/src/styles/index.css`
   - O Tailwind consome os valores HSL através da função `hsl(var(--token) / <alpha-value>)`.

   ```css
   :root {
     --background: 60 20% 95%;        /* #F5F5F0 */
     --foreground: 0 0% 4%;           /* #0A0A0A */
     --card: 0 0% 100%;               /* #FFFFFF */
     --card-foreground: 0 0% 4%;
     --primary: 72 100% 50%;          /* #CCFF00 — fill */
     --primary-foreground: 0 0% 4%;
     --primary-ink: 75 100% 20%;      /* #4D6600 — texto/ícones */
     --secondary: 60 10% 88%;         /* #E3E3DC */
     --muted-foreground: 0 0% 32%;    /* #525252 */
     --border: 0 0% 4%;               /* contorno preto */
     --input: 0 0% 4%;
     --ring: 0 0% 4%;

     --destructive: 0 74% 42%;        /* #B91C1C — claro */
     --destructive-foreground: 0 0% 100%;

     /* Sombra brutalista */
     --shadow: 0 0% 4%;
     --shadow-alpha: 1;
     --shadow-alpha-hover: 1;

     /* Sombra neutra para fills neon */
     --shadow-fill: 0 0% 0%;
     --shadow-fill-alpha: 1;
     --shadow-fill-alpha-hover: 1;
   }

   .dark {
     --background: 0 0% 4%;           /* #0A0A0A */
     --foreground: 0 0% 100%;         /* #FFFFFF */
     --card: 0 0% 10%;                /* #1A1A1A */
     --card-foreground: 0 0% 100%;
     --primary: 72 100% 50%;          /* #CCFF00 */
     --primary-foreground: 0 0% 4%;
     --primary-ink: 72 100% 50%;      /* #CCFF00 */
     --secondary: 0 0% 15%;           /* #262626 */
     --muted-foreground: 0 0% 80%;    /* #CCCCCC */
     --destructive: 0 84% 60%;        /* #EF4343 — escuro */
     --destructive-foreground: 0 0% 100%;
     --border: 0 0% 15%;              /* #262626 */
     --input: 0 0% 15%;
     --ring: 72 100% 50%;             /* #CCFF00 */

     --shadow: 72 100% 50%;
     --shadow-alpha: 0.2;
     --shadow-alpha-hover: 0.4;

     --shadow-fill: 0 0% 100%;
     --shadow-fill-alpha: 0.2;
     --shadow-fill-alpha-hover: 0.4;
   }

   ::selection {
     background: hsl(var(--primary));
     color: hsl(var(--primary-foreground));
   }
   ```

2. **Cores e Sombras Brutalistas no Tailwind:**
   - Arquivo: `frontend/tailwind.config.js` sob `theme.extend`:

   ```js
   colors: {
     primary: {
       DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
       foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
       ink: 'hsl(var(--primary-ink) / <alpha-value>)', // text-primary-ink
     },
   },
   boxShadow: {
     hard: '4px 4px 0px 0px hsl(var(--shadow) / var(--shadow-alpha))',
     'hard-hover': '6px 6px 0px 0px hsl(var(--shadow) / var(--shadow-alpha-hover))',
   },
   ```

3. **Alternância de Tema:**
   - A classe `.dark` é injetada na tag `<html>`, trocando automaticamente as variáveis CSS de `:root` para `.dark` sem necessidade de classes redundantes no HTML.

4. **Checklist de Migração no Código:**
   - [ ] Substituir `text-primary` usado em **textos e ícones sobre fundo** por `text-primary-ink`.
   - [ ] Manter `bg-primary` nos fills (botões, barras, badges) e adicionar `border-2 border-black` (ou `border-foreground`).
   - [ ] Trocar `focus:border-primary` / `ring-primary` por `focus:border-ring` / `ring-ring`.
   - [ ] Transformar o "SYNC" do logo em marca-texto (`bg-primary text-primary-foreground px-1`).
   - [ ] Verificar se nenhuma sombra está com `rgba(204, 255, 0, …)` fixo no código (usar `shadow-hard` / `shadow-hard-hover`).
