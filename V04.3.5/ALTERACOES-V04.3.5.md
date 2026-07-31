# V04.3.5 — Auditoria, Reconciliação e Testes Finais da Integração iFood

## Implementado

- Auditoria persistente da configuração, polling, eventos, pedidos e catálogo.
- Comparação opcional com itens vendáveis e não vendáveis do catálogo remoto.
- Detecção de eventos com erro, pendentes ou sem acknowledgment local.
- Detecção de pedidos iFood sem vínculo com o ERP e status divergentes.
- Detecção de produtos publicados sem mapeamento, mapeamentos com erro e órfãos.
- Detecção de divergências de preço e disponibilidade.
- Correções automáticas seguras para polling, reenvio de catálogo, preço, disponibilidade e status local.
- Histórico das últimas auditorias.
- Painel administrativo responsivo com filtros por módulo e severidade.

## Novos arquivos

- backend/src/models/ifoodauditoria.js
- backend/src/services/IfoodReconciliacaoService.js
- admin/src/components/IfoodAuditoriaPanel.jsx

## Arquivos alterados

- backend/src/controllers/ifoodcontroller.js
- backend/src/routes/ifoodRoutes.js
- admin/src/pages/IfoodIntegracao.jsx
- admin/src/styles/ifood-integracao.css
