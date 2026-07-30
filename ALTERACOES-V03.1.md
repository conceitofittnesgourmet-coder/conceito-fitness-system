# V03.1 — Dashboard Executivo

## Backend
- Novo serviço `DashboardExecutivoService` com indicadores por período.
- Novo endpoint autenticado `GET /api/dashboard/executivo?dias=30`.
- Comparação de faturamento com o período anterior.
- Cálculo de faturamento, CMV vendido, lucro bruto, margem, ticket médio e quantidade vendida.
- Integração com registros de CMV da produção e ordens ativas.
- Rankings por lucro, quantidade e margem.
- Alertas de estoque baixo, margem crítica e produção em aberto.
- Séries diárias reais para gráficos e pedidos por horário.

## Painel administrativo
- Dashboard principal convertido para visão executiva.
- Filtro de 7, 15, 30, 60 ou 90 dias.
- KPIs reais de vendas, lucro, CMV, produção, produtos e clientes.
- Gráficos reais de faturamento, CMV, lucro e pedidos por horário.
- Rankings e alertas operacionais.
