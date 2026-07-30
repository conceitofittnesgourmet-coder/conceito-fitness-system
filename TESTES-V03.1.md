# Validação da V03.1

Na raiz do projeto:

```cmd
node --check backend\src\services\DashboardExecutivoService.js
node --check backend\src\controllers\dashboardcontroller.js
node --check backend\src\routes\dashboardRoutes.js
```

No painel:

```cmd
cd admin
npm run build
cd ..
git diff --check
```

Teste funcional após o deploy:
- Abrir o Dashboard.
- Alternar os períodos.
- Conferir KPIs, gráficos, rankings e alertas.
