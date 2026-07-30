# Validação da V03.3.3

```cmd
node --check backend\src\models\planoassinaturaclube.js
node --check backend\src\models\assinaturaclube.js
node --check backend\src\controllers\clubecontroller.js
node --check backend\src\routes\clubeRoutes.js
node --check backend\src\services\ClubeConceitoService.js

cd admin
npm run build
cd ..

git diff --check
```

## Teste funcional sugerido
1. Abra Clube Conceito > Planos e crie um plano.
2. Abra Assinaturas e vincule o plano a um cliente.
3. Confira os indicadores e a carteira do cliente no Cardápio Online.
4. Altere o status da assinatura e confirme a atualização.
