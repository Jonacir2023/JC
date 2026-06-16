/**
 * GOOGLE APPS SCRIPT - Diário de Obras API
 * Deploy como Web App (Execute as: Me, Anyone)
 *
 * Endpoints:
 * - GET /api/diario/carregar?data=YYYY-MM-DD
 * - POST /api/diario/salvar
 * - GET /api/diario/relatorio?data=YYYY-MM-DD
 * - GET /api/diario/lista-mes?mes=YYYY-MM
 */

const SHEET_ID = ''; // Será preenchido com ID da planilha
const SHEET_NAME_DIARIO = 'Diário';

function doGet(e) {
  const path = e.parameter.path || '';
  const action = e.parameter.action || '';
  const data = e.parameter.data || '';
  const mes = e.parameter.mes || '';

  try {
    if (path === 'diario' && action === 'carregar' && data) {
      return carregarDiario(data);
    }
    if (path === 'diario' && action === 'relatorio' && data) {
      return gerarRelatorioDiario(data);
    }
    if (path === 'diario' && action === 'lista-mes' && mes) {
      return listarDiariosMes(mes);
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
    if (path === 'diario' && action === 'salvar') {
      return salvarDiario(data);
    }
    return errorResponse('Endpoint não encontrado');
  } catch (err) {
    return errorResponse(err.message);
  }
}

// ============================================================
// DIÁRIO - Funções
// ============================================================

function salvarDiario(diarioData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_DIARIO);
  if (!sheet) return errorResponse('Aba Diário não encontrada');

  const data = diarioData.data || '';
  const id = 'DIARIO-' + data.replace(/-/g, '') + '-' + Date.now();
  const agora = new Date().toISOString();

  // Verifica se já existe registro para essa data
  const range = sheet.getDataRange();
  const values = range.getValues();

  for (let i = 1; i < values.length; i++) {
    if (values[i][1] === data) {
      // Atualizar linha existente
      const novaLinha = montarLinhasDiario(id, diarioData, agora);
      for (let j = 0; j < novaLinha.length; j++) {
        sheet.getRange(i + 1, j + 1).setValue(novaLinha[j]);
      }
      return successResponse({ ok: true, id, msg: 'Diário atualizado' });
    }
  }

  // Inserir nova linha
  const novaLinha = montarLinhasDiario(id, diarioData, agora);
  sheet.appendRow(novaLinha);

  return successResponse({ ok: true, id, msg: 'Diário salvo com sucesso' });
}

function montarLinhasDiario(id, dados, agora) {
  return [
    id,
    dados.data || '',
    dados.setor || '',
    dados.tempo || '',
    dados.tempoVento ? 'sim' : 'não',
    dados.cafeInicio || '',
    dados.cafeFim || '',
    dados.almocoInicio || '',
    dados.almocoFim || '',
    dados.encerramento || '',
    dados.dssHorario || '',
    dados.dssMinistrou || '',
    dados.dssTema || '',
    dados.atividadesExtra || '',
    JSON.stringify(dados.atividadesMarcadas || {}),
    JSON.stringify(dados.atividadesQtd || {}),
    JSON.stringify(dados.atividadesAvulsas || []),
    JSON.stringify(dados.efetivo || {}),
    JSON.stringify(dados.equipamentos || {}),
    JSON.stringify(dados.veiculosLeves || []),
    JSON.stringify(dados.eventosSeguranca || []),
    JSON.stringify(dados.eventosAmbiente || []),
    dados.observacoes || '',
    dados.criado_por || '',
    agora
  ];
}

function carregarDiario(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_DIARIO);
  if (!sheet) return errorResponse('Aba Diário não encontrada');

  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0];

  for (let i = 1; i < values.length; i++) {
    if (values[i][1] === data) {
      // Encontrou o diário
      const diario = {};
      for (let j = 0; j < headers.length; j++) {
        const valor = values[i][j];
        // Tenta desserializar JSON em colunas específicas
        if (j >= 14 && j <= 21) { // colunas de JSON
          try {
            diario[headers[j]] = JSON.parse(valor);
          } catch (e) {
            diario[headers[j]] = valor;
          }
        } else {
          diario[headers[j]] = valor;
        }
      }
      return successResponse({ ok: true, diario });
    }
  }

  // Não encontrou - retorna estrutura vazia
  return successResponse({
    ok: false,
    msg: 'Diário não encontrado',
    diario: {
      data,
      tempo: '',
      tempoVento: false,
      cafeInicio: '06:30',
      cafeFim: '07:00',
      almocoInicio: '12:00',
      almocoFim: '13:00',
      encerramento: '17:00',
      dssHorario: '',
      dssMinistrou: '',
      dssTema: '',
      atividadesExtra: '',
      atividadesMarcadas: {},
      atividadesQtd: {},
      atividadesAvulsas: [],
      efetivo: {},
      equipamentos: {},
      veiculosLeves: [],
      eventosSeguranca: [],
      eventosAmbiente: []
    }
  });
}

function gerarRelatorioDiario(data) {
  const resp = carregarDiario(data);
  const respObj = JSON.parse(resp.getContent());

  if (!respObj.ok || !respObj.diario) {
    return resp;
  }

  const d = respObj.diario;
  const formatData = (dateStr) => {
    if (!dateStr) return '';
    const dt = new Date(dateStr);
    return dt.toLocaleDateString('pt-BR');
  };

  const relatorio = `
📝 DIÁRIO DE OBRAS — ${formatData(d.data)}

🌤️ TEMPO: ${d.tempo || '—'} ${d.tempoVento ? '💨 Com vento' : ''}

⏰ JORNADA:
  ☕ Café: ${d.cafeInicio} — ${d.cafeFim}
  🍽️ Almoço: ${d.almocoInicio} — ${d.almocoFim}
  🔚 Encerramento: ${d.encerramento}

📋 DSS:
  Horário: ${d.dssHorario || '—'}
  Ministrado por: ${d.dssMinistrou || '—'}
  Tema: ${d.dssTema || '—'}

🛠️ ATIVIDADES:
${Object.keys(d.atividadesMarcadas || {}).length > 0 ?
  Object.keys(d.atividadesMarcadas).map(k => `  • ${k}`).join('\n') :
  '  (nenhuma)'}
${d.atividadesExtra ? `\nObservações: ${d.atividadesExtra}` : ''}

👷 EFETIVO: ${Object.keys(d.efetivo || {}).length} presentes

🚜 EQUIPAMENTOS: ${Object.keys(d.equipamentos || {}).length} utilizados

🦺 EVENTOS: ${d.eventosSeguranca?.length || 0} seg. / ${d.eventosAmbiente?.length || 0} amb.
  `.trim();

  return successResponse({
    ok: true,
    data,
    relatorio
  });
}

function listarDiariosMes(mes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_DIARIO);
  if (!sheet) return errorResponse('Aba Diário não encontrada');

  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0];

  const diarios = [];
  for (let i = 1; i < values.length; i++) {
    const rowData = values[i];
    const dataDiario = rowData[1];

    if (dataDiario && dataDiario.startsWith(mes)) {
      const diario = {};
      for (let j = 0; j < headers.length; j++) {
        diario[headers[j]] = rowData[j];
      }
      diarios.push(diario);
    }
  }

  return successResponse({ ok: true, mes, diarios });
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
