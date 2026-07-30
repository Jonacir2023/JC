// ============================================================
// Google Apps Script — Diário de Obras (unificado)
// Módulos: Pauta · CheckIn · Diário · Fotos (Drive) · Backup (Drive)
// Planilha: https://docs.google.com/spreadsheets/d/19fTP_qyxv1QiLdxBz3jbvTb46DKedrkApEVExmSxKEM
//
// Como implantar:
// 1. Abra a planilha → Extensões → Apps Script
// 2. Cole este código substituindo todo o conteúdo existente
// 3. Implantar → Gerenciar implantações → Editar → Nova versão → Implantar
//    (na primeira execução o Google pedirá autorização de acesso ao Drive — aceite)
// 4. A URL gerada é a mesma usada em APPS_SCRIPT_URL_DIARIO no HTML
// ============================================================

const SHEET_ID           = '19fTP_qyxv1QiLdxBz3jbvTb46DKedrkApEVExmSxKEM';
const SHEET_NAME_PAUTA   = 'Pauta';
const SHEET_NAME_CHECKIN = 'CheckIn';
const SHEET_NAME_DIARIO  = 'Diário';

// 24 colunas
const COLUNAS_DIARIO = [
  'Data',                    // A
  'Dia da Semana',           // B
  'Obra',                    // C
  'Empresa',                 // D
  'Cidade',                  // E
  'Local da Obra',           // F  ← local diário onde os trabalhos foram executados
  'Descrição do Local',      // G  ← descrição do local
  'Tempo / Clima',           // H
  'Jornada',                 // I
  'DSS — Horário',           // J
  'DSS — Ministrado Por',    // K
  'DSS — Tema',              // L
  'Atividades do Dia',       // M
  'Efetivo Total',           // N
  'Efetivo por Função',      // O
  'Colaboradores Presentes', // P
  'Equipamentos Utilizados', // Q
  'Veículos Leves',          // R
  'Veículos/Equip. Parados', // S
  'Eventos de Segurança',    // T
  'Eventos de Meio Ambiente',// U
  'Observações do Dia',      // V
  'Apontador',               // W
  'Fotos',                   // X  ← links das fotos no Google Drive
  'RDO Nº'                   // Y  ← numeração sequencial do relatório
];

// ============================================================
// ROTEAMENTO
// ============================================================

function doGet(e) {
  const path   = e.parameter.path   || '';
  const action = e.parameter.action || '';
  const data   = e.parameter.data   || '';
  const mes    = e.parameter.mes    || '';
  try {
    if (path === 'pauta'   && action === 'listar')      return listarPautas();
    if (path === 'checkin' && action === 'historico')   return listarCheckIns();
    if (path === 'diario'  && action === 'carregar' && data) return carregarDiario(data);
    if (path === 'diario'  && action === 'lista-mes' && mes) return listarDiariosMes(mes);
    if (path === 'diario'  && action === 'salvar'   && e.parameter.dados) {
      return salvarDiario(JSON.parse(e.parameter.dados));
    }
    if (path === 'diario'  && action === 'limpar-duplicatas') {
      const resultado = limparDuplicatasDiario();
      return successResponse({ ok: true, ...resultado });
    }
    if (path === 'backup'  && action === 'buscar-ultimo') {
      return buscarUltimoBackup(e.parameter.obra || 'Obra');
    }
    return successResponse({ ok: true, msg: 'API Diário de Obras ativa' });
  } catch (err) { return errorResponse(err.message); }
}

