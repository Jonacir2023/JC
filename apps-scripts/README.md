# Google Apps Script - Deployment Guide

## Setup Rápido

### Passo 1: Criar Google Sheet
1. Acesse [sheets.google.com](https://sheets.google.com)
2. Crie uma nova planilha chamada **`JC - Gestão de Obras`**
3. Crie 3 abas:
   - **Pauta** (colunas: id, assunto, descrição, criador, responsável, setor, prioridade, status, data_lançamento, data_término, criado_em, atualizado_em)
   - **CheckIn** (colunas: id, data, hora, obra, assuntos_json, resumo, criado_em)
   - **Diário** (veja abaixo)

### Passo 2: Apps Script 1 (Pauta + CheckIn)

1. Na planilha, clique em **Extensões → Apps Script**
2. Apague o código padrão
3. Cole o conteúdo de `pauta-checkin-api.gs`
4. **Mude a linha:**
   ```javascript
   const SHEET_ID = ''; // ← COLOQUE O ID DA SUA PLANILHA AQUI
   ```
   Para encontrar o ID: na URL da planilha
   ```
   https://docs.google.com/spreadsheets/d/AQUI-É-O-ID/edit
   ```

5. Clique em **Deploy → New deployment**
6. Type: **Web app**
7. Execute as: **Me** (sua conta)
8. Execute access: **Anyone**
9. **Deploy** e copie o link gerado (vai usar nos HTMLs)

### Passo 3: Apps Script 2 (Diário)

1. Crie um **novo Apps Script** na mesma planilha (ou outro projeto)
2. Cole o conteúdo de `diario-api.gs`
3. **Mude a linha:**
   ```javascript
   const SHEET_ID = ''; // ← COLOQUE O ID DA SUA PLANILHA
   ```
4. **Deploy** como Web App (mesmo processo acima)
5. Copie o link gerado

### Estrutura da Aba "Diário"

Na primeira linha, adicione esses headers (exatamente nesta ordem):

```
id | data | setor | tempo | tempoVento | cafeInicio | cafeFim | almocoInicio | almocoFim | encerramento | dssHorario | dssMinistrou | dssTema | atividadesExtra | atividadesMarcadas | atividadesQtd | atividadesAvulsas | efetivo | equipamentos | veiculosLeves | eventosSeguranca | eventosAmbiente | observacoes | criado_por | criado_em
```

---

## URLs dos Apps Scripts Deployados

Após fazer deploy, você terá URLs como:

```
Apps Script 1 (Pauta+CheckIn):
https://script.google.com/macros/d/XXXX/userweb/dev

Apps Script 2 (Diário):
https://script.google.com/macros/d/YYYY/userweb/dev
```

**Guarde essas URLs!** Você vai usar no HTML.

---

## Como Chamar as APIs

### Pauta + CheckIn

```javascript
// Listar pautas
fetch('https://script.google.com/macros/.../dev?path=pauta&action=listar')
  .then(r => r.json())
  .then(d => console.log(d.pautas))

// Criar pauta
fetch('https://script.google.com/macros/.../dev?path=pauta&action=criar', {
  method: 'POST',
  body: JSON.stringify({
    assunto: 'Compra de Cimento',
    descricao: '50 sacos',
    criador: 'João',
    responsavel: 'Maria',
    setor: 'Suprimentos',
    prioridade: 'Alta'
  })
})

// Atualizar status
fetch('https://script.google.com/macros/.../dev?path=pauta&action=atualizar-status', {
  method: 'POST',
  body: JSON.stringify({
    id: 'PAUTA-1234567890',
    novo_status: 'Em Andamento'
  })
})

// Salvar CheckIn
fetch('https://script.google.com/macros/.../dev?path=checkin&action=salvar', {
  method: 'POST',
  body: JSON.stringify({
    data: '2026-06-16',
    hora: '08:00',
    obra: 'Obra X',
    assuntos: [{...}, {...}],
    resumo: 'Resumo da reunião'
  })
})
```

### Diário de Obras

```javascript
// Carregar diário de uma data
fetch('https://script.google.com/macros/.../dev?path=diario&action=carregar&data=2026-06-16')
  .then(r => r.json())
  .then(d => console.log(d.diario))

// Salvar diário
fetch('https://script.google.com/macros/.../dev?path=diario&action=salvar', {
  method: 'POST',
  body: JSON.stringify({
    data: '2026-06-16',
    setor: 'Produção Civil',
    tempo: 'nublado',
    tempoVento: false,
    cafeInicio: '06:30',
    cafeFim: '07:00',
    almocoInicio: '12:00',
    almocoFim: '13:00',
    encerramento: '17:00',
    dssHorario: '07:15',
    dssMinistrou: 'João',
    dssTema: 'Uso de EPI',
    atividadesMarcadas: {id1: true, id3: true},
    atividadesQtd: {id1: '50', id3: '30'},
    efetivo: {col1: true, col3: true},
    equipamentos: {eq1: {ativo: true, operadorNome: 'João'}},
    eventosSeguranca: [{tipo: 'Quase acidente', desc: 'Cabo solto'}],
    criado_por: 'Jonacir'
  })
})

// Gerar relatório
fetch('https://script.google.com/macros/.../dev?path=diario&action=relatorio&data=2026-06-16')
  .then(r => r.json())
  .then(d => console.log(d.relatorio))

// Listar diários de um mês
fetch('https://script.google.com/macros/.../dev?path=diario&action=lista-mes&mes=2026-06')
  .then(r => r.json())
  .then(d => console.log(d.diarios))
```

---

## Próximo Passo

Depois de fazer deploy dos 2 Apps Scripts, você vai **adaptar os HTMLs** para:
1. Em vez de salvar só em localStorage
2. Fazer POST/GET para essas APIs
3. Sincronizar com a planilha Google

**Guarde as URLs dos Apps Scripts que você vai usar nos HTMLs!**
