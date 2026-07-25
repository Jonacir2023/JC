# 🎯 PILOT SPEC: Alerta Antecipado de Atraso de Materiais

**Status:** ✅ Especificação Aprovada  
**Data:** 2026-07-24  
**Responsável Arquitetura:** Claude  
**Responsável Implementação:** Codex  
**Responsável Validação:** Humano

---

## 📍 Objetivo

Implementar um sistema de previsão que detecte risco de atraso de material com **3+ dias de antecedência**, permitindo que o gestor de obra replane atividades antes do impacto crítico.

**Valor esperado:**
- Reduzir atrasos não-planejados em 40-60%
- Ganhar 5-10 dias por obra (replanejamento antecipado)
- Economia por atraso evitado: R$ 20k-50k

---

## 🔍 Escopo

### O Que Está Dentro

✅ Prever atraso de material com 3+ dias  
✅ Integrar com Core via API REST  
✅ Requer aprovação humana antes de ação  
✅ Registrar confiança e histórico  
✅ Testes automatizados

### O Que Está Fora

❌ OCR de pedidos (Phase 3.9)  
❌ Automação de replaneamento (Phase 4.0)  
❌ Mobile app (Phase 4.1)  
❌ Multi-tenant (Phase 4.0)

---

## 📊 Dados de Entrada

### Fonte Primária
```
Histórico de pedidos (12 meses mínimo):
├─ obra_id
├─ material_id
├─ data_pedida (promised date)
├─ data_realizada (actual date)
├─ dias_atraso (calculated)
└─ fornecedor_id
```

### Dados Secundários
```
Cronograma da obra:
├─ atividade_id
├─ materiais_necessarios (array)
├─ data_inicio_planejada
├─ data_fim_planejada
├─ criticidade (CRITICA | ALTA | NORMAL)
└─ atividades_dependentes (array)
```

### Tabelas PostgreSQL Necessárias

```sql
-- Já existem (verificar):
obras (id, nome, data_inicio, data_fim)
cronograma_atividades (id, obra_id, material_id, data_inicio, data_fim)

-- Criar:
material_pedidos_historico (obra_id, material_id, data_pedida, data_realizada)
material_fornecedores (fornecedor_id, nome, taxa_atraso_historica)
```

---

## 🧠 Lógica de Previsão

### Algoritmo (Versão 1)

```
Para cada atividade crítica com material necessário:
  1. Buscar histórico do material nos últimos 12 meses
  2. Calcular taxa de atraso: (dias_atrasados / total_pedidos)
  3. Calcular dias_atraso_medio
  4. Determinar fornecedor_id
  5. Se taxa_atraso > 15% E dias_até_atividade <= dias_atraso_medio + 3
     → Gerar alerta com confiança = (taxa_atraso × dias_até_atividade_fator)
  6. Registrar em ml_predictions
```

### Exemplo Concreto

```
Material: Cimento | Fornecedor: CIMESA
Histórico últimos 12 meses:
├─ Total pedidos: 20
├─ Pedidos atrasados: 5
├─ Taxa atraso: 5/20 = 25%
└─ Dias atraso médio: 8 dias

Atividade: Concretagem Laje 3 (CRITICA)
├─ Data planejada: 2026-08-10
├─ Hoje: 2026-07-28
├─ Dias até atividade: 13 dias
└─ Material necessário: 50 sacos cimento

Previsão:
├─ Taxa atraso: 25% (histórico)
├─ Dias atraso esperado: 8 (histórico médio)
├─ Confiança: 78% (25% × 13/8 × fatores)
├─ Alerta: "Cimento pode atrasar 3-8 dias"
└─ Ação recomendada: "Reordenar para material alternativo OU adiantar cimento"
```

---

## ✅ Critério de Sucesso

