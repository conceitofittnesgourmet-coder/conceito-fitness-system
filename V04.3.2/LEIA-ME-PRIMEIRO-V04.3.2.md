# Instalação V04.3.2

Extraia o pacote na raiz do projeto. Antes de ativar o polling automático:

1. Confirme Client ID, Client Secret e Merchant ID.
2. Execute o teste de conexão.
3. Clique em **Executar polling agora**.
4. Confira eventos e pedidos importados.
5. Somente então ative `Integração ativa`, `Sincronizar pedidos` e `Polling automático`.

O polling automático roda a cada 30 segundos. Eventos de pedido são armazenados antes do acknowledgment. Se os detalhes de um pedido ainda não estiverem disponíveis, o evento não é reconhecido e será tentado novamente.
