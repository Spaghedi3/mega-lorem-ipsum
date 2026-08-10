import  express from 'express';
import { fileURLToPath } from 'node:url';
import router from './routes.js';

const app = express();
const publicPath = fileURLToPath(new URL('../public', import.meta.url));

app.use(express.json());
app.use(express.static(publicPath));
app.use('/api', router);

export default app;