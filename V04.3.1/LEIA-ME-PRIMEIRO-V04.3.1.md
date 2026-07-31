# Instalação

Extraia o conteúdo na raiz do projeto.

No Render, configure `IFOOD_ENCRYPTION_KEY` com uma senha longa e exclusiva. Opcionalmente, configure também `IFOOD_CLIENT_ID` e `IFOOD_CLIENT_SECRET`; quando presentes, essas variáveis têm prioridade sobre o banco.

Esta etapa não inicia polling nem recebe pedidos. Ela valida a conexão antes de ativarmos o fluxo operacional.
