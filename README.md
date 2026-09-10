# PayAccount API

Protótipo de uma conta de pagamentos integrado à API do microsserviço em `/home/guto/Desktop/opah`.

> Este projeto é uma simulação para desenvolvimento e demonstração. Não é uma instituição financeira, não processa dinheiro real e não deve ser usado com dados reais de clientes.

## O que existe

- onboarding em uma etapa com dados básicos do cliente;
- criação de conta pelo microsserviço de contas;
- dashboard com saldo disponível e status da conta;
- lançamento de créditos pela API;
- lançamento de débitos pela API com validação de saldo;
- extrato com descrição, data, tipo e saldo após cada lançamento;
- mensagens de validação e feedback;
- interface responsiva construída com Bootstrap e CSS próprio.

## Stack

- Node.js
- Express
- Express Handlebars
- Express Session
- Connect Flash
- Bootstrap via CDN

## Executar localmente

Inicie primeiro a API do repositório `case-enterprise-architecture` em `http://localhost:8000`.

```bash
cd /home/guto/Desktop/opah
uvicorn src.interfaces.api.main:app --reload --port 8000
```

```bash
cd /home/guto/Desktop/azc/payaccountapi
npm install
npm start
```

Acesse `http://localhost:8091`.

Se a API estiver em outro endereço, configure `API_BASE_URL`:

```bash
API_BASE_URL=http://localhost:8000 PORT=8091 npm start
```

Para desenvolvimento com reinício automático:

```bash
npm run dev
```

A porta pode ser alterada com a variável `PORT`:

```bash
PORT=8091 npm start
```

## Fluxo demonstrado

1. Abra a página inicial.
2. Entre em **Abrir conta**.
3. Preencha nome, e-mail, documento, data de nascimento e aceite os termos.
4. No dashboard, registre um crédito.
5. Registre um débito menor ou igual ao saldo disponível.
6. Consulte o extrato e o saldo atualizado.

O cadastro, o identificador da conta e o histórico de apresentação ficam na sessão do BFF; saldo e validação dos lançamentos são mantidos pela API. Como o repositório do `opah` é em memória, as contas são perdidas quando a API reinicia.

## Próximas evoluções sugeridas

- persistência com MongoDB/Mongoose;
- autenticação com Passport e verificação de e-mail;
- onboarding em etapas com análise de identidade e status `pending`, `active` ou `rejected`;
- limites transacionais e regras de risco;
- ledger de dupla entrada para saldo;
- idempotency keys e controle de concorrência;
- API autenticada e testes automatizados;
- observabilidade, logs estruturados e proteção de dados;
- integração com um provedor de pagamentos autorizado.
