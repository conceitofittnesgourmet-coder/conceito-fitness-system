# ERP Conceito — V02.2 Ficha Técnica Inteligente

Extraia este pacote diretamente na raiz do projeto e confirme a substituição dos arquivos.

## Validação obrigatória

```cmd
node --check backend\src\models\fichatecnica.js
node --check backend\src\controllers\fichatecnicacontroller.js
node --check backend\src\routes\fichaTecnicaRoutes.js
cd admin
npm run build
cd ..
git diff --check
```

Não faça o commit caso algum comando apresente erro.
