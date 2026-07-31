# V04.2.1 — Base de Produtos Personalizáveis

Esta etapa prepara o configurador do cardápio para bolos e demais produtos com massa, recheio, cobertura, tamanho e adicionais.

## Arquivos para substituir

- `backend/src/models/produto.js`
- `backend/src/models/opcaocomponente.js`
- `admin/src/components/ConfiguradorUniversal/configuradorUtils.js`
- `admin/src/components/CardapioOnline/GrupoConfiguracao.jsx`
- `admin/src/components/CardapioOnline/ProdutoModal.jsx`
- `admin/src/styles/CardapioOnline.css`

## O que foi incluído

- opções permitidas por produto e grupo;
- opções pré-selecionadas;
- visibilidade da opção por canal;
- controle de disponibilidade e estoque da opção;
- filtro automático de opções no cardápio;
- validação real de mínimo e máximo de escolhas;
- bloqueio visual de opção indisponível;
- correção da inicialização do modal ao trocar de produto.

Não exige migração manual do MongoDB. Os novos campos possuem valores padrão e os cadastros atuais continuam compatíveis.
