# Testes — V02.3.3

## Validação técnica

```cmd
node --check backend\src\models\ordemproducao.js
node --check backend\src\models\produto.js
node --check backend\src\services\OrdemProducaoService.js
node --check backend\src\controllers\producaocontroller.js
node --check backend\src\routes\producaoRoutes.js

cd admin
npm run build
cd ..

git diff --check
```

## Casos funcionais

- concluir uma OP com estoque suficiente;
- confirmar baixa de todos os ingredientes;
- confirmar entrada do produto acabado;
- confirmar geração do lote `PRD-*`;
- confirmar custo médio, lucro e margem;
- tentar concluir novamente e confirmar bloqueio;
- tentar concluir com estoque insuficiente e confirmar que nenhum saldo foi alterado;
- cancelar uma OP em produção e confirmar que não houve baixa física;
- em ingrediente com lote, confirmar consumo pela validade mais próxima.
