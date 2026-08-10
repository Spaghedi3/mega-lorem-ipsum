import { beforeEach, describe, it, expect } from 'vitest';

process.env.DB_PATH = ':memory:';

const { default: app } = await import('../server/app.js');
const { default: db } = await import('../server/db.js');
const request = (await import('supertest')).default;

const valid = {
  name: 'Test Widget',
  category: 'Books',
  price: '19.99',
  stock: '5',
  status: 'available'
};

const insert = db.prepare(`
  INSERT INTO items (name, category, price, stock, status, updated_at)
  VALUES (@name, @category, @price, @stock, @status, @updated_at)
`);

function reseed() {
  db.exec('DELETE FROM items');
  for (let i = 1; i <= 30; i++) {
    insert.run({
      name: `Item ${i}`,
      category: 'Books',
      price: i * 10,
      stock: i,
      status: 'available',
      updated_at: new Date(Date.UTC(2026, 0, i)).toISOString()
    });
  }
}

beforeEach(reseed);

describe('GET /api/items', () => {
  it('returns a paginated list', async () => {
    const res = await request(app).get('/api/items?per_page=10');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.meta.total).toBe(30);
    expect(res.body.meta.total_pages).toBe(3);
  });

  it('offsets correctly on page 2', async () => {
    const res = await request(app).get('/api/items?per_page=10&page=2');
    expect(res.body.data[0].name).toBe('Item 11');
  });

  it('sorts descending', async () => {
    const res = await request(app).get('/api/items?sort=price&order=desc&per_page=1');
    expect(res.body.data[0].price).toBe(300);
  });

  it('rejects an unknown sort column', async () => {
    const res = await request(app).get('/api/items?sort=hax');
    expect(res.status).toBe(400);
  });

  it('clamps per_page to 100', async () => {
    const res = await request(app).get('/api/items?per_page=9999');
    expect(res.body.meta.per_page).toBe(100);
  });

  it('clamps page to 1', async () => {
    const res = await request(app).get('/api/items?page=-5');
    expect(res.body.meta.page).toBe(1);
  });

  it('filters by name', async () => {
    const res = await request(app).get('/api/items?q=Item 30');
    expect(res.body.meta.total).toBe(1);
  });

  it('filters by category', async () => {
    insert.run({
      name: 'Zebra', category: 'Sports', price: 1, stock: 1,
      status: 'available', updated_at: new Date().toISOString()
    });
    const res = await request(app).get('/api/items?q=Sports');
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].name).toBe('Zebra');
  });

  it('returns an empty page when nothing matches', async () => {
    const res = await request(app).get('/api/items?q=zzzznothing');
    expect(res.body.data).toHaveLength(0);
    expect(res.body.meta.total).toBe(0);
  });

  it('treats SQL metacharacters in the search term as literal text', async () => {
    const res = await request(app).get("/api/items?q=' OR 1=1 --");
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(0);
  });
});

describe('GET /api/items/:id', () => {
  it('returns a single item', async () => {
    const list = await request(app).get('/api/items?per_page=1');
    const id = list.body.data[0].id;
    const res = await request(app).get(`/api/items/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/items/9999');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBeDefined();
  });
});

describe('POST /api/items', () => {
  it('creates an item and coerces numeric strings', async () => {
    const res = await request(app).post('/api/items').send(valid);
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeGreaterThan(0);
    expect(res.body.data.price).toBe(19.99);
    expect(res.body.data.stock).toBe(5);
  });

  it('rejects an empty body with field errors', async () => {
    const res = await request(app).post('/api/items').send({});
    expect(res.status).toBe(422);
    expect(Object.keys(res.body.error.fields)).toHaveLength(5);
  });

  it('stores arbitrary text without mangling it', async () => {
    const name = '<script>alert(1)</script>';
    const res = await request(app).post('/api/items').send({ ...valid, name });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(name);
  });
});

describe('PATCH /api/items/:id', () => {
  it('applies a partial update and leaves other fields intact', async () => {
    const created = await request(app).post('/api/items').send(valid);
    const res = await request(app)
      .patch(`/api/items/${created.body.data.id}`)
      .send({ price: '1.50' });
    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(1.5);
    expect(res.body.data.name).toBe(valid.name);
  });

  it('rejects an invalid partial update', async () => {
    const created = await request(app).post('/api/items').send(valid);
    const res = await request(app)
      .patch(`/api/items/${created.body.data.id}`)
      .send({ stock: '3.5' });
    expect(res.status).toBe(422);
    expect(res.body.error.fields.stock).toBeDefined();
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).patch('/api/items/9999').send({ price: '1' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/items/:id', () => {
  it('deletes an item', async () => {
    const created = await request(app).post('/api/items').send(valid);
    const id = created.body.data.id;
    expect((await request(app).delete(`/api/items/${id}`)).status).toBe(204);
    expect((await request(app).get(`/api/items/${id}`)).status).toBe(404);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).delete('/api/items/9999');
    expect(res.status).toBe(404);
  });
});