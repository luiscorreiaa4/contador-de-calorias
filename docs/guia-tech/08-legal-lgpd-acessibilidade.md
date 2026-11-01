# 08 — Jurídico, LGPD e acessibilidade

> Itens desta seção: **política de privacidade** · **termos de serviço** · **aviso de cookies** · **política de reembolso** · **formulários na LGPD** · **só dados necessários** · **scripts de tracking** · **conformidade LGPD** ("lgpt") · **riscos jurídicos** · **dados da empresa** · **rodapé com dados** (legal) · **sem avaliações falsas** · **copyright das imagens** · **auditoria de acessibilidade** · **alt nas imagens** · **contraste** · **navegação por teclado**.

> ⚖️ Este material é informativo e **não substitui um advogado**. Para e-commerce, SaaS com dados sensíveis ou volume grande de usuários, valide os documentos com um profissional.

**Leis brasileiras que aparecem aqui:**
| Lei | Assunto |
|---|---|
| **LGPD** — Lei 13.709/2018 | Proteção de dados pessoais |
| **Marco Civil da Internet** — Lei 12.965/2014 | Direitos e deveres no uso da internet, guarda de registros |
| **CDC** — Lei 8.078/1990 | Direito do consumidor (publicidade, arrependimento) |
| **Decreto 7.962/2013** | Comércio eletrônico (informações obrigatórias) |
| **Lei de Direitos Autorais** — Lei 9.610/1998 | Imagens, textos, músicas |
| **LBI** — Lei 13.146/2015 (art. 63) | Acessibilidade de sites |

---

## 1. LGPD na prática

### Conformidade LGPD (visão geral)
A LGPD vale para qualquer site/app que trate dados de pessoas no Brasil (nome, e-mail, telefone, IP, cookies identificadores, localização…). O essencial:
1. **Base legal** para cada uso de dado (art. 7º): consentimento, execução de contrato, obrigação legal, legítimo interesse, etc. Não é sempre "consentimento".
2. **Princípios** (art. 6º): finalidade, adequação, **necessidade**, transparência, segurança, prevenção, não discriminação, responsabilização.
3. **Direitos do titular** (art. 18): confirmar se você tem dados dele, acessar, corrigir, excluir, portar, revogar consentimento. Precisa de um **canal** para isso (e-mail ou formulário) e prazo de resposta.
4. **Encarregado (DPO)**: indicar um contato responsável (agentes de pequeno porte têm regras simplificadas — Resolução CD/ANPD nº 2/2022 — mas devem manter um canal de comunicação).
5. **Segurança** (art. 46) — tudo de `03-seguranca-web.md` conta aqui.
6. **Incidentes**: vazamento relevante deve ser comunicado à **ANPD** e aos titulares (Resolução CD/ANPD nº 15/2024 — prazo de 3 dias úteis).
7. **Registro das operações** de tratamento (inventário: que dado, de onde, para quê, onde fica, quem acessa, por quanto tempo).
- Sanções: advertência, multa de até **2% do faturamento** (limitada a R$ 50 milhões por infração), publicização, bloqueio/eliminação dos dados.
- Link: https://www.gov.br/anpd · texto da lei: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm

### Só dados necessários (princípio da necessidade / minimização)
- Coletar **o mínimo** para a finalidade. Formulário de orçamento não precisa de CPF, data de nascimento e endereço completo.
- Perguntas a fazer para cada campo: *eu uso isso? para quê? por quanto tempo preciso guardar?*
- Menos dados = menos risco em caso de vazamento e menos obrigação.
- Defina **prazos de retenção** e apague/anonimize depois (ex.: leads não convertidos após 12 meses).

### Formulários na LGPD
- **Informar a finalidade** junto ao formulário ("Usaremos seu telefone apenas para retornar este orçamento").
- **Link para a política de privacidade** visível antes do envio.
- **Checkbox de consentimento separado e não pré-marcado** quando a base for consentimento — especialmente para marketing ("Quero receber novidades por e-mail/WhatsApp"). Consentimento para newsletter não pode ser condição para pedir orçamento.
- Guardar **prova do consentimento** (data/hora, versão do texto, IP).
- Oferecer **descadastro** fácil em toda mensagem de marketing.
- Campos sensíveis (saúde, religião, biometria, origem racial — art. 11) exigem cuidado redobrado; evite se não for indispensável.
- Formulário protegido com captcha e rate limit (ver `03`).

