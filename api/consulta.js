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
        const init = await fetch(site.url, { headers: { 'User-Agent': 'Mozilla' } });
        const cookies = init.headers.get('set-cookie') || '';
        const html1 = await init.text();
        const $1 = cheerio.load(html1);

        // Monta o form completo
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
            if ((type === 'checkbox' || type === 'radio') && !$el.is(':checked')) {
              return;
            }
            val = $el.attr('value') || '';
          }
          params.set(name, val);
        });

        // Sobrepõe CNPJ, nome do form e flags
        params.set(site.cnpjField, cnpj);
        params.set('fPP', 'fPP');
        params.set('fPP:searchProcessos', 'Pesquisar');
        params.set('mascaraProcessoReferenciaRadio', 'on');
        params.set('tipoMascaraDocumento', 'on');

        // POST e resposta
        const post = await fetch(site.url, {
          method: 'POST',
          headers: {
            'User-Agent':  'Mozilla',
            'Cookie':      cookies,
            'Content-Type':'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });
        const html2 = await post.text();
        const $2 = cheerio.load(html2);

        // Seleciona a tabela correta pelo ID
        let table = $2('table#tabelaProcessos');
        if (!table.length) {
          // Fallback por headers
          table = $2('table').filter((i, tbl) => {
            const headers = $2(tbl).find('thead th')
              .map((j, th) => $2(th).text().trim()).get();
            return headers.includes('Processo') &&
                   headers.includes('Última movimentação');
          });
        }
        if (!table.length) throw new Error(`Tabela de resultados não encontrada em ${site.name}`);

        // Extrai as linhas da tabela
        table.find('tbody tr').each((i, tr) => {
          const cols = $2(tr).find('td');
          allResults.push({
            origem:         site.name,
            cnpj,
            numero:         cols.eq(0).text().trim(),
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
