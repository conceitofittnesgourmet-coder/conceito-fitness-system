# Testes da V01.4

## Testes técnicos

1. Execute os quatro comandos `node --check` descritos no LEIA-ME.
2. Execute `npm run build` dentro da pasta `admin`.
3. Execute `git diff --check` na raiz.

## Testes na tela

1. Abra Fiscal > NF-e.
2. Clique em “Testar SEFAZ”.
3. Confira o código e a mensagem retornados pela SEFAZ.
4. Valide um pedido completo.
5. Emita a nota em homologação.
6. Quando a nota ficar em processamento, clique em “Consultar”.
7. Confira status, cStat, protocolo/recibo, XML e DANFE.

## Resultado esperado

- Status 107 indica serviço em operação.
- NF-e autorizada deve possuir cStat 100 e protocolo.
- O download do XML autorizado deve entregar um `nfeProc` contendo a NF-e e o protocolo.
- Falhas técnicas devem ficar registradas como `erro`, sem apagar o histórico anterior.
