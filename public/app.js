// app.js

const API_URL = window.location.origin + '/api/consulta';

// Aqui cada item é { name, cnpj }
const CNPJS_FIXOS = [
  { name: 'Acender Engenharia Ltda',                             cnpj: '05913401000156' },
  { name: 'Acripel Distribuidora Pernambuco Ltda',                cnpj: '24455677000182' },
  { name: 'Agaesse Group Ltda',                                    cnpj: '21659356000101' },
  { name: 'Aliansce Sonae Shopping Centers S/A',                  cnpj: '05878397000132' },
  { name: 'AMERAPEX DO BRASIL TESTES E ANALISES TECNICAS LTDA',    cnpj: '17213095000124' },
  { name: 'AP NET INFORMATICA LTDA',                              cnpj: '06011105000122' },
  { name: 'Arvoredo Participações Ltda.',                         cnpj: '36114320000110' },
  { name: 'AWS Marketing, Publicidade, Agenciamento e Manutenção', cnpj: '04971672000103' },
  { name: 'Axess do Brasil Ltda',                                 cnpj: '11419278000114' },
  { name: 'AZZAS 2154 (Antiga SOMA)',                             cnpj: '16590234000176' },
  { name: 'Ball do Brasil LTDA',                                  cnpj: '00771979001092' },
  { name: 'BHUB SERVICOS E TECNOLOGIA LTDA',                      cnpj: '42330545000106' },
  { name: 'BIOMA INVESTIMENTOS S.A.',                             cnpj: '40120778000159' },
  { name: 'Bitzer Compressores LTDA',                             cnpj: '68870997000174' },
  { name: 'BLUEGREEN PAGAMENTOS LTDA',                            cnpj: '52270124000190' },
  { name: 'Bom Negócio Atividades de Internet LTDA (OLX)',        cnpj: '13673743000255' },
  { name: 'BP Tax Global Advisory SA',                            cnpj: '0'               },
  { name: 'Brunel Energy Serviços Ltda',                          cnpj: '11121254000184' },
  { name: 'BSM Engenharia S.A. - Em Recuperação Judicial',         cnpj: '34078154000118' },
  { name: 'Café de Jardim de Mesquita LTDA. (Grupo Sinaf)',       cnpj: '05385411000166' },
  { name: 'Cainiao Network Transportes Ltda',                     cnpj: '0'               },
  { name: 'Câmara de Comercialização de Energia Elétrica - CCEE',cnpj: '03034433000156' },
  { name: 'Casa Bom Pastor Serviços Funerários S.A.',              cnpj: '36194207000191' },
  { name: 'Casa do Alemão Indústria e Comércio de Lanches Ltda',  cnpj: '31130537000108' },
  { name: 'CASA DO SABER EVENTOS CULTURAIS S.A.',                 cnpj: '05452257000106' },
  { name: 'CEPOA - Centro de Estudos e Pesquisas...',             cnpj: '42161307000114' },
  { name: 'Cidade Maravilhosa Indústria e Comércio de Roupas',    cnpj: '09611669000194' },
  { name: 'Clivale Pró Saúde Iguatemi LTDA',                      cnpj: '33794132000191' },
  { name: 'Comércio de Perfumaria Ginseng Ltda',                  cnpj: '08489643000152' },
  { name: 'COMPANHIA DE SANEAMENTO MUNICIPAL - CESAMA',            cnpj: '21572243000174' },
  { name: 'Concessionária Aeroporto Rio de Janeiro S.A.',         cnpj: '19726111000108' },
  { name: 'Concessionária Aeroporto Confins S/A',                 cnpj: '19674909000153' },
  { name: 'Concessionária Aeroporto Florianópolis S.A.',          cnpj: '27844178000175' },
  { name: 'Concessionaria Aeroporto Guarulhos - GRU',             cnpj: '15578569000106' },
  { name: 'CONDUIT TECHNOLOGY, INC',                              cnpj: '0'               },
  { name: 'Consórcio Parque Shopping Belém',                      cnpj: '31055224000124' },
  { name: 'CONSULADO GERAL DA REPÚBLICA ARGENTINA',               cnpj: '03729104000120' },
  { name: 'CONVICTA AUDITORES INDEPENDENTES S/S LTDA',            cnpj: '03061922000105' },
  { name: 'COPAGAZ DISTRIBUIDORA DE GÁS S/A.',                    cnpj: '03237583000167' },
  { name: 'Covington & Burling LLP',                             cnpj: '0'               },
  { name: 'CRAS Logística Importação e Exportação Ltda.',        cnpj: '14777639000192' },
  { name: 'CS3 Mármores e Granitos Ltda',                         cnpj: '07599291000125' },
  { name: 'CURUPIRA S.A (Take Blip)',                             cnpj: '04413729000140' },
  { name: 'Danielle Cristiane Mesquita de Araujo Bolzan',         cnpj: '0'               },
  { name: 'Datamint Serviços e Sistemas LTDA',                    cnpj: '41448933000123' },
  { name: 'Discautol Distribuidora Campograndense...',            cnpj: '03244290000107' },
  { name: 'DISPROCOR BRASIL DISTRIBUIDORA...',                    cnpj: '23209115000196' },
  { name: 'Ecology and Environment do Brasil Ltda.',              cnpj: '01766605000150' },
  { name: 'Embalar Distribuidora de Embalagens Eireli',           cnpj: '10347424000180' },
  { name: 'Enel Green Power',                                     cnpj: '08084537000199' },
  { name: 'Faria, Cendão & Maia Advogados',                       cnpj: '22601643000123' },
  { name: 'FORESEA S.A',                                          cnpj: '37964448000135' },
  { name: 'Fotop Serviços Ltda',                                  cnpj: '07936428000190' },
  { name: 'Froneri Brasil Distribuidora de Sorvetes...',          cnpj: '25036392000170' },
  { name: 'FUNDAÇÃO DE APOIO AO DESENVOLVIMENTO...',              cnpj: '06220430000103' },
  { name: 'Geyer Medicamentos S/A',                               cnpj: '92670801000182' },
  { name: 'Globaltime SGPS S.A.',                                 cnpj: '0'               },
  { name: 'Globo Comunicação e Participação S/A',                 cnpj: '27865757000102' },
  { name: 'Great Oil Perfurações Brasil Ltda',                    cnpj: '11895432000124' },
  { name: 'H Strattner & Cia Ltda',                               cnpj: '33250713000162' },
  { name: 'Haleon Brasil Distribuidora Ltda (GSK)',               cnpj: '21892032000119' },
  { name: 'HARSCO METALS LTDA',                                   cnpj: '32592073000106' },
  { name: 'Harsco Rail Ltda',                                     cnpj: '03868378000108' },
  { name: 'HF Grupo Hoteleiro Ltda - Hotel Frade',                cnpj: '15288198000128' },
  { name: 'Hospital de Clínicas Rio Mar Barra Ltda',              cnpj: '32154700000127' },
  { name: 'HYPOFARMA INSTITUTO...',                               cnpj: '17174657000178' },
  { name: 'IDWALL TECNOLOGIA LTDA',                              cnpj: '24934106000120' },
  { name: 'IMM ESPORTE E ENTRETENIMENTO LTDA',                    cnpj: '06951432000164' },
  { name: 'IMM Live LTDA',                                        cnpj: '15464374000135' },
  { name: 'INCO PLATAFORMA ELETRÔNICA...',                       cnpj: '30031833000180' },
  { name: 'Insider Comércio e Confecção...',                      cnpj: '26520188000192' },
  { name: 'Instituto de Oftalmologia do RJ Ltda. - IORJ',         cnpj: '17045613000148' },
  { name: 'Instramed Ind. Médico Hospitalar Ltda',               cnpj: '90909631000110' },
  { name: 'INTEREXPRESS SERVIÇOS ADUANEIROS LTDA',                cnpj: '13273256000114' },
  { name: 'INVESTIMO EMPREENDIMENTOS E PARTICIPAÇÕES LTDA',       cnpj: '10268937000104' },
  { name: 'Kimberly-Clark Brasil Ind. e Com. Higiene Ltda.',      cnpj: '02290277000121' },
  { name: 'KOGUT JOIAS FOLHEADAS LTDA',                          cnpj: '03290309000151' },
  { name: 'Kogut Participações Ltda',                            cnpj: '15671218000498' },
  { name: 'KPFR Empreendimentos Imobiliários S/A',                cnpj: '14007592000269' },
  { name: 'Labo Cine do Brasil Ltda',                            cnpj: '03008714000134' },
  { name: 'Laboratório Richet Pesquisas...',                     cnpj: '31887136000199' },
  { name: 'Leggio Consultoria LTDA',                             cnpj: '24326104000159' },
  { name: 'Licks Advogados',                                      cnpj: '14410178000115' },
  { name: 'Livima Consultoria Imobiliária Ltda',                 cnpj: '27514627000117' },
  { name: 'Loreal Brasil Comercial de Cosméticos Ltda',          cnpj: '30278428000161' },
  { name: 'Medlevensohn Comércio e Representações...',           cnpj: '05343029000190' },
  { name: 'Merck S.A.',                                           cnpj: '33069212000184' },
  { name: 'METALTEC LTDA',                                       cnpj: '12944401000189' },
  { name: 'MF PROCURADORIA GERAL DA FAZENDA NACIONAL',            cnpj: '0'               },
  { name: 'Mondelez Brasil Ltda',                                cnpj: '33033028000184' },
  { name: 'Monteiro e Weiss Sociedade de Advogados',             cnpj: '49118981000165' },
  { name: 'Movenext Hutt Digital Tecnologia & Software Ltda.',   cnpj: '18587207000170' },
  { name: 'Nacerta Acabamentos para Construção LTDA',            cnpj: '05095944000103' },
  { name: 'Neoenergia Renováveis S/A',                           cnpj: '12227426000161' },
  { name: 'Nilco Distribuidora de Títulos...',                   cnpj: '87963450000168' },
  { name: 'Nissan do Brasil Automóveis Ltda',                    cnpj: '04104117000761' },
  { name: 'Oculistas Associados do RJ Ltda',                     cnpj: '29254406000182' },
  { name: 'OCYAN S.A.',                                          cnpj: '08091102000171' },
  { name: 'OILTANKING',                                          cnpj: '04409230000160' },
  { name: 'OLX Group',                                           cnpj: '0'               },
  { name: 'OMBRELLO PARTICIPAÇÕES S.A.',                         cnpj: '26381094000180' },
  { name: 'Orafi Comércio de Adornos LTDA',                     cnpj: '13509758000100' },
  { name: 'Órama Distribuidora de Títulos...',                  cnpj: '13293225000125' },
  { name: 'Origem Energia S.A.',                                cnpj: '32021201000161' },
  { name: 'Orthoclub Comércio de Material Médico Hospitalar.',   cnpj: '11443395000113' },
  { name: 'Petrobahia S/A',                                      cnpj: '01125282000116' },
  { name: 'PETROSYNERGY LTDA',                                   cnpj: '03951809000510' },
  { name: 'Pretorian Contabilidade e Gestão Empresarial LTDA',   cnpj: '11792709000193' },
  { name: 'PROMENADE AEL PARTICIPACOES LTDA - Ipanema',         cnpj: '31369872000155' },
  { name: 'Proteica Alimentos LTDA',                             cnpj: '05132476000108' },
  { name: 'R B DANTAS LTDA - COAGRO',                            cnpj: '02895028000160' },
  { name: 'Rede D’Or São Luiz',                                  cnpj: '06047087000139' },
  { name: 'Refracta - Rio Serviços Médicos Ltda',                cnpj: '05853132000180' },
  { name: 'Revendedora de Pneus TC Ltda',                       cnpj: '03339821000226' },
  { name: 'Roda Conveniência em Vending Ltda',                   cnpj: '0'               },
  { name: 'ROFX Partners Consultoria em Gestão Empresarial',     cnpj: '35865660000110' },
  { name: 'Santo Antonio Energia S/A - SAE',                     cnpj: '09391823000160' },
  { name: 'Sergio de Valladão Gomes Brandão',                    cnpj: '0'               },
  { name: 'SERRA AZUL INFRAESTRUTURA TURÍSTICA SPE S.A.',        cnpj: '35606365000149' },
  { name: 'SIG RESIDENCIA SOCIAL LTDA',                          cnpj: '20739430000137' },
  { name: 'Sinaf 24 Horas Serviços de Assistência LTDA.',        cnpj: '40454647000108' },
  { name: 'Sinaf Assistencial S.A.',                             cnpj: '02496391000102' },
  { name: 'Sinaf Previdência Cia de Seguros',                    cnpj: '44019198000120' },
  { name: 'Sinaf Sistema Nacional de Assistência à Família',     cnpj: '27903798000138' },
  { name: 'Solidariedade Participações Ltda',                   cnpj: '31911027000160' },
  { name: 'Solum I Fundo De Investimento...',                    cnpj: '34218279000104' },
  { name: 'Sonangol Hidrocarbonetos Brasil LTDA',                cnpj: '03347723000150' },
  { name: 'Souza Cruz Ltda',                                     cnpj: '33009911000139' },
  { name: 'Step Oil & Gás Serviços Ltda',                        cnpj: '13169311000120' },
  { name: 'Sucumbência',                                         cnpj: '0'               },
  { name: 'SUMAQ COMUNICACAO...',                                cnpj: '37310982000128' },
  { name: 'Suzano S/A',                                          cnpj: '16404287003332' },
  { name: 'TACHRIS COMERCIO...',                                 cnpj: '17758140000126' },
  { name: 'Targa S.A',                                           cnpj: '00157774000554' },
  { name: 'Tecon Rio Grande S/A',                               cnpj: '01640625000180' },
  { name: 'Tecon Salvador S/A',                                 cnpj: '03642342000101' },
  { name: 'Ticket Agora Serviços...',                            cnpj: '03921458000171' },
  { name: 'Tozzi Latam do Brasil...',                            cnpj: '18628613000133' },
  { name: 'TRANS KOTHE TRANSPORTES...',                         cnpj: '03052564000166' },
  { name: 'Transanta Rita LTDA.',                               cnpj: '86458478000185' },
  { name: 'Transportadora Associada de Gás S.A. - TAG',         cnpj: '06248349000123' },
  { name: 'UNI Empreendimento Ltda (Grupo Sinaf)',               cnpj: '00964851000154' },
  { name: 'Uniodonto Maceio-Cooperativa Odontológica',           cnpj: '24243925000121' },
  { name: 'Unisys Brasil LTDA',                                 cnpj: '33426420000193' },
  { name: 'Unisys Tecnologia LTDA',                            cnpj: '01483153000108' },
  { name: 'VC Ferragens LTDA',                                 cnpj: '12324723000125' },
  { name: 'Vital Latina Corretora de Seguros S.A. (Grupo Sinaf)',cnpj: '05271817000118' },
  { name: 'Wilson Sons Estaleiros LTDA',                       cnpj: '10320573000156' },
  { name: 'Wilson Sons Holdings Brasil S/A',                    cnpj: '33130691000105' },
  { name: 'Wilson Sons Serviços Marítimos Ltda',               cnpj: '03562124001473' },
  { name: 'Wilson Sons Serviços… (antiga Saveiros)',           cnpj: '03562124001473' },
  { name: 'Wilson Sons Shipping… (Antiga Agência)',            cnpj: '33411794000135' },
  { name: 'Wilson Sons Terminais e Logística Ltda',           cnpj: '03852972000100' }
];

