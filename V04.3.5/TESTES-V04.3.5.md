# Testes — V04.3.5

## Sintaxe

node --check backend/src/models/ifoodauditoria.js
node --check backend/src/services/IfoodReconciliacaoService.js
node --check backend/src/controllers/ifoodcontroller.js
node --check backend/src/routes/ifoodRoutes.js

## Frontend

cd admin
npm run build
cd ..

## Git

git diff --check
git status

## Teste funcional

- Executar auditoria sem consulta remota.
- Executar auditoria com consulta remota.
- Confirmar exibição de métricas e histórico.
- Confirmar filtro por módulo e severidade.
- Testar correção automática apenas em ambiente controlado.
- Reexecutar auditoria e confirmar redução das pendências.
