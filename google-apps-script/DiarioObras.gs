// ============================================================
// Google Apps Script — Diário de Obras (unificado)
// Módulos: Pauta · CheckIn · Diário
// Planilha: https://docs.google.com/spreadsheets/d/19fTP_qyxv1QiLdxBz3jbvTb46DKedrkApEVExmSxKEM
//
// Como implantar:
// 1. Abra a planilha → Extensões → Apps Script
// 2. Cole este código substituindo todo o conteúdo existente
// 3. Implantar → Gerenciar implantações → Editar → Nova versão → Implantar
//    (ou Nova implantação → App da Web → Executar como: Eu · Acesso: Qualquer pessoa)
// 4. A URL gerada é a mesma usada em APPS_SCRIPT_URL_DIARIO no HTML
// ============================================================

const SHEET_ID           = '19fTP_qyxv1QiLdxBz3jbvTb46DKedrkApEVExmSxKEM';
const SHEET_NAME_PAUTA   = 'Pauta';
const SHEET_NAME_CHECKIN = 'CheckIn';
const SHEET_NAME_DIARIO  = 'Diário';

// 23 colunas
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
  'Apontador'                // W
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
    return successResponse({ ok: true, msg: 'API Diário de Obras ativa' });
  } catch (err) { return errorResponse(err.message); }
}

function doPost(e) {
  try {
    const raw  = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const body = JSON.parse(raw);
    const path   = (e && e.parameter && e.parameter.path)   || '';
    const action = (e && e.parameter && e.parameter.action) || '';
    if (path === 'pauta'   && action === 'criar')            return criarPauta(body);
    if (path === 'pauta'   && action === 'atualizar-status') return atualizarStatusPauta(body);
    if (path === 'checkin' && action === 'salvar')           return salvarCheckIn(body);
    if (path === 'diario'  && action === 'salvar')           return salvarDiario(body);
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

  // Reescreve cabeçalho se necessário
  const colA = sheet.getRange(1, 1).getValue();
  if (colA !== 'Data') {
    sheet.clearContents();
    const hr = sheet.getRange(1, 1, 1, COLUNAS_DIARIO.length);
    hr.setValues([COLUNAS_DIARIO]);
    hr.setBackground('#2c2c2c');
    hr.setFontColor('#f5b334');
    hr.setFontWeight('bold');
    sheet.setFrozenRows(1);
    const larguras = [100,110,160,160,120,180,220,130,230,80,160,230,280,80,200,300,220,180,260,240,240,320,180];
    larguras.forEach((w, i) => sheet.setColumnWidth(i+1, w));
  }

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
    payload.apontador              || ''   // W Apontador
  ];

  // Upsert por data + apontador (mantém apenas o mais recente)
  const apontadorCol = COLUNAS_DIARIO.length - 1; // índice 0-based = col V
  const dados = sheet.getDataRange().getValues();
  const rowsParaDeletar = [];
  let linhaIdx = -1;
  for (let i = 1; i < dados.length; i++) {
    const mesmaData      = dados[i][0] === payload.data;
    const mesmoApontador = String(dados[i][apontadorCol]).trim() === String(payload.apontador || '').trim();
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
// UTILITÁRIOS
// ============================================================

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
