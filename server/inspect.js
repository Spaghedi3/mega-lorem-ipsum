import db from './db.js';
console.log(db.prepare('SELECT sql FROM sqlite_master WHERE name=?').get('items'));