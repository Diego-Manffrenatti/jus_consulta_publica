// api/consulta.js

import fetch from 'node-fetch';
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }
  const { cnpjs: rawList } = req.body;

  const resultados = [];

  for (const raw of rawList) {
    const cnpj = formatCnpj(raw);

    // 1) GET inicial
    const init = await fetch(BASE + LIST_PATH, {
      headers: { 'User-Agent': 'Mozilla' }
    });
    const cookies   = init.headers.get('set-cookie') || '';
    const html1     = await init.text();
    const $1        = cheerio.load(html1);
    const viewState = $1('input[name="javax.faces.ViewState"]').val();

    // 2) Clonar form “fPP” e aplicar overrides
    const params = new URLSearchParams();
    $1('form[name="fPP"] input, form[name="fPP"] select, form[name="fPP"] textarea')
      .each((_, el) => {
        const $el = $1(el), name = $el.attr('name');
        if (!name) return;
        let val = '';
        if (el.tagName === 'select') {
          val = $el.find('option:selected').attr('value') || '';
        } else if (el.tagName === 'textarea') {
          val = $el.text() || '';
        } else {
          val = $el.attr('value') || '';
        }
        params.set(name, val);
      });

    // overrides necessários para retornar só a lista, sem detalhes:
    params.set('AJAXREQUEST', '_viewRoot');
    params.set('mascaraProcessoReferenciaRadio', 'on');
    params.set('tipoMascaraDocumento', 'on');
    params.set('fPP:dpDec:documentoParte', cnpj);
    params.set('javax.faces.ViewState', viewState);
    params.set('fPP:j_id220', 'fPP:j_id220');
    params.set('AJAX:EVENTS_COUNT', '1');

    // 3) POST consulta
    const post = await fetch(BASE + LIST_PATH, {
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

    // 4) Iterar sobre as linhas da tabela de resultados
    $2('table.rich-table tbody tr').each((i, tr) => {
      const $tr  = $2(tr);
      const cols = $tr.find('td');
      // coluna 1: texto e descrição
      const nodes = cols.eq(1).contents().toArray();
      const texts = nodes
        .filter(n => n.type === 'text' && n.data.trim())
        .map(n => n.data.trim());
      const processo  = texts[0] || '';
      const descricao = texts.slice(1).join(' ') || '';

      if (!processo) return;

      // coluna 2: última movimentação
      const mov = cols.eq(2).text()
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
        .join(' ');

      // ** Agora vamos buscar número e objeto no detalhe **
      // link de detalhe:
      const onclick = $tr.find('td').first().find('a').attr('onclick') || '';
      const matchCa = onclick.match(/ca=([0-9a-f]+)/);
      let numero = '', objeto = '';
      if (matchCa) {
        const urlDet = `${BASE}/consultapublica/ConsultaPublica/DetalheProcessoConsultaPublica/listView.seam?ca=${matchCa[1]}`;
        // GET detalhe
        // (aqui assumimos que o detalhe é síncrono; é possível virar para await fetch)
        // mas cuidado com muitos requests — ideal rodar um batch separado.
        // Para não travar tudo, não await aqui em produção, mas para dev:
        fetch(urlDet, {
          headers: { 'User-Agent': 'Mozilla', 'Cookie': cookies }
        })
        .then(r => r.text())
        .then(htmlDet => {
          const $d = cheerio.load(htmlDet);
          // Número:
          numero = $d('label:contains("Número Processo")')
            .closest('.propertyView')
            .find('.value div')
            .first().text().trim();
          // Assunto (agora mapeado para “objeto”)
          objeto = $d('label:contains("Assunto")')
            .closest('.propertyView')
            .find('.value div')
            .first().text().trim();
        })
        .catch(() => {
          // falhou detalhe, deixa em branco
        });
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
    });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.json({ processos: resultados });
}
