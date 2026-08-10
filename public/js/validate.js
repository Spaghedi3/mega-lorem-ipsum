import { CATEGORIES, STATUSES } from './constants.js';

export function validateItem(input) { 
    const fields = {};

    const name = String(input.name ?? '').trim();
    if (name.length === 0) {
        fields.name = 'Name is required';
    } else if (name.length > 100) {
        fields.name = 'Name must be at most 100 characters';  
    }

    const category = String(input.category ?? '').trim();
    if (!CATEGORIES.includes(category)) {
        fields.category = 'Category is invalid';
    }

    const price = Number(input.price);
    if (String(input.price ?? '').trim() === '') {
        fields.price = 'Price is required';
    } else if (!Number.isFinite(price) || price < 0) {
        fields.price = 'Price must be a non-negative number';
    }

    const stock = Number(input.stock);
    if (String(input.stock ?? '').trim() === '') {
        fields.stock = 'Stock is required';
    } else if (!Number.isInteger(stock) || stock < 0) {
        fields.stock = 'Stock must be a non-negative integer';
    }

    const status = String(input.status ?? '').trim();
    if (!STATUSES.includes(status)) {
        fields.status = 'Status is invalid';
    }

    return {
      valid: Object.keys(fields).length === 0,
      fields,
      values: { name, category, price, stock, status }
    };
 }