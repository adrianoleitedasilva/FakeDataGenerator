# Fake Data Generator

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB) ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

Aplicação web para gerar dados falsos e realistas para popular bancos de dados. Monte um schema visualmente, escolha o locale dos dados e exporte em JSON, CSV ou SQL.

## Stack

- **Backend:** Node.js + Express
- **Frontend:** HTML + CSS + JavaScript (vanilla)
- **Geração de dados:** [@faker-js/faker](https://fakerjs.dev/)

## Funcionalidades

- Schema builder visual — adicione e remova campos livremente
- 41 tipos de dados organizados por categoria (Person, Internet, Location, Commerce, Finance, System…)
- Consistência nome ↔ email: se o schema tiver um campo de nome e um de email, o username do email é derivado automaticamente do nome gerado (`Geraldo Silva` → `geraldosilva@dominio.com`)
- Consistência sobrenome dos pais: se o schema incluir `motherName` ou `fatherName` junto com `lastName` ou `fullName`, o sobrenome dos pais é automaticamente ajustado para coincidir com o sobrenome da pessoa gerada
- Consistência telefone ↔ estado (pt_BR): se o locale for Português BR e o schema tiver `state` e `phone`, o DDD do telefone é selecionado automaticamente conforme o estado gerado
- 5 locales para os dados gerados: English, Português BR, Español, Français, Deutsch
- Exportação em **JSON**, **CSV** e **SQL INSERT**
- Copiar para clipboard e download do arquivo
- Limite de até **5.000 linhas** por geração
- Interface em **Português BR** ou **Inglês** (preferência salva no localStorage)

## Estrutura

```
fake-data-generator/
├── server.js          # Express + lógica de geração
├── package.json
└── public/
    ├── index.html
    ├── style.css
    └── app.js         # UI, i18n, chamadas à API
```

## Instalação e uso

```bash
# Instalar dependências
npm install

# Iniciar o servidor
npm start

# Ou com auto-reload durante desenvolvimento
npm run dev
```

Acesse `http://localhost:3000` no navegador.

A porta padrão é `3000`. Para usar outra porta:

```bash
PORT=8080 npm start
```

## Regras de consistência

O gerador aplica automaticamente três regras de consistência entre campos relacionados:

### 1. Nome → Email

Se o schema incluir um campo de nome (`fullName`, `firstName` e/ou `lastName`) junto com um campo `email`, o username do email é derivado do nome gerado — sem acentos, sem espaços, tudo em minúsculo.

| Campos no schema | Exemplo gerado |
|------------------|----------------|
| `fullName` + `email` | `Geraldo Silva` → `geraldosilva@dominio.com` |
| `firstName` + `lastName` + `email` | `Ana` + `Souza` → `anasouza@dominio.com` |
| `firstName` + `email` | `Carlos` → `carlos@dominio.com` |

### 2. Sobrenome dos pais

Se o schema incluir `motherName` ou `fatherName` junto com `lastName` ou `fullName`, o último sobrenome dos pais é substituído pelo sobrenome da pessoa gerada, mantendo a coerência familiar.

**Exemplo:** pessoa `João Silva` → mãe `Maria Silva`, pai `Roberto Silva`.

### 3. Telefone → DDD por estado (pt_BR)

Exclusivo para o locale **Português BR**: se o schema incluir `state` e `phone`, o DDD do número de telefone é automaticamente escolhido dentre os DDDs válidos do estado gerado.

**Exemplo:** estado `São Paulo` → telefone `(11) 9XXXX-XXXX`; estado `Bahia` → `(71) 9XXXX-XXXX`.

## API

### `GET /api/types`

Retorna a lista de tipos de dados disponíveis.

```json
{
  "types": [
    { "value": "firstName", "label": "First Name", "category": "Person" },
    ...
  ]
}
```

### `POST /api/generate`

Gera os registros com base no schema enviado.

**Body:**

```json
{
  "fields": [
    { "name": "id",         "type": "uuid" },
    { "name": "name",       "type": "fullName" },
    { "name": "email",      "type": "email" },
    { "name": "created_at", "type": "datetime" }
  ],
  "count": 10,
  "locale": "pt_BR"
}
```

| Campo    | Tipo     | Descrição                                           |
|----------|----------|-----------------------------------------------------|
| `fields` | array    | Lista de campos com `name` e `type`                 |
| `count`  | number   | Quantidade de registros (1–5000, padrão: 10)        |
| `locale` | string   | `en`, `pt_BR`, `es`, `fr` ou `de` (padrão: `en`)   |

**Response:**

```json
{
  "data": [
    {
      "id": "a3f1c...",
      "name": "Geraldo Silva",
      "email": "geraldosilva@exemplo.com.br",
      "created_at": "2024-03-15T10:22:00.000Z"
    }
  ],
  "count": 10
}
```

## Tipos de dados disponíveis

| Categoria | Tipos |
|-----------|-------|
| **Person** | firstName, lastName, fullName, motherName, fatherName, jobTitle |
| **Internet** | email, username, password, url, ipv4, userAgent, avatarUrl |
| **Location** | phone, city, country, state, streetAddress, zipCode, latitude, longitude |
| **Misc** | uuid, number, float, boolean, date, datetime, color |
| **Text** | word, sentence, paragraph |
| **Commerce** | companyName, productName, price |
| **Finance** | creditCard, iban, currencyCode, amount |
| **System** | mimeType, fileName, semver |
