# Testes — V04.2.3

## Backend

```cmd
node --check backend\src\models\pedido.js
node --check backend\src\services\PersonalizacaoPedidoService.js
node --check backend\src\controllers\pedidocontroller.js
```

## Frontend

```cmd
cd admin
npm run build
cd ..
```

## Git

```cmd
git diff --check
git status
```

## Teste funcional

1. Abra um produto configurável no Cardápio Online.
2. Escolha massa, recheio, cobertura e adicionais.
3. Em um grupo com repetição, aumente e diminua a quantidade da opção.
4. Adicione o produto ao carrinho.
5. Confira o resumo separado por grupo.
6. Clique no lápis para editar.
7. Troque uma opção, altere a quantidade e salve.
8. Atualize a página e confirme que o carrinho permanece salvo.
9. Confira a mensagem final do WhatsApp.
10. Ao usar a API de pedidos, confirme que `produtos[].configuracoes`, `adicionais` e `observacaoItem` foram gravados.
