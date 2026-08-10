import { Router } from 'express';
import db from './db.js';
import { validateItem } from '../public/js/validate.js';

const router = Router();

const SORTABLE = ['id', 'name', 'category', 'price', 'stock', 'status', 'updated_at'];

router.get('/items', (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const per_page = Math.min(100, Math.max(1, Number(req.query.per_page) || 25));

  const sort = String(req.query.sort ?? 'id');
  if (!SORTABLE.includes(sort)) {
    return res.status(400).json({ error: { message: 'Invalid sort column' } });
  }

  const order = req.query.order === 'desc' ? 'DESC' : 'ASC';
  const q = String(req.query.q ?? '').trim();

  const where = q ? 'WHERE name LIKE @like OR category LIKE @like' : '';
  const params = q ? { like: `%${q}%` } : {};

  const { total } = db
    .prepare(`SELECT COUNT(*) AS total FROM items ${where}`)
    .get(params);

  const rows = db
    .prepare(`
      SELECT * FROM items
      ${where}
      ORDER BY ${sort} ${order}
      LIMIT @limit OFFSET @offset
    `)
    .all({ ...params, limit: per_page, offset: (page - 1) * per_page });

  res.json({
    data: rows,
    meta: { page, per_page, total, total_pages: Math.ceil(total / per_page) }
  });
});

router.get('/items/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: { message: 'Item not found' } });
  res.json({ data: item });
});

router.post('/items', (req, res) => {
  const { valid, fields, values } = validateItem(req.body ?? {});
  if (!valid) {
    return res.status(422).json({ error: { message: 'Validation failed', fields } });
  }

  const info = db.prepare(`
    INSERT INTO items (name, category, price, stock, status, updated_at)
    VALUES (@name, @category, @price, @stock, @status, @updated_at)
  `).run({ ...values, updated_at: new Date().toISOString() });

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ data: item });
});

router.patch('/items/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: { message: 'Item not found' } });

  const { valid, fields, values } = validateItem({ ...existing, ...req.body });
  if (!valid) {
    return res.status(422).json({ error: { message: 'Validation failed', fields } });
  }

  db.prepare(`
    UPDATE items
    SET name = @name, category = @category, price = @price,
        stock = @stock, status = @status, updated_at = @updated_at
    WHERE id = @id
  `).run({ ...values, updated_at: new Date().toISOString(), id: existing.id });

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(existing.id);
  res.json({ data: item });
});

router.delete('/items/:id', (req, res) => {
    const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: { message: 'Item not found' } });

    db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
    res.status(204).send();
});

export default router;