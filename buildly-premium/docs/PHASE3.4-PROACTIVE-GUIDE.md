# Phase 3.4 Week 2-3 — Assistente Proativo Inteligente

**Duração:** 8-10 dias (17-26 outubro)  
**Status:** Fase de design completo, pronto para implementação  
**Esforço:** ~40 horas (1 engineer + automação)

---

## 📋 Visão Geral

Enquanto o Brain armazena conhecimento passado e o usuário faz perguntas, o **Phase 3.4 Proativo** inverte o paradigma:
- Sistema **monitora continuamente** novos RDOs
- **Detecta padrões** que se assemelham a problemas históricos
- **Gera alertas inteligentes** antes do problema escalar
- **Recomenda soluções** baseadas em lições aprendidas
- Integra com **Slack/Email** para notificação em tempo real

### Exemplo Prático

```
T=0:00 — Engenheiro registra novo RDO:
  "Chuva forte hoje, obra STAGING-001 parada"
  
T=0:05 — Phase 3.4 dispara automaticamente:
  1. Busca histórico: "Chuva + STAGING-001 = atraso médio 8 dias"
  2. Detecta padrão: Similar a 3 RDOs passados (confiabilidade 87%)
  3. Gera alert: "⚠️ CLIMA: Chuva forte previne 8 dias de atraso"
  4. Recomenda: "Ação: Reordenar atividades (funcionou 2x antes)"
  5. Notifica: Slack #obras + email responsavel + SMS crítico
  6. Rastreia: Cria "alerta-123" para monitorar se acontece
  
T=0:30 — Responsável responde:
  "Já reordenei. ETA: 2 dias delay (vs 8 previsto)"
  
T=24:00 — Phase 3.4 aprende:
  "Reordenação foi 75% eficaz contra chuva em STAGING"
  Aumenta score de recomendação para próxima vez
```

---

## 🎯 Objetivos

| Objetivo | Métrica | Target |
|----------|---------|--------|
| Detecção de padrões | Latência | < 5s após novo RDO |
| Precisão de alertas | True Positive Rate | > 85% |
| Relevância de soluções | Hit rate | > 80% |
| Adoção de sugestões | % seguindo recomendação | > 60% |
| ROI | R$/alert que evitou problema | > R$ 50k/ano |

---

## 🏗️ Arquitetura Phase 3.4

```
┌─────────────────────────────────────────────────────────┐
│                 RDO → Brain → Proativo                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. RDO Ingestion (N8N)                                │
│     ↓                                                    │
│  2. Pattern Matcher (Python + Neo4j)                   │
│     ↓                                                    │
│  3. Alert Generator (Rule Engine)                      │
│     ↓                                                    │
│  4. Notification (Slack/Email/SMS)                     │
│     ↓                                                    │
│  5. Feedback Loop (Learn + Improve)                    │
│                                                          │
│  Data Stores:                                           │
│  - PostgreSQL: Alertas (brain_alerts)                  │
│  - Neo4j: Padrões (Pattern nodes + relationships)      │
│  - Redis: Cache de patterns quentes                    │
│                                                          │
│  Workers:                                               │
│  - Bull.js queues: Async processing                    │
│  - N8N cron: 5-min interval check                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Pattern Types Detectados

### 1. **Temporal Patterns** (Sazonalidade)
```
Regra: IF (mes == "janeiro") AND (tipo_evento == "ATRASO_MATERIAL")
       THEN alert_severity = "HIGH"
       
Razão: Janeiro tem 3x mais atrasos de fornecedor (férias)
Ação: Pre-contratar 30% extra mão de obra em dez
```

### 2. **Causal Patterns** (Causalidade)
```
Regra: IF (weather == "chuva") AND (frente == "escavacao")
       THEN impact = "8 dias atraso" (média histórica)
       
Razão: Chuva causa alagamento → escavação impossível
Ação: Movimentar escavação pra coberto quando chover
```

### 3. **Cascade Patterns** (Cascata de Falhas)
```
Regra: IF (atraso_fornecedor == true)
       AND (mao_obra == "terceirizada")
       AND (tempo_falta > 3_dias)
       THEN prox_risco = "paralisacao" (prob 72%)
       
