# Testes — V03.2.3

## Backend
```cmd
node --check backend\src\models\cliente.js
node --check backend\src\controllers\clientecontroller.js
node --check backend\src\controllers\pedidocontroller.js
node --check backend\src\routes\clienteRoutes.js
node --check backend\src\routes\pedidoRoutes.js
```

## Frontend
```cmd
cd admin
npm run build
cd ..
git diff --check
```

## Testes funcionais
1. Abra o cardápio e clique em "Minha conta".
2. Informe nome e WhatsApp.
3. Feche e reabra o modal para confirmar a sessão.
4. Favorite um produto, atualize a página e confirme a permanência.
5. Abra `/cardapio-online?mesa=12` e confirme a identificação da mesa.
6. Consulte o histórico com um WhatsApp que possua pedidos.
7. Clique em "Acompanhar" em um pedido.
