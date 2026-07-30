# V02.1 — Banco de Ingredientes

Extraia o conteúdo do ZIP na raiz do projeto e confirme a substituição.

Validação:

node --check backend\\src\\models\\materiaprima.js
node --check backend\\src\\controllers\\materiaprimacontroller.js
node --check backend\\src\\routes\\materiaPrimaRoutes.js

cd admin
npm run build
cd ..

git diff --check

A versão preserva os endpoints antigos de matérias-primas e acrescenta busca detalhada, edição, histórico, lotes e movimentações.