| Métrica | Target | Como Medir |
|---------|--------|-----------|
| **Precisão** | >= 75% | (Alertas corretos / Total alertas) |
| **Recall** | >= 70% | (Atrasos previstos / Total atrasos reais) |
| **Falsos Positivos** | < 10% | (Alertas que não se concretizaram / Total alertas) |
| **Latência P95** | < 800ms | Tempo de resposta da API |
| **Aprovação Humana** | 100% funcional | Gestor consegue aprovar/rejeitar |
| **Cobertura** | >= 80% | Obras com histórico suficiente (>= 5 eventos) |
| **Impacto Financeiro** | >= R$ 20k/piloto | Economia estimada registrada e validada |

---

## 🎯 Aprovação Humana (Crítico)

### Fluxo

```
1. Brain prevê: "75% chance de atraso em 5 dias"
2. API retorna: { recommendation_id, confidence, action }
3. Core mostra ao gestor com botões:
   ┌─────────────────┬──────────────────┐
   │ ✅ Confirmar    │ ❌ Rejeitar      │
   └─────────────────┴──────────────────┘
4. Gestor clica ✅
5. Core executa ação (se definida)
6. Brain registra feedback: actual_outcome = "occurred" | "false_positive"
```

### Dados Armazenados

```
ml_predictions {
  id: uuid,
  pattern_type: "delay",
  confidence: 0.78,
  recommended_action: "Reordenar cronograma",
  actual_outcome: NULL (até humano aprovar),
  feedback_at: NULL
}
```

---

## 📈 Dados de Teste (Simulado)

### Conjunto de Teste: 5 Obras

```
Obra A: 50 eventos históricos (12 meses) → Baixo risco
Obra B: 50 eventos históricos (12 meses) → Alto risco
Obra C: 20 eventos históricos (6 meses) → Médio risco
Obra D: 8 eventos históricos (2 meses) → Risco elevado (histórico pequeno)
Obra E: 80 eventos históricos (24 meses) → Precisão máxima esperada
```

**Resultado esperado:**
- Obra A: 2-3 alertas (low FP rate)
- Obra B: 8-12 alertas (high recall)
- Obra C: 4-6 alertas (medium)
- Obra D: 1-2 alertas (low confidence)
- Obra E: 5-8 alertas (high precision)

---

## 🗓️ Timeline

### Semana 1: Setup

- [ ] Claude (você): Valida arquitetura
- [ ] Codex: Propõe 5-8 PRs pequenas
- [ ] Humano: Aprova plano

### Semanas 2-3: Implementação

```
PR #1: GET /ml/predict/alerts (endpoint esqueleto)
PR #2: Query histórico de 12 meses
PR #3: Calcular taxa atraso + previsão
PR #4: Integração com Core (header X-Tenant-ID)
PR #5: Testes unitários (casos críticos)
PR #6: Testes integração (ponta-a-ponta)
PR #7: Documentação + exemplos
```

**Paralelo:** Preparar dados de teste

### Semana 4: Validação

- [ ] Rodar contra 5 obras de teste
- [ ] Calcular precisão, recall, falsos positivos
- [ ] Validar aprovação humana
- [ ] Registrar economia estimada

---

## 🚀 Integração com Core

### Requisição (Core → Brain)

```bash
GET /ml/predict/alerts?forecast_days=7&obra_id=obra-123
Headers:
  X-Tenant-ID: obra-123
  Authorization: Bearer <token>
```

### Resposta (Brain → Core)

```json
{
  "status": "success",
  "data": {
    "predictions": [
      {
        "id": "pred-1",
        "obra_id": "obra-123",
        "pattern_type": "delay",
        "material": "Cimento",
        "predicted_date": "2026-08-02",
        "confidence": 0.78,
        "severity": "HIGH",
        "recommended_action": "Reordenar cronograma para atividades 5,6,7",
        "estimated_impact": 35000.00,
        "requires_approval": true
      }
    ],
    "summary": {
      "total_alerts": 3,
      "high_severity": 1,
      "estimated_total_impact": 85000.00
    }
  },
  "metadata": {
    "query_time_ms": 340,
    "cache_hit": false
  }
}
```

### Feedback Loop (Core → Brain)

