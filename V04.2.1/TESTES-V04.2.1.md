# Testes da V04.2.1

## Backend

```bash
node --check backend/src/models/produto.js
node --check backend/src/models/opcaocomponente.js
```

## Frontend

```bash
cd admin
npm run build
```

## Integridade do Git

Na raiz do projeto:

```bash
git diff --check
```

## Teste funcional

1. Cadastre ou edite um grupo de componentes.
2. Cadastre opções vinculadas ao grupo.
3. Vincule o grupo a um produto configurável.
4. Abra o produto no Cardápio Online.
5. Confirme mínimo e máximo de escolhas.
6. Confirme o acréscimo de preço.
7. Marque uma opção como indisponível pelo banco/API e confirme que ela fica bloqueada.