### Scripts de tracking
- Pixel do Meta, Google Ads, TikTok Pixel, Hotjar/Clarity (gravação de sessão), GA4 — coletam dados pessoais (IP, identificadores, comportamento) e muitas vezes os enviam para fora do país.
- **Regras:**
  - Carregar **somente após consentimento** da categoria correspondente (analytics/marketing). Implementar com **Google Consent Mode v2** + plataforma de consentimento (CMP).
  - Listar cada ferramenta na política de privacidade/cookies (o que coleta, finalidade, para onde vai).
  - Mascarar campos sensíveis em ferramentas de gravação de sessão.
  - Remover scripts que ninguém usa mais (cada um também pesa no PageSpeed).

### Aviso de cookies
- Banner que informa e **coleta o consentimento** para cookies não essenciais, conforme o **Guia orientativo de cookies da ANPD** (2022):
  - Botões **"Aceitar" e "Rejeitar" com o mesmo destaque** (rejeitar não pode ser escondido).
  - Opção de **gerenciar por categoria** (essenciais sempre ativos; analytics; marketing).
  - **Nada pré-marcado** e nenhum cookie não essencial antes da escolha.
  - Permitir **mudar a escolha depois** (link "Preferências de cookies" no rodapé).
  - Link para a política de cookies.
- Ferramentas: CookieYes, Cookiebot, Usercentrics, Klaro (open-source), `vanilla-cookieconsent` (open-source, leve).
- Guia ANPD: https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf

---

## 2. Documentos obrigatórios / recomendados

### Política de privacidade
Documento público explicando, em linguagem clara:
- Quem é o **controlador** (razão social, CNPJ, contato) e o **encarregado/canal** de privacidade.
- **Quais dados** coleta, **como** (formulário, cookies, integrações), **para quê** e com **qual base legal**.
- **Com quem compartilha** (hospedagem, gateway de pagamento, e-mail marketing, analytics) e se há **transferência internacional** (Vercel, Supabase, Google costumam ter servidores fora do Brasil).
- **Por quanto tempo** guarda.
- **Direitos do titular** e como exercê-los.
- Medidas de segurança, uso de cookies, atualização da política (data da versão).
> ⚠️ Não copie a política de outro site: além de violar direito autoral, ela vai descrever tratamentos que você não faz. Geradores podem ajudar no esqueleto, mas adapte à realidade do seu sistema.

### Termos de serviço (termos de uso)
Contrato entre você e o usuário: o que o serviço oferece, regras de uso (proibições), conta e senha, pagamento/assinatura/renovação/cancelamento, propriedade intelectual, limitação de responsabilidade (dentro do que o CDC permite — cláusulas abusivas são nulas), suspensão de contas, foro, alterações dos termos. Aceite registrado (checkbox no cadastro + versão + data).

### Política de reembolso (trocas e devoluções)
- **Direito de arrependimento (CDC, art. 49):** compras feitas **fora do estabelecimento** (internet, telefone) podem ser canceladas em **7 dias corridos** a partir da compra ou do recebimento, **com devolução integral**, incluindo frete — sem precisar justificar. Isso vale também para assinaturas/infoprodutos digitais na interpretação majoritária.
- **Decreto 7.962/2013:** o site deve informar de forma clara como exercer o arrependimento, e o fornecedor deve comunicar a administradora do cartão para estornar.
- A política deve dizer: prazos (arrependimento e garantia — 30 dias para não duráveis, 90 dias para duráveis em caso de vício, art. 26), como solicitar, quem paga o frete de devolução, prazo e forma do reembolso, regras de cancelamento de assinatura.
- Link: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm

