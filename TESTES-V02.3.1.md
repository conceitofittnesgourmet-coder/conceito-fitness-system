# Testes V02.3.1

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

Teste manual: criar uma ordem, iniciar, concluir com quantidade produzida e criar outra para testar cancelamento com motivo.
