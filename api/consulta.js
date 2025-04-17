import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const SITES = [
  {
    name: 'trf1-pje1g',
    url: 'https://pje1g.trf1.jus.br/consultapublica/ConsultaPublica/listView.seam',
    form: {
      campo: 'formConsulta:campoCpfCnpj',
      tipo:  'formConsulta:tipoPesquisa',
      tipoVal: 'cpfCnpj'
    }
  },
  // 🔁 duplique para cada URL da sua lista, ajustando os parâmetros
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Use POST');
  const { cnpjs } = req.body;
  const allResults = [];

  for (let site of SITES) {
    for (let cnpj of cnpjs) {
      const init = await fetch(site.url, { headers: { 'User-Agent': 'Mozilla' } });
      const cookies = init.headers.get('set-cookie') || '';
      const html1 = await init.text();
      const $1 = cheerio.load(html1);
      const viewState = $1('input[name=javax.faces.ViewState]').val();

      const form = new URLSearchParams();
      form.set(site.form.tipo, site.form.tipoVal);
      form.set(site.form.campo, cnpj);
      form.set('javax.faces.ViewState', viewState);

      const post = await fetch(site.url, {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla',
          'Cookie': cookies,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: form.toString()
      });
      const html2 = await post.text();
      const $2 = cheerio.load(html2);

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
