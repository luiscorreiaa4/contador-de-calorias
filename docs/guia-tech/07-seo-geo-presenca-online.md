# 07 — SEO, GEO e presença online

> Itens desta seção: **página 404 própria** · **HTTPS** · **PageSpeed** · **sitemap.xml** · **Google Analytics** · **cookies** (técnico) · **rodapé com dados** · **robots.txt não bloqueando a produção** · **meta descriptions** · **Google Search Console** · **Google Meu Negócio** · **llms.txt** · **SEO (motores de pesquisa)** · **GEO (pesquisa de IA)** · **domínio com certificado SSL**.
> Lado jurídico de cookies/rodapé em `08-legal-lgpd-acessibilidade.md`.

---

## 1. Base técnica

### Domínio com certificado SSL / HTTPS
- Domínio próprio (`.com.br` no Registro.br, `.com` em Cloudflare/Namecheap) + certificado TLS ativo. Vercel/Netlify/Cloudflare emitem e renovam automático.
- Escolha **uma versão canônica** (com ou sem `www`) e redirecione a outra com **301**.
- HTTPS é sinal de ranqueamento e o Chrome marca sites HTTP como "Não seguro". Detalhes de HSTS em `03`.

### PageSpeed (Core Web Vitals)
- **PageSpeed Insights** (https://pagespeed.web.dev) mede a performance com dados de laboratório (Lighthouse) e de usuários reais (CrUX).
- **Core Web Vitals** (metas no percentil 75):
  | Métrica | Mede | Bom |
  |---|---|---|
  | **LCP** — Largest Contentful Paint | quando o maior elemento aparece | ≤ 2,5 s |
  | **INP** — Interaction to Next Paint | rapidez de resposta a cliques/toques | ≤ 200 ms |
  | **CLS** — Cumulative Layout Shift | quanto a página "pula" | ≤ 0,1 |
- **O que mais ajuda:** imagens WebP/AVIF otimizadas e com tamanho definido (ver `06`); hero com `priority`; fontes com `next/font` (sem layout shift); menos JavaScript no cliente (Server Components); adiar scripts de terceiros (`next/script` com `strategy="lazyOnload"`); CDN e cache.
- Monitorar usuários reais: Vercel Speed Insights, Search Console (relatório Core Web Vitals).
- O **Chrome DevTools MCP** permite ao agente gravar um trace e sugerir correções (ver `02`).

### robots.txt não bloqueando a produção
- `/robots.txt` diz aos robôs o que podem rastrear. **Erro clássico:** lançar com o `Disallow: /` que estava no staging → o site some do Google.
- Produção:
  ```
  User-agent: *
  Allow: /
  Disallow: /api/
  Disallow: /admin/
  Sitemap: https://seusite.com.br/sitemap.xml
  ```
- Staging/preview: bloqueie com `X-Robots-Tag: noindex` ou senha (a Vercel já adiciona `noindex` nos previews).
- `robots.txt` **não é segurança**: não liste caminhos secretos ali (é público). Proteja com autenticação.
- Robôs de IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended): decida se quer permitir — bloquear reduz a chance de ser citado em respostas de IA (GEO).
- Next.js: `app/robots.ts`. Link: https://developers.google.com/search/docs/crawling-indexing/robots/intro

### sitemap.xml
- Lista de todas as URLs que você quer indexadas, com data de modificação. Ajuda o Google a descobrir páginas novas.
- Next.js: `app/sitemap.ts` (gera automaticamente, inclusive de páginas dinâmicas do banco).
- Envie no Search Console e referencie no `robots.txt`.
- Link: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview

### Página 404 própria (técnico)
- Precisa retornar **status HTTP 404 de verdade** (não 200 com texto "não encontrado" — isso vira *soft 404* no Search Console).
- Next.js: `app/not-found.tsx` + `notFound()` nas páginas dinâmicas. Apache: `ErrorDocument 404 /404.html` no `.htaccess`.
- Páginas que mudaram de endereço: redirecionar com **301** em vez de deixar dar 404.

---

## 2. Conteúdo na página (SEO on-page)