function doPost(e) {
  try {
    const raw  = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const body = JSON.parse(raw);
    const path   = (e && e.parameter && e.parameter.path)   || '';
    const action = (e && e.parameter && e.parameter.action) || '';
    if (body.path === 'foto') return salvarFoto(body);
    if (body.path === 'backup') return salvarBackup(body);
    if (path === 'pauta'   && action === 'criar')            return criarPauta(body);
    if (path === 'pauta'   && action === 'atualizar-status') return atualizarStatusPauta(body);
    if (path === 'checkin' && action === 'salvar')           return salvarCheckIn(body);
    if (path === 'diario'  && action === 'salvar')           return salvarDiario(body);
    if (path === 'ia'      && action === 'perguntar')        return perguntarIA(body);
    return errorResponse('Endpoint não encontrado: ' + path + '/' + action);
  } catch (err) { return errorResponse(err.message); }
}

// ============================================================
// PAUTA
// ============================================================

function listarPautas() {
  const sheet = getSheet(SHEET_NAME_PAUTA);
  if (!sheet) return errorResponse('Aba Pauta não encontrada');
  const values  = sheet.getDataRange().getValues();
  const headers = values[0];
  const pautas  = [];
  for (let i = 1; i < values.length; i++) {
    if (!values[i][0]) break;
    const pauta = {};
    headers.forEach((h, j) => pauta[h] = values[i][j]);
    pautas.push(pauta);
  }
  return successResponse({ pautas });
}

function criarPauta(data) {
  const sheet = getSheet(SHEET_NAME_PAUTA);
  if (!sheet) return errorResponse('Aba Pauta não encontrada');
  const id    = 'PAUTA-' + Date.now();
  const agora = new Date().toISOString();
  sheet.appendRow([
    id,
    data.assunto        || '',
    data.descricao      || '',
    data.criador        || '',
    data.responsavel    || '',
    data.setor          || '',
    data.prioridade     || 'Média',
    'Aberta',
    data.data_lancamento|| new Date().toISOString().slice(0,10),
    data.data_termino   || '',
    agora,
    agora
  ]);
  return successResponse({ ok: true, id, status: 'Aberta', msg: 'Pauta criada' });
}

function atualizarStatusPauta(data) {
  const sheet = getSheet(SHEET_NAME_PAUTA);
  if (!sheet) return errorResponse('Aba Pauta não encontrada');
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.id) {
      sheet.getRange(i+1, 8).setValue(data.novo_status);
      sheet.getRange(i+1, 12).setValue(new Date().toISOString());
      return successResponse({ ok: true, status: data.novo_status });
    }
  }
  return errorResponse('Pauta não encontrada');
}

// ============================================================
// CHECKIN
// ============================================================

function salvarCheckIn(data) {
  const sheet = getSheet(SHEET_NAME_CHECKIN);
  if (!sheet) return errorResponse('Aba CheckIn não encontrada');
  const id = 'CHECKIN-' + Date.now();
  sheet.appendRow([
    id,
    data.data    || '',
    data.hora    || '',
    data.obra    || '',
    JSON.stringify(data.assuntos || []),
    data.resumo  || '',
    new Date().toISOString()
  ]);
  return successResponse({ ok: true, id, msg: 'CheckIn salvo' });
}

function listarCheckIns() {
  const sheet = getSheet(SHEET_NAME_CHECKIN);
  if (!sheet) return errorResponse('Aba CheckIn não encontrada');
  const values  = sheet.getDataRange().getValues();
  const headers = values[0];
  const checkins = [];
  for (let i = 1; i < values.length; i++) {
    if (!values[i][0]) break;
    const checkin = {};
    headers.forEach((h, j) => checkin[h] = values[i][j]);
    checkins.push(checkin);
  }
  return successResponse({ checkins });
}

// ============================================================
// DIÁRIO
// ============================================================

