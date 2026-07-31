# Testes — V04.1

## Validação técnica

Na raiz do projeto:

```cmd
node --check backend\src\models\orcamento.js
node --check backend\src\services\ConversaoOrcamentoService.js
node --check backend\src\controllers\orcamentocontroller.js
node --check backend\src\routes\orcamentoRoutes.js
cd admin
npm run build
cd ..
git diff --check
```

## Teste funcional
1. Abra Orçamentos e crie um orçamento.
2. Em cada item, selecione um produto cadastrado.
3. Salve e altere o status para `aprovado`.
4. Clique no botão mágico de conversão.
5. Confira índice de confiança, sinal, saldo, lucro e margem.
6. Converta.
7. Verifique:
   - status do orçamento `convertido`;
   - pedido criado;
   - contas a receber de sinal e saldo;
   - ordens de produção para itens controlados;
   - segunda tentativa de conversão bloqueada.
8. Teste impressão e WhatsApp.
