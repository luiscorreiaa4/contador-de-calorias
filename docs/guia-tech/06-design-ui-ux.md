# 06 — Design, UI/UX e recursos visuais

> Itens desta seção: **motion principles** (skeleton, lazy loading, animação de entrada/saída, carregamento e progresso) · **expo-glass-effect** · **Refero** (referodesign / styles.refero) · **Cult UI** · **ShaderGradient** · **Coolors** · **21st.dev** · **Spell UI** · **Inspora** · **imagens < 300 KB em WebP** · **vídeos WebM** · **imagens reais para confiabilidade** · **AI slops** · **cases com storytelling** · **onboarding** · **página 404 própria** (design).
> Skills de design (UI UX Pro Max, frontend-design, Design Motion Principles, Refero skill) estão em `02-claude-code-skills-plugins-mcps.md`.

---

## 1. Motion e percepção de velocidade

A skill **Design Motion Principles** (kylezantos) cobre estes padrões. O objetivo: o app **parecer** rápido e responder a cada ação.

### Skeleton (esqueleto de carregamento)
- Blocos cinza no formato do conteúdo final (linhas de texto, avatar, card) enquanto os dados carregam, em vez de um spinner no meio da tela.
- Reduz a sensação de espera e evita **layout shift** (CLS), porque o espaço já está reservado.
- Next.js: arquivo `loading.tsx` + `<Suspense fallback={<Skeleton/>}>`. shadcn/ui tem o componente `Skeleton`.
- Use um *shimmer* sutil; respeite `prefers-reduced-motion`.

### Lazy loading
- Carregar só quando precisa: imagens abaixo da dobra (`loading="lazy"`, ou `next/image` que já faz isso), componentes pesados (`next/dynamic`, `React.lazy`), vídeos, mapas, gráficos.
- **Não** faça lazy load da imagem principal do topo (LCP) — nela use `priority`/`fetchpriority="high"`.

### Animação de entrada e saída suave
- Entrada: *fade + leve deslocamento* (8–16 px), 150–300 ms, *ease-out*. Saída: mais rápida que a entrada (~100–200 ms, *ease-in*).
- Escalonar listas (*stagger* de 30–60 ms entre itens).
- Ferramentas: **Motion** (antigo Framer Motion) com `AnimatePresence` para saída; CSS `@starting-style` e **View Transitions API** para transições entre páginas.
- Regra de ouro (lente Emil Kowalski): ações que o usuário faz **centenas de vezes por dia** (abrir menu, digitar) devem ter pouca ou nenhuma animação; momentos raros (onboarding, sucesso de compra) podem ser mais expressivos.

### Carregamento e progresso
- **< 1 s:** nada ou feedback mínimo no botão. **1–3 s:** spinner/skeleton. **> 3 s:** barra de progresso com etapas ou porcentagem. **Muito longo:** processamento em segundo plano + notificação.
- Botões: estado *loading* (desabilitado + spinner) para evitar clique duplo.
- **Optimistic UI:** atualizar a interface antes da resposta do servidor (curtir, marcar tarefa) e desfazer se falhar (`useOptimistic` no React).
- Barra fina no topo para navegação entre páginas (ex.: `nextjs-toploader`).

### Acessibilidade em motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```

---

## 2. Bibliotecas de componentes e efeitos

### 21st.dev ("21dev.st")
- **O que é:** comunidade/registro de **componentes React + Tailwind** no estilo shadcn: heróis, cards animados, botões, backgrounds, pricing tables. Cada componente tem preview ao vivo, código TSX e comando de instalação pela CLI do shadcn.
- Tem o **Magic MCP**: o agente de IA busca e instala componentes direto no projeto. Requer chave de API do 21st (limite diário no plano grátis).
- Link: https://21st.dev

### Cult UI
- **O que é:** registro shadcn de componentes **animados e "de nicho"** para *design engineers*: inputs de prompt de IA, controles "Halo", heróis com shader, mockups de dispositivos. Gratuito, licença MIT, usa os tokens do seu tema shadcn (cores e dark mode herdados).
- Instalar: `npx shadcn@latest add @cult-ui/halo-button`
- Link: https://www.cult-ui.com · https://github.com/nolly-studio/cult-ui