### Meta descriptions (e meta tags)
- **`<title>`:** único por página, ~50–60 caracteres, palavra-chave principal no começo + marca.
- **Meta description:** resumo de ~140–160 caracteres que aparece no Google abaixo do título. Não influencia o ranking diretamente, mas influencia o **clique**. Única por página, com chamada para ação.
- **Open Graph / Twitter Card:** `og:title`, `og:description`, `og:image` (1200×630) — controla o preview no WhatsApp, LinkedIn, X.
- **Canonical:** `<link rel="canonical">` para evitar conteúdo duplicado.
- Next.js: `export const metadata` ou `generateMetadata()` por página.
- Link: https://developers.google.com/search/docs/appearance/snippet

### SEO para motores de pesquisa (o conjunto)
1. **Técnico:** HTTPS, velocidade, mobile-first, sitemap, robots, status codes, sem erros de rastreamento.
2. **On-page:** um `<h1>` por página, hierarquia de headings, URLs legíveis (`/servicos/limpeza-de-sofa`), links internos, `alt` em imagens.
3. **Conteúdo:** responder de verdade às perguntas do público; páginas por serviço/região; conteúdo original (Google penaliza conteúdo em massa sem valor — inclusive AI slop).
4. **Dados estruturados (Schema.org / JSON-LD):** `Organization`, `LocalBusiness`, `Product`, `FAQPage`, `Article`, `BreadcrumbList` → *rich results* no Google. Teste: https://search.google.com/test/rich-results
5. **Autoridade:** backlinks de sites relevantes, menções, Google Meu Negócio, avaliações reais.
6. **E-E-A-T:** experiência, especialidade, autoridade e confiabilidade — autor identificado, página "Sobre", dados da empresa, política de privacidade.
- Guia oficial: https://developers.google.com/search/docs/fundamentals/seo-starter-guide

---

## 3. Ferramentas do Google

### Google Search Console
- Gratuito. Mostra **como o Google vê seu site**: quais buscas trazem cliques, posição média, páginas indexadas ou com erro, Core Web Vitals, problemas de mobile, ações manuais e segurança.
- **Primeiros passos:** verificar o domínio (registro DNS TXT) → enviar `sitemap.xml` → usar "Inspeção de URL" para pedir indexação de páginas novas.
- Link: https://search.google.com/search-console

### Google Analytics (GA4)
- Mede visitantes, origem do tráfego, páginas, eventos e conversões (cadastro, compra, clique no WhatsApp).
- Instalação no Next.js: `@next/third-parties/google` (`<GoogleAnalytics gaId="G-XXXX" />`) ou via Google Tag Manager.
- **LGPD:** GA usa cookies não essenciais → só carregar **após consentimento** (Consent Mode v2 + banner de cookies, ver `08`).
- Alternativas sem cookie e mais simples: Plausible, Umami, Vercel Web Analytics, PostHog (produto).
- Link: https://developers.google.com/analytics

### Google Meu Negócio (Perfil da Empresa no Google)
- Perfil gratuito que faz sua empresa aparecer no **Google Maps** e no painel lateral da busca ("perto de mim"): endereço, horário, telefone, fotos, avaliações, link do site, WhatsApp.
- Essencial para negócio local (SEO local). Dicas: categoria correta, **fotos reais** frequentes, responder todas as avaliações, posts semanais, **NAP consistente** (Nome, Endereço, Telefone idênticos no site, no rodapé e no perfil).
- Link: https://business.google.com/br/business-profile/

### Cookies (técnico)
- Pequenos dados guardados pelo navegador. Tipos: **essenciais** (sessão/login, carrinho — não precisam de consentimento), **preferências**, **analytics** e **marketing** (Pixel do Meta, Google Ads — precisam de consentimento).
- Para segurança de cookies de sessão (`HttpOnly`, `Secure`, `SameSite`) ver `03`. Para o aviso/consentimento ver `08`.

