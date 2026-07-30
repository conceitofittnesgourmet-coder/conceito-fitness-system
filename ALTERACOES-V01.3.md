# Alterações V01.3

## Backend

- Novo endpoint `POST /api/nfe/validar/:pedidoId`.
- Validação completa do pedido, empresa, destinatário, produtos, totais e certificado A1.
- Retorno de resumo da futura NF-e:
  - ambiente;
  - série;
  - próxima numeração;
  - emitente;
  - destinatário;
  - itens;
  - total.
- A pré-validação não reserva numeração e não grava documento fiscal.

## Painel

- Fluxo dividido em duas etapas:
  1. Validar pedido para NF-e.
  2. Gerar, assinar e transmitir.
- O botão de transmissão fica bloqueado até a validação passar.
- Alterações no pedido ou destinatário invalidam a validação anterior.
- Resumo visual mostra ambiente de homologação ou produção antes da emissão.
