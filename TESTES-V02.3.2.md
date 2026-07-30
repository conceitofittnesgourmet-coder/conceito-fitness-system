# Testes V02.3.2

```cmd
node --check backend\src\models\ordemproducao.js
node --check backend\src\services\OrdemProducaoService.js
node --check backend\src\controllers\producaocontroller.js
node --check backend\src\routes\producaoRoutes.js
cd admin
npm run build
cd ..
git diff --check
```

Teste funcional: crie uma OP, clique em Conferir ingredientes e tente iniciar com estoque suficiente e insuficiente.