### Rodapé com dados
- Do ponto de vista de SEO/confiança: nome da empresa, **CNPJ**, endereço (NAP), telefone/WhatsApp, e-mail, horário, links para políticas (privacidade, termos, cookies, trocas/reembolso), redes sociais, mapa do site.
- Use o mesmo NAP do Google Meu Negócio e marque com Schema `LocalBusiness`.
- Requisitos legais do rodapé em `08`.

---

## 4. Pesquisa por IA

### GEO — Generative Engine Optimization
- **O que é:** otimizar para ser **encontrado e citado por motores de resposta com IA** — ChatGPT Search, Perplexity, Gemini, Claude com busca, Google AI Overviews/AI Mode. Também chamado de AEO (*Answer Engine Optimization*) ou LLMO.
- **Diferença do SEO:** no SEO você disputa a posição num link; no GEO você disputa ser **a fonte que a IA usa e cita** na resposta.
- **O que funciona (segundo estudos e prática atual):**
  - Responder perguntas **de forma direta logo no início** da seção (a IA extrai trechos).
  - **Dados concretos, estatísticas, citações de fontes** — conteúdo verificável é mais citado.
  - Estrutura clara: headings em forma de pergunta, listas, tabelas, FAQ com Schema `FAQPage`.
  - Conteúdo renderizado no servidor (SSR/SSG) — muitos robôs de IA não executam JavaScript.
  - Permitir os robôs de IA no `robots.txt` (se for do seu interesse).
  - **Menções fora do seu site**: Reddit, YouTube, reviews, imprensa, Wikipédia — IAs se baseiam muito em consenso de terceiros.
  - Página "Sobre" e dados da empresa claros (entidade bem definida).
  - Ter um `llms.txt`.
- **Medir:** perguntar às IAs sobre seu nicho periodicamente; tráfego de referência vindo de `chatgpt.com`, `perplexity.ai` no Analytics; ferramentas como Profound, Peec AI, Otterly.
- Artigo acadêmico original: https://arxiv.org/abs/2311.09735

### llms.txt
- **O que é:** proposta de padrão (de Jeremy Howard, Answer.AI) — um arquivo **Markdown em `/llms.txt`** que resume o site e aponta os links mais importantes para que LLMs entendam seu conteúdo sem precisar rastrear HTML cheio de menus e scripts. Opcionalmente, `/llms-full.txt` com o conteúdo completo.
- Formato:
  ```markdown
  # Nome da Empresa

  > Uma frase dizendo o que a empresa faz, para quem e onde.

  Informações importantes: atende Maceió e região, horário, contato.

  ## Serviços
  - [Limpeza de sofá](https://site.com.br/servicos/sofa): preços e como funciona
  - [Impermeabilização](https://site.com.br/servicos/impermeabilizacao)

  ## Institucional
  - [Sobre nós](https://site.com.br/sobre)
  - [Perguntas frequentes](https://site.com.br/faq)

  ## Opcional
  - [Blog](https://site.com.br/blog)
  ```
- **Status:** adotado por muita documentação técnica (Anthropic, Vercel, Expo, Supabase, Cult UI…). Os grandes buscadores **não confirmaram** usar o arquivo como fator de ranqueamento — é barato de fazer e ajuda agentes de IA que o leem, mas não é garantia de citação.
- Link: https://llmstxt.org

---

## Checklist SEO/GEO de lançamento

- [ ] Domínio próprio + HTTPS + redirecionamento canônico (www ou não)
- [ ] `robots.txt` de produção **permitindo** rastreamento + link do sitemap
- [ ] `sitemap.xml` gerado e enviado ao Search Console
- [ ] Title + meta description únicos em cada página; Open Graph com imagem
- [ ] 404 própria retornando status 404; redirecionamentos 301 para URLs antigas
- [ ] PageSpeed mobile ≥ 90 e Core Web Vitals no verde
- [ ] Schema JSON-LD (`Organization`/`LocalBusiness`, `FAQPage`)
- [ ] Search Console verificado; GA4 (com consentimento) ou analytics sem cookie
- [ ] Google Meu Negócio completo, NAP igual ao do rodapé
- [ ] `llms.txt` publicado; FAQ com respostas diretas
