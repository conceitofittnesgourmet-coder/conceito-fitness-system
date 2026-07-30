# Alterações — V03.0

## Backend

### ProducaoCalculoService
Centraliza conversões kg/g, litro/ml e arredondamentos usados pela produção.

### PlanejamentoProducaoService
- Consulta vendas históricas por produto.
- Calcula média diária e demanda projetada.
- Considera estoque atual e ordens ativas na data.
- Consolida necessidades de ingredientes por ficha técnica.
- Calcula faltas para compra.
- Cria ordens em lote.

### Endpoints

- `GET /api/producao/ordens/planejamento/sugestoes`
- `POST /api/producao/ordens/planejamento/criar`

## Frontend

A tela Ordens de Produção recebeu:
- configuração de data, histórico e cobertura;
- tabela de sugestões editáveis;
- indicador de confiança;
- lista automática de compras;
- criação de ordens selecionadas.
