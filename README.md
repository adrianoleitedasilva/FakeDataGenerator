# Fake Data Generator

Aplicação web para gerar dados falsos e realistas para popular bancos de dados. Monte um schema visualmente, escolha o locale dos dados e exporte em JSON, CSV ou SQL.

## Stack

- **Backend:** Node.js + Express
- **Frontend:** HTML + CSS + JavaScript (vanilla)
- **Geração de dados:** [@faker-js/faker](https://fakerjs.dev/)

## Funcionalidades

- Schema builder visual — adicione e remova campos livremente
- 38 tipos de dados organizados por categoria (Person, Internet, Location, Commerce, Finance, System…)
- Consistência nome ↔ email: se o schema tiver um campo de nome e um de email, o username do email é derivado automaticamente do nome gerado (`Geraldo Silva` → `geraldosilva@dominio.com`)
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
| **Person** | firstName, lastName, fullName, jobTitle |
| **Internet** | email, username, password, url, ipv4, userAgent, avatarUrl |
| **Location** | phone, city, country, state, streetAddress, zipCode, latitude, longitude |
| **Misc** | uuid, number, float, boolean, date, datetime, color |
| **Text** | word, sentence, paragraph |
| **Commerce** | companyName, productName, price |
| **Finance** | creditCard, iban, currencyCode, amount |
| **System** | mimeType, fileName, semver |
