# V04.2.3 — Carrinho com Personalizações

## Implementado

- Carrinho passa a guardar personalizações em formato estruturado.
- Resumo separado por grupo: massa, recheio, cobertura, adicionais e outros.
- Edição completa do item já adicionado ao carrinho.
- Alteração de quantidade, opções e observação sem duplicar o item anterior.
- Quantidade por opção para grupos que permitem repetição.
- Cálculo de adicionais considerando quantidade da opção.
- Identificador de carrinho baseado nas opções, quantidades e observação.
- Mensagem do WhatsApp com grupos e escolhas organizados.
- Snapshot das personalizações no pedido.
- Validação no backend contra opções inválidas, indisponíveis ou não permitidas.
- Preço adicional recalculado pelo backend com dados cadastrados no banco.

## Segurança

O backend não confia no nome ou no preço adicional enviado pelo navegador. Ao criar um pedido, os grupos e opções são consultados novamente no MongoDB, validados e gravados como snapshot.
