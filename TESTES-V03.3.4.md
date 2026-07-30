# Validação V03.3.4

```cmd
node --check backend\src\models\missaoclube.js
node --check backend\src\models\progressomissaoclube.js
node --check backend\src\services\ClubeGamificacaoService.js
node --check backend\src\services\ClubeConceitoService.js
node --check backend\src\controllers\clubecontroller.js
node --check backend\src\controllers\pedidocontroller.js
node --check backend\src\routes\clubeRoutes.js
cd admin
npm run build
cd ..
git diff --check
```
