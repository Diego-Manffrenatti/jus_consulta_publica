// api/consulta.js
import * as cheerio from 'cheerio';

const SITES = [
  {
    name: 'trf1-pje1g',
    url:  'https://pje1g.trf1.jus.br/consultapublica/ConsultaPublica/listView.seam',
    cnpjField: 'fPP:dpDec:documentoParte'
  },
  // … demais sites …
];

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
    const { cnpjs } = req.body;
    const allResults = [];

    for (const site of SITES) {
      for (const cnpj of cnpjs) {
        // GET inicial
        const init = await fetch(site.url, { headers: { 'User-Agent': 'Mozilla' } });
        const cookies = init.headers.get('set-cookie') || '';
        const html1 = await init.text();
        const $1 = cheerio.load(html1);

        // Monta form completo
        const params = new URLSearchParams();
        const formEl = $1('form[name="fPP"]');
        formEl.find('input, select, textarea').each((i, el) => {
          const $el = $1(el);
          const name = $el.attr('name');
          if (!name) return;
          let val = '';
          if (el.tagName === 'select') {
            val = $el.find('option:selected').attr('value') || '';
          } else if (el.tagName === 'textarea') {
            val = $el.text() || '';
          } else {
            const type = $el.attr('type');
            if ((type === 'checkbox' || type === 'radio') && !$el.is(':checked')) return;
            val = $el.attr('value') || '';
          }
          params.set(name, val);
        });

        params.set(site.cnpjField, cnpj);
        params.set('fPP', 'fPP');
        params.set('fPP:searchProcessos', 'Pesquisar');
        params.set('mascaraProcessoReferenciaRadio', 'on');
        params.set('tipoMascaraDocumento', 'on');

        // POST e parse da resposta
        const post = await fetch(site.url, {
          method: 'POST',
          headers: {
            'User-Agent': 'Mozilla',
            'Cookie':     cookies,
            'Content-Type':'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });
        const html2 = await post.text();
        const $2 = cheerio.load(html2);

        // Seleciona a tabela de resultados corretamente
        let table = $2('table#tabelaProcessos');
        if (!table.length) {
          table = $2('table').filter((i, tbl) => {
            const headers = $2(tbl).find('thead th')
              .map((j, th) => $2(th).text().trim()).get();
            return headers.includes('Processo') &&
                   headers.includes('Última movimentação');
          });
        }
        if (!table.length) throw new Error(`Tabela de resultados não encontrada em ${site.name}`);

        // Extrai as linhas reais (filtra ícones vazios)
        table.find('tbody tr').each((i, tr) => {
          const cols = $2(tr).find('td');

          // Limpa o texto do ícone “Ver detalhes do processo”
          let numeroRaw = cols.eq(0).text().trim()
            .replace(/Ver detalhes do processo/, '')
            .trim();
          if (!numeroRaw) return;  // pula linhas sem número

          allResults.push({
            origem:         site.name,
            cnpj,
            numero:         numeroRaw,
            classe:         cols.eq(1).text().trim().split('\n')[0].trim(),
            movimentacao:   cols.eq(1).text().trim().split('\n')[1]?.trim() || '',
            ultimaMoviment: cols.eq(2).text().trim()
          });
        });
      }
    }

    res.setHeader('Access-Control-Allow-Origin','*');
    return res.status(200).json({ processos: allResults });

  } catch (e) {
    console.error('Erro na Function:', e);
    return res.status(500).json({ error: e.message });
  }
}
