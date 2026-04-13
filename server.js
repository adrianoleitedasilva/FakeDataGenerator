const express = require('express');
const path = require('path');
const {
  faker,
  fakerPT_BR,
  fakerES,
  fakerFR,
  fakerDE,
} = require('@faker-js/faker');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const localeMap = {
  en: faker,
  pt_BR: fakerPT_BR,
  es: fakerES,
  fr: fakerFR,
  de: fakerDE,
};

// Mapeamento de estados brasileiros para DDDs
const BRAZIL_STATE_DDD = {
  'Acre':                 ['68'],
  'Alagoas':              ['82'],
  'Amapá':                ['96'],
  'Amazonas':             ['92', '97'],
  'Bahia':                ['71', '73', '74', '75', '77'],
  'Ceará':                ['85', '88'],
  'Distrito Federal':     ['61'],
  'Espírito Santo':       ['27', '28'],
  'Goiás':                ['62', '64'],
  'Maranhão':             ['98', '99'],
  'Mato Grosso':          ['65', '66'],
  'Mato Grosso do Sul':   ['67'],
  'Minas Gerais':         ['31', '32', '33', '34', '35', '37', '38'],
  'Pará':                 ['91', '93', '94'],
  'Paraíba':              ['83'],
  'Paraná':               ['41', '42', '43', '44', '45', '46'],
  'Pernambuco':           ['81', '87'],
  'Piauí':                ['86', '89'],
  'Rio de Janeiro':       ['21', '22', '24'],
  'Rio Grande do Norte':  ['84'],
  'Rio Grande do Sul':    ['51', '53', '54', '55'],
  'Rondônia':             ['69'],
  'Roraima':              ['95'],
  'Santa Catarina':       ['47', '48', '49'],
  'São Paulo':            ['11', '12', '13', '14', '15', '16', '17', '18', '19'],
  'Sergipe':              ['79'],
  'Tocantins':            ['63'],
};

function generateBrazilianPhone(f, ddd) {
  const n1 = f.string.numeric({ length: 4 });
  const n2 = f.string.numeric({ length: 4 });
  return `(${ddd}) 9${n1}-${n2}`;
}

// Remove acentos, caracteres especiais e espaços para montar o username do email
function toEmailUsername(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics (ã, é, ç…)
    .replace(/[^a-zA-Z\s]/g, '')    // keep only letters and spaces
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '');           // join parts: "Geraldo Silva" → "geraldosilva"
}

// Resolve o username a partir dos campos de nome presentes no schema
function resolveUsername(record, fields) {
  const byType = type => fields.find(f => f.type === type);

  const fullNameField  = byType('fullName');
  const firstNameField = byType('firstName');
  const lastNameField  = byType('lastName');

  if (fullNameField && record[fullNameField.name]) {
    return toEmailUsername(String(record[fullNameField.name]));
  }

  if (firstNameField && lastNameField) {
    const first = record[firstNameField.name] || '';
    const last  = record[lastNameField.name]  || '';
    return toEmailUsername(`${first} ${last}`);
  }

  if (firstNameField && record[firstNameField.name]) {
    return toEmailUsername(String(record[firstNameField.name]));
  }

  if (lastNameField && record[lastNameField.name]) {
    return toEmailUsername(String(record[lastNameField.name]));
  }

  return null;
}

function buildGenerators(f) {
  return {
    firstName:     () => f.person.firstName(),
    lastName:      () => f.person.lastName(),
    fullName:      () => f.person.fullName(),
    motherName:    () => `${f.person.firstName('female')} ${f.person.lastName()}`,
    fatherName:    () => `${f.person.firstName('male')} ${f.person.lastName()}`,
    email:         () => f.internet.email().toLowerCase(),
    username:      () => f.internet.username(),
    password:      () => f.internet.password({ length: 12 }),
    phone:         () => f.phone.number(),
    city:          () => f.location.city(),
    country:       () => f.location.country(),
    state:         () => f.location.state(),
    streetAddress: () => f.location.streetAddress(),
    zipCode:       () => f.location.zipCode(),
    latitude:      () => parseFloat(f.location.latitude()),
    longitude:     () => parseFloat(f.location.longitude()),
    uuid:          () => f.string.uuid(),
    number:        () => f.number.int({ min: 1, max: 9999 }),
    float:         () => parseFloat(f.number.float({ min: 0, max: 9999, fractionDigits: 2 })),
    boolean:       () => f.datatype.boolean(),
    date:          () => f.date.past().toISOString().split('T')[0],
    datetime:      () => f.date.past().toISOString(),
    word:          () => f.lorem.word(),
    sentence:      () => f.lorem.sentence(),
    paragraph:     () => f.lorem.paragraph(),
    companyName:   () => f.company.name(),
    jobTitle:      () => f.person.jobTitle(),
    url:           () => f.internet.url(),
    color:         () => f.color.human(),
    productName:   () => f.commerce.productName(),
    price:         () => parseFloat(f.commerce.price()),
    avatarUrl:     () => f.image.avatar(),
    ipv4:          () => f.internet.ipv4(),
    userAgent:     () => f.internet.userAgent(),
    creditCard:    () => f.finance.creditCardNumber(),
    iban:          () => f.finance.iban(),
    currencyCode:  () => f.finance.currencyCode(),
    amount:        () => parseFloat(f.finance.amount()),
    mimeType:      () => f.system.mimeType(),
    fileName:      () => f.system.fileName(),
    semver:        () => f.system.semver(),
  };
}

