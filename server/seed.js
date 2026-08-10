import { faker } from '@faker-js/faker';
import db from './db.js';

faker.seed(42);

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Toys'];

const STATUSES = ['available', 'out of stock', 'discontinued'];

const makeItem = () => {
    return {
        name: faker.commerce.productName(),
        category: faker.helpers.arrayElement(CATEGORIES),
        price: parseFloat(faker.commerce.price()),
        stock: faker.number.int({ min: 0, max: 100 }),
        status: faker.helpers.arrayElement(STATUSES),
        updated_at: faker.date.recent().toISOString(),
    };
}

const insert = db.prepare(`
  INSERT INTO items (name, category, price, stock, status, updated_at)
  VALUES (@name, @category, @price, @stock, @status, @updated_at)
`);

const seed = db.transaction((count) => {
  for (let i = 0; i < count; i++) insert.run(makeItem());
});

db.exec('DELETE FROM items');

seed(200);

console.log(db.prepare('SELECT COUNT(*) AS n FROM items').get());