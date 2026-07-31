# Testes — V04.2.2

Execute na raiz do projeto, um comando por vez:

```cmd
node --check backend\src\models\grupocomponente.js
node --check backend\src\controllers\grupocomponenteController.js
node --check backend\src\routes\grupoComponenteRoutes.js
```

Depois:

```cmd
cd admin
npm run build
cd ..
git diff --check
```

## Testes funcionais

1. Criar um grupo de escolha única obrigatório.
2. Confirmar que o máximo fica em 1.
3. Criar um grupo de múltipla escolha com mínimo 1 e máximo 2.
4. Editar canais e habilitar iFood.
5. Duplicar um grupo e confirmar que a cópia nasce inativa.
6. Alterar a ordem e clicar em "Salvar ordem".
7. Tentar excluir um grupo que possua opções ou produtos vinculados; a exclusão deve ser bloqueada.
8. Desativar e reativar um grupo pela listagem.
