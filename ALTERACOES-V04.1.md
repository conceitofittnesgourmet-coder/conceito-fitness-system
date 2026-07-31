# V04.1 — Conversão Inteligente de Orçamentos

## Backend
- Assistente de inspeção prévia com índice de confiança, pendências, avisos, custo, lucro e margem estimada.
- Bloqueio de conversão duplicada por marcação atômica de processamento.
- Conversão de orçamento aprovado em pedido.
- Criação de ordens de produção para produtos configurados com controle de produção ou produto composto.
- Criação das contas a receber de sinal e saldo.
- Vínculos persistentes entre orçamento, pedido, ordens de produção e contas a receber.
- Timeline permanente de criação, atualização, conversão e falhas.
- Novos endpoints:
  - GET /api/orcamentos/:id/conversao
  - POST /api/orcamentos/:id/converter

## Frontend
- Seleção de produto cadastrado em cada item do orçamento.
- Botão de Assistente de Conversão para orçamentos aprovados.
- Índice de confiança e painel de pendências/avisos.
- Resumo financeiro com lucro e margem estimados.
- Configuração de forma de pagamento e vencimentos.
- Impressão premium pelo navegador.
- Mensagem pronta para WhatsApp.
