# V04.3.2 — Recebimento de Pedidos do iFood

- Polling oficial a cada 30 segundos, controlado pelo painel.
- Header `x-polling-merchants` com a loja selecionada.
- Persistência de eventos antes do acknowledgment.
- Deduplicação por eventId e orderId.
- Consulta dos detalhes completos em `GET /orders/{id}`.
- Importação do pedido para o modelo Pedido do ERP.
- Atualização dos status posteriores do pedido.
- Histórico administrativo de eventos e pedidos importados.
- Execução manual para homologação e diagnóstico.
