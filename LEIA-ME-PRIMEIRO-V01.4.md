# ERP Conceito — V01.4

Esta atualização conclui o núcleo operacional da NF-e modelo 55 em homologação, reforçando transmissão, consulta, protocolo, XML autorizado e histórico técnico.

## Instalação

Extraia o ZIP diretamente na raiz do projeto e confirme a substituição dos arquivos.

## Validação obrigatória

```cmd
node --check backend\src\models\nfe.js
node --check backend\src\services\nfeService.js
node --check backend\src\controllers\nfeController.js
node --check backend\src\routes\nfeRoutes.js
cd admin
npm run build
cd ..
git diff --check
```

Não faça commit caso algum comando apresente erro.
