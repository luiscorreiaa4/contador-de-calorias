# Organização das telas do CalorieSync

Decisão de 19/10/2026: organizar a navegação pelas tarefas do usuário, preservando o Diário (antigo Dashboard) e as APIs existentes.

## Referências e critérios

- [NN/g — Information Architecture vs. Navigation](https://www.nngroup.com/articles/ia-vs-navigation/): definir agrupamentos e rótulos coerentes antes de escolher os controles de navegação.
- [NN/g — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/): manter tarefas frequentes visíveis e distribuir opções especializadas em páginas secundárias com acesso claro.

Aplicação ao projeto: navegação principal persistente com duas áreas, mais a área da conta; navegação local com URLs próprias; formulários independentes por finalidade. É uma decisão de arquitetura baseada nesses princípios e nas tarefas existentes, a validar com uso real; não existe uma divisão universal para toda SPA.

## Mapa implementado

O app autenticado vive sob `/app` (bloqueado no `robots.txt`, `noindex` via `useNoIndex`). `/` é a landing pública; `/`, `/termos`, `/privacidade` e `/seguranca` são pré-renderadas no build (`frontend/scripts/prerender.mjs`, metadados em `frontend/src/seo/pages.ts`). URLs antigas sem o prefixo (`/historico/*`, `/metas/*`, `/configuracoes/*`, `/conta`, `/perfil`, `/diario/:date`, `/onboarding`) redirecionam para `/app/...`.

| Área | Página | Responsabilidade |
| --- | --- | --- |
| Diário | `/app` | Visão e registro do dia; conteúdo preservado |
| Histórico | `/app/historico/alimentacao` | Média e histórico do consumo alimentar |
| Histórico | `/app/historico/corpo` | Histórico de peso/gordura e nova medição |
| Metas | `/app/metas/rotina` | Objetivo e nível de atividade física |
| Metas | `/app/metas/diarias` | Metas automáticas ou manuais de calorias e macros |
| Perfil | `/app/perfil` | Nome, e-mail (não alterável), altura, sexo e nascimento |
| Configurações | `/app/configuracoes/notificacoes` | Ativação de lembretes e envio de teste |
| Configurações | `/app/configuracoes/seguranca` | Alteração de senha |
| Configurações | `/app/configuracoes/privacidade` | Exportação dos dados e exclusão da conta |

Estatísticas e histórico corporal passam a compartilhar a área Histórico, com páginas separadas para preservar os contextos e filtros próprios. Peso/gordura têm um formulário de registro com seletor de data padronizado; altura é alterada diretamente no perfil. Objetivo e rotina ficam juntos porque orientam o cálculo automático; metas numéricas têm confirmação própria.

Cada formulário envia apenas os campos da tarefa atual. O e-mail cadastrado é exibido no perfil mas não é alterável; alterar senha é uma tarefa independente na tela de Segurança. Em Metas diárias, AUTOMÁTICO é só visualização (valores calculados, TMB e gasto total) e nunca grava sozinho; MANUAL só grava ao confirmar em Aplicar metas. Se a meta salva é manual e o usuário escolhe AUTOMÁTICO, a troca só vale depois de confirmar em Usar metas automáticas; trocar de modo sem confirmar descarta o rascunho e volta ao salvo. Atualizações invalidam as consultas relacionadas para manter o Diário e as metas sincronizados.

## Navegação e compatibilidade

- Header do desktop com Diário e Histórico e indicação da área atual; o menu da conta espelha a tela `/app/conta`: Metas, Perfil, Configurações e Catálogo (admin).
- Links locais preservam acesso direto, recarga e histórico de voltar/avançar. As páginas permanecem protegidas pela autenticação e pelo onboarding.
- `/estatisticas` e `/evolucao` (com subrotas) redirecionam para `/app/historico/alimentacao`; `/medidas` e `/evolucao/corpo` para `/app/historico/corpo`.
- `/app/historico`, `/app/metas` e `/app/configuracoes` abrem suas primeiras páginas por redirecionamento com substituição no histórico.
- Nenhuma mudança de banco ou migration é necessária.

## Navegação mobile, tela Conta e swipe

- **Barra inferior (abaixo de `md`, 4 slots):** `[DIÁRIO] [HISTÓRICO] [+] [CONTA]`. Vidro escuro translúcido sem divisórias; só ícones, sem legendas (o nome acessível vem do `aria-label`); o ícone ativo é preenchido (`aria-current="page"`). O "+" abre o modal de Nova Refeição em qualquer tela (data em exibição no Diário; hoje nas demais) e nunca fica ativo.
- **Auto-ocultar:** some ao rolar para baixo e volta ao rolar para cima; fica sempre visível no topo (`scrollY < 56`), com foco por teclado dentro dela e em `/app/configuracoes/*`. Some enquanto um campo de texto/select está em foco, para não subir com o teclado.
- **HISTÓRICO** abre `/app/historico` e fica ativo só nessa seção. Metas é uma tela separada, acessada pela Conta.
- **`/app/conta`:** hub com cartão do usuário, atalhos para Metas, Perfil e Configurações (e Catálogo, para administradores), alternador de tema e "Sair da conta". Ativa em `/app/conta`, `/app/metas/*`, `/app/perfil` e `/app/configuracoes/*`. No mobile, o menu do avatar do header é substituído por esta tela; no desktop, o menu da conta oferece os mesmos atalhos.
- **Abas de seção:** Histórico, Metas e Configurações têm um único nível de abas, com `SegmentedNav` (caixa e `bg-primary` no ativo). Colunas iguais, sem rolagem horizontal, rótulo curto quando o nome é longo.
- **Filtros ficam no card que afetam:** período (7D | 30D) em Alimentação e métrica (PESO | % GORDURA) em Peso e medidas são `SegmentedToggle` (chips) no cabeçalho do `SectionCard`; o filtro permanece visível nos estados de carregando, erro e vazio. O nome da aba não é repetido na página (título `sr-only` só para a hierarquia de cabeçalhos).
- **Resumos sem grade 2x2:** Alimentação mostra consumo × meta e P/C/G num único card; Peso e medidas mostra Atual/Menor/Maior/Variação numa faixa de 4 colunas dentro do card do gráfico.
- **Swipe horizontal entre os destinos da barra inferior** (Diário ↔ Histórico ↔ Conta), só no mobile e só em toque, sem dar a volta. A tela acompanha o dedo; ao soltar, sai deslizando e a nova entra pelo lado oposto (ou volta ao lugar, com resistência na ponta da fila). Confirma por distância (o maior entre 64 px e 30% da largura) ou por flick (≥ 40 px a ≥ 0,5 px/ms). Com `prefers-reduced-motion`, navega direto. **Não há swipe entre abas irmãs** (Alimentação ↔ Peso e medidas, abas de Configurações): elas só mudam pela barra segmentada. Telas fora da barra (ex.: `/admin/alimentos`, páginas legais) não têm swipe. Como o Diário agora usa o gesto horizontal, a futura navegação por dia (BL-02) precisará de outro gesto. Detalhes em `docs/SPEC.md` (RF-008).
- **Fonte única:** todos os destinos vêm de `frontend/src/navigation/nav-items.ts`.

## Verificação

Teste inicial reproduz a presença indevida de medidas corporais no perfil. Regressões cobrem separação das telas, payloads independentes, senha para alteração do e-mail, metas automáticas/manuais, rotas protegidas, links antigos e navegação pelo histórico.
