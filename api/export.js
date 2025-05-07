// api/export.js
import * as XLSX from 'xlsx';
import handlerConsulta from './consulta.js';  // importa o seu handler atual

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  // 1) Reutiliza o handler de consulta para obter os dados
  const fakeReq = { method: 'POST', body: req.body };
  let resultado;
  await handlerConsulta(fakeReq, {
    status: () => ({ json: (d) => { resultado = d; } }),
    setHeader: () => {}
  });

  const processos = resultado.processos;

  // 2) Monta uma worksheet a partir do JSON
  const wsData = processos.map(p => ({
    Origem:            p.origem,
    CNPJ:              p.cnpj,
    Processo:          p.processo,
    Descrição:         p.descricao,
    'Última movimentação': p.ultimaMovimentacao
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Processos');

  // 3) Gera o buffer e envia como download
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  res.setHeader('Content-Disposition', 'attachment; filename="processos.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
}
