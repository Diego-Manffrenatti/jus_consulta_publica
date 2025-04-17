import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const SITES = [
  {
    name: 'trf1-pje1g',
    url:  'https://pje1g.trf1.jus.br/consultapublica/ConsultaPublica/listView.seam',
    cnpjField: 'fPP:dpDec:documentoParte'
  },
  // → duplique este objeto para cada URL da sua lista,
  //    ajustando name, url e cnpjField
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Use POST');
  }
  const { cnpjs } = req.body;        // ex: ["01234567000162", ...]
  const allResults = [];

  for (let site of SITES) {
    for (let cnpj of cnpjs) {
      // 1) GET inicial para pegar cookies e HTML
      const init = await fetch(site.url, { headers: { 'User-Agent': 'Mozilla' } });
      const cookies = init.headers.get('set-cookie') || '';
      const html1   = await init.text();
      const $1      = cheerio.load(html1);

      // 2) Clona TODOS os campos do <form name="fPP">
      const params = new URLSearchParams();
      const formEl = $1('form[name="fPP"]');

      // inputs (hidden, text, radios, checkboxes)
      formEl.find('input').each((i, el) => {
        const name = $1(el).attr('name');
        if (!name) return;
        const type = $1(el).attr('type');
        let val = $1(el).attr('value') || '';
        // só inclui checkbox/radio se estiver marcado
        if ((type === 'checkbox' || type === 'radio') && !$1(el).is(':checked')) {
          return;
        }
        params.set(name, val);
      });

      // selects
      formEl.find('select').each((i, el) => {
        const name = $1(el).attr('name');
        const val  = $1(el).find('option:selected').attr('value') || '';
        params.set(name, val);
      });

      // textareas
      formEl.find('textarea').each((i, el) => {
        const name = $1(el).attr('name');
        const val  = $1(el).text() || '';
        params.set(name, val);
      });

      // 3) Sobrepõe apenas o CNPJ e o nome do form
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

      // 5) Parse da tabela de resultados
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
  res.status(200).json({ processos: allResults });
}
