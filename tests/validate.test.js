import { describe, it, expect } from 'vitest';
import { validateItem } from '../public/js/validate.js';
const valid = {
  name: 'Widget',
  category: 'Books',
  price: '19.99',
  stock: '5',
  status: 'available'
};

describe('validateItem', () => {
  it('accepts a valid item', () => {
    const result = validateItem(valid);
    expect(result.valid).toBe(true);
    expect(result.fields).toEqual({});
  });

  it('coerces string inputs to numbers', () => {
    const { values } = validateItem(valid);
    expect(values.price).toBe(19.99);
    expect(values.stock).toBe(5);
  });

  it('rejects an empty name', () => {
  const result = validateItem({ ...valid, name: '' });
  expect(result.valid).toBe(false);
  expect(result.fields.name).toBe('Name is required');
  });

  it('accepts a name of exactly 100 characters', () => {
    const result = validateItem({ ...valid, name: 'a'.repeat(100) });
    expect(result.valid).toBe(true);
  });
  
  it('trims whitespace from name', () => {
    const result = validateItem({ ...valid, name: '  Widget  ' });
    expect(result.valid).toBe(true);
    expect(result.values.name).toBe('Widget');
  });

  it('rejects name over 100 characters', () => {
    const result = validateItem({...valid, name: 'a'.repeat(101) });
    expect(result.valid).toBe(false);
    expect(result.fields.name).toBe('Name must be at most 100 characters');
  });

  it('accepts name at 100 characters', () => {
    const result = validateItem({ ...valid, name: 'a'.repeat(100) });
    expect(result.valid).toBe(true);
  });

  it('rejects unknown category', () => {
    const result = validateItem({ ...valid, category: 'Unknown' });
    expect(result.valid).toBe(false);
    expect(result.fields.category).toBe('Category is invalid');
  });
  
  it('rejects negative price', () => {
    const result = validateItem({ ...valid, price: '-1' });
    expect(result.valid).toBe(false);
    expect(result.fields.price).toBe('Price must be a non-negative number');
  });

  it('rejects non-numeric price', () => {
    const result = validateItem({ ...valid, price: 'abc' });
    expect(result.valid).toBe(false);
    expect(result.fields.price).toBe('Price must be a non-negative number');
  });

  it('rejects negative stock', () => {
    const result = validateItem({ ...valid, stock: '-1' });
    expect(result.valid).toBe(false);
    expect(result.fields.stock).toBe('Stock must be a non-negative integer');
  });

  it('rejects non-integer stock', () => {
    const result = validateItem({ ...valid, stock: '3.5' });
    expect(result.valid).toBe(false);
    expect(result.fields.stock).toBe('Stock must be a non-negative integer');
  });

  it('rejects unknown status', () => {
    const result = validateItem({ ...valid, status: 'unknown' });
    expect(result.valid).toBe(false);
    expect(result.fields.status).toBe('Status is invalid');
  });

  it('rejects empty price', () => {
    const result = validateItem({ ...valid, price: '' });
    expect(result.valid).toBe(false);
    expect(result.fields.price).toBe('Price is required');
  });

  it('reports every field on an empty object', () => {
  const result = validateItem({});
  expect(Object.keys(result.fields)).toHaveLength(5);
  });

});