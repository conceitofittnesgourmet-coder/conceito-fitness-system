# Validação V04.0

Na raiz do projeto:

```cmd
node --check backend\src\models\orcamento.js
node --check backend\src\controllers\orcamentocontroller.js
node --check backend\src\routes\orcamentoRoutes.js
node --check backend\src\app.js
cd admin
npm run build
cd ..
git diff --check
```
