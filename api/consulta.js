import * as cheerio from 'cheerio';

const SITES = [
  {
    name: 'trf1-pje1g',
    url:  'https://pje1g.trf1.jus.br/consultapublica/ConsultaPublica/listView.seam',
    cnpjField: 'fPP:dpDec:documentoParte'
  },
  // … duplique para cada site …
];

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Use POST' });
    }
    const { cnpjs } = req.body;
    const allResults = [];

    for (let site of SITES) {
      for (let cnpj of cnpjs) {
        // 1) GET inicial
        const init = await fetch(site.url, { headers: { 'User-Agent': 'Mozilla' } });
        const cookies = init.headers.get('set-cookie') || '';
        const html1   = await init.text();
        const $1      = cheerio.load(html1);

        // 2) Clona todos os campos do form nome="fPP"
        const params = new URLSearchParams();
        const formEl = $1('form[name="fPP"]');
        formEl.find('input').each((i, el) => {
          const name = $1(el).attr('name');
          if (!name) return;
          const type = $1(el).attr('type');
          let val = $1(el).attr('value') || '';
          if ((type === 'checkbox' || type === 'radio') && !$1(el).is(':checked')) {
            return;
          }
          params.set(name, val);
        });
        formEl.find('select').each((i, el) => {
          const name = $1(el).attr('name');
          const val  = $1(el).find('option:selected').attr('value') || '';
          params.set(name, val);
        });
        formEl.find('textarea').each((i, el) => {
          const name = $1(el).attr('name');
          const val  = $1(el).text() || '';
          params.set(name, val);
        });

        // 3) Sobrepõe o CNPJ e o nome do form
        params.set(site.cnpjField, cnpj);
        params.set('fPP', 'fPP');

        // 4) POST de consulta
        const post = await fetch(site.url, {
          method: 'POST',
          headers: {
            'User-Agent':   'Mozilla',
            'Cookie':       cookies,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });
        const html2 = await post.text();
        const $2    = cheerio.load(html2);

        // 5) Parse da tabela
        $2('table#tabelaResultado tbody tr').each((i, tr) => {
          const cols = $2(tr).find('td');
          allResults.push({
            origem: site.name,
            cnpj,
            numero: cols.eq(0).text().trim(),
            classe: cols.eq(1).text().trim(),
            data:   cols.eq(2).text().trim()
          });
        });
      }
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ processos: allResults });
  } catch (e) {
    console.error('Erro na Function:', e);
    return res.status(500).json({ error: e.message });
  }
}
