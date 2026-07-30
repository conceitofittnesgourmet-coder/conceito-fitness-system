# Validação V03.3.2

```cmd
node --check backend\src\models\cupomclube.js
node --check backend\src\models\campanhaclube.js
node --check backend\src\models\usocupomclube.js
node --check backend\src\services\ClubePromocoesService.js
node --check backend\src\controllers\clubecontroller.js
node --check backend\src\routes\clubeRoutes.js
cd admin
npm run build
cd ..
git diff --check
```
