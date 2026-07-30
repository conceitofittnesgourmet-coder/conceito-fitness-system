# Leia-me primeiro — V02.3.3

Esta versão altera estoque real. Faça backup do banco antes do primeiro teste em produção.

O MongoDB Atlas já oferece suporte a transações. Em instalação local, o MongoDB deve operar como replica set.

Fluxo de teste recomendado:

1. cadastrar estoque conhecido em dois ingredientes;
2. criar uma ficha técnica com esses ingredientes;
3. criar e iniciar uma Ordem de Produção;
4. anotar os saldos anteriores;
5. concluir com uma quantidade pequena;
6. conferir as saídas dos ingredientes;
7. conferir a entrada no produto acabado;
8. conferir lote, custo e histórico da ordem.
