# Testes V01.3

Na raiz do projeto:

```cmd
node --check backend\src\services\nfeService.js
node --check backend\src\controllers\nfeController.js
node --check backend\src\routes\nfeRoutes.js
```

Depois:

```cmd
cd admin
npm run build
cd ..
git diff --check
```

## Teste na tela

1. Abra Fiscal.
2. Selecione um pedido.
3. Preencha o destinatário.
4. Clique em `1. Validar pedido para NF-e`.
5. Confira ambiente, série, próxima numeração, emitente, destinatário, itens e total.
6. Confirme que o segundo botão só é liberado após a validação.
7. Altere um campo do destinatário e confirme que a validação é anulada.
8. Em homologação, só prossiga para transmissão depois de conferir todos os dados.