function salvarDiario(payload) {
  const ss  = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME_DIARIO);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME_DIARIO);

  // Reescreve cabeçalho se necessário (planilha nova ou sem cabeçalho)
  const colA = sheet.getRange(1, 1).getValue();
  if (colA !== 'Data') {
    sheet.clearContents();
    const hr = sheet.getRange(1, 1, 1, COLUNAS_DIARIO.length);
    hr.setValues([COLUNAS_DIARIO]);
    hr.setBackground('#2c2c2c');
    hr.setFontColor('#f5b334');
    hr.setFontWeight('bold');
    sheet.setFrozenRows(1);
    const larguras = [100,110,160,160,120,180,220,130,230,80,160,230,280,80,200,300,220,180,260,240,240,320,180,260,80];
    larguras.forEach((w, i) => sheet.setColumnWidth(i+1, w));
  }

  // Migração automática: garante todos os cabeçalhos (colunas novas em planilhas antigas)
  COLUNAS_DIARIO.forEach(function(titulo, i) {
    const cel = sheet.getRange(1, i + 1);
    if (cel.getValue() !== titulo) {
      cel.setValue(titulo);
      cel.setBackground('#2c2c2c');
      cel.setFontColor('#f5b334');
      cel.setFontWeight('bold');
    }
  });

  const linha = [
    payload.data                   || '',  // A Data
    payload.diaSemana              || '',  // B Dia da Semana
    payload.obra                   || '',  // C Obra
    payload.empresa                || '',  // D Empresa
    payload.local                  || '',  // E Cidade
    payload.localObra              || '',  // F Local da Obra
    payload.descricaoLocal         || '',  // G Descrição do Local
    payload.tempo                  || '',  // H Tempo / Clima
    payload.jornada                || '',  // I Jornada
    payload.dssHorario             || '',  // J DSS — Horário
    payload.dssMinistrou           || '',  // K DSS — Ministrado Por
    payload.dssTema                || '',  // L DSS — Tema
    payload.atividades             || '',  // M Atividades do Dia
    payload.efetivoTotal           || 0,   // N Efetivo Total
    payload.efetivoPorFuncao       || '',  // O Efetivo por Função
    payload.colaboradoresPresentes || '',  // P Colaboradores Presentes
    payload.equipamentos           || '',  // Q Equipamentos Utilizados
    payload.veiculosLeves          || '',  // R Veículos Leves
    payload.veiculosParados        || '',  // S Veículos/Equip. Parados
    payload.eventosSeguranca       || '',  // T Eventos de Segurança
    payload.eventosMeioAmbiente    || '',  // U Eventos de Meio Ambiente
    payload.observacoes            || '',  // V Observações do Dia
    payload.apontador              || '',  // W Apontador
    payload.fotos                  || '',  // X Fotos (links do Drive)
    payload.rdoNum                 || ''   // Y RDO Nº
  ];

  // Upsert por data + apontador (mantém apenas o mais recente)
  // Datas são normalizadas: a célula pode estar como tipo Data ou como texto
  const tz = ss.getSpreadsheetTimeZone();
  const apontadorCol = COLUNAS_DIARIO.indexOf('Apontador'); // coluna W
  const dados = sheet.getDataRange().getValues();
  const dataAlvo  = normalizarData(payload.data, tz);
  const apontAlvo = normalizarApontador(payload.apontador);
  const rowsParaDeletar = [];
  let linhaIdx = -1;
  for (let i = 1; i < dados.length; i++) {
    const mesmaData      = normalizarData(dados[i][0], tz) === dataAlvo;
    const mesmoApontador = normalizarApontador(dados[i][apontadorCol]) === apontAlvo;
    if (mesmaData && mesmoApontador) {
      if (linhaIdx === -1) { linhaIdx = i + 1; }
      else { rowsParaDeletar.push(i + 1); }
    }
  }
  rowsParaDeletar.reverse().forEach(r => sheet.deleteRow(r));

  if (linhaIdx > 0) {
    sheet.getRange(linhaIdx, 1, 1, linha.length).setValues([linha]);
  } else {
    sheet.appendRow(linha);
    const nr = sheet.getLastRow();
    sheet.getRange(nr, 1, 1, linha.length).setWrap(true);
  }

  // Ordenar por data decrescente
  const lastRow = sheet.getLastRow();
  if (lastRow > 2) {
    sheet.getRange(2, 1, lastRow - 1, COLUNAS_DIARIO.length)
         .sort({ column: 1, ascending: false });
  }

  return successResponse({ ok: true, msg: 'Diário salvo' });
}

