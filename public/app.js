// app.js
const API_URL = window.location.origin + '/api/consulta';

// utilitário para formatar CNPJ
function formatCnpj(raw) {
  const d = raw.replace(/\D/g, '').padStart(14, '0');
  return d.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

document.getElementById('btnConsulta').onclick = async () => {
  const txt = document.getElementById('input').value.trim();
  const raws = txt.split('\n').map(s => s.trim()).filter(Boolean);
  const cnpjs = Array.from(new Set(raws.map(s => s.replace(/\D/g, ''))))
    .filter(s => s.length === 14);

  if (!cnpjs.length) {
    alert('Informe pelo menos um CNPJ válido.');
    return;
  }

  document.getElementById('warnings').innerHTML = '';
  document.getElementById('log').style.display = 'none';
  document.getElementById('btnDownload').disabled = true;
  document.getElementById('loading').style.display = 'block';

  try {
    // chamamos a API uma vez com toda a lista
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cnpjs })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const { processos = [], avisos = [] } = await resp.json();

    // renderiza avisos
    avisos.forEach(w => {
      const div = document.createElement('div');
      div.className = 'alert alert-warning';
      div.textContent = `${w.empresa} — ${w.cnpj} — ${w.origem}: ${w.mensagem}`;
      document.getElementById('warnings').appendChild(div);
    });

    window.RESULTS = processos;
    document.getElementById('btnDownload').disabled = false;
  } catch (err) {
    console.error(err);
    alert('Erro ao consultar. Veja console.');
  } finally {
    document.getElementById('loading').style.display = 'none';
  }
};

document.getElementById('btnDownload').onclick = () => {
  if (!window.RESULTS || !window.RESULTS.length) {
    alert('Sem resultados para exportar.');
    return;
  }
  const data = window.RESULTS.map(r => ({
    Origem:             r.origem,
    CNPJ:               r.cnpj,
    Processo:           r.processo,
    Descrição:          r.descricao,
    'Última Movimentação': r.ultimaMovimentacao,
    Número:             r.numero,
    Objeto:             r.objeto
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Processos');
  XLSX.writeFile(wb, 'processos.xlsx');
};

// preencher/limpar seleção de texto (compatível com lista grande)
document.getElementById('btnSelectAll').onclick = () => {
  const ta = document.getElementById('input');
  ta.value = ta.value
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
    .join('\n');
};
document.getElementById('btnClearAll').onclick = () => {
  document.getElementById('input').value = '';
};
