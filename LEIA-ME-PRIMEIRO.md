# ERP Conceito V01.1 — Módulo Empresa

Este pacote deve ser extraído **na raiz do projeto**, na pasta que contém `admin` e `backend`.

Estrutura correta após a extração:

```text
projeto/
├── admin/src/pages/Empresa.jsx
├── admin/src/styles/empresa.css
├── admin/src/layouts/AdminLayout.jsx
├── admin/src/App.jsx
├── backend/src/models/empresa.js
├── backend/src/controllers/empresacontroller.js
└── backend/src/services/fiscalReadinessService.js
```

Não extraia o pacote de dentro da pasta `admin` ou `backend`.

## O que foi implementado

- Novo botão **Empresa** no menu, logo abaixo de Clientes.
- Nova rota administrativa `/empresa` protegida por login.
- Tela completa para identificação, endereço fiscal, contatos e dados comerciais.
- Botão para preencher os dados oficiais já conhecidos da Conceito Fitness Gourmet.
- Persistência pelo endpoint existente `/api/empresa`.
- Sincronização dos campos legados `endereco`, `cidade`, `estado` e `cep`.
- Integração imediata com o diagnóstico da NF-e.
- Atalho técnico no diagnóstico fiscal para apontar pendências de empresa/endereço para `/empresa`.

## Atenção ao CRT

O botão de preenchimento automático **não altera o CRT**. Confirme com a contabilidade se o código correto é:

- 1 — Simples Nacional
- 2 — Simples Nacional com excesso de sublimite
- 3 — Regime Normal
- 4 — MEI

O cadastro estadual apresentado anteriormente indica regime normal, mas essa escolha deve ser confirmada com a contabilidade antes da emissão fiscal.