function carregarDiario(data) {
  const sheet = getSheet(SHEET_NAME_DIARIO);
  if (!sheet) return errorResponse('Aba Diário não encontrada');
  const valores = sheet.getDataRange().getValues();
  const headers = valores[0];
  for (let i = 1; i < valores.length; i++) {
    if (valores[i][0] === data) {
      const diario = {};
      headers.forEach((h, j) => diario[h] = valores[i][j]);
      return successResponse({ ok: true, diario });
    }
  }
  return successResponse({ ok: false, msg: 'Diário não encontrado para ' + data });
}

function listarDiariosMes(mes) {
  const sheet = getSheet(SHEET_NAME_DIARIO);
  if (!sheet) return errorResponse('Aba Diário não encontrada');
  const valores  = sheet.getDataRange().getValues();
  const headers  = valores[0];
  const diarios  = [];
  for (let i = 1; i < valores.length; i++) {
    if (valores[i][0] && String(valores[i][0]).startsWith(mes)) {
      const d = {};
      headers.forEach((h, j) => d[h] = valores[i][j]);
      diarios.push(d);
    }
  }
  return successResponse({ ok: true, mes, diarios });
}

// ============================================================
// LIMPEZA DE DUPLICATAS
// ============================================================

/**
 * Remove duplicatas da aba Diário, mantendo apenas o registro mais recente
 * por combinação de Data + Apontador.
 *
 * Como usar:
 *   - No editor do Apps Script: selecione esta função e clique em ▶ Executar
 *   - Via API: GET ?path=diario&action=limpar-duplicatas
 *
 * Retorna um resumo de quantas linhas foram removidas.
 */
function limparDuplicatasDiario() {
  const sheet = getSheet(SHEET_NAME_DIARIO);
  if (!sheet) {
    Logger.log('Aba Diário não encontrada');
    return;
  }

  const dados = sheet.getDataRange().getValues();
  if (dados.length <= 1) {
    Logger.log('Nenhum dado para limpar.');
    return { removidas: 0 };
  }

  const tz = SpreadsheetApp.openById(SHEET_ID).getSpreadsheetTimeZone();
  const idxData = 0;                                    // coluna A = Data
  const idxApon = COLUNAS_DIARIO.indexOf('Apontador');  // coluna W = Apontador

  // Agrupa linhas por chave "data|apontador" (valores normalizados)
  // Mantém apenas o ÚLTIMO índice encontrado para cada chave (mais recente no sheet)
  const mapaUltimo = {}; // chave → índice da linha (1-based, excluindo header)
  for (let i = 1; i < dados.length; i++) {
    const data  = normalizarData(dados[i][idxData], tz);
    const apon  = normalizarApontador(dados[i][idxApon]);
    if (!data) continue; // linha vazia, ignora
    const chave = `${data}|${apon}`;
    mapaUltimo[chave] = i; // sobrescreve → fica o último
  }

  // Linhas a deletar = todas que NÃO são o último de sua chave
  const linhasParaDeletar = [];
  for (let i = 1; i < dados.length; i++) {
    const data  = normalizarData(dados[i][idxData], tz);
    const apon  = normalizarApontador(dados[i][idxApon]);
    if (!data) continue;
    const chave = `${data}|${apon}`;
    if (mapaUltimo[chave] !== i) {
      linhasParaDeletar.push(i + 1); // +1 porque sheet é 1-based
    }
  }

  // Deletar de baixo para cima para não deslocar índices
  linhasParaDeletar.sort((a, b) => b - a).forEach(r => sheet.deleteRow(r));

  // Reordenar por data decrescente
  const lastRow = sheet.getLastRow();
  if (lastRow > 2) {
    sheet.getRange(2, 1, lastRow - 1, COLUNAS_DIARIO.length)
         .sort({ column: 1, ascending: false });
  }

  const msg = `Limpeza concluída: ${linhasParaDeletar.length} linha(s) duplicada(s) removida(s).`;
  Logger.log(msg);
  return { removidas: linhasParaDeletar.length, msg };
}

