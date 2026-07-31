# Leia-me primeiro — V04.1

1. Extraia este pacote na raiz do projeto e confirme a substituição dos arquivos.
2. Um item só pode ser convertido quando estiver vinculado a um produto cadastrado.
3. O orçamento precisa estar com status `aprovado`.
4. Produtos com `cadastroMestre.producao.controlaProducao = true` ou `produtoComposto = true` geram ordem de produção.
5. A conversão cria contas a receber pendentes; ela não registra o sinal como já recebido.
6. Faça os testes locais antes do commit e deploy.
