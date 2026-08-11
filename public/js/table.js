import { listItems, getItem } from './api.js';
import { parseQuery, buildQuery } from './urlstate.js';
import { openCreate, openEdit, openDelete, closeAll,
         setOnSaved, setOnDeleted, setOnClosed } from './modal.js';

const state = parseQuery(location.search);

let pushedForModal = false;
let skipBackOnClose = false;
const LIST_KEYS = ['page', 'per_page', 'sort', 'order', 'q'];

let currentItems = [];

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

    const actions = document.createElement('td');
    actions.className = 'actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.dataset.action = 'edit';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', `Edit ${item.name}`);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.dataset.action = 'delete';
    delBtn.className = 'link-danger';
    delBtn.textContent = 'Delete';
    delBtn.setAttribute('aria-label', `Delete ${item.name}`);

    actions.append(editBtn, delBtn);
    tr.append(actions);

    tbody.append(tr);
  }
}

function renderPagination(meta) {
  pageInfo.textContent = `Page ${meta.page} of ${meta.total_pages || 1}`;
  prevBtn.disabled = meta.page <= 1;
  nextBtn.disabled = meta.page >= meta.total_pages;
}

function urlFor() {
  return buildQuery(state) || location.pathname;
}
function pushUrl() { history.pushState(null, '', urlFor()); }
function replaceUrl() { history.replaceState(null, '', urlFor()); }

function openModal(kind, id, trigger, item) {
  state.modal = kind;
  state.id = id;
  pushUrl();
  pushedForModal = true;
  if (kind === 'new') openCreate(trigger);
  else if (kind === 'edit') openEdit(item, trigger);
  else openDelete(item, trigger);
}

async function syncModal() {
  if (!state.modal) return closeAll();
  if (state.modal === 'new') return openCreate(null);

  let item = currentItems.find((i) => i.id === state.id);
  if (!item) {
    try {
      item = (await getItem(state.id)).data;
    } catch {
      setStatus('That item no longer exists.', 'error');
      state.modal = null;
      state.id = null;
      replaceUrl();
      return;
    }
  }
  if (state.modal === 'edit') openEdit(item, null);
  else openDelete(item, null);
}

async function load() {
  setStatus('Loading...');
  try {
    const { data, meta } = await listItems(state);
    currentItems = data;
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
  replaceUrl();
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
    replaceUrl();
    load();
  }, 300);
});

prevBtn.addEventListener('click', () => {
  if (state.page > 1) {
    state.page--;
    replaceUrl();
    load();
  }
});

nextBtn.addEventListener('click', () => {
  state.page++;
  replaceUrl();
  load();
});

tbody.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const id = Number(btn.closest('tr').dataset.id);
  const item = currentItems.find((i) => i.id === id);
  if (!item) return;

  if (btn.dataset.action === 'edit') openModal('edit', item.id, btn, item);
  if (btn.dataset.action === 'delete') openModal('delete', item.id, btn, item);
});

document.querySelector('#add-btn').addEventListener('click', (e) => {
  openModal('new', null, e.currentTarget);
});

window.addEventListener('popstate', async () => {
  const next = parseQuery(location.search);
  const listChanged = LIST_KEYS.some((k) => next[k] !== state[k]);
  Object.assign(state, next);

  searchInput.value = state.q;
  updateSortIndicators();
  if (listChanged) await load();

  pushedForModal = Boolean(state.modal);
  await syncModal();
});

setOnSaved(() => { skipBackOnClose = true; load(); });

setOnDeleted(() => {
  skipBackOnClose = true;
  if (currentItems.length === 1 && state.page > 1) state.page--;
  load();
});

setOnClosed(() => {
  state.modal = null;
  state.id = null;
  const goBack = pushedForModal && !skipBackOnClose;
  pushedForModal = false;
  skipBackOnClose = false;
  if (goBack) history.back();
  else replaceUrl();
});

(async () => {
  searchInput.value = state.q;
  updateSortIndicators();
  await load();
  if (state.modal) await syncModal();
})();