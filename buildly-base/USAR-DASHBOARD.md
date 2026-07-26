# 🎯 Como Usar o Test Dashboard

## 📥 Abrir o Dashboard

### Opção 1: Abrir diretamente no navegador
```bash
open buildly-base/test-dashboard.html
# ou
firefox buildly-base/test-dashboard.html
# ou
google-chrome buildly-base/test-dashboard.html
```

### Opção 2: Servir via HTTP (recomendado)
```bash
cd buildly-base
python -m http.server 8000
# Acessar: http://localhost:8000/test-dashboard.html
```

---

## 🎮 Guia de Uso

### 1️⃣ **Criar um Evento** (Painel Esquerdo)

**O que faz:** Simula um evento de atraso de material

**Campos:**
- **Tipo de Evento:** Material Delay, Cost Overrun, Schedule Deviation
- **Material ID:** identificador do material (ex: MAT-001)
- **Dias de Atraso:** quantos dias de atraso (ex: 5)
- **Impacto (R$):** impacto financeiro (ex: 50000)
- **Confiança:** score de confiança (0-1, ex: 0.95)

**Exemplo:**
```
Tipo: Material Delay
Material ID: MAT-CONCRETE-001
Dias: 5
Impacto: R$ 50.000
Confiança: 0.95
```

**Clicar:** ✅ Criar Evento

**Resultado:** JSON do evento criado + Log atualizado

---

### 2️⃣ **Criar uma Decisão** (Painel Direito)

**O que faz:** Cria uma decisão (automática ou manual)

**Campos:**
- **Tipo:** Budget Approval, Material Substitution, Schedule Adjustment, Cost Mitigation
- **Status:** Pending, Approved, Rejected
- **Contexto (JSON):** dados adicionais (formato JSON)
- **Criado por:** quem criou (usuário ou sistema)

**Exemplo:**
```
Tipo: Material Substitution
Status: APPROVED
Contexto: {"substitute": "Concreto pré-moldado", "cost_difference": 15000}
Criado por: system-ml
```

**Clicar:** ✅ Criar Decisão

**Resultado:** JSON da decisão + Métrica atualizada

---

### 3️⃣ **Executar Workflow Completo** (Painel Central)

**O que faz:** Simula todo o fluxo de uma vez:
1. Evento de atraso criado
2. ML Engine prediz (95% confiança)
3. Sistema cria decisão automática
4. Gestor aprova
5. Resultado real registrado

**Clicar:** 🚀 Executar Workflow Completo

**Resultado:**
```json
{
  "event": { ... },
  "prediction": { delay_probability: 0.95, ... },
  "decision": { status: "APPROVED", ... },
  "feedback": { outcome: "success", actual_impact: 45000 }
}
```

---

### 4️⃣ **Testar Endpoints**

**Três botões disponíveis:**

1. **GET /health (Core API)**
   - Retorna: Status UP do serviço
   - Response time: < 5ms
   - Status: ✅ 200 OK

2. **POST /predict/material-delay**
   - Retorna: Predição de atraso
   - Confiança: 95%
   - Status: ✅ 200 OK

3. **POST /decisions**
   - Cria: Nova decisão
   - Status: Pending
   - Status: ✅ 200 OK

---

### 5️⃣ **Registrar Feedback** (Painel Inferior)

**O que faz:** Registra resultado real da decisão (para treinar ML)

**Campos:**
- **Decision ID:** ID da decisão (gerado automaticamente se deixado vazio)
- **Resultado:** Success ✅ | Partial ⚠️ | Failure ❌
- **Feedback:** descrição textual do que aconteceu
- **Impacto Real (R$):** valor real gastos/economizados

**Exemplo:**
```
Decision ID: (auto)
Resultado: Success ✅
Feedback: Substituição executada com sucesso no prazo
Impacto Real: R$ 45.000 (economizou R$ 5k extra)
```

**Clicar:** 📤 Registrar Feedback

**Resultado:** Feedback armazenado + Métrica atualizada

---

## 📊 Dashboard Elementos

### Status Board (Topo)
```
┌─────────────────────────────────────┐
│ Core API   │ ML Engine │ Decision API│
│ PORT 3001  │ PORT 3002 │  PORT 3003  │
├─────────────────────────────────────┤
│        Tests Passed: 49/49 ✅        │
└─────────────────────────────────────┘
```
Mostra o status em tempo real dos 3 serviços.

### Métricas (Direita)
```
Events Criados:      N
Decisions Criadas:   N
Feedback Registrado: N
Workflows OK:        N
```
Atualiza em tempo real conforme você interage.

### Console Log (Rodapé)
```
[09:00:00] ✅ Evento criado: MATERIAL_DELAY
[09:00:01] ✅ Decisão criada: BUDGET_APPROVAL
[09:00:02] ✅ Workflow completo executado
```
Mostra histórico de todas as ações.

---

## 🧪 Cenários de Teste

### Cenário 1: Atraso Simples
1. Criar evento com 5 dias de atraso
2. Criar decisão de substituição
3. Aprovar decisão
4. Registrar feedback: sucesso

### Cenário 2: Workflow Automático
1. Clicar em "Executar Workflow Completo"
2. Observar evento → predição → decisão → feedback

### Cenário 3: Múltiplas Decisões
1. Criar 3 eventos diferentes
2. Criar 3 decisões associadas
3. Registrar feedback para cada uma
4. Observar métricas crescerem

### Cenário 4: Teste de Endpoints
1. Clicar em cada botão de teste
2. Observar respostas (devem ter status 200)
3. Validar formato JSON das respostas

---

## 🔄 Workflow Visual

```
┌──────────────────────────────────────────────────────┐
│                   BUILDLY WORKFLOW                   │
├──────────────────────────────────────────────────────┤
│                                                       │
│  1️⃣ Evento               2️⃣ Decisão               3️⃣ Feedback
│  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  │ Material     │───────▶│ Substituição │───────▶│ Success ✅   │
│  │ Delay        │        │ Approved     │        │ R$ 45.000    │
│  │ R$ 50.000    │        │              │        │              │
│  └──────────────┘        └──────────────┘        └──────────────┘
│
│  Atraso de 5 dias  →  Decisão automática  →  Impacto real
│
└──────────────────────────────────────────────────────┘
```

---

## 💡 Dicas

1. **JSON Inválido:** Se receber erro ao criar decisão, verifique sintaxe do JSON
2. **Métricas:** Clique "Limpar Métricas" para resetar tudo
3. **Console:** Scroll para ver histórico completo de ações
4. **Responsive:** Dashboard funciona em celular também
5. **Dados:** Tudo é simulado (em memória, não persiste ao recarregar)

---

## ⚠️ Limitações

- ❌ Não conecta aos serviços reais (sem Docker)
- ❌ Dados não persistem ao recarregar a página
- ❌ Sem autenticação/JWT
- ❌ Sem validação de backend

**Para testes reais, execute:**
```bash
# Instalar pnpm
npm install -g pnpm@8

# Instalar dependências
cd buildly-base
pnpm install:all

# Rodar testes
pnpm test

# Compilar
pnpm build

# Iniciar serviços (requer Docker)
pnpm start
```

---

## 📞 Suporte

**Problemas?**
1. Verifique console do navegador (F12)
2. Tente recarregar a página (F5)
3. Limpe métricas e tente novamente
4. Consulte TESTE-COMPLETO.md para status dos testes

---

**🎯 Dashboard pronto! Divirta-se testando Buildly Premium!**