### Spell UI
- **O que é:** biblioteca de componentes React/Tailwind **focada em motion** (feita com Motion): textos com shimmer, *tilt card* 3D, marquee, light rays com WebGL, gradiente animado, input que "explode", botões com borda animada. Distribuída como registro shadcn em spell.sh e também listada no 21st.dev.
- Link: https://spell.sh · https://github.com/xxtomm/spell-ui

### ShaderGradient
- **O que é:** gerador de **gradientes 3D animados** (feitos com shaders WebGL/Three.js) para fundos de hero, com editor visual onde você ajusta cores, forma (plano, esfera, onda), grão e câmera, e copia o código.
- Disponível como componente React (`@shadergradient/react`), plugin do Figma e do Framer.
- ⚠️ É pesado: use com `lazy` / só no hero, tenha um fallback estático (imagem) para mobile fraco e `prefers-reduced-motion`.
- Link: https://www.shadergradient.co

### expo-glass-effect (React Native / Expo)
- **O que é:** pacote oficial do Expo que renderiza o efeito **Liquid Glass** nativo do iOS 26 (vidro translúcido com refração) via `UIVisualEffectView`.
- Componentes: `GlassView` (superfície de vidro, com `glassEffectStyle` e `tintColor`) e `GlassContainer` (vários vidros que se "fundem" quando próximos, controlado por `spacing`).
- Funções: `isLiquidGlassAvailable()` e `isGlassEffectAPIAvailable()` para checar suporte.
- **Só iOS 26+ / tvOS** — em Android e iOS antigo vira `View` comum, então desenhe um fallback. Respeite `AccessibilityInfo.isReduceTransparencyEnabled()`.
- Instalar: `npx expo install expo-glass-effect`
- Link: https://docs.expo.dev/versions/latest/sdk/glass-effect/

---

## 3. Referências e inspiração

### Refero (referodesign) e Refero Styles (stylesrefero)
- **Refero** (refero.design): biblioteca de **telas e fluxos reais** de produtos web e iOS (onboarding, checkout, configurações…) pesquisável por padrão de UI — referência de produtos que já foram lançados de verdade.
- **Refero Styles** (styles.refero.design): milhares de **design systems extraídos de sites reais** empacotados como arquivos **`DESIGN.md`** (cores, tipografia, espaçamento, componentes, regras de uso) prontos para colar no contexto do Claude Code, Cursor, v0, Lovable.
- **Refero MCP** (`https://api.refero.design/mcp`, requer Refero Pro): o agente pesquisa estilos, telas e fluxos antes de gerar a interface.
- **Refero Skill:** metodologia "pesquisar antes de desenhar" (ver `02`).
- Por que usar: é o antídoto mais direto contra **AI slop** — a IA copia padrões de produtos bons em vez do "gosto médio".
- Links: https://refero.design · https://styles.refero.design · https://doc.refero.design

### Inspora
- **O que é:** arquivo **curado** de design visual recente — web, branding, produto, motion, ilustração, 3D — com filtro por categoria, crédito ao autor e link para a fonte. Boa parte vem de posts de designers no X/Twitter. Gratuito, sem cadastro.
- Uso: montar moodboard e ver tendências sem rolar feed infinito.
- Link: https://www.inspora.design
- Parecidos: Mobbin (telas de apps), Godly, Land-book, Awwwards, 60fps.design (motion), Design Spells (micro-interações).

### Coolors
- **O que é:** gerador de **paletas de cores** — aperte espaço para gerar, trave as cores que gostou, explore milhões de paletas prontas, extraia paleta de uma foto, verifique contraste e simule daltonismo. Exporta para CSS, Tailwind, SVG, PDF.
- Dica: depois de escolher, valide o contraste (ver `08`) e crie os tokens de cor no tema (ex.: shadcn `--primary`, `--background`).
- Link: https://coolors.co · alternativas: Realtime Colors (https://www.realtimecolors.com — testa a paleta num site de exemplo), Huemint.

---

## 4. Mídia: imagens e vídeos