app.get('/api/types', (_req, res) => {
  const types = [
    { value: 'firstName',     label: 'First Name',     category: 'Person' },
    { value: 'lastName',      label: 'Last Name',      category: 'Person' },
    { value: 'fullName',      label: 'Full Name',      category: 'Person' },
    { value: 'motherName',    label: "Mother's Name",  category: 'Person' },
    { value: 'fatherName',    label: "Father's Name",  category: 'Person' },
    { value: 'jobTitle',      label: 'Job Title',      category: 'Person' },
    { value: 'email',         label: 'Email',          category: 'Internet' },
    { value: 'username',      label: 'Username',       category: 'Internet' },
    { value: 'password',      label: 'Password',       category: 'Internet' },
    { value: 'url',           label: 'URL',            category: 'Internet' },
    { value: 'ipv4',          label: 'IPv4',           category: 'Internet' },
    { value: 'userAgent',     label: 'User Agent',     category: 'Internet' },
    { value: 'avatarUrl',     label: 'Avatar URL',     category: 'Internet' },
    { value: 'phone',         label: 'Phone',          category: 'Location' },
    { value: 'city',          label: 'City',           category: 'Location' },
    { value: 'country',       label: 'Country',        category: 'Location' },
    { value: 'state',         label: 'State',          category: 'Location' },
    { value: 'streetAddress', label: 'Street Address', category: 'Location' },
    { value: 'zipCode',       label: 'Zip Code',       category: 'Location' },
    { value: 'latitude',      label: 'Latitude',       category: 'Location' },
    { value: 'longitude',     label: 'Longitude',      category: 'Location' },
    { value: 'uuid',          label: 'UUID',           category: 'Misc' },
    { value: 'number',        label: 'Integer',        category: 'Misc' },
    { value: 'float',         label: 'Float',          category: 'Misc' },
    { value: 'boolean',       label: 'Boolean',        category: 'Misc' },
    { value: 'date',          label: 'Date',           category: 'Misc' },
    { value: 'datetime',      label: 'DateTime',       category: 'Misc' },
    { value: 'color',         label: 'Color',          category: 'Misc' },
    { value: 'word',          label: 'Word',           category: 'Text' },
    { value: 'sentence',      label: 'Sentence',       category: 'Text' },
    { value: 'paragraph',     label: 'Paragraph',      category: 'Text' },
    { value: 'companyName',   label: 'Company Name',   category: 'Commerce' },
    { value: 'productName',   label: 'Product Name',   category: 'Commerce' },
    { value: 'price',         label: 'Price',          category: 'Commerce' },
    { value: 'creditCard',    label: 'Credit Card',    category: 'Finance' },
    { value: 'iban',          label: 'IBAN',           category: 'Finance' },
    { value: 'currencyCode',  label: 'Currency Code',  category: 'Finance' },
    { value: 'amount',        label: 'Amount',         category: 'Finance' },
    { value: 'mimeType',      label: 'MIME Type',      category: 'System' },
    { value: 'fileName',      label: 'File Name',      category: 'System' },
    { value: 'semver',        label: 'Semver',         category: 'System' },
  ];
  res.json({ types });
});

app.post('/api/generate', (req, res) => {
  const { fields, count, locale } = req.body;

  if (!Array.isArray(fields) || fields.length === 0) {
    return res.status(400).json({ error: 'At least one field is required.' });
  }

  const clampedCount = Math.min(Math.max(parseInt(count) || 10, 1), 5000);
  const f = localeMap[locale] || faker;
  const generators = buildGenerators(f);

  const emailFields  = fields.filter(field => field.type === 'email');
  const hasNameField = fields.some(field =>
    ['fullName', 'firstName', 'lastName'].includes(field.type)
  );
  const phoneFields  = fields.filter(field => field.type === 'phone');
  const stateField   = fields.find(field => field.type === 'state');
  const parentFields = fields.filter(field => ['motherName', 'fatherName'].includes(field.type));
  const lastNameField  = fields.find(field => field.type === 'lastName');
  const fullNameField  = fields.find(field => field.type === 'fullName');

  const data = [];
  for (let i = 0; i < clampedCount; i++) {
    const record = {};
    for (const field of fields) {
      const gen = generators[field.type];
      record[field.name || field.type] = gen ? gen() : null;
    }

    // Sobrescreve email(s) com username derivado do nome gerado (sempre minúsculo)
    if (emailFields.length > 0 && hasNameField) {
      const username = resolveUsername(record, fields);
      if (username) {
        for (const ef of emailFields) {
          record[ef.name] = `${username}@${f.internet.domainName()}`.toLowerCase();
        }
      }
    }

    // Sobrescreve telefone(s) com DDD correspondente ao estado (pt_BR)
    if (locale === 'pt_BR' && stateField && phoneFields.length > 0) {
      const stateName = record[stateField.name || stateField.type];
      const ddds = BRAZIL_STATE_DDD[stateName];
      if (ddds) {
        const ddd = f.helpers.arrayElement(ddds);
        const phone = generateBrazilianPhone(f, ddd);
        for (const pf of phoneFields) {
          record[pf.name || pf.type] = phone;
        }
      }
    }

    // Sobrenome dos pais igual ao sobrenome da pessoa
    if (parentFields.length > 0) {
      let personLastName = null;
      if (lastNameField) {
        personLastName = record[lastNameField.name || lastNameField.type] || null;
      } else if (fullNameField) {
        const parts = String(record[fullNameField.name || fullNameField.type] || '').split(' ');
        if (parts.length > 1) personLastName = parts[parts.length - 1];
      }

      if (personLastName) {
        for (const pf of parentFields) {
          const current = String(record[pf.name || pf.type] || '');
          const parts = current.split(' ');
          parts[parts.length - 1] = personLastName;
          record[pf.name || pf.type] = parts.join(' ');
        }
      }
    }

    data.push(record);
  }

  res.json({ data, count: data.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Fake Data Generator running at http://localhost:${PORT}`);
});
