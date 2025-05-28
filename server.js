import express from 'express';
import consulta from './api/consulta.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/api/consulta', consulta);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
