# FirebaseATV

Projeto de Modelagem de Dados de Controle de privilégios e Firebase (Security Tools, realtime database e etc).

Professor:
[Marcos Vinícius Silva Bento](https://github.com/marcmec)

Alunos:
[Danilo Soares Matos](https://github.com/danilosmatos), [Ian Oliveira](https://github.com/ianMonteiro07).

## Objetivo

Sistema de Tickets de suporte simples para demonstrar diferentes níveis de acesso pelo firebase.

A aplicação possui dois tipos de usuário:

- `user`: usuário comum.
- `admin`: administrador.

Cada cargo possui permissões diferentes no banco de dados. O controle de acesso é feito pelo firebase.

O Usuário é capaz de criar conta, logar, criar ticket. 

Já o Admin consegue ver todos os tickets (o usuário só consegue ver o próprio), alterar o estado deles (aberto, andamento e fechado) acessar o admin-data (banco).

Os prints requeridos estão na pasta Prints do repositorio.

## Estrutura do banco

```json
{
  "users": {
    "UID_DO_USUARIO": {
      "name": "Nome do usuário",
      "email": "usuario@email.com",
      "role": "user",
      "createdAt": 1710000000000
    },
    "UID_DO_ADMIN": {
      "name": "Administrador",
      "email": "admin@email.com",
      "role": "admin",
      "createdAt": 1710000000000
    }
  },
  "tickets": {
    "UID_DO_USUARIO": {
      "ID_DO_CHAMADO": {
        "title": "Computador não liga",
        "description": "Descrição do problema",
        "status": "open",
        "createdBy": "UID_DO_USUARIO",
        "ownerEmail": "usuario@email.com",
        "createdAt": 1710000000000,
        "updatedAt": 1710000000000
      }
    }
  },
  "admin-data": {
    "notice": "Mensagem restrita aos administradores",
    "lastUpdated": 1710000000000,
    "updatedBy": "UID_DO_ADMIN"
  }
}
```