### Dados da empresa / Rodapé com dados (exigência legal)
O **Decreto 7.962/2013 (art. 2º)** exige que sites de comércio eletrônico mostrem em **local de destaque e fácil visualização**:
- **Nome empresarial** e **CNPJ** (ou nome e CPF, se pessoa física);
- **Endereço físico e eletrônico** e demais informações para localização e contato;
- características essenciais do produto, riscos, preço total com taxas e frete, condições da oferta.
Na prática, o **rodapé** concentra: razão social, CNPJ, endereço, telefone/WhatsApp, e-mail, horário de atendimento, links para privacidade, termos, cookies, trocas/reembolso e canal do titular (LGPD). Mesmo sites que não vendem online ganham confiança (e SEO local — ver `07`) mostrando esses dados.

---

## 3. Conteúdo e propriedade intelectual

### Sem avaliações falsas
- Depoimentos, notas, "+10.000 clientes satisfeitos" ou contadores de "pessoas vendo agora" **inventados** configuram **publicidade enganosa** (CDC, arts. 37 e 67 — o art. 67 prevê inclusive crime) e violam o Código do CONAR. Plataformas (Google, Reclame Aqui) também punem avaliações compradas.
- **Faça:** depoimentos reais com autorização por escrito (nome, foto, empresa); avaliações coletadas por ferramenta verificável (Google, Trustpilot, Reclame Aqui); mostrar também avaliações neutras/negativas respondidas.
- Depoimento de influenciador/parceiro pago → sinalizar como publicidade (#publi).
- Imagens "de clientes" geradas por IA se passando por pessoas reais = mesmo problema.

### Copyright das imagens
- **Toda imagem tem dono** (Lei 9.610/1998). "Achei no Google" não é licença. Indenizações por uso indevido de foto são comuns no Brasil.
- **Fontes seguras:**
  - Fotos próprias (com **autorização de uso de imagem** das pessoas que aparecem).
  - Bancos gratuitos com licença clara: Unsplash, Pexels, Pixabay (leia a licença de cada uma).
  - Bancos pagos: Shutterstock, Adobe Stock, Getty, Envato.
  - Ícones/ilustrações com licença: Lucide, Heroicons, unDraw, Storyset (atribuição quando exigida).
- **Imagens geradas por IA:** verifique os termos da ferramenta; evite gerar algo que imite marca, personagem ou pessoa real.
- **Fontes tipográficas** também têm licença (Google Fonts são livres).
- Guarde um registro: imagem → origem → licença → data.

### Riscos jurídicos (resumo)
| Risco | Origem | Prevenção |
|---|---|---|
| Multa/sanção da ANPD, ações de titulares | Vazamento, coleta sem base legal, tracking sem consentimento | Itens de LGPD acima + segurança (`03`) |
| Ações de consumidores / Procon | Sem direito de arrependimento, publicidade enganosa, dados da empresa ausentes | Política de reembolso, rodapé completo, sem avaliações falsas |
| Indenização por direito autoral | Imagens, textos, músicas, fontes sem licença | Registro de licenças |
| Uso indevido de imagem/marca | Foto de pessoa sem autorização; marca de terceiro | Autorizações por escrito; não usar marcas alheias |
| Ação por falta de acessibilidade | LBI art. 63; Ministério Público já moveu ações | Auditoria de acessibilidade (abaixo) |
| Responsabilidade por conteúdo de usuários | Comentários, avaliações, uploads | Termos de uso + canal de denúncia + moderação (Marco Civil, art. 19, e entendimento atualizado do STF em 2025) |
| Spam / disparo em massa | WhatsApp/e-mail sem opt-in (ex.: listas raspadas com Apify) | Consentimento, descadastro, respeitar termos das plataformas |
| Contratos com fornecedores | Hospedagem/SaaS tratando dados sem contrato | Verificar DPA/termos de processamento dos fornecedores |

---

## 4. Acessibilidade

**Por quê:** ~18,6 milhões de brasileiros com deficiência (IBGE/PNAD 2022), além de idosos e pessoas com limitações temporárias. A **LBI (art. 63)** torna obrigatória a acessibilidade nos sites de empresas com sede ou representação no Brasil e de órgãos públicos. Acessibilidade também melhora SEO e usabilidade para todos.

**Padrão de referência:** **WCAG 2.2, nível AA** (W3C) — https://www.w3.org/TR/WCAG22/ · para governo: **eMAG** — https://emag.governoeletronico.gov.br

### Auditoria de acessibilidade
1. **Automática** (pega ~30–40% dos problemas):
   - **Lighthouse** (aba Accessibility no Chrome DevTools / PageSpeed);
   - **axe DevTools** (extensão) e `@axe-core/playwright` nos testes E2E (ver `05`);
   - **WAVE** — https://wave.webaim.org;
   - plugin `eslint-plugin-jsx-a11y` (ou regras de a11y do Biome).
2. **Manual:**
   - Navegar o site inteiro **só com teclado**;
   - Testar com **leitor de tela**: NVDA (Windows, gratuito), VoiceOver (Mac/iPhone), TalkBack (Android);
   - Zoom de 200% sem quebrar o layout; modo escuro; `prefers-reduced-motion`.
3. **Com usuários reais** com deficiência, quando possível.
4. Registrar os problemas como issues e corrigir por PR.

### Alt nas imagens
- Todo `<img>` precisa do atributo `alt`:
  - Imagem **informativa** → descreva o conteúdo/função: `alt="Técnico limpando sofá cinza com extratora"`.
  - Imagem **funcional** (botão/link só com ícone) → descreva a ação: `alt="Abrir carrinho"` (ou `aria-label` no botão).
  - Imagem **decorativa** → `alt=""` (vazio, para o leitor de tela pular).
- Não comece com "imagem de…"; seja objetivo (até ~125 caracteres).
- Bônus: `alt` também ajuda no SEO de imagens.

### Contraste
- Mínimos WCAG AA:
  - **Texto normal:** razão **4,5:1**;
  - **Texto grande** (≥ 24 px, ou ≥ 18,66 px em negrito): **3:1**;
  - **Componentes de interface e ícones** (bordas de input, foco, ícones informativos): **3:1**.
- Cuidado com texto cinza-claro sobre branco, texto sobre foto/gradiente (use overlay), placeholder como único rótulo.
- Não transmitir informação **só por cor** (ex.: erro em vermelho → adicione ícone e texto).
- Ferramentas: WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/), verificador do Coolors, DevTools (mostra a razão ao inspecionar a cor).

