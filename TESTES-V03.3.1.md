# Validação V03.3.1

```cmd
node --check backend\src\models\clubeconfiguracao.js
node --check backend\src\models\movimentoclube.js
node --check backend\src\services\ClubeConceitoService.js
node --check backend\src\controllers\clubecontroller.js
node --check backend\src\routes\clubeRoutes.js
node --check backend\src\models\cliente.js
node --check backend\src\app.js
cd admin
npm run build
cd ..
git diff --check
```
