/**
 * Buildly Brain — Google Apps Script Integration
 * Captura eventos de Google Sheets e envia para a API
 *
 * Instalação:
 * 1. Abra o Google Sheet da sua obra
 * 2. Extensions → Apps Script
 * 3. Cole este código
 * 4. Configure as variáveis abaixo
 * 5. Autorize a app para usar suas contas
 * 6. Execute setup() uma vez
 * 7. Crie triggers manuais ou automáticos
 */

// ============================================
// CONFIGURAÇÃO
// ============================================

const API_URL = 'https://seu-buildly-deploy.vercel.app/api/graphql';
const API_KEY = 'sua-api-key-gratis';
const SHEET_NAME = 'Eventos RDO';
const TENANT_ID = 'seu-tenant-id';

// Estrutura esperada do Sheet:
// Col A: Data | Col B: Obra ID | Col C: Tipo | Col D: Descrição | Col E: Criador | Col F: Status (vazio=pendente)

// ============================================
// SETUP INICIAL
// ============================================

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    addHeaders(sheet);
  }

  // Cria trigger automático (a cada 30 min)
  deleteAllTriggers();
  ScriptApp.newTrigger('onTimerTrigger')
    .timeBased()
    .everyMinutes(30)
    .create();

  Logger.log('✓ Setup concluído! Triggers criados.');
}

function addHeaders(sheet) {
  const headers = [
    'Data',
    'Obra ID',
    'Tipo Evento',
    'Descrição',
    'Criador',
    'Status',
    'Timestamp Envio',
    'ID GraphQL'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
}

// ============================================
// CAPTURE: PROCESSAR EVENTOS DO SHEET
// ============================================

function onTimerTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  let processed = 0;

  // Começa na linha 2 (linha 1 é header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const status = row[5]; // Col F: Status

    // Processa apenas linhas que ainda não foram enviadas
    if (status === '' || status === 'Pendente') {
      try {
        const event = {
          data_evento: row[0],
          obra_id: row[1],
          tipo: row[2],
          descricao: row[3],
          criador: row[4],
        };

        // Envia para a API
        const response = sendEventToAPI(event);

        if (response.success) {
          // Marca como enviado e salva o ID
          sheet.getRange(i + 1, 6).setValue('Enviado');
          sheet.getRange(i + 1, 7).setValue(new Date().toLocaleString('pt-BR'));
          sheet.getRange(i + 1, 8).setValue(response.id);
          processed++;
        } else {
          sheet.getRange(i + 1, 6).setValue('Erro: ' + response.error);
        }
      } catch (error) {
        sheet.getRange(i + 1, 6).setValue('Erro: ' + error.message);
      }
    }
  }

  Logger.log(`✓ Processados ${processed} eventos`);
}

function sendEventToAPI(event) {
  const mutation = `
    mutation CreateEvent($input: CreateEventInput!) {
      createEvent(input: $input) {
        id
        obra_id
        tipo
        descricao
        criador
        created_at
      }
    }
  `;

  const payload = {
    query: mutation,
    variables: {
      input: {
        obra_id: event.obra_id,
        tipo: event.tipo,
        descricao: event.descricao,
        criador: event.criador,
        data_evento: event.data_evento,
      },
    },
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + API_KEY,
      'X-Tenant-ID': TENANT_ID,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(API_URL, options);
    const result = JSON.parse(response.getContentText());

    if (result.data?.createEvent) {
      return {
        success: true,
        id: result.data.createEvent.id,
      };
    } else {
      return {
        success: false,
        error: result.errors?.[0]?.message || 'Erro desconhecido',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// UTILITIES
// ============================================

function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    ScriptApp.deleteTrigger(trigger);
  }
}

/**
 * Manual trigger para testar (use para debug)
 * Execute via Apps Script console: runManualTest()
 */
function runManualTest() {
  const testEvent = {
    data_evento: new Date().toLocaleDateString('pt-BR'),
    obra_id: 'OBRA-2026-001',
    tipo: 'ATRASO_MATERIAL',
    descricao: 'Teste de integração com Google Sheets',
    criador: 'Google Apps Script',
  };

  const response = sendEventToAPI(testEvent);
  Logger.log('Resposta do API:', JSON.stringify(response, null, 2));
}

/**
 * Limpar status de um evento (permite reenvio)
 * Use: clearEventStatus(2) para limpar linha 2
 */
function clearEventStatus(rowNumber) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  sheet.getRange(rowNumber, 6).clearContent();
  Logger.log(`Linha ${rowNumber} limpa. Será reprocessada no próximo trigger.`);
}

/**
 * Consultar status de um evento via GraphQL
 */
function queryEventStatus(eventId) {
  const query = `
    query GetEvent($id: String!) {
      event(id: $id) {
        id
        tipo
        descricao
        criador
        created_at
      }
    }
  `;

  const payload = {
    query: query,
    variables: { id: eventId },
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + API_KEY,
      'X-Tenant-ID': TENANT_ID,
    },
    payload: JSON.stringify(payload),
  };

  const response = UrlFetchApp.fetch(API_URL, options);
  const result = JSON.parse(response.getContentText());

  Logger.log('Evento:', JSON.stringify(result.data?.event, null, 2));
  return result.data?.event;
}
