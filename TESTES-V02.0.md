# Testes V02.0

```cmd
node --check backend\src\models\produto.js
node --check backend\src\controllers\produtocontroller.js
node --check backend\src\routes\produtoRoutes.js
cd admin
npm run build
cd ..
git diff --check
```

Abra **Cadastro Mestre** no menu e valide busca, filtro e edição.
