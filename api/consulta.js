// api/consulta.js
import * as cheerio from 'cheerio';
import he from 'he';

function formatCnpj(cnpjRaw) {
  const digits = cnpjRaw.replace(/\D/g, '').padStart(14, '0');
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

const BASE      = 'https://pje1g.trf1.jus.br';
const LIST_PATH = '/consultapublica/ConsultaPublica/listView.seam';

export default async function handler(req, res) {
  console.log('--- handler start ---');
  if (req.method !== 'POST') {
    console.log('Método inválido:', req.method);
    return res.status(405).json({ error: 'Use POST' });
  }

  const { cnpjs: rawList } = req.body;
  console.log('CNPJs brutos recebidos:', rawList);

  const resultados = [];

  for (const raw of rawList) {
    const cnpj = formatCnpj(raw);
    console.log(`\n>> Consulta para CNPJ ${cnpj}`);

    // 1) GET inicial
    const init = await fetch(BASE + LIST_PATH, { headers: { 'User-Agent': 'Mozilla' } });
    console.log('Status GET inicial:', init.status);
    const cookies   = init.headers.get('set-cookie') || '';
    const html1     = await init.text();
    const $1        = cheerio.load(html1);
    const viewState = $1('input[name="javax.faces.ViewState"]').val();

    // 2) Clona form + overrides
    const params = new URLSearchParams();
    $1('form[name="fPP"] input, form[name="fPP"] select, form[name="fPP"] textarea')
      .each((_, el) => {
        const $el = $1(el), name = $el.attr('name');
        if (!name) return;
        let val = el.tagName === 'select'
          ? $el.find('option:selected').attr('value') || ''
          : el.tagName === 'textarea'
            ? $el.text() || ''
            : $el.attr('value') || '';
        params.set(name, val);
      });

    params.set('AJAXREQUEST', '_viewRoot');
    params.set('mascaraProcessoReferenciaRadio', 'on');
    params.set('tipoMascaraDocumento', 'on');
    params.set('fPP:dpDec:documentoParte', cnpj);
    params.set('javax.faces.ViewState', viewState);
    params.set('fPP:j_id220', 'fPP:j_id220');
    params.set('AJAX:EVENTS_COUNT', '1');

    // 3) POST consulta
    console.log('POST consulta…');
    const post = await fetch(BASE + LIST_PATH, {
      method: 'POST',
      headers: {
        'User-Agent':   'Mozilla',
        'Cookie':       cookies,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    console.log('Status POST consulta:', post.status);
    const html2 = await post.text();
    const $2    = cheerio.load(html2);

    // 4) Itera resultados
    const rows = $2('table.rich-table tbody tr');
    console.log('Linhas encontradas:', rows.length);

    for (let i = 0; i < rows.length; i++) {
      const tr   = rows[i];
      const $tr  = $2(tr);
      const cols = $tr.find('td');
      console.log(` Linha ${i}, cols=${cols.length}`);

      // Processo e Descrição
      const texts = cols.eq(1).contents().toArray()
        .filter(n => n.type === 'text' && n.data.trim())
        .map(n => n.data.trim());
      const processo  = texts[0] || '';
      const descricao = texts[1] || '';
      console.log(`    processo: "${processo}"`);
      console.log(`    descricao: "${descricao}"`);
      if (!processo) {
        console.log(`    > Linha ${i} ignorada (sem processo)`);
        continue;
      }

      // Última movimentação
      const mov = cols.eq(2).text()
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
        .join(' ');
      console.log(`    ultimaMovimentacao: "${mov}"`);

      // Detalhes para número e objeto (antes era "assunto")
      const onclick = cols.eq(0).find('a').attr('onclick') || '';
      const m = onclick.match(/'(\/consultapublica[^']*)'/);
      let numero = '', objeto = '';
      if (m && m[1]) {
        const urlDet = BASE + m[1];
        console.log(`    → GET detalhe em: ${urlDet}`);
        const detResp = await fetch(urlDet, {
          headers: { 'User-Agent': 'Mozilla', 'Cookie': cookies }
        });
        console.log(`      status detalhe [${i}]:`, detResp.status);
        const detHtml = await detResp.text();
        const $d      = cheerio.load(detHtml);

        numero = $d('div.propertyView:has(label:contains("Número Processo")) .value').text().trim();
        console.log(`      número: "${numero}"`);

        objeto = $d('div.propertyView:has(label:contains("Assunto")) .value').text().trim();
        objeto = he.decode(objeto);
        console.log(`      objeto: "${objeto}"`);
      }

      resultados.push({
        origem:             'trf1-pje1g',
        cnpj,
        processo,
        descricao,
        ultimaMovimentacao: mov,
        numero,
        objeto
      });
    }
  }

  console.log('\nTotal coletado:', resultados.length);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ processos: resultados });
}
