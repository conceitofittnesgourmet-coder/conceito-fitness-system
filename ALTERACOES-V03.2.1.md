# V03.2.1 — Cardápio Online Premium

## Objetivo

Primeira sprint da evolução do Cardápio Online, com foco em experiência do cliente, identidade visual da Conceito Fitness Gourmet e funcionamento responsivo em celulares, tablets e computadores.

## Implementações

- carregamento real do cardápio ao abrir a página;
- atualização automática por eventos de produtos via Socket.IO;
- estados de carregamento, erro e busca sem resultados;
- cabeçalho responsivo com menu móvel;
- indicador de quantidade de itens no carrinho;
- hero premium com chamadas para o cardápio e WhatsApp;
- busca ampliada por nome, descrição, categoria, restrições e selos;
- categorias em navegação horizontal adaptada ao toque;
- filtros alimentares: Sem glúten, Zero lactose, Zero açúcar, Low carb, Vegano e Proteico;
- botão para limpar filtros;
- seção com todos os produtos filtrados;
- cards de produtos responsivos;
- carrinho adaptado para desktop e celular;
- skeleton loading;
- nova paleta off-white, rosé, verde e dourado;
- acessibilidade básica em botões e navegação.

## Arquivos alterados

- `admin/src/pages/CardapioOnline.jsx`
- `admin/src/styles/CardapioOnline.css`

## Observação

Esta sprint mantém o fluxo atual de finalização pelo WhatsApp. O carrinho transacional, login, checkout e acompanhamento de pedidos serão evoluídos nas próximas entregas do Cardápio Online.
