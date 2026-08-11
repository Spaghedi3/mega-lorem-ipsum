import { SORTABLE, MODALS } from './constants.js';

export const DEFAULTS = {
  page: 1,
  per_page: 25,
  sort: 'id',
  order: 'asc',
  q: '',
  modal: null,
  id: null
};

export function parseQuery(search) {
  const p = new URLSearchParams(search);
  const state = { ...DEFAULTS };

  const page = Number(p.get('page'));
  if (Number.isInteger(page) && page > 0) state.page = page;

  const perPage = Number(p.get('per_page'));
  if (Number.isInteger(perPage) && perPage > 0 && perPage <= 100) state.per_page = perPage;

  const sort = p.get('sort');
  if (SORTABLE.includes(sort)) state.sort = sort;

  if (p.get('order') === 'desc') state.order = 'desc';

  state.q = (p.get('q') ?? '').trim();

  const modal = p.get('modal');
  if (MODALS.includes(modal)) state.modal = modal;

  const id = Number(p.get('id'));
  if (Number.isInteger(id) && id > 0) state.id = id;

  if ((state.modal === 'edit' || state.modal === 'delete') && state.id === null) {
    state.modal = null;
  }

  return state;
}

export function buildQuery(state) {
  const p = new URLSearchParams();

  for (const key of ['page', 'per_page', 'sort', 'order', 'q']) {
    if (state[key] !== DEFAULTS[key]) p.set(key, state[key]);
  }

  if (state.modal) {
    p.set('modal', state.modal);
    if (state.id) p.set('id', state.id);
  }

  const qs = p.toString();
  return qs ? `?${qs}` : '';
}