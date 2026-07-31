# Testes V04.3.2

## Sintaxe

- node --check backend/src/models/ifoodevento.js
- node --check backend/src/models/ifoodpedido.js
- node --check backend/src/models/ifoodconfiguracao.js
- node --check backend/src/models/pedido.js
- node --check backend/src/services/IfoodApiService.js
- node --check backend/src/services/IfoodPollingService.js
- node --check backend/src/controllers/ifoodcontroller.js
- node --check backend/src/routes/ifoodRoutes.js
- node --check backend/src/server.js

## Fluxo

1. Salvar credenciais e Merchant ID.
2. Executar polling manual sem eventos e confirmar retorno 0.
3. Criar pedido de teste no portal iFood.
4. Executar polling e confirmar um único pedido no ERP.
5. Executar novamente e confirmar que não houve duplicação.
6. Confirmar que o evento ficou como processado e reconhecido.
7. Ativar polling automático e verificar atualização em até 30 segundos.
