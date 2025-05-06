import { chromium } from 'playwright';

export async function scrapeCnpjTRF1(cnpj) {
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();
  await page.goto('https://pje1g.trf1.jus.br/consultapublica/ConsultaPublica/listView.seam');

  // 1) Seleciona tipo CNPJ
  await page.click('input[name="tipoMascaraDocumento"][value="documentoParte"]');

  // 2) Digita o CNPJ
  await page.fill('input[name="fPP:dpDec:documentoParte"]', cnpj);

  // 3) Clica em Pesquisar e espera a tabela
  await Promise.all([
    page.click('button[id$=":searchProcessos"]'),
    page.waitForSelector('table#fPP\\:processosTable tbody tr')
  ]);

  // 4) Extrai cada linha
  const processos = [];
  const rows = await page.$$('table#fPP\\:processosTable tbody tr');
  for (let row of rows) {
    const classe = (await row.$eval('td:nth-child(1)', td => td.innerText.trim()))
                    .replace(/\n.*$/, '').trim();

    const parte  = await row.$eval('td:nth-child(2)', td => td.innerText.trim());
    const data   = await row.$eval('td:nth-child(3)', td => td.innerText.trim());

    // 5) Abre popup de detalhe
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      row.click('td:nth-child(1) a')
    ]);
    await popup.waitForSelector('#formDetalhe\\:numeroProcesso');
    const numero = (await popup.$eval('#formDetalhe\\:numeroProcesso', el => el.textContent.trim()));
    await popup.close();

    processos.push({ numero, classe, parte, data });
  }

  await browser.close();
  return processos;
}
