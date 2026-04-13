// ── i18n ─────────────────────────────────────────────────────────────────────

const i18n = {
  en: {
    title:            'Fake Data Generator',
    subtitle:         'Build a schema, choose a locale, and generate realistic test data.',
    labelTable:       'Table / entity name',
    placeholderTable: 'users',
    labelRows:        'Rows',
    labelLocale:      'Data locale',
    sectionFields:    'Fields',
    btnAddField:      '+ Add field',
    btnGenerate:      'Generate data',
    btnGenerating:    'Generating…',
    btnCopy:          'Copy',
    btnCopied:        'Copied!',
    btnDownload:      'Download',
    emptyState:       'No fields yet. Click <strong>+ Add field</strong> to get started.',
    placeholderField: 'field_name',
    removeTitle:      'Remove',
    hintGenerated:    n    => `${n} rows generated.`,
    hintNoFields:     ()   => 'Add at least one field first.',
    hintError:        msg  => `Error: ${msg}`,
  },
  pt: {
    title:            'Gerador de Dados Falsos',
    subtitle:         'Monte um schema, escolha o locale e gere dados de teste realistas.',
    labelTable:       'Nome da tabela / entidade',
    placeholderTable: 'usuarios',
    labelRows:        'Linhas',
    labelLocale:      'Locale dos dados',
    sectionFields:    'Campos',
    btnAddField:      '+ Adicionar campo',
    btnGenerate:      'Gerar dados',
    btnGenerating:    'Gerando…',
    btnCopy:          'Copiar',
    btnCopied:        'Copiado!',
    btnDownload:      'Baixar',
    emptyState:       'Nenhum campo ainda. Clique em <strong>+ Adicionar campo</strong> para começar.',
    placeholderField: 'nome_campo',
    removeTitle:      'Remover',
    hintGenerated:    n    => `${n} linhas geradas.`,
    hintNoFields:     ()   => 'Adicione pelo menos um campo primeiro.',
    hintError:        msg  => `Erro: ${msg}`,
  },
};

let currentLang = localStorage.getItem('fdg_lang') || 'en';

function t(key, ...args) {
  const val = i18n[currentLang]?.[key] ?? i18n.en[key];
  return typeof val === 'function' ? val(...args) : val;
}

function applyLang() {
  // text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (key === 'title') document.title = t(key);
    el.textContent = t(key);
  });

  // innerHTML (for elements with embedded tags like <strong>)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });

  // placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  // remove buttons in existing field rows
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.title = t('removeTitle');
  });

  // lang toggle buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });

  document.documentElement.lang = currentLang === 'pt' ? 'pt-BR' : 'en';
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('fdg_lang', lang);
  applyLang();
}

// ── State ─────────────────────────────────────────────────────────────────────

let FIELD_TYPES = [];
let generatedData = [];
let currentTab = 'json';
let dragSrc = null;

// ── Bootstrap ────────────────────────────────────────────────────────────────

async function init() {
  applyLang();

  try {
    const res = await fetch('/api/types');
    const { types } = await res.json();
    FIELD_TYPES = types;

    addField('id',         'uuid');
    addField('name',       'fullName');
    addField('email',      'email');
    addField('phone',      'phone');
    addField('created_at', 'datetime');
  } catch (err) {
    console.error('Failed to load field types:', err);
  }
}

// ── Field rows ───────────────────────────────────────────────────────────────

function buildTypeOptions(selected) {
  const categories = {};
  for (const t of FIELD_TYPES) {
    (categories[t.category] = categories[t.category] || []).push(t);
  }
  return Object.entries(categories)
    .map(([cat, items]) => {
      const opts = items
        .map(item => `<option value="${item.value}"${item.value === selected ? ' selected' : ''}>${item.label}</option>`)
        .join('');
      return `<optgroup label="${cat}">${opts}</optgroup>`;
    })
    .join('');
}

function createFieldRow(name, type) {
  const row = document.createElement('div');
  row.className = 'field-row';
  row.draggable = true;
  row.innerHTML = `
    <div class="drag-handle" title="Drag to reorder">⠿</div>
    <div class="field-name">
      <input type="text" placeholder="${t('placeholderField')}" value="${name}" />
    </div>
    <div class="field-type">
      <select>${buildTypeOptions(type)}</select>
    </div>
    <button class="remove-btn" title="${t('removeTitle')}">×</button>
  `;

  row.querySelector('.remove-btn').addEventListener('click', () => {
    row.remove();
    syncEmptyState();
  });

  row.addEventListener('dragstart', e => {
    dragSrc = row;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => row.classList.add('dragging'), 0);
  });

  row.addEventListener('dragend', () => {
    dragSrc = null;
    row.classList.remove('dragging');
    document.querySelectorAll('.field-row').forEach(r => r.classList.remove('drag-over'));
  });

  row.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (row !== dragSrc) row.classList.add('drag-over');
  });

  row.addEventListener('dragleave', () => row.classList.remove('drag-over'));

  row.addEventListener('drop', e => {
    e.preventDefault();
    row.classList.remove('drag-over');
    if (!dragSrc || dragSrc === row) return;
    const list = document.getElementById('fieldsList');
    const rows = [...list.querySelectorAll('.field-row')];
    const srcIdx = rows.indexOf(dragSrc);
    const tgtIdx = rows.indexOf(row);
    srcIdx < tgtIdx ? row.after(dragSrc) : row.before(dragSrc);
  });

  return row;
}

