# Plano de resposta a incidentes

Para incidentes de segurança com dados pessoais (LGPD, art. 48). Documento operacional curto; não substitui revisão jurídica (ver issue #32).

## 1. O que é um incidente
Acesso, vazamento, alteração ou perda indevida de dados de usuários: banco ou backup exposto, segredo vazado (`JWT_SECRET`, `AUTH_TOKEN_PEPPER`, senha de banco, chave SMTP), conta administrativa invadida, falha que exponha dados de outra pessoa (IDOR).

## 2. Quem decide
O mantenedor do projeto (responsável pelo repositório) conduz e decide. Registrar cada passo com data e hora em um arquivo privado de incidente.

## 3. Primeiras 24 horas
1. **Conter:** revogar o que vazou. Trocar o segredo no Render/Neon/Brevo. Trocar `JWT_SECRET` encerra todas as sessões; aumentar `users.token_version` invalida os tokens de uma conta. Se preciso, suspender o serviço no Render.
2. **Preservar evidências:** exportar logs do Render e o `admin_audit_log` antes de qualquer limpeza (os logs ficam poucos dias).
3. **Avaliar o alcance:** quais dados (cadastro, saúde), de quantos usuários, por quanto tempo, e se houve acesso real ou só exposição.
4. **Corrigir a causa:** branch `fix/...`, PR com o CI verde, deploy (`docs/HOSPEDAGEM.md`, seção de hotfix).

## 4. Comunicação
- **Risco ou dano relevante aos titulares:** comunicar a ANPD e os usuários afetados. O prazo regulamentado pela ANPD é curto (3 dias úteis a partir do conhecimento do incidente, a confirmar com o jurídico antes de depender dele).
- Texto para o usuário: o que aconteceu, quais dados, o que já foi feito, o que a pessoa deve fazer (trocar a senha) e um e-mail de contato.
- Sem risco relevante: registrar internamente a decisão e o motivo.

## 5. Depois
Escrever a causa raiz, o que mudou para não repetir, e atualizar este documento e a política de privacidade se necessário.

## 6. Retenção declarada
Conta excluída: remoção imediata e em cascata no banco. Backups e logs: no máximo 30 dias. O mesmo texto está na Política de Privacidade (`frontend/src/pages/public/LegalPage.tsx`).
