# Testes — V03.0

Na raiz do projeto:

```cmd
node --check backend\src\services\ProducaoCalculoService.js
node --check backend\src\services\PlanejamentoProducaoService.js
node --check backend\src\services\OrdemProducaoService.js
node --check backend\src\controllers\producaocontroller.js
node --check backend\src\routes\producaoRoutes.js
```

Depois:

```cmd
cd admin
npm run build
cd ..
git diff --check
```

## Teste funcional

1. Abra Ordens de Produção.
2. Escolha a data e o período histórico.
3. Clique em Gerar sugestão.
4. Confira quantidades, confiança e lista de compras.
5. Edite uma quantidade sugerida.
6. Clique em Criar ordens selecionadas.
7. Confirme se as ordens aparecem na lista.
