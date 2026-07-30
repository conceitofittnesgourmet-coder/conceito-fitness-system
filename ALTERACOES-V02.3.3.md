# V02.3.3 — Baixa Automática de Estoque

## Implementado

- conclusão transacional da Ordem de Produção;
- revalidação do estoque pela quantidade efetivamente produzida;
- baixa definitiva dos ingredientes;
- movimentação de saída em cada matéria-prima;
- consumo FIFO dos lotes, priorizando validade mais próxima;
- entrada automática do produto acabado;
- geração de lote de produção;
- atualização do custo médio, lucro e margem do produto;
- rastreabilidade completa armazenada na Ordem de Produção;
- proteção contra processamento duplicado da conclusão;
- liberação da reserva lógica após conclusão.

## Segurança

A conclusão usa transação MongoDB. Se qualquer baixa ou entrada falhar, nenhuma alteração parcial é confirmada.