### Imagens com menos de 300 KB em WebP
- **WebP** é ~25–35% menor que JPEG/PNG com qualidade parecida; **AVIF** é ainda menor (suporte amplo hoje). Use WebP como padrão e AVIF quando o pipeline permitir.
- **Meta:** < 300 KB por imagem grande (hero), < 100 KB para imagens de conteúdo, < 30 KB para thumbnails.
- **Como:**
  - Redimensionar para o tamanho real de exibição (não subir foto de 4000 px para mostrar em 800 px).
  - `next/image` converte e redimensiona automaticamente e gera `srcset` responsivo.
  - Manualmente: **Squoosh** (https://squoosh.app), `sharp` (Node), `cwebp`, TinyPNG.
  - Sempre definir `width`/`height` (evita CLS) e `alt` (ver `08`).
- Impacta direto o **PageSpeed/LCP** (ver `07`).

### Vídeos em WebM
- **WebM** (codec VP9 ou AV1) gera arquivos bem menores que MP4/H.264 para vídeos de fundo e demos.
- Ofereça MP4 como fallback (Safari antigo):
  ```html
  <video autoplay muted loop playsinline preload="none" poster="/hero.webp">
    <source src="/hero.webm" type="video/webm">
    <source src="/hero.mp4" type="video/mp4">
  </video>
  ```
- `muted` + `playsinline` são obrigatórios para autoplay no celular; `poster` mostra uma imagem enquanto carrega.
- Converter: `ffmpeg -i in.mp4 -c:v libvpx-vp9 -crf 34 -b:v 0 -an out.webm` (vídeo de fundo sem áudio).
- Vídeos longos: hospede em serviço de streaming (Mux, Cloudflare Stream, YouTube) em vez de servir o arquivo direto.

### Imagens reais para confiabilidade
- Fotos **reais** da equipe, do escritório/loja, do produto em uso e de clientes (com autorização) geram muito mais confiança que banco de imagens genérico ou imagem gerada por IA.
- Prova social real: logos de clientes (com permissão), depoimentos com nome/foto/empresa verificáveis, números concretos.
- Endereço e mapa reais (conecta com Google Meu Negócio em `07`).
- Uso de imagem de pessoas exige **autorização de uso de imagem** (ver `08`).

---

## 5. Conteúdo e experiência

### AI slops (no design)
Conceito em `01-ia-conceitos.md`. Checklist visual para evitar:
- [ ] Paleta própria (não o gradiente roxo padrão)
- [ ] Tipografia escolhida com intenção (par de fontes, hierarquia clara)
- [ ] Layout baseado em referência real (Refero/Inspora), não em "3 cards com ícone"
- [ ] Copy específica do seu negócio (passou pelo Humanizer + revisão humana)
- [ ] Imagens reais
- [ ] Nada de depoimento ou número inventado

### Cases com storytelling
- Em vez de "Projeto X — Site institucional", contar uma **história**: **contexto** (quem é o cliente) → **problema** (o que doía, com números) → **processo** (decisões e por quê, incluindo o que deu errado) → **solução** (telas, antes/depois) → **resultado** (métricas: +38% conversão, -2 s no carregamento) → **depoimento** do cliente.
- Funciona para portfólio de dev/designer, agência e página de "Clientes" de SaaS.
- Use dados reais e com autorização do cliente (ver "sem avaliações falsas" em `08`).
- Referências: estudos de caso no Behance, Read.cv, páginas "Customers" de Linear/Vercel/Stripe.

### Onboarding (UX)
- Os primeiros minutos do usuário. Objetivo: levar ao **primeiro valor** ("momento aha") o mais rápido possível.
- Boas práticas:
  - Pedir o mínimo no cadastro (login social / magic link; resto depois).
  - **Checklist de ativação** (3–5 passos) com progresso visível.
  - *Empty states* úteis: em vez de "Nenhum projeto", um botão "Criar primeiro projeto" + exemplo/template.
  - Tours curtos e puláveis (não 12 balões em sequência).
  - Personalização por pergunta simples ("Para que você vai usar?").
  - Medir: % que conclui cada etapa (PostHog, GA4 funis).
- Referência de telas: buscar "onboarding" no Refero/Mobbin.
- Segurança do fluxo (não deixar pular etapas pela API) em `03`.

### Página 404 própria
- Uma 404 com a identidade do site, mensagem amigável, **busca** e links para as páginas principais (em vez da tela padrão do servidor) — recupera o visitante perdido.
- Next.js: `app/not-found.tsx`. Detalhes técnicos de SEO (status code correto) em `07`.
