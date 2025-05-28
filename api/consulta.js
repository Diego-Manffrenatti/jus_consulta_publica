// api/consulta.js
import * as cheerio from 'cheerio';

function formatCnpj(cnpjRaw) {
  const digits = cnpjRaw.replace(/\D/g, '').padStart(14, '0');
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

const BASE      = 'https://pje1g.trf1.jus.br';
const LIST_PATH = '/consultapublica/ConsultaPublica/listView.seam';

export default async function (req, res) {
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
    // overrides idênticos
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
      const tr = rows[i];
      const cols = $tr.find('td');
      console.log(` Linha ${i}, cols=${cols.length}`);

      // ** Processo e Descrição na COLUNA 1 **
      const td1 = cols.eq(1);
      const nodes = td1.contents().toArray();
      // Filtra só nós de texto e limpa
      const texts = nodes
        .filter(n => n.type === 'text' && n.data.trim())
        .map(n => n.data.trim());
      console.log('    texts coluna 1 raw:', texts);
      const processo  = texts[0] || '';
      const descricao = texts[1] || '';
      console.log(`    processo: "${processo}"`);
      console.log(`    descricao: "${descricao}"`);
      if (!processo) {
        console.log(`    > Linha ${i} ignorada (sem processo)`);
        return;
      }

      // ** Última movimentação na COLUNA 2 **
      const mov = cols.eq(2).text()
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
        .join(' ');
      console.log(`    ultimaMovimentacao: "${mov}"`);

      resultados.push({
        origem:             'trf1-pje1g',
        cnpj,
        processo,
        descricao,
        ultimaMovimentacao: mov
      });

      try {
         const detLink = cols.eq(0).find('a').attr('onclick');
         const relativeUrlMatch = detLink && detLink.match(/'([^']+)'/);
         if (!relativeUrlMatch || !relativeUrlMatch[1]) {
           console.log('    > Sem link de detalhes');
           return;
         }

         const detUrl = BASE + relativeUrlMatch[1];
         console.log(`    >> Buscando detalhes em: ${detUrl}`);

         const detResp = await fetch(detUrl, {
           headers: {
             'User-Agent': 'Mozilla',
             'Cookie': cookies
           }
         });
         const htmlDet = await detResp.text();
         const $det = cheerio.load(htmlDet);

         const procNum = $det('label:contains("Número Processo")')
           .closest('.propertyView')
           .find('.value .col-sm-12')
           .text().trim();

         console.log(`    >> Número do processo na tela de detalhes: ${procNum}`);
       } catch (err) {
         console.error('    !! Erro ao buscar detalhes:', err.message);
       }

    });
  }

  console.log('\nTotal coletado:', resultados.length);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ processos: resultados });
}
