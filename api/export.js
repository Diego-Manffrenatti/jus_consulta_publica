// api/export.js
import * as XLSX from 'xlsx';
import consultaHandler from './consulta.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  // Chama internamente o handler de consulta para obter os dados
  let resultado;
  await consultaHandler(
    { method: 'POST', body: req.body },
    {
      setHeader: () => {},
      status: () => ({ json: (d) => { resultado = d; } })
    }
  );

  const processos = resultado.processos;

  // Converte para planilha
  const wsData = processos.map(p => ({
    Origem:               p.origem,
    CNPJ:                 p.cnpj,
    Processo:             p.processo,
    Descrição:            p.descricao,
    'Última movimentação': p.ultimaMovimentacao
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Processos');

  // Envia como download
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  res.setHeader('Content-Disposition', 'attachment; filename="processos.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
}
