# ERP Conceito — V01.2 Cadastro Fiscal Inteligente

Extraia este ZIP diretamente na pasta raiz do projeto, a pasta que contém `admin` e `backend`.

Exemplo:

```text
C:\Users\Windows\site-conceito\projeto
```

Confirme a substituição dos arquivos existentes. A estrutura correta deve continuar sendo:

```text
projeto\admin
projeto\backend
```

Não extraia dentro de `admin` nem dentro de `backend`.

## Validação

```cmd
node --check backend\src\models\produto.js
node --check backend\src\controllers\produtocontroller.js
node --check backend\src\routes\produtoRoutes.js
cd admin
npm run build
cd ..
git diff --check
```
