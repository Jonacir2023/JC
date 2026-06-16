# Como Criar os Headers no Google Sheets

## Instruções Rápidas

1. Abra sua Google Sheet
2. Para cada aba abaixo, insira os nomes das colunas na **Linha 1**
3. Cada coluna fica em uma célula (A1, B1, C1, etc.)

---

## 🗂️ Aba "Pauta"

Na **linha 1**, coloque esses nomes nas colunas:

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| id | assunto | descrição | criador | responsável | setor | prioridade | status | data_lançamento | data_término | criado_em | atualizado_em |

### Copie e Cole na Linha 1:
```
id	assunto	descrição	criador	responsável	setor	prioridade	status	data_lançamento	data_término	criado_em	atualizado_em
```

---

## 🗂️ Aba "CheckIn"

Na **linha 1**, coloque esses nomes:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| id | data | hora | obra | assuntos_json | resumo | criado_em |

### Copie e Cole na Linha 1:
```
id	data	hora	obra	assuntos_json	resumo	criado_em
```

---

## 🗂️ Aba "Diário"

Na **linha 1**, coloque esses nomes (25 colunas):

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| id | data | setor | tempo | tempoVento | cafeInicio | cafeFim | almocoInicio | almocoFim | encerramento | dssHorario | dssMinistrou | dssTema | atividadesExtra | atividadesMarcadas | atividadesQtd | atividadesAvulsas | efetivo | equipamentos | veiculosLeves | eventosSeguranca | eventosAmbiente | observacoes | criado_por | criado_em |

### Copie e Cole na Linha 1:
```
id	data	setor	tempo	tempoVento	cafeInicio	cafeFim	almocoInicio	almocoFim	encerramento	dssHorario	dssMinistrou	dssTema	atividadesExtra	atividadesMarcadas	atividadesQtd	atividadesAvulsas	efetivo	equipamentos	veiculosLeves	eventosSeguranca	eventosAmbiente	observacoes	criado_por	criado_em
```

---

## 📝 Passo a Passo Manual

1. **Abra a aba "Pauta"** na Google Sheet
2. **Clique na célula A1** (canto superior esquerdo)
3. **Cole o texto da seção "Copie e Cole"** (Ctrl+V ou Cmd+V)
4. O Google Sheets vai distribuir automaticamente em cada coluna
5. **Repita para as outras abas** ("CheckIn" e "Diário")

---

## ⚡ Alternativa: Criar via Google Apps Script

Se preferir automatizar, adicione esta função a um Apps Script:

```javascript
function criarHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Aba Pauta
  const sheetPauta = ss.getSheetByName('Pauta') || ss.insertSheet('Pauta');
  sheetPauta.getRange('A1:L1').setValues([[
    'id', 'assunto', 'descrição', 'criador', 'responsável', 'setor', 
    'prioridade', 'status', 'data_lançamento', 'data_término', 'criado_em', 'atualizado_em'
  ]]);
  
  // Aba CheckIn
  const sheetCheckin = ss.getSheetByName('CheckIn') || ss.insertSheet('CheckIn');
  sheetCheckin.getRange('A1:G1').setValues([[
    'id', 'data', 'hora', 'obra', 'assuntos_json', 'resumo', 'criado_em'
  ]]);
  
  // Aba Diário
  const sheetDiario = ss.getSheetByName('Diário') || ss.insertSheet('Diário');
  sheetDiario.getRange('A1:Y1').setValues([[
    'id', 'data', 'setor', 'tempo', 'tempoVento', 'cafeInicio', 'cafeFim', 
    'almocoInicio', 'almocoFim', 'encerramento', 'dssHorario', 'dssMinistrou', 
    'dssTema', 'atividadesExtra', 'atividadesMarcadas', 'atividadesQtd', 
    'atividadesAvulsas', 'efetivo', 'equipamentos', 'veiculosLeves', 
    'eventosSeguranca', 'eventosAmbiente', 'observacoes', 'criado_por', 'criado_em'
  ]]);
  
  SpreadsheetApp.getUi().alert('Headers criados com sucesso!');
}
```

---

## ✅ Próximo Passo

Depois que os headers estiverem criados, teste salvando dados de um dos HTMLs e verifique se aparece no Google Sheet.
