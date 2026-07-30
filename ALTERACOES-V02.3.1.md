# V02.3.1 — Ordens de Produção

- Novo modelo persistente de Ordem de Produção.
- Código automático no padrão OP-AAAAMMDD-XXXXXXXX.
- Produto, ficha técnica vinculada, quantidade, unidade, responsável, prioridade e data planejada.
- Status: aberta, em produção, concluída e cancelada.
- Transições de status validadas no backend.
- Histórico de criação, edição, início, conclusão e cancelamento.
- Nova tela `/producao/ordens` com painel, busca, filtros e ações operacionais.
- Nesta etapa não há baixa automática de ingredientes nem entrada de produto acabado.