```bash
POST /ml/predict/alerts/feedback
Body:
{
  "prediction_id": "pred-1",
  "actual_outcome": "occurred" | "prevented" | "false_positive",
  "actual_date": "2026-08-01",
  "actual_impact": 35000.00,
  "gestor_notes": "Reordenamos e economizamos R$ 30k"
}
```

---

## 🧪 Testes Esperados

### Teste 1: Query de Histórico
```
Input: obra_id, data_inicio (12 meses atrás)
Expected: Array com todos os pedidos históricos
Test cases:
  - Histórico completo (50+ eventos)
  - Histórico pequeno (< 5 eventos) → warning
  - Sem histórico → error 404
```

### Teste 2: Cálculo de Taxa Atraso
```
Input: eventos = [{dias_atraso: 5}, {dias_atraso: 8}, {dias_atraso: 0}...]
Expected: taxa_atraso, dias_media, desvio_padrao
Test cases:
  - 0% atraso (sem delays) → previsão baixa
  - 100% atraso (todos atrasados) → previsão alta
  - Outliers (1 delay extremo) → filtrar ou pesar menos
```

### Teste 3: Recomendação de Ação
```
Input: confidence, dias_até_atividade, criticidade
Expected: recommended_action, severity
Test cases:
  - Alta confiança + crítico → "reordenar imediatamente"
  - Média confiança + normal → "notificar gestor"
  - Baixa confiança → não alerta
```

### Teste 4: Integração Core ↔ Brain
```
Input: HTTP request com X-Tenant-ID
Expected: Response com predictions + metadata
Test cases:
  - Tenant válido → 200 + dados
  - Tenant inválido → 403 forbidden
  - Timeout → 504 (retorno de cache)
```

### Teste 5: Feedback Loop
```
Input: prediction_id + actual_outcome
Expected: ml_predictions atualizado, weights ajustados
Test cases:
  - occurred → confidence aumenta em feedback futuro
  - false_positive → confidence diminui
  - prevented → registra economia
```

---

## 🚨 Riscos Técnicos & Mitigação

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **Histórico pequeno** | FP alto | Threshold adaptativo (confiança mín 0.7 se < 10 eventos) |
| **Mudança de fornecedor** | Dados desatualizados | Filtrar últimos 6 meses apenas |
| **Sazonalidade** | Falta padrão seasonal | Foco em "delay", não "data exata" |
| **Latência > 800ms** | Timeout | Implementar cache 24h + fallback |
| **Aprovação humana falha** | Ação sem consentimento | Requer token + 2FA para ações críticas |

---

## 📋 Checklist de Implementação

### Antes de começar
- [ ] Dados históricos de 5 obras disponíveis
- [ ] Acesso a tabelas PostgreSQL (cronograma_atividades, material_pedidos)
- [ ] Conta de teste no Core API

### Durante implementação
- [ ] 1 PR/dia (máximo 300 LOC/PR)
- [ ] Testes + documentação em cada PR
- [ ] Nenhuma mudança no Core sem aprovação
- [ ] Nenhuma deploy em produção (staging only)

### Após implementação
- [ ] Todos os testes passam
- [ ] Documentação atualizada
- [ ] Exemplo de request/response funciona
- [ ] Pronto para validação com dados reais

---

## 📞 Contatos & Escalação

| Papel | Responsabilidade |
|-------|-----------------|
| **Claude** | Revisão de PRs, decisões arquitetônicas, risco assessment |
| **Codex** | Implementação, testes, documentation |
| **Humano** | Dados de teste, validação operacional, aprovação |

**Se atolado:** Abrir issue no GitHub com contexto

---

## ✨ Sucesso Esperado

Ao final das 4 semanas:

✅ Sistema funciona com 75%+ precisão  
✅ Falsos positivos < 10%  
✅ Latência < 800ms  
✅ Aprovação humana 100% operacional  
✅ Economia estimada >= R$ 20k/obra validada  
✅ Pronto para scale para N obras

**Próximo passo:** Phase 3.9 (Document Recognition) ou Phase 4.0 (Real-Time Streaming)

---

**Piloto Aprovado Para Começar! 🚀**