Razão: Terceirizados saem se obra parada > 3 dias
Ação: Ativar cláusula de retorno ao mercado imediatamente
```

### 4. **Resource Contention** (Escassez)
```
Regra: IF (obra_count_active > 3)
       AND (material == "cimento")
       AND (supplier_capacity < demanda_total)
       THEN alert = "fornecedor pode dividir cimento"
       
Ação: Negociar contrato priorizado com fornecedor
```

---

## 🔧 Implementação

### Fase 1: Pattern Detection Engine (3 dias)

**Arquivo:** `apps/intelligence-layer/src/proactive/proactive.service.ts`

```typescript
class ProactivePatternMatcher {
  // Core methods:
  async detectPatterns(rdo: RDO): Promise<DetectedPattern[]>
  async generateAlerts(patterns: Pattern[]): Promise<Alert[]>
  async recommendActions(alert: Alert): Promise<Recommendation[]>
  async notifyStakeholders(alert: Alert): Promise<NotificationResult>
  async recordFeedback(alert: Alert, feedback: Feedback): Promise<void>
  
  // Pattern-specific detectors:
  private detectTemporalPattern(rdo: RDO): Pattern
  private detectCausalPattern(rdo: RDO): Pattern
  private detectCascadePattern(rdo: RDO): Pattern
  private detectResourceContention(rdo: RDO): Pattern
}
```

### Fase 2: Alert Storage (1 dia)

**Tabela PostgreSQL:**
```sql
CREATE TABLE brain_alerts (
  id BIGSERIAL PRIMARY KEY,
  rdo_id VARCHAR(50) UNIQUE NOT NULL,
  obra_id VARCHAR(50) NOT NULL,
  pattern_type VARCHAR(50),  -- temporal, causal, cascade, resource
  alert_severity VARCHAR(20),  -- low, medium, high, critical
  description TEXT,
  detected_at TIMESTAMP DEFAULT NOW(),
  recommendation TEXT,
  action_taken BOOLEAN DEFAULT false,
  action_taken_at TIMESTAMP,
  action_description TEXT,
  effectiveness_score DECIMAL(3,2),  -- 0-1 (how well it worked)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alert_obra ON brain_alerts(obra_id, detected_at DESC);
CREATE INDEX idx_alert_severity ON brain_alerts(alert_severity);
```

### Fase 3: Notification Integration (2 dias)

**Slack webhook:**
```bash
curl -X POST https://hooks.slack.com/services/xxx \
  -H 'Content-Type: application/json' \
  -d '{
    "channel": "#obras",
    "username": "Buildly Brain",
    "text": "⚠️ ALERTA: Padrão detectado em STAGING-001",
    "attachments": [{
      "color": "warning",
      "fields": [
        {"title": "Tipo", "value": "Causal: Chuva → Atraso"},
        {"title": "Confiabilidade", "value": "87%"},
        {"title": "Impacto Previsto", "value": "8 dias atraso"},
        {"title": "Ação Recomendada", "value": "Reordenar atividades"}
      ],
      "actions": [
        {"text": "Implementar", "type": "button", "url": "..."},
        {"text": "Ignorar", "type": "button", "url": "..."}
      ]
    }]
  }'
```

### Fase 4: Feedback & Learning (1 dia)

Sistema registra se a recomendação funcionou:
```
Alert → Recommendation → Implemented → Outcome → Score Updated

Exemplo:
Alert: "Chuva em STAGING-001 → 8 dias atraso"
Recommendation: "Reordenar atividades"
Implemented: true (responsável clicou em "Implementar")
Actual_Outcome: "2 dias atraso" (vs 8 previsto)
Score: (8 - 2) / 8 = 75% eficaz → aumenta weight

