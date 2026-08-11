import { listItems } from './api.js';

const state = {
  page: 1,
  per_page: 25,
  sort: 'id',
  order: 'asc',
  q: ''
};

const tbody = document.querySelector('#items-body');
const statusEl = document.querySelector('#status');
const pageInfo = document.querySelector('#page-info');
const prevBtn = document.querySelector('#prev-btn');
const nextBtn = document.querySelector('#next-btn');

function setStatus(text, kind = '') {
  statusEl.textContent = text;
  statusEl.dataset.state = kind;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function renderRows(items) {
  tbody.replaceChildren();

  for (const item of items) {
    const tr = document.createElement('tr');
    tr.dataset.id = item.id;

    const cells = [
      { text: item.id, cls: 'num' },
      { text: item.name },
      { text: item.category },
      { text: item.price.toFixed(2), cls: 'num' },
      { text: item.stock, cls: 'num' },
      { text: item.status },
      { text: formatDate(item.updated_at) }
    ];

    for (const cell of cells) {
      const td = document.createElement('td');
      td.textContent = cell.text;
      if (cell.cls) td.className = cell.cls;
      tr.append(td);
    }

    tbody.append(tr);
  }
}

function renderPagination(meta) {
  pageInfo.textContent = `Page ${meta.page} of ${meta.total_pages || 1}`;
  prevBtn.disabled = meta.page <= 1;
  nextBtn.disabled = meta.page >= meta.total_pages;
}

async function load() {
  setStatus('Loading...');
  try {
    const { data, meta } = await listItems(state);
    renderRows(data);
    renderPagination(meta);
    setStatus(`${meta.total} item${meta.total === 1 ? '' : 's'}`);
  } catch (err) {
    tbody.replaceChildren();
    setStatus(err.message, 'error');
  }
}

const thead = document.querySelector('#items-table thead');

thead.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-sort]');
  if (!btn) return;

  const column = btn.dataset.sort;

  if (state.sort === column) {
    state.order = state.order === 'asc' ? 'desc' : 'asc';
  } else {
    state.sort = column;
    state.order = 'asc';
  }

  state.page = 1;
  updateSortIndicators();
  load();
});

function updateSortIndicators() {
  for (const th of thead.querySelectorAll('th')) {
    const btn = th.querySelector('button[data-sort]');
    if (!btn) continue;

    if (btn.dataset.sort === state.sort) {
      th.setAttribute('aria-sort', state.order === 'asc' ? 'ascending' : 'descending');
    } else {
      th.removeAttribute('aria-sort');
    }
  }
}

const searchInput = document.querySelector('#search');

let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.q = searchInput.value.trim();
    state.page = 1;
    load();
  }, 300);
});

prevBtn.addEventListener('click', () => {
  if (state.page > 1) {
    state.page--;
    load();
  }
});

nextBtn.addEventListener('click', () => {
  state.page++;
  load();
});

load();