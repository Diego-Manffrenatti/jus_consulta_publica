import { scrapeCnpjTRF1 } from './playwright-scraper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }
  const { cnpjs } = req.body;
  const resultados = [];

  for (let cnpj of cnpjs) {
    try {
      const procs = await scrapeCnpjTRF1(cnpj);
      for (let p of procs) {
        resultados.push({ origem: 'trf1-pje1g', cnpj, ...p });
      }
    } catch (e) {
      console.error(`Erro scraping ${cnpj}:`, e);
    }
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({ processos: resultados });
}
