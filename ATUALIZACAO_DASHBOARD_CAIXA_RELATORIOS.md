# Atualização — Dashboard, Caixa, Financeiro, Analytics e Relatórios

## Como aplicar
1. Faça uma cópia de segurança do projeto atual.
2. Extraia este ZIP na pasta raiz do projeto `ERP-Conceito`.
3. Confirme a substituição dos arquivos existentes.
4. Faça o commit e o deploy do backend.
5. Não é necessário alterar o banco manualmente: os novos campos do MongoDB serão criados automaticamente nos próximos registros.

## O que foi corrigido
- Dashboard e Analytics passam a usar o mês atual como período padrão e zeram naturalmente na virada do mês.
- Indicadores de hoje, últimos 7 dias e mês usam o fuso de São Paulo.
- Formas de pagamento com pagamento dividido são somadas corretamente.
- Custos usam o custo gravado no momento da venda (`custoNaVenda`).
- Cada nova venda é vinculada ao caixa aberto no momento da criação.
- Ao fechar o caixa, os totais são gravados como fotografia definitiva do fechamento.
- Pedidos posteriores não alteram mais um caixa já fechado.
- Relatórios usam o mês atual por padrão e respeitam datas informadas.
- Financeiro usa movimentações do mês atual por padrão.
- Cancelamentos são excluídos dos totais de vendas.
- Consultas passam a respeitar a empresa do usuário autenticado quando essa informação existe no token.

## Testes recomendados
1. Abra o caixa com saldo inicial conhecido.
2. Faça uma venda em dinheiro e outra em PIX.
3. Confira Caixa, Dashboard, Analytics e Relatório do dia.
4. Feche o caixa e anote o total.
5. Faça uma nova venda após abrir outro caixa.
6. Confirme que o fechamento anterior não mudou.
7. Selecione um período do mês anterior no Relatório e confirme que os dados históricos continuam disponíveis.
