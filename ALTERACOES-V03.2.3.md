# V03.2.3 — Área do Cliente, Favoritos e QR Code

## Implementado
- Acesso rápido do cliente por nome e WhatsApp.
- Criação ou atualização automática do cadastro de cliente.
- Sessão local persistente no navegador.
- Modal responsivo "Minha conta".
- Histórico dos últimos 30 pedidos vinculados ao WhatsApp.
- Link de acompanhamento para a tela de tracking já existente.
- Favoritos no cardápio, com persistência local e sincronização no cadastro quando o cliente está identificado.
- Identificação automática de mesa pela URL `?mesa=NUMERO`.
- Inclusão do número da mesa na mensagem final do WhatsApp.

## Observação de segurança
Esta sprint usa acesso rápido por nome e WhatsApp, sem senha e sem código OTP. A autenticação forte do consumidor poderá ser adicionada posteriormente sem quebrar esta estrutura.
