# Testes V04.2.6

## Sintaxe do backend

```cmd
node --check backend\src\services\AuditoriaPersonalizacoesService.js
node --check backend\src\services\PersonalizacaoPedidoService.js
node --check backend\src\controllers\pedidocontroller.js
node --check backend\src\controllers\produtocontroller.js
node --check backend\src\routes\produtoRoutes.js
```

## Build

```cmd
cd admin
npm run build
cd ..
```

## Formatação

```cmd
git diff --check
git status
```

## Teste funcional

1. Abra **Opções por Produto**.
2. Selecione um produto configurável.
3. Clique em **Executar auditoria**.
4. Confirme os contadores e as pendências.
5. Corrija uma pendência e execute novamente.
6. No Cardápio Online, monte um item com personalizações.
7. Edite o item no carrinho.
8. Finalize um pedido e confira total, pagamento, Pedido, Cozinha e Comanda.
9. Tente enviar a mesma opção duplicada ou quantidade inválida por uma requisição manual; o backend deve rejeitar.
