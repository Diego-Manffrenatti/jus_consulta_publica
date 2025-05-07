import express from 'express';
import bodyParser from 'body-parser';
import consultaHandler from './api/consulta.js';

const app = express();
app.use(bodyParser.json());

// Rota principal
app.post('/api/consulta', consultaHandler);

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server local rodando em http://localhost:${PORT}`);
});
