/**
 * GOOGLE APPS SCRIPT - Pauta + CheckIn API
 * Deploy como Web App (Execute as: Me, Anyone)
 *
 * Endpoints:
 * - GET /api/pauta/listar
 * - POST /api/pauta/criar
 * - POST /api/pauta/atualizar-status
 * - POST /api/checkin/salvar
 * - GET /api/checkin/historico
 */

const SHEET_ID = '19fTP_qyxv1QiLdxBz3jbvTb46DKedrkApEVExmSxKEM';
const SHEET_NAME_PAUTA = 'Pauta';
const SHEET_NAME_CHECKIN = 'CheckIn';

function doGet(e) {
  const path = e.parameter.path || '';
  const action = e.parameter.action || '';

  try {
    if (path === 'pauta' && action === 'listar') {
      return listarPautas();
    }
    if (path === 'checkin' && action === 'historico') {
      return listarCheckIns();
    }
    return errorResponse('Endpoint não encontrado');
  } catch (err) {
    return errorResponse(err.message);
  }
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const path = e.parameter.path || '';
  const action = e.parameter.action || '';

  try {
    // PAUTA
    if (path === 'pauta' && action === 'criar') {
      return criarPauta(data);
    }
    if (path === 'pauta' && action === 'atualizar-status') {
      return atualizarStatusPauta(data);
    }

    // CHECKIN
    if (path === 'checkin' && action === 'salvar') {
      return salvarCheckIn(data);
    }

    return errorResponse('Endpoint não encontrado');
  } catch (err) {
    return errorResponse(err.message);
  }
}

// ============================================================
// PAUTA - Funções
// ============================================================

function listarPautas() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME_PAUTA);
  if (!sheet) return errorResponse('Aba Pauta não encontrada');

  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0];

  const pautas = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) break; // linha vazia = fim

    const pauta = {};
    for (let j = 0; j < headers.length; j++) {
      pauta[headers[j]] = row[j];
    }
    pautas.push(pauta);
  }

  return successResponse({ pautas });
}

function criarPauta(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME_PAUTA);
  if (!sheet) return errorResponse('Aba Pauta não encontrada');

  // Gerar ID único
  const id = 'PAUTA-' + Date.now();
  const agora = new Date().toISOString();

  // Inserir linha
  const novaLinha = [
    id,
    data.assunto || '',
    data.descricao || '',
    data.criador || '',
    data.responsavel || '',
    data.setor || '',
    data.prioridade || 'Média',
    'Aberta',
    data.data_lancamento || new Date().toISOString().slice(0, 10),
    data.data_termino || '',
    agora,
    agora
  ];

  sheet.appendRow(novaLinha);

  return successResponse({
    ok: true,
    id,
    status: 'Aberta',
    msg: 'Pauta criada com sucesso'
  });
}

function atualizarStatusPauta(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME_PAUTA);
  if (!sheet) return errorResponse('Aba Pauta não encontrada');

  const id = data.id;
  const novoStatus = data.novo_status;

  const range = sheet.getDataRange();
  const values = range.getValues();

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.getRange(i + 1, 8).setValue(novoStatus); // coluna status
      sheet.getRange(i + 1, 12).setValue(new Date().toISOString()); // atualizado_em
      return successResponse({ ok: true, status: novoStatus });
    }
  }

  return errorResponse('Pauta não encontrada');
}

// ============================================================
// CHECKIN - Funções
// ============================================================

function salvarCheckIn(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME_CHECKIN);
  if (!sheet) return errorResponse('Aba CheckIn não encontrada');

  const id = 'CHECKIN-' + Date.now();
  const agora = new Date().toISOString();

  const novaLinha = [
    id,
    data.data || '',
    data.hora || '',
    data.obra || '',
    JSON.stringify(data.assuntos || []),
    data.resumo || '',
    agora
  ];

  sheet.appendRow(novaLinha);

  return successResponse({
    ok: true,
    id,
    msg: 'CheckIn salvo com sucesso'
  });
}

function listarCheckIns() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME_CHECKIN);
  if (!sheet) return errorResponse('Aba CheckIn não encontrada');

  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0];

  const checkins = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) break;

    const checkin = {};
    for (let j = 0; j < headers.length; j++) {
      checkin[headers[j]] = row[j];
    }
    // Desserializar JSON
    if (checkin.assuntos_json) {
      try {
        checkin.assuntos = JSON.parse(checkin.assuntos_json);
      } catch (e) {}
    }
    checkins.push(checkin);
  }

  return successResponse({ checkins });
}

// ============================================================
// Utils
// ============================================================

function successResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({
    ok: false,
    error: msg
  }))
    .setMimeType(ContentService.MimeType.JSON);
}