// ============================================================
// FOTOS DO DIÁRIO — Google Drive
// ============================================================

var PASTA_RAIZ_FOTOS = 'Diario de Obras - Fotos';

function salvarFoto(dados) {
  var raiz = obterOuCriarPasta(DriveApp.getRootFolder(), PASTA_RAIZ_FOTOS);
  var pastaObra = obterOuCriarPasta(raiz, dados.obra || 'Obra');
  var pastaData = obterOuCriarPasta(pastaObra, dados.data || 'sem-data');

  var bytes = Utilities.base64Decode(dados.base64);
  var nome = 'foto_' + dados.data + '_' + new Date().getTime() + '.jpg';
  var arquivo = pastaData.createFile(Utilities.newBlob(bytes, 'image/jpeg', nome));
  arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return successResponse({
    fileId: arquivo.getId(),
    url: 'https://drive.google.com/file/d/' + arquivo.getId() + '/view'
  });
}

function obterOuCriarPasta(pai, nome) {
  var it = pai.getFoldersByName(nome);
  return it.hasNext() ? it.next() : pai.createFolder(nome);
}

// ============================================================
// BACKUP NA NUVEM — JSON completo do app no Google Drive
// Mantém apenas os 30 backups mais recentes por obra
// ============================================================
var PASTA_RAIZ_BACKUPS = 'Diario de Obras - Backups';

function salvarBackup(dados) {
  var raiz = obterOuCriarPasta(DriveApp.getRootFolder(), PASTA_RAIZ_BACKUPS);
  var pastaObra = obterOuCriarPasta(raiz, dados.obra || 'Obra');

  var agora = new Date();
  var nome = 'backup_' + Utilities.formatDate(agora, Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm') + '.json';
  pastaObra.createFile(nome, dados.conteudo || '{}', 'application/json');

  // Limpeza: manter só os 30 mais recentes
  var arquivos = [];
  var it = pastaObra.getFiles();
  while (it.hasNext()) arquivos.push(it.next());
  arquivos.sort(function(a, b) { return b.getDateCreated() - a.getDateCreated(); });
  for (var i = 30; i < arquivos.length; i++) arquivos[i].setTrashed(true);

  return successResponse({ ok: true, arquivo: nome });
}

function buscarUltimoBackup(obra) {
  var raiz = obterOuCriarPasta(DriveApp.getRootFolder(), PASTA_RAIZ_BACKUPS);
  var pastaObra = obterOuCriarPasta(raiz, obra);
  var arquivos = [];
  var it = pastaObra.getFiles();
  while (it.hasNext()) arquivos.push(it.next());
  if (!arquivos.length) return successResponse({ ok: false, msg: 'Nenhum backup encontrado' });
  arquivos.sort(function(a, b) { return b.getDateCreated() - a.getDateCreated(); });
  var mais = arquivos[0];
  return successResponse({
    ok: true,
    conteudo: mais.getBlob().getDataAsString(),
    data: mais.getDateCreated().toISOString(),
    arquivo: mais.getName()
  });
}

// ============================================================
// PERGUNTAS SOBRE OS DADOS — via API da Anthropic (Claude)
//
// Configuração necessária (uma vez só):
//   No editor do Apps Script → ⚙️ Configurações do projeto → Propriedades do script
//   → Adicionar propriedade de script: ANTHROPIC_API_KEY = sk-ant-...
// ============================================================

// Modelo usado para responder perguntas. Trocar aqui se quiser outro.
var MODELO_IA_PERGUNTAS = 'claude-haiku-4-5-20251001';

function perguntarIA(body) {
  var pergunta = String(body.pergunta || '').trim();
  if (!pergunta) return errorResponse('Pergunta vazia');

  var apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return successResponse({
      ok: false,
      resposta: '⚠️ A chave de API da Anthropic ainda não foi configurada neste Apps Script. ' +
        'Vá em Configurações do projeto → Propriedades do script e adicione ANTHROPIC_API_KEY.'
    });
  }

  try {
    var contexto = montarContextoParaIA();
    var resposta = chamarClaude(pergunta, contexto, apiKey);
    return successResponse({ ok: true, resposta: resposta });
  } catch (err) {
    return successResponse({ ok: false, resposta: '❌ Erro ao consultar: ' + err.message });
  }
}

