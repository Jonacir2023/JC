// Google Apps Script — Diário de Obras
// Planilha: https://docs.google.com/spreadsheets/d/10s86jccaYDECSNjvac4oLSaiQ2ngEHgPWbZU6i2dpmo
//
// Como usar:
// 1. Abra a planilha → Extensões → Apps Script
// 2. Cole este código substituindo todo o conteúdo
// 3. Clique em Implantar → Nova implantação → Tipo: App da Web
//    - Executar como: EU (sua conta)
//    - Quem tem acesso: Qualquer pessoa
// 4. Copie a URL gerada e substitua APPS_SCRIPT_URL_DIARIO no HTML

const SHEET_NAME = 'Diário';

const COLUNAS = [
  'Data',
  'Dia da Semana',
  'Obra',
  'Empresa',
  'Local',
  'Tempo / Clima',
  'Jornada',
  'DSS — Horário',
  'DSS — Ministrado Por',
  'DSS — Tema',
  'Atividades do Dia',
  'Efetivo Total',
  'Efetivo por Função',
  'Colaboradores Presentes',
  'Equipamentos Utilizados',
  'Veículos Leves',
  'Eventos de Segurança',
  'Eventos de Meio Ambiente',
  'Observações do Dia'
];

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Criar aba se não existir
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      // Cabeçalho
      sheet.getRange(1, 1, 1, COLUNAS.length).setValues([COLUNAS]);
      sheet.setFrozenRows(1);
      // Formatar cabeçalho
      const headerRange = sheet.getRange(1, 1, 1, COLUNAS.length);
      headerRange.setBackground('#2c2c2c');
      headerRange.setFontColor('#f5b334');
      headerRange.setFontWeight('bold');
      sheet.setColumnWidth(1, 100);   // Data
      sheet.setColumnWidth(2, 110);   // Dia
      sheet.setColumnWidth(3, 160);   // Obra
      sheet.setColumnWidth(4, 160);   // Empresa
      sheet.setColumnWidth(5, 140);   // Local
      sheet.setColumnWidth(6, 120);   // Tempo
      sheet.setColumnWidth(7, 200);   // Jornada
      sheet.setColumnWidth(8, 80);    // DSS hora
      sheet.setColumnWidth(9, 140);   // DSS ministrou
      sheet.setColumnWidth(10, 220);  // DSS tema
      sheet.setColumnWidth(11, 280);  // Atividades
      sheet.setColumnWidth(12, 80);   // Efetivo total
      sheet.setColumnWidth(13, 200);  // Efetivo função
      sheet.setColumnWidth(14, 280);  // Colaboradores
      sheet.setColumnWidth(15, 220);  // Equipamentos
      sheet.setColumnWidth(16, 180);  // Veículos
      sheet.setColumnWidth(17, 220);  // Seg
      sheet.setColumnWidth(18, 220);  // MA
      sheet.setColumnWidth(19, 300);  // Observações
    }

    const linha = [
      payload.data                  || '',
      payload.diaSemana             || '',
      payload.obra                  || '',
      payload.empresa               || '',
      payload.local                 || '',
      payload.tempo                 || '',
      payload.jornada               || '',
      payload.dssHorario            || '',
      payload.dssMinistrou          || '',
      payload.dssTema               || '',
      payload.atividades            || '',
      payload.efetivoTotal          || 0,
      payload.efetivoPorFuncao      || '',
      payload.colaboradoresPresentes|| '',
      payload.equipamentos          || '',
      payload.veiculosLeves         || '',
      payload.eventosSeguranca      || '',
      payload.eventosMeioAmbiente   || '',
      payload.observacoes           || ''
    ];

    // Procurar linha existente com a mesma data (coluna A, a partir da linha 2)
    const dados = sheet.getDataRange().getValues();
    let linhaExistente = -1;
    for (let i = 1; i < dados.length; i++) {
      if (dados[i][0] === payload.data) {
        linhaExistente = i + 1; // +1 porque getValues é 0-indexed mas Sheets é 1-indexed
        break;
      }
    }

    if (linhaExistente > 0) {
      // Atualizar linha existente
      sheet.getRange(linhaExistente, 1, 1, linha.length).setValues([linha]);
    } else {
      // Append nova linha
      sheet.appendRow(linha);
      // Formatar células com quebra de linha para colunas de texto longo
      const novaLinha = sheet.getLastRow();
      sheet.getRange(novaLinha, 1, 1, linha.length).setWrap(true);
      sheet.setRowHeight(novaLinha, 21);
    }

    // Ordenar por data (coluna A) a partir da linha 2
    const lastRow = sheet.getLastRow();
    if (lastRow > 2) {
      sheet.getRange(2, 1, lastRow - 1, COLUNAS.length).sort({ column: 1, ascending: false });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, erro: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET para teste de conectividade
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, msg: 'Diário de Obras API ativa' }))
    .setMimeType(ContentService.MimeType.JSON);
}
