import  express from 'express';
import { fileURLToPath } from 'node:url';
import router from './routes.js';

const app = express();
const publicPath = fileURLToPath(new URL('../public', import.meta.url));

app.use(express.json());
app.use('/api', router);
app.use(express.static(publicPath));

app.listen(3000, () => console.log('http://localhost:3000'));