import express from 'express';
import consultaHandler from './api/consulta.js';

const app = express();
app.use(express.json());

// Rota idêntica à Vercel
app.post('/api/consulta', consultaHandler);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server local rodando em http://localhost:${PORT}`);
});