// formata para "00.000.000/0000-00"
function formatCnpjMask(c) {
  return c.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

function montarLista() {
  const ul = document.getElementById('cnpjCheckboxes');
  CNPJS_FIXOS.forEach(({ name, cnpj }) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <label>
        <input type="checkbox" data-cnpj="${cnpj}" checked>
        ${name} — ${formatCnpjMask(cnpj)}
      </label>
    `;
    ul.appendChild(li);
  });
}

async function consultaEmLote(cnpjs) {
  const resultados = [];
  const total = cnpjs.length;
  const progressEl = document.getElementById('progress');
  const loadingEl  = document.getElementById('loading');

  loadingEl.classList.remove('hidden');
  for (let i = 0; i < total; i++) {
    const cnpj = cnpjs[i];
    progressEl.textContent = `Processando ${i+1}/${total} — ${formatCnpjMask(cnpj)}…`;
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cnpjs: [cnpj] })
    });
    const { processos } = await resp.json();
    resultados.push(...processos);
  }
  loadingEl.classList.add('hidden');
  progressEl.textContent = `Concluído: ${resultados.length} registros.`;
  return resultados;
}

document.getElementById('btnConsulta').onclick = async () => {
  const checks = Array.from(document.querySelectorAll('#cnpjCheckboxes input:checked'));
  if (!checks.length) {
    alert('Marque ao menos um CNPJ');
    return;
  }
  const cnpjs = checks.map(cb => cb.dataset.cnpj);
  window.RESULTS = await consultaEmLote(cnpjs);
  document.getElementById('btnDownload').disabled = !window.RESULTS.length;
};

document.getElementById('btnDownload').onclick = () => {
  if (!window.RESULTS || !window.RESULTS.length) {
    alert('Nada para exportar');
    return;
  }
  const data = window.RESULTS.map(r => ({
    Origem:               r.origem,
    CNPJ:                 formatCnpjMask(r.cnpj),
    Processo:             r.processo,
    Descrição:            r.descricao,
    'Última movimentação': r.ultimaMovimentacao
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Processos');
  XLSX.writeFile(wb, 'processos.xlsx');
};

window.addEventListener('DOMContentLoaded', montarLista);
