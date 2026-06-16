# Como Criar os Headers da Aba Diário Automaticamente

## ⚡ Jeito Rápido (2 minutos)

1. **Abra sua Google Sheet**

2. **Clique em "Extensions" → "Apps Script"** (ou "Ferramentas" → "Editor de scripts" em português)

3. **Cole este código no editor:**

```javascript
function criarHeadersDiario() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetDiario = ss.getSheetByName('Diário');
  if (!sheetDiario) {
    sheetDiario = ss.insertSheet('Diário');
  }
  const headers = ['id','data','setor','tempo','tempoVento','cafeInicio','cafeFim','almocoInicio','almocoFim','encerramento','dssHorario','dssMinistrou','dssTema','atividadesExtra','atividadesMarcadas','atividadesQtd','atividadesAvulsas','efetivo','equipamentos','veiculosLeves','eventosSeguranca','eventosAmbiente','observacoes','criado_por','criado_em'];
  sheetDiario.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheetDiario.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheetDiario.getRange(1, 1, 1, headers.length).setBackground('#d3d3d3');
  SpreadsheetApp.getUi().alert('✅ Headers criados!');
}
```

4. **Clique no botão ▶️ "Run"** (ou pressione Ctrl+Enter)

5. **Clique em "Autorizar"** quando pedir permissão

6. **Pronto!** Os headers foram criados automaticamente na aba Diário

---

## ✅ Verificar

Volte para a Google Sheet e veja a aba "Diário" com os headers já preenchidos e formatados em negrito + fundo cinza.
