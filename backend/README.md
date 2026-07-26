# Módulo de Produção — Conceito Fitness ERP

## Arquivos incluídos

- `backend/src/services/ProducaoService.js`
- `backend/src/controllers/producaoController.js`
- `backend/src/routes/producaoRoutes.js`
- `backend/src/models/pedido.js` (modelo atualizado)

## O que foi implementado

- Fila de produção
- Resumo por status
- Busca individual
- Transições controladas:
  - aguardando → produção
  - produção → aguardando ou pronto
  - pronto → produção ou entregue
- Sincronização entre `statusProducao` e `status`
- Registro de início e fim da produção
- Cálculo do tempo real em minutos
- Checklist
- Prioridade de 0 a 10
- Eventos Socket.IO:
  - `producao-atualizada`
  - `pedido-atualizado`

## Instalação

Copie os arquivos para as pastas correspondentes.

No `backend/src/app.js`, importe:

```js
const producaoRoutes = require("./routes/producaoRoutes");
```

E monte a rota:

```js
app.use("/api/producao", producaoRoutes);
```

Use o mesmo middleware de autenticação/empresa já aplicado nas demais rotas, caso ele seja registrado diretamente no `app.js`.

## Endpoints

### Listar fila aberta

```http
GET /api/producao
```

### Filtrar por status

```http
GET /api/producao?status=aguardando
GET /api/producao?status=producao
GET /api/producao?status=pronto
```

### Resumo

```http
GET /api/producao/resumo
```

### Iniciar produção

```http
PUT /api/producao/:id/status
Content-Type: application/json

{
  "status": "producao"
}
```

### Marcar como pronto

```json
{
  "status": "pronto"
}
```

### Marcar como entregue

```json
{
  "status": "entregue"
}
```

### Atualizar checklist

```http
PUT /api/producao/:id/checklist
```

```json
{
  "checklist": [
    {
      "nome": "Conferir embalagem",
      "concluido": true
    }
  ]
}
```

### Atualizar prioridade

```http
PUT /api/producao/:id/prioridade
```

```json
{
  "prioridade": 5
}
```

## Testes antes do commit

```bash
node --check backend/src/services/ProducaoService.js
node --check backend/src/controllers/producaoController.js
node --check backend/src/routes/producaoRoutes.js
node --check backend/src/models/pedido.js
```

## Observação importante

O nome do arquivo foi mantido exatamente como `ProducaoService.js`. Em Linux/Render, maiúsculas e minúsculas precisam coincidir com o `require`.
