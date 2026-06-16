# PLANO DE IMPLEMENTAÇÃO - JC SEM N8N

## 🎯 Objetivo
Substituir N8N por Google Sheets + Google Apps Script (100% grátis)

---

## 📋 CHECKLIST - FAÇA NESTA ORDEM

### FASE 1: Google Sheets (5-10 min)
- [ ] Acesse [sheets.google.com](https://sheets.google.com)
- [ ] Crie nova planilha: **"JC - Gestão de Obras"**
- [ ] Copie a URL e guarde o ID (entre `/d/` e `/edit`)
- [ ] Crie 3 abas com nomes:
  - [ ] Aba 1: **Pauta** (adicione headers na linha 1)
  - [ ] Aba 2: **CheckIn** (adicione headers na linha 1)
  - [ ] Aba 3: **Diário** (adicione headers na linha 1)

**Headers para cada aba:**

**Pauta:**
```
id	assunto	descrição	criador	responsável	setor	prioridade	status	data_lançamento	data_término	criado_em	atualizado_em
```

**CheckIn:**
```
id	data	hora	obra	assuntos_json	resumo	criado_em
```

**Diário:**
```
id	data	setor	tempo	tempoVento	cafeInicio	cafeFim	almocoInicio	almocoFim	encerramento	dssHorario	dssMinistrou	dssTema	atividadesExtra	atividadesMarcadas	atividadesQtd	atividadesAvulsas	efetivo	equipamentos	veiculosLeves	eventosSeguranca	eventosAmbiente	observacoes	criado_por	criado_em
```

---

### FASE 2: Google Apps Scripts (10-15 min)

#### Apps Script 1: Pauta + CheckIn

- [ ] Na planilha, clique **Extensões → Apps Script**
- [ ] Apague o código padrão
- [ ] Cole o conteúdo de **`/home/user/JC/apps-scripts/pauta-checkin-api.gs`**
- [ ] Mude a linha:
  ```javascript
  const SHEET_ID = 'SEU_ID_AQUI'; // Copie da URL da planilha
  ```
- [ ] Clique **Guardar** (ícone 💾)
- [ ] Clique **Deploy → New deployment**
  - Type: **Web app**
  - Execute as: **Me**
  - Execute access: **Anyone**
  - Clique **Deploy**
- [ ] Copie o link gerado (vai parecer com `https://script.google.com/macros/d/XXXXX/userweb/dev`)
- [ ] **Guarde essa URL!** → Será **APPS_SCRIPT_URL_PAUTA**

#### Apps Script 2: Diário

- [ ] Crie um novo Apps Script (na mesma planilha ou novo projeto)
- [ ] Cole o conteúdo de **`/home/user/JC/apps-scripts/diario-api.gs`**
- [ ] Mude a linha:
  ```javascript
  const SHEET_ID = 'SEU_ID_AQUI'; // Mesmo ID da planilha
  ```
- [ ] Clique **Guardar**
- [ ] Clique **Deploy → New deployment** (mesmo processo)
- [ ] Copie o link gerado
- [ ] **Guarde essa URL!** → Será **APPS_SCRIPT_URL_DIARIO**

---

### FASE 3: Adaptar HTMLs (20-30 min)

#### HTML 1: Check-in.html

- [ ] Abra o arquivo **Check-in.html** em um editor de texto
- [ ] Procure por: `const S={`
- [ ] **Logo após** essa linha, adicione:
  ```javascript
  // 🔗 Google Apps Script API
  const APPS_SCRIPT_URL_PAUTA = 'COLE_A_URL_DO_APPS_SCRIPT_1_AQUI';
  ```
  (Cole a URL que você guardou em FASE 2)

- [ ] Procure por: `function carregarDaPlanilha(){`
- [ ] **Copie e cole** todo o bloco de funções de "Passo 2" do guia:
  - `carregarDaPlanilhaGoogle()`
  - `sincronizarComGoogle()`
  - `salvarCheckInGoogle()`

- [ ] Modifique a função `carregarDaPlanilha()` para chamar a nova função Google
- [ ] Modifique `moverCard()` para sincronizar com Google (veja guia)
- [ ] Modifique `salvarReuniao()` para salvar na planilha Google (veja guia)

- [ ] **Salve o arquivo**

#### HTML 2: Diário de Obras

- [ ] Abra **diarioobrasv4.html**
- [ ] Procure por: `let state = loadState();`
- [ ] **Logo antes**, adicione:
  ```javascript
  // 🔗 Google Apps Script API
  const APPS_SCRIPT_URL_DIARIO = 'COLE_A_URL_DO_APPS_SCRIPT_2_AQUI';
  ```

- [ ] Procure por: `function salvarDiarioDia(notificar) {`
- [ ] **Copie e cole** as 3 funções de sincronização (veja guia):
  - `salvarDiarioGoogle()`
  - `carregarDiarioGoogle(data)`
  - `gerarRelatorioGoogle()`

- [ ] Modifique `salvarDiarioDia()` para chamar `salvarDiarioGoogle()` (veja guia)
- [ ] Modifique o evento de clique no calendário para carregar da planilha
- [ ] Modifique `gerarRelatorio()` para usar `gerarRelatorioGoogle()`

- [ ] **Salve o arquivo**

---

### FASE 4: Testar (5-10 min)

- [ ] Abra **Check-in.html** no navegador
- [ ] Clique em **"🔄 ATUALIZAR DA PLANILHA"**
  - [ ] Deve aparecer mensagem de sucesso
  - [ ] Se houver dados na planilha, devem aparecer

- [ ] Crie um novo assunto
  - [ ] Clique **"+ NOVO ASSUNTO"**
  - [ ] Preencha os campos
  - [ ] Clique **"SALVAR ASSUNTO"**
  - [ ] Verifique se aparece no Kanban

- [ ] Mude um status (ex: A Fazer → Fazendo)
  - [ ] Clique em ⚡ no card
  - [ ] Abra a planilha Google
  - [ ] Verifique se o status foi atualizado na coluna "status"

- [ ] Teste o **Diário de Obras**
  - [ ] Abra **diarioobrasv4.html**
  - [ ] Preencha um dia
  - [ ] Clique **"💾 SALVAR DIÁRIO"**
  - [ ] Verifique se apareceu uma linha na aba "Diário" da planilha

- [ ] Teste carregar um diário anterior
  - [ ] Clique numa data no calendário
  - [ ] O dia deve carregar da planilha

---

### FASE 5: Decisão sobre N8N (5 min)

- [ ] **Opção A: Manter N8N**
  - N8N continua criando Markdown em Obsidian
  - Google Sheets é espelho dos dados
  - Apps HTML usam Google Sheets
  - Sincronização é manual (script adicional needed)

- [ ] **Opção B: Remover N8N (Recomendado)**
  - Apps HTML como interface principal
  - Google Sheets como banco de dados
  - Criar script opcional para sincronizar com Obsidian
  - **Economiza custo mensal do N8N** ✅

**RECOMENDAÇÃO:** Opção B (remover N8N, usar Google Sheets)

---

## 📊 Status de Implementação

| Item | Status | Arquivo |
|------|--------|---------|
| Google Sheets | ⏳ Você cria | (manual) |
| Apps Script 1 | ✅ Pronto | `/apps-scripts/pauta-checkin-api.gs` |
| Apps Script 2 | ✅ Pronto | `/apps-scripts/diario-api.gs` |
| Guia Deploy | ✅ Pronto | `/apps-scripts/README.md` |
| Guia Adaptar HTML | ✅ Pronto | `/apps-scripts/ADAPTAR-HTMLS.md` |
| Check-in.html | ⏳ Você adapta | Siga o guia |
| Diário.html | ⏳ Você adapta | Siga o guia |

---

## 🚀 Próximo Passo

**VOCÊ FARÁ AGORA:**

1. Crie a planilha Google (FASE 1)
2. Faça deploy dos Apps Scripts (FASE 2)
3. Adapte os HTMLs (FASE 3)
4. Teste (FASE 4)
5. Decida sobre N8N (FASE 5)

**Quanto tempo:** ~1 hora de trabalho manual

**Benefício:** 100% grátis, sem dependência de N8N

---

## 💬 Suporte

- Dúvidas sobre Apps Script? Veja `/apps-scripts/README.md`
- Dúvidas sobre adaptar HTML? Veja `/apps-scripts/ADAPTAR-HTMLS.md`
- Algo não funciona? Verifique as URLs dos Apps Scripts (mais comum)

**Bora começar?** 🔥