Próxima vez: recomendação sobe de 60% confiança para 75%
```

---

## 📈 Expected Results

### Week 2 (17-21 outubro)

**Dia 1-2: Pattern Detection Engine (80 linhas TypeScript)**
- ✅ Detecção temporal (sazonalidade)
- ✅ Detecção causal (clima → impacto)
- ✅ Detecção cascata (atraso → saída pessoal)
- ✅ Integração com Neo4j para histórico

**Dia 3-4: Alert Storage (PostgreSQL)**
- ✅ Criar tabela brain_alerts
- ✅ Índices para performance
- ✅ Auditoria + timestamps

**Dia 5: Notification Integration**
- ✅ Slack webhook
- ✅ Email simple SMTP
- ✅ SMS optional (Twilio)

### Week 3 (24-26 outubro)

**Dia 1: Feedback Loop**
- ✅ Registrar outcomes
- ✅ Atualizar pattern weights

**Dia 2-3: Testing + Optimization**
- ✅ Load test (100 RDOs/min)
- ✅ Accuracy validation (manual 20 cases)
- ✅ Performance tuning

---

## 🧪 Test Plan

### Unit Tests
```bash
# 10 pattern detector tests
npm test -- proactive.service.spec.ts

# Expected: 100% pass rate
# Coverage: > 85%
```

### Integration Tests
```bash
# End-to-end: RDO → Alert → Notification
npm test -- proactive.e2e.spec.ts

# Scenarios:
# 1. Chuva forte → deteta pattern → notifica Slack
# 2. Atraso fornecedor → detecta cascata → recomenda ação
# 3. Feedback: ação funcionou → aumenta score
```

### Load Test
```bash
# 100 RDOs/min para 30 min
# Expected: P95 latency < 5s, 0 errors
ab -n 3000 -c 100 http://localhost:3000/brain/rdo-intake
```

---

## 📋 Checklist Implementação

### Code
- [ ] ProactiveService (pattern detection)
- [ ] PatternDetector abstract class + 4 implementations
- [ ] AlertGenerator (regras)
- [ ] NotificationService (Slack/Email/SMS)
- [ ] FeedbackRecorder (outcomes)
- [ ] Controller: POST /proactive/alerts

### Database
- [ ] Migration: create brain_alerts table
- [ ] Migration: add pattern_weights to Neo4j
- [ ] Índices para performance

### Testing
- [ ] Unit tests (90%+ coverage)
- [ ] Integration tests (E2E)
- [ ] Load tests (100 RDOs/min)

### Documentation
- [ ] API docs (Swagger)
- [ ] Pattern rules documentation
- [ ] Alert schema documentation

---

## 🚀 Deployment

### Pre-deployment
```bash
# 1. Run tests
npm test

# 2. Check database migrations
npm run migrate -- --dry-run

# 3. Validate pattern rules
npm run validate-patterns

# 4. Smoke test staging
npm run smoke-test -- staging
```

### Deployment Steps
```bash
# 1. Deploy code
docker push buildly-intelligence:v0.2.0
kubectl apply -f k8s/intelligence-layer-deployment.yaml

# 2. Run migrations
npm run migrate

# 3. Warm-up pattern cache
npm run warm-cache

# 4. Monitor alerts
kubectl logs -f deployment/intelligence-layer | grep "ALERT"
```

### Rollback
```bash
# If pattern detection causes false positives > 15%:
kubectl rollout undo deployment/intelligence-layer

# Revert to previous version
git revert <commit>
```

---

## 📊 Monitoring

### Key Metrics
```
- Alerts generated per day (target: 2-5 per obra)
- Pattern detection accuracy (target: > 85%)
- Recommendation adoption (target: > 60%)
- False positive rate (target: < 15%)
- Alert-to-implementation latency (target: < 2h)
- Effectiveness score (target: > 70%)
```

### Dashboards
```
Prometheus metrics:
- proactive_alerts_total (counter)
- proactive_pattern_accuracy (gauge)
- proactive_recommendation_adoption (gauge)
- proactive_alert_latency_ms (histogram)
```

---

## 🔗 Próxima Fase (Week 4)

**Phase 3.5 — Predictive Analytics** (26 out - 2 nov)

Usa dados de Phase 3.2-3.4 para:
- Forecasting: "Qual será impacto em 30 dias?"
- Capacity planning: "Quanto cimento precisar?"
- Risk simulation: "Se chover, qual o pior cenário?"

---

**Phase 3.4 Status:** Design completo, pronto para implementação (17 outubro)  
**Estimated Completion:** 26 outubro  
**Next Milestone:** Phase 3.5 Predictive (26 outubro)
