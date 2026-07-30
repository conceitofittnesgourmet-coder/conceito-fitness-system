# Testes da V01.2

Na raiz do projeto:

```cmd
node --check backend\src\models\produto.js
node --check backend\src\controllers\produtocontroller.js
node --check backend\src\routes\produtoRoutes.js
cd admin
npm run build
cd ..
git diff --check
```

Após o deploy:
1. Abra Cadastro Fiscal no menu.
2. Filtre produtos incompletos.
3. Selecione um produto de teste.
4. Preencha apenas um campo e aplique.
5. Confirme a redução das pendências.
