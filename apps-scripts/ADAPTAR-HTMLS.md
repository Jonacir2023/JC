# Como Adaptar os HTMLs para Google Sheets

## Resumo

Você vai adicionar **3 linhas de código** em cada HTML para:
1. Sincronizar com Google Sheets via Apps Script
2. Manter localStorage como backup
3. Carregar dados ao abrir a página

---

## HTML 1: Check-in.html

### Passo 1: Adicione a URL do Apps Script

No início do `<script>` final, após `const S={...}`, adicione:

```javascript
// 🔗 Google Apps Script API
const APPS_SCRIPT_URL_PAUTA = 'https://script.google.com/macros/d/XXXXX/userweb/dev';
// ↑ MUDE XXXXX pela URL que você recebeu ao fazer deploy
```

### Passo 2: Função para Sincronizar com Google Sheets

Adicione esta função logo após `const S={...}`:

```javascript
// Carregar assuntos da planilha
async function carregarDaPlanilhaGoogle() {
  try {
    notify('Carregando da planilha...', 'var(--blue)');
    const resp = await fetch(APPS_SCRIPT_URL_PAUTA + '?path=pauta&action=listar');
    const data = await resp.json();
    
    if (data.pautas && data.pautas.length > 0) {
      assuntos = data.pautas.map(p => ({
        id: p.id,
        assunto: p.assunto,
        desc: p.descrição,
        criador: p.criador,
        resp: p.responsável,
        setor: p.setor,
        prioridade: p.prioridade,
        status: p.status.toLowerCase().replace(' ', ''),
        dataLanc: p.data_lançamento,
        dataTerm: p.data_término,
        criadoEm: new Date(p.criado_em).getTime()
      }));
      S.set('assuntos', assuntos);
      renderCheckin();
      notify('✅ Assuntos atualizados da planilha!');
    } else {
      notify('Nenhum assunto encontrado na planilha', 'var(--yellow)');
    }
  } catch (err) {
    notify('❌ Erro ao carregar: ' + err.message, 'var(--red)');
  }
}

// Sincronizar um assunto com Google Sheets
async function sincronizarComGoogle(assunto) {
  if (!APPS_SCRIPT_URL_PAUTA) return;
  
  try {
    const resp = await fetch(APPS_SCRIPT_URL_PAUTA + '?path=pauta&action=atualizar-status', {
      method: 'POST',
      body: JSON.stringify({
        id: assunto.id,
        novo_status: assunto.status === 'afazer' ? 'Aberta' :
                      assunto.status === 'fazendo' ? 'Em Andamento' : 'Concluído'
      })
    });
    const data = await resp.json();
    if (!data.ok) throw new Error(data.error);
  } catch (err) {
    console.error('Erro sincronizar:', err);
  }
}

// Salvar CheckIn na planilha
async function salvarCheckInGoogle(reuniao) {
  if (!APPS_SCRIPT_URL_PAUTA) return;
  
  try {
    const resp = await fetch(APPS_SCRIPT_URL_PAUTA + '?path=checkin&action=salvar', {
      method: 'POST',
      body: JSON.stringify({
        data: reuniao.data,
        hora: reuniao.hora,
        obra: config.obra,
        assuntos: reuniao.assuntos.map(a => ({id: a.id, assunto: a.assunto, status: a.status})),
        resumo: 'CheckIn de ' + new Date(reuniao.data).toLocaleDateString('pt-BR')
      })
    });
    const data = await resp.json();
    if (data.ok) {
      notify('✅ CheckIn salvo na planilha!');
    }
  } catch (err) {
    console.error('Erro salvar CheckIn:', err);
  }
}
```

### Passo 3: Modifique as Funções Existentes

**Em `moverCard()`, adicione:**
```javascript
function moverCard(id,status){
  const a=assuntos.find(x=>x.id===id);
  if(a){
    a.status=status;
    if(status==='concluido')a.concluidoEm=Date.now();
    S.set('assuntos',assuntos);
    renderKanbanCheckin();atualizarContadores();
    sincronizarPlanilha(a);
    
    // 🔗 NOVO: Sincronizar com Google
    sincronizarComGoogle(a);
  }
}
```

**Em `salvarReuniao()`, adicione:**
```javascript
function salvarReuniao(){
  const reuniao={
    id:Date.now(),
    data:document.getElementById('ci-data').value,
    hora:document.getElementById('ci-hora').value,
    assuntos:[...assuntos]
  };
  reunioes.push(reuniao);S.set('reunioes',reunioes);notify('Reunião salva!');
  
  // 🔗 NOVO: Salvar na planilha Google
  salvarCheckInGoogle(reuniao);
}
```

**Em `carregarDaPlanilha()`, MUDE para:**
```javascript
function carregarDaPlanilha(){
  // Tenta carregar de Google Sheets primeiro
  carregarDaPlanilhaGoogle();
}
```

---

## HTML 2: Diário de Obras (diarioobrasv4.html)

### Passo 1: Adicione a URL do Apps Script

No início do `<script>` final, adicione:

```javascript
// 🔗 Google Apps Script API
const APPS_SCRIPT_URL_DIARIO = 'https://script.google.com/macros/d/YYYYY/userweb/dev';
// ↑ MUDE YYYYY pela URL que você recebeu ao fazer deploy
```

### Passo 2: Funções de Sincronização

Adicione estas funções:

```javascript
// Salvar diário na planilha
async function salvarDiarioGoogle() {
  if (!currentDay || !APPS_SCRIPT_URL_DIARIO) return;
  
  try {
    const resp = await fetch(APPS_SCRIPT_URL_DIARIO + '?path=diario&action=salvar', {
      method: 'POST',
      body: JSON.stringify({
        ...currentDay,
        criado_por: state.obra.empresa || 'Sistema'
      })
    });
    const data = await resp.json();
    if (data.ok) {
      console.log('✅ Diário sincronizado com planilha');
      return data.id;
    } else {
      throw new Error(data.error);
    }
  } catch (err) {
    console.error('Erro sincronizar diário:', err);
  }
}

// Carregar diário de uma data específica
async function carregarDiarioGoogle(data) {
  if (!APPS_SCRIPT_URL_DIARIO) return null;
  
  try {
    const resp = await fetch(APPS_SCRIPT_URL_DIARIO + '?path=diario&action=carregar&data=' + data);
    const resultado = await resp.json();
    
    if (resultado.diario) {
      return resultado.diario;
    }
    return null;
  } catch (err) {
    console.error('Erro carregar diário:', err);
    return null;
  }
}

// Gerar relatório formatado
async function gerarRelatorioGoogle() {
  if (!currentDay || !APPS_SCRIPT_URL_DIARIO) return '';
  
  try {
    const resp = await fetch(APPS_SCRIPT_URL_DIARIO + '?path=diario&action=relatorio&data=' + currentDay.data);
    const data = await resp.json();
    return data.relatorio || '';
  } catch (err) {
    console.error('Erro gerar relatório:', err);
    return '';
  }
}
```

### Passo 3: Modifique `salvarDiarioDia()`

**MUDE a função `salvarDiarioDia()` para:**

```javascript
function salvarDiarioDia(notificar) {
  if (!currentDay || !currentDay.data) return;
  const temDado = currentDay.dssTema || currentDay.dssHorario || currentDay.atividadesExtra || currentDay.tempo ||
    Object.keys(currentDay.efetivo).length > 0 ||
    Object.keys(currentDay.atividadesMarcadas).length > 0 ||
    Object.keys(currentDay.atividadesQtd || {}).length > 0 ||
    currentDay.atividadesAvulsas.length > 0 ||
    Object.keys(currentDay.equipamentos).length > 0 ||
    (currentDay.veiculosLeves || []).length > 0 ||
    currentDay.eventosSeguranca.length > 0 ||
    currentDay.eventosAmbiente.length > 0;
  if (temDado) {
    history[currentDay.data] = JSON.parse(JSON.stringify(currentDay));
    saveHistory();
    
    // 🔗 NOVO: Sincronizar com Google Sheets
    salvarDiarioGoogle().then(id => {
      if (notificar && id) {
        toast('✅ Diário sincronizado com a planilha');
      }
    });
  } else if (history[currentDay.data]) {
    delete history[currentDay.data];
    saveHistory();
  }
  if (notificar) {
    toast('Diário salvo no histórico');
  }
}
```

### Passo 4: Modifique o Calendário

**Em `renderCalendario()` ou ao clicar numa data, MUDE para:**

```javascript
// Quando usuário clica numa data do calendário
document.getElementById('calGrid').addEventListener('click', async (e) => {
  if (e.target.classList.contains('cal-day') && !e.target.classList.contains('empty')) {
    const dia = parseInt(e.target.textContent);
    const dataClicada = new Date(cal.year, cal.month, dia).toISOString().slice(0, 10);
    
    // Salvar dia atual antes de trocar
    salvarDiarioDia(false);
    
    // 🔗 NOVO: Tentar carregar da planilha
    const diarioGoogle = await carregarDiarioGoogle(dataClicada);
    
    if (diarioGoogle) {
      currentDay = diarioGoogle;
      toast('✅ Diário carregado da planilha');
    } else {
      currentDay = EMPTY_DAY();
      currentDay.data = dataClicada;
    }
    
    editingDate = (dataClicada === todayISO()) ? null : dataClicada;
    atualizarHeaderEdicao();
    preencherCampos();
    renderDiario();
  }
});
```

### Passo 5: Modifique Geração de Relatório

**Em `gerarRelatorio()`, MUDE para:**

```javascript
async function gerarRelatorio() {
  // Tentar gerar via Google Sheets
  const relatorioGoogle = await gerarRelatorioGoogle();
  
  if (relatorioGoogle) {
    document.getElementById('output').textContent = relatorioGoogle;
  } else {
    // Fallback: gerar localmente
    const d = currentDay;
    const relatorio = `📝 DIÁRIO — ${formatDateBR(d.data)}...`;
    document.getElementById('output').textContent = relatorio;
  }
}
```

---

## Resumo das Mudanças

| HTML | O que muda | Linhas de código |
|-----|-----------|---|
| Check-in | Carregar da planilha + sincronizar status | ~50 linhas |
| Diário | Salvar/carregar/relatório com planilha | ~80 linhas |

**Tudo é 100% compatível com localStorage** - continua salvando localmente também!

---

## Próximo Passo

1. ✅ Deploy os 2 Google Apps Scripts (copie as URLs)
2. ✅ Adapte os 2 HTMLs (cole o código acima)
3. ✅ Crie a planilha Google com as 3 abas
4. 🧪 Teste: abra o HTML, clique "Atualizar da Planilha"