function addField(name = '', type = 'word') {
  const list  = document.getElementById('fieldsList');
  const empty = document.getElementById('emptyState');
  if (empty) empty.remove();
  list.appendChild(createFieldRow(name, type));
}

function syncEmptyState() {
  const list = document.getElementById('fieldsList');
  if (!list.querySelector('.field-row')) {
    const div = document.createElement('div');
    div.className = 'empty-state';
    div.id = 'emptyState';
    div.setAttribute('data-i18n-html', 'emptyState');
    div.innerHTML = t('emptyState');
    list.appendChild(div);
  }
}

function getFields() {
  return Array.from(document.querySelectorAll('.field-row')).map(row => ({
    name: row.querySelector('input').value.trim() || row.querySelector('select').value,
    type: row.querySelector('select').value,
  }));
}

// ── Generate ─────────────────────────────────────────────────────────────────

async function generate() {
  const fields = getFields();
  if (fields.length === 0) {
    showHint(t('hintNoFields'));
    return;
  }

  const count  = parseInt(document.getElementById('rowCount').value) || 10;
  const locale = document.getElementById('locale').value;
  const btn    = document.getElementById('generateBtn');

  btn.disabled    = true;
  btn.textContent = t('btnGenerating');
  showHint('');

  try {
    const res = await fetch('/api/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fields, count, locale }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || 'Server error');
    }

    const { data } = await res.json();
    generatedData = data;

    const outputSection = document.getElementById('outputSection');
    outputSection.style.display = 'block';
    renderOutput();
    showHint(t('hintGenerated', data.length));
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    showHint(t('hintError', err.message));
  } finally {
    btn.disabled    = false;
    btn.textContent = t('btnGenerate');
  }
}

function showHint(msg) {
  document.getElementById('generateHint').textContent = msg;
}

// ── Output rendering ─────────────────────────────────────────────────────────

function renderOutput() {
  const pre       = document.getElementById('outputContent');
  const tableName = document.getElementById('tableName').value.trim() || 'table_name';

  if (currentTab === 'json') {
    pre.textContent = JSON.stringify(generatedData, null, 2);
  } else if (currentTab === 'csv') {
    pre.textContent = toCSV(generatedData);
  } else {
    pre.textContent = toSQL(generatedData, tableName);
  }
}

function toCSV(data) {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const escape  = v => {
    const s = String(v ?? '');
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(','),
    ...data.map(row => headers.map(h => escape(row[h])).join(',')),
  ].join('\n');
}

function toSQL(data, tableName) {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const cols    = headers.map(h => `\`${h}\``).join(', ');
  const sqlVal  = v => {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'number') return v;
    return `'${String(v).replace(/'/g, "''")}'`;
  };
  const rows = data
    .map(row => `  (${headers.map(h => sqlVal(row[h])).join(', ')})`)
    .join(',\n');
  return `INSERT INTO \`${tableName}\` (${cols})\nVALUES\n${rows};`;
}

// ── Copy / Download ───────────────────────────────────────────────────────────

document.getElementById('copyBtn').addEventListener('click', () => {
  const text = document.getElementById('outputContent').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = t('btnCopied');
    setTimeout(() => (btn.textContent = t('btnCopy')), 1600);
  });
});

document.getElementById('downloadBtn').addEventListener('click', () => {
  const text = document.getElementById('outputContent').textContent;
  const ext  = currentTab === 'json' ? 'json' : currentTab === 'csv' ? 'csv' : 'sql';
  const name = (document.getElementById('tableName').value.trim() || 'data') + '.' + ext;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a    = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(blob),
    download: name,
  });
  a.click();
  URL.revokeObjectURL(a.href);
});

// ── Tabs ──────────────────────────────────────────────────────────────────────

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentTab = tab.dataset.tab;
    if (generatedData.length) renderOutput();
  });
});

// ── Language switcher ─────────────────────────────────────────────────────────

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});

// ── Wire up buttons ───────────────────────────────────────────────────────────

document.getElementById('addFieldBtn').addEventListener('click', () => addField());
document.getElementById('generateBtn').addEventListener('click', generate);

// ── Start ─────────────────────────────────────────────────────────────────────

init();
