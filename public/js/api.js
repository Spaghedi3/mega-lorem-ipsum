const BASE = '/api/items';

async function request(url, options = {}) {
  const res = await fetch(url, options);

  if (res.status === 204) return null;

  let body = null;
  try {
    body = await res.json();
  } catch {}

  if (!res.ok) {
    const err = new Error(body?.error?.message ?? `Request failed (${res.status})`);
    err.status = res.status;
    err.fields = body?.error?.fields ?? {};
    throw err;
  }

  return body;
}

export function listItems({ page = 1, per_page = 25, sort = 'id', order = 'asc', q = '' } = {}) {
  const params = new URLSearchParams({ page, per_page, sort, order });
  if (q) params.set('q', q);
  return request(`${BASE}?${params}`);
}

export function getItem(id) {
  return request(`${BASE}/${id}`);
}

export function createItem(data) {
  return request(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export function updateItem(id, data) {
  return request(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export function deleteItem(id) {
  return request(`${BASE}/${id}`, { method: 'DELETE' });
}