// Monta um resumo em JSON de tudo que existe na aba Diário (fonte oficial e mais atual),
// mais Pauta e CheckIn, para servir de contexto à IA.
function montarContextoParaIA() {
  var partes = {};

  var sheetDiario = getSheet(SHEET_NAME_DIARIO);
  if (sheetDiario) {
    var vD = sheetDiario.getDataRange().getValues();
    var hD = vD[0];
    var rdos = [];
    for (var i = 1; i < vD.length; i++) {
      if (!vD[i][0]) continue;
      var obj = {};
      hD.forEach(function(h, j) { obj[h] = vD[i][j]; });
      rdos.push(obj);
    }
    rdos.sort(function(a, b) { return String(a['Data']).localeCompare(String(b['Data'])); });
    partes.rdos_diario = rdos;
  }

  var sheetPauta = getSheet(SHEET_NAME_PAUTA);
  if (sheetPauta) {
    var vP = sheetPauta.getDataRange().getValues();
    var hP = vP[0];
    var pautas = [];
    for (var p = 1; p < vP.length; p++) {
      if (!vP[p][0]) continue;
      var op = {};
      hP.forEach(function(h, j) { op[h] = vP[p][j]; });
      pautas.push(op);
    }
    partes.pautas = pautas;
  }

  return JSON.stringify(partes);
}

function chamarClaude(pergunta, contextoJson, apiKey) {
  var systemPrompt =
    'Você é um assistente que responde perguntas sobre os Relatórios Diários de Obra (RDO) ' +
    'de uma obra de construção civil, e sobre pautas/pendências registradas, com base ' +
    'EXCLUSIVAMENTE nos dados JSON fornecidos abaixo (vindos da planilha "JC - Gestão de Obras"). ' +
    'Responda sempre em português do Brasil, de forma direta e objetiva, citando datas e números ' +
    'quando relevante. Se a informação perguntada não estiver nos dados fornecidos, diga claramente ' +
    'que não encontrou nos dados disponíveis — nunca invente números, datas ou nomes.\n\n' +
    'Dados disponíveis (JSON):\n' + contextoJson;

  var payload = {
    model: MODELO_IA_PERGUNTAS,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: pergunta }]
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', options);
  var json = JSON.parse(resp.getContentText());
  if (json.error) throw new Error(json.error.message || 'Erro desconhecido da API Anthropic');
  if (json.content && json.content[0] && json.content[0].text) return json.content[0].text;
  return 'Sem resposta da IA.';
}

// ============================================================
// UTILITÁRIOS
// ============================================================

// Converte qualquer formato de data (célula tipo Data, "2026-07-10" ou "10/07/2026") para "yyyy-MM-dd"
function normalizarData(v, tz) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, tz || Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const s = String(v || '').trim();
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); // 10/07/2026
  if (br) return br[3] + '-' + br[2] + '-' + br[1];
  return s.slice(0, 10); // "2026-07-10..." → "2026-07-10"
}

// Apontador sem espaços extras e sem diferença de maiúsculas/minúsculas
function normalizarApontador(v) {
  return String(v || '').trim().toLowerCase();
}

function getSheet(name) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
}

function successResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
