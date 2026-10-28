# Organização das telas do CalorieSync

Decisão de 19/10/2026: organizar a navegação pelas tarefas do usuário, preservando o Diário (antigo Dashboard) e as APIs existentes.

## Referências e critérios

- [NN/g — Information Architecture vs. Navigation](https://www.nngroup.com/articles/ia-vs-navigation/): definir agrupamentos e rótulos coerentes antes de escolher os controles de navegação.
- [NN/g — Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/): manter tarefas frequentes visíveis e distribuir opções especializadas em páginas secundárias com acesso claro.

Aplicação ao projeto: navegação principal persistente com cinco áreas; navegação local com URLs próprias; formulários independentes por finalidade. É uma decisão de arquitetura baseada nesses princípios e nas tarefas existentes, a validar com uso real; não existe uma divisão universal para toda SPA.

## Mapa implementado

| Área no header | Página | Responsabilidade |
| --- | --- | --- |
| Diário | `/` | Visão e registro do dia; conteúdo preservado |
| Evolução | `/evolucao/alimentacao` | Média e histórico do consumo alimentar |
| Evolução | `/evolucao/corpo` | Histórico de peso/gordura e nova medição |
| Metas | `/metas/rotina` | Objetivo e nível de atividade física |
| Metas | `/metas/diarias` | Metas automáticas ou manuais de calorias e macros |
| Perfil | `/perfil` | Nome, e-mail (não alterável), altura, sexo e nascimento |
| Configurações | `/configuracoes/notificacoes` | Ativação de lembretes e envio de teste |
| Configurações | `/configuracoes/seguranca` | Alteração de senha |
| Configurações | `/configuracoes/privacidade` | Exportação dos dados e exclusão da conta |

Estatísticas e histórico corporal passam a compartilhar a área Evolução, com páginas separadas para preservar os contextos e filtros próprios. Peso/gordura têm um formulário de registro com seletor de data padronizado; altura é alterada diretamente no perfil. Objetivo e rotina ficam juntos porque orientam o cálculo automático; metas numéricas têm confirmação própria.

Cada formulário envia apenas os campos da tarefa atual. O e-mail cadastrado é exibido no perfil mas não é alterável; alterar senha é uma tarefa independente na tela de Segurança. Selecionar o modo das metas não grava dados até confirmar em Aplicar metas. Atualizações invalidam as consultas relacionadas para manter o Diário e as metas sincronizados.

## Navegação e compatibilidade

- Header responsivo com links visíveis e indicação da área atual; menu da conta com acesso direto às configurações específicas.
- Links locais preservam acesso direto, recarga e histórico de voltar/avançar. As páginas permanecem protegidas pela autenticação e pelo onboarding.
- `/estatisticas` redireciona para `/evolucao/alimentacao`; `/medidas` para `/evolucao/corpo`.
- `/evolucao`, `/metas` e `/configuracoes` abrem suas primeiras páginas por redirecionamento com substituição no histórico.
- Nenhuma mudança de banco ou migration é necessária.

## Verificação

Teste inicial reproduz a presença indevida de medidas corporais no perfil. Regressões cobrem separação das telas, payloads independentes, senha para alteração do e-mail, metas automáticas/manuais, rotas protegidas, links antigos e navegação pelo histórico.