### Navegação por teclado
- Tudo que funciona com mouse precisa funcionar com **Tab / Shift+Tab / Enter / Espaço / Esc / setas**.
- **Foco visível** sempre (nunca `outline: none` sem substituto) — use `:focus-visible` com contorno de contraste 3:1.
- Ordem de foco lógica (segue a leitura); evite `tabindex` positivo.
- Use elementos nativos: `<button>` para ações, `<a href>` para navegação (não `<div onClick>`).
- Link "**Pular para o conteúdo**" no topo.
- Modais: prender o foco dentro, fechar com Esc, devolver o foco ao botão que abriu (Radix/shadcn já fazem isso).
- Formulários: `<label>` associado a cada campo; mensagens de erro anunciadas (`aria-live` / `aria-describedby`).

---

## Checklist jurídico/acessibilidade

- [ ] Política de privacidade específica do seu tratamento de dados + canal do titular
- [ ] Termos de serviço com aceite registrado
- [ ] Política de trocas/reembolso com direito de arrependimento de 7 dias
- [ ] Banner de cookies com "Rejeitar" igual a "Aceitar"; tracking só após consentimento
- [ ] Formulários: finalidade, link da política, checkbox de marketing não pré-marcado, só campos necessários
- [ ] Rodapé com razão social, CNPJ, endereço, contatos e links das políticas
- [ ] Nenhum depoimento, número ou avaliação inventada
- [ ] Todas as imagens com licença registrada e autorização de uso de imagem
- [ ] Lighthouse Accessibility ≥ 90 + teste manual com teclado e leitor de tela
- [ ] `alt` em todas as imagens; contraste AA; foco visível
