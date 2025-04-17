import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

(async () => {
  const url = 'https://pje1g.trf1.jus.br/consultapublica/ConsultaPublica/listView.seam';
  const cnpjTeste = '33250713000162';

  // 1) GET inicial (cookies + HTML)
  const init = await fetch(url, { headers: { 'User-Agent': 'Mozilla' } });
  const cookies = init.headers.get('set-cookie') || '';
  const html1 = await init.text();
  const $1   = cheerio.load(html1);

  // 2) Monta todos os campos do <form> original
  const params = new URLSearchParams();
  $1('form').first().find('input').each((i, el) => {
    const name = $1(el).attr('name');
    const val  = $1(el).attr('value') || '';
    params.set(name, val);
  });

  // 3) Sobrepõe os campos conforme o Form Data capturado:

  // - Tipo de request AJAX do JSF/Seam
  params.set('AJAXREQUEST', '_viewRoot');
  // - Contador de eventos AJAX
  params.set('AJAX:EVENTS_COUNT', '1');
  // - Campo que carrega o CNPJ (sem máscara)
  params.set('fPP:dpDec:documentoParte', cnpjTeste);
  // - Campo do formulário (nome do próprio form)
  params.set('fPP', 'fPP');

  // 4) Exibe o Payload que será enviado (compare com o DevTools)
  console.log('=== Payload enviado ===');
  console.log(params.toString());

  // 5) Executa o POST e lê o HTML de resposta
  const post = await fetch(url, {
    method: 'POST',
    headers: {
      'User-Agent':   'Mozilla',
      'Cookie':       cookies,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });
  const html2 = await post.text();

  // 6) Verifica se o CNPJ aparece na resposta
  if (html2.includes(cnpjTeste)) {
    console.log('✅ Consulta funcionou! HTML de resposta contém o CNPJ de teste.');
  } else {
    console.log('❌ Consulta falhou – CNPJ não apareceu. Ajuste o payload acima.');
  }
})();
