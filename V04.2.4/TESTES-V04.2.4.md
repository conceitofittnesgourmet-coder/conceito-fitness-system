# Testes — V04.2.4

## Backend

```cmd
node --check backend\src\services\PersonalizacaoProducaoService.js
node --check backend\src\services\ProducaoService.js
node --check backend\src\controllers\producaocontroller.js
node --check backend\src\routes\producaoRoutes.js
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

1. Crie um pedido com massa, recheio, cobertura e observação individual.
2. Abra Pedidos e confirme que todas as escolhas aparecem abaixo do produto.
3. Clique em Comanda e confira a impressão em 80 mm.
4. Abra Cozinha e confirme as personalizações no cartão do pedido.
5. Marque o pedido como prioridade e confirme a ordenação da fila.
6. Avance o pedido de Aguardando para Produção, Pronto e Entregue.
