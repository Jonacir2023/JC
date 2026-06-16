/**
 * Script para criar headers na aba Diário
 * Cole esta função no Google Apps Script Editor e execute
 */

function criarHeadersDiario() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Cria a aba "Diário" se não existir
  let sheetDiario = ss.getSheetByName('Diário');
  if (!sheetDiario) {
    sheetDiario = ss.insertSheet('Diário');
  }

  // Headers da aba Diário (25 colunas)
  const headers = [
    'id',
    'data',
    'setor',
    'tempo',
    'tempoVento',
    'cafeInicio',
    'cafeFim',
    'almocoInicio',
    'almocoFim',
    'encerramento',
    'dssHorario',
    'dssMinistrou',
    'dssTema',
    'atividadesExtra',
    'atividadesMarcadas',
    'atividadesQtd',
    'atividadesAvulsas',
    'efetivo',
    'equipamentos',
    'veiculosLeves',
    'eventosSeguranca',
    'eventosAmbiente',
    'observacoes',
    'criado_por',
    'criado_em'
  ];

  // Insere os headers na linha 1
  sheetDiario.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Formata o header (opcional: deixa em negrito)
  sheetDiario.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheetDiario.getRange(1, 1, 1, headers.length).setBackground('#d3d3d3');

  SpreadsheetApp.getUi().alert('✅ Headers da aba Diário criados com sucesso!');
}
