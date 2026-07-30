# Testes da V01.1

## 1. Backend

Na raiz do projeto:

```cmd
node --check backend\src\models\empresa.js
node --check backend\src\controllers\empresacontroller.js
node --check backend\src\services\fiscalReadinessService.js
```

Nenhum comando deve apresentar erro.

## 2. Frontend

```cmd
cd admin
npm run build
cd ..
```

## 3. Teste funcional

1. Faça login no ERP.
2. Abra o novo botão **Empresa**.
3. Clique em **Preencher dados conhecidos**.
4. Confira os dados.
5. Selecione o CRT correto.
6. Clique em **Salvar dados da empresa**.
7. Abra **Fiscal**.
8. Clique em **Atualizar diagnóstico**.
9. As pendências de CNPJ, razão social, IE e endereço devem desaparecer.

## 4. Verificação Git

```cmd
git status
git diff --check
```
