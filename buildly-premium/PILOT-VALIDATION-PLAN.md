# 🎯 Pilot Validation Plan — Material Delay Prediction

**Phase:** 4.3 (Pilot Validation)  
**Status:** Ready to Execute  
**Duration:** 4-6 weeks  
**Target:** 5 construction sites across Brazil

---

## 📍 Pilot Scope

### Objective
Validate that Buildly Brain's material delay predictions deliver measurable business value:
- **Precision:** ≥ 75% (TP / TP+FP)
- **Recall:** ≥ 70% (TP / TP+FN)
- **False Positives:** < 10%
- **ROI:** ≥ R$ 20k per prevented delay

### Timeline
```
Week 1-2: Setup + Data Loading
Week 2-3: Soft Launch (monitoring, zero decisions)
Week 3-5: Active Phase (gestores approve/reject alerts)
Week 5-6: Analysis + Validation
```

---

## 🏗️ Target Construction Sites

### Site 1: São Paulo — Large Scale (High Volume)

```
Name:           Edificio Corporate SP
Client:         Camargo Corrêa
Location:       São Paulo, SP
Scope:          Commercial complex (50,000m²)
Budget:         R$ 500M
Materials:      Cimento, Aço, Blocos, Vidro
Lead:           Gestor: João Silva
Historical Data: 24 months (950+ delivery records)
```

**Characteristics:**
- High material volume (10+ deliveries/week)
- Multiple suppliers (5-8 concurrent)
- Complex scheduling (critical path)
- Expected: 15-25 alerts per week

---

### Site 2: Belo Horizonte — Medium Scale (Steady)

```
Name:           Conjunto Residencial BH
Client:         Odebrecht
Location:       Belo Horizonte, MG
Scope:          Residential complex (80 units)
Budget:         R$ 120M
Materials:      Cimento, Aço, Alvenaria, Esquadrias
Lead:           Gestor: Maria Santos
Historical Data: 18 months (650+ delivery records)
```

**Characteristics:**
- Moderate material volume (5-8 deliveries/week)
- Regional suppliers (3-5 concurrent)
- Standard scheduling
- Expected: 8-12 alerts per week

---

### Site 3: Rio de Janeiro — Complex Logistics

```
Name:           Porto Maravilha
Client:         Queiroz Galvão
Location:       Rio de Janeiro, RJ
Scope:          Waterfront development (200,000m²)
Budget:         R$ 800M
Materials:      Cimento, Aço, Vidro, Acabamentos
Lead:           Gestor: Carlos Oliveira
Historical Data: 30 months (1,200+ delivery records)
```

**Characteristics:**
- Very high material volume (15+ deliveries/week)
- Complex logistics (port constraints)
- Multiple delayed shipments historically
- Expected: 25-35 alerts per week

---

### Site 4: Brasília — Infrastructure (Government)

```
Name:           Centro Administrativo Federal
Client:         governo do Brasil
Location:       Brasília, DF
Scope:          Government offices (100,000m²)
Budget:         R$ 600M
Materials:      Cimento, Aço, Mármore, Vidro
Lead:           Gestor: Ana Paula Lima
Historical Data: 24 months (800+ delivery records)
```

**Characteristics:**
- High-stakes project (political visibility)
- Strict schedules (contracts enforced)
- Government suppliers (bureaucratic delays)
- Expected: 12-18 alerts per week

---

### Site 5: Manaus — Remote (High Risk)

```
Name:           Polo Industrial AM
Client:         SUFRAMA
Location:       Manaus, AM
Scope:          Industrial complex (150,000m²)
Budget:         R$ 350M
Materials:      Cimento, Aço, Maquinário, Diesel
Lead:           Gestor: Roberto Ferreira
Historical Data: 12 months (450+ delivery records - sparse)
```

**Characteristics:**
- Remote location (logistics challenges)
- Seasonal shipping (Amazon river)
- Limited local suppliers (import delays)
- Expected: 20-25 alerts per week (HIGH RISK)

---

## 📊 Validation Metrics

### Success Criteria

| Metric | Target | Formula | Threshold |
|--------|--------|---------|-----------|
| **Precision** | ≥ 75% | TP / (TP+FP) | If < 60%: Alert, If < 50%: Stop |
| **Recall** | ≥ 70% | TP / (TP+FN) | If < 60%: Review model, If < 50%: Retrain |
| **False Positives** | < 10% | FP / Total | If > 15%: Adjust thresholds |
| **Latency P95** | < 800ms | percentile(query_time) | If > 1000ms: Investigate |
| **Cache Hit Rate** | > 80% | Cache hits / Total | If < 60%: Review TTL |
| **ROI per Delay** | ≥ R$ 20k | Cost prevented | Track all outcomes |
| **Adoption Rate** | > 80% | Gestores using system | Target: all 5 sites |
| **Feedback Quality** | > 90% | Accurate feedback rate | Validate against reality |

---

## 🧪 Testing Phases

### Phase 1: Setup & Data Loading (Week 1-2)

**Activities:**
```
Day 1-2:   Load historical data for all 5 sites
Day 3:     Configure site-specific parameters
Day 4:     Run baseline predictions
Day 5:     Train gestores on approval workflow
Day 6-10:  Validate predictions against known delays
Day 11-14: Fine-tune thresholds, run sanity checks
```

**Deliverables:**
- ✅ 5 sites in database with 12+ months history
- ✅ Gestores trained and signed off
- ✅ Baseline metrics established
- ✅ Go/No-Go decision for soft launch

---

### Phase 2: Soft Launch — Observation Only (Week 2-3)

**Rules:**
- ✅ Predictions generated
- ❌ Gestores don't act on alerts (observation only)
- ✅ System records all alerts in background
- ✅ Actual delays tracked separately

**Monitoring:**
```
Daily:
  - Alert volume (should match forecast)
  - False positive rate (estimate vs real outcomes)
  - System latency (P50, P95, P99)
  - Cache hit rate

Weekly:
  - Precision calculation
  - Recall estimation
  - Outlier analysis
  - Model drift detection
```

**Deliverables:**
- ✅ Baseline precision/recall calculated
- ✅ System stability confirmed
- ✅ No critical issues found
- ✅ Ready for active phase

---

### Phase 3: Active Phase — Live Decisions (Week 3-5)

**Rules:**
- ✅ Predictions generated & displayed to gestores
- ✅ Gestores approve/reject alerts (feedback recorded)
- ✅ System learns from feedback (EMA weights update)
- ✅ Actual outcomes tracked

**Workflow:**
```
1. Brain predicts: "Cimento 8 dias atraso"
2. Gestor sees alert: 78% confidence, R$ 50k impact
3. Gestor decides: "Aprovar" or "Rejeitar"
4. System records: outcome + actual date/impact
5. Model learns: weights updated (EMA algorithm)
6. Next prediction: more accurate based on feedback
```

**Metrics Collection:**
```
Per Alert:
  - prediction_id
  - predicted_date
  - predicted_delay_days
  - confidence
  - actual_outcome (occurred | false_positive)
  - actual_date
  - actual_impact_brl
  - gestor_feedback_time

Per Site (Daily):
  - total_alerts
  - critical_alerts
  - false_positives
  - prevented_delays
  - total_impact_brl
```

**Deliverables:**
- ✅ Live feedback being recorded
- ✅ Model improving over time
- ✅ Real ROI data collected
- ✅ Problem sites identified

---

### Phase 4: Analysis & Validation (Week 5-6)

**Analysis Tasks:**
```
1. Calculate final metrics
   - Precision = TP / (TP+FP)
   - Recall = TP / (TP+FN)
   - Specificity = TN / (TN+FP)

2. Per-site breakdown
   - Which sites performed best?
   - Which materials have highest accuracy?
   - Seasonal patterns?

3. ROI calculation
   - Cost prevented per site
   - Cost of false positives
   - Net ROI = (TP * cost_prevented) - (FP * cost_false_positive)
   - Payback period

4. Model analysis
   - Which patterns improved most?
   - Which suppliers most predictable?
   - Confidence distribution shift?

5. Recommendation
   - Roll out to all sites?
   - Scale to regions?
   - Identify gaps for Phase 4.4?
```

**Deliverables:**
- ✅ Final precision/recall report
- ✅ Per-site ROI breakdown
- ✅ Executive summary
- ✅ Go/No-Go for enterprise rollout

---

## 📈 Data Collection Strategy

### Automated Collection (System)

```sql
-- Predictions table
CREATE TABLE pilot_predictions (
  prediction_id UUID PRIMARY KEY,
  site_id VARCHAR,
  material_id VARCHAR,
  predicted_date DATE,
  predicted_delay_days INT,
  confidence FLOAT,
  severity VARCHAR,
  created_at TIMESTAMP
);

-- Feedback table
CREATE TABLE pilot_feedback (
  feedback_id UUID PRIMARY KEY,
  prediction_id UUID REFERENCES pilot_predictions,
  actual_outcome VARCHAR, -- occurred|false_positive|prevented
  actual_date DATE,
  actual_delay_days INT,
  actual_impact_brl DECIMAL,
  gestor_id VARCHAR,
  recorded_at TIMESTAMP
);

-- Metrics table (daily rollup)
CREATE TABLE pilot_daily_metrics (
  date DATE,
  site_id VARCHAR,
  total_alerts INT,
  critical_alerts INT,
  false_positives INT,
  true_positives INT,
  prevented_delays INT,
  total_impact_brl DECIMAL,
  cache_hit_rate FLOAT,
  latency_p95 FLOAT
);
```

### Manual Collection (Gestor Feedback)

```
Daily:
- Notes on actual delays (if different from prediction)
- External factors (strikes, weather, accidents)
- Supplier performance changes

Weekly:
- Site coordinator call
- Challenges with system
- Recommendations for improvement
```

---

## 🎯 Go/No-Go Decision Criteria

### Go (Proceed to Enterprise Rollout)

```
✅ Precision ≥ 75%
✅ Recall ≥ 70%
✅ False Positive Rate < 10%
✅ Average ROI ≥ R$ 20k per site
✅ Adoption Rate > 80%
✅ No critical bugs reported
✅ Gestores satisfied (NPS > 50)
```

### Conditional Go (Rollout with Restrictions)

```
⚠️ One site underperforming (< 60% precision)
→ Exclude that site, validate model drift
→ Focus on other 4 sites

⚠️ One material type problematic
→ Increase threshold for that material
→ Collect more data before scaling

⚠️ False positive rate 10-15%
→ Adjust confidence threshold
→ Retrain model with feedback
→ Retest before rollout
```

### No-Go (Back to R&D)

```
❌ Precision < 60% (too many false positives)
❌ Recall < 50% (missing too many delays)
❌ Systematic bugs in feedback loop
❌ Data quality issues preventing learning
❌ Adoption rate < 50% (gestores won't use)

→ Return to Phase 4.2 for retraining
→ Root cause analysis
→ Model improvements
→ Retry pilot in 2-3 months
```

---

## 📊 Real-Time Dashboard

### What Gets Tracked

```
┌─────────────────────────────────────────┐
│   BUILDLY BRAIN — PILOT DASHBOARD       │
├─────────────────────────────────────────┤
│                                         │
│  Overall Metrics (5 Sites):             │
│  ├─ Alerts Today:        125            │
│  ├─ Precision (Live):    73%  ⚠️        │
│  ├─ Recall (Live):       68%  ⚠️        │
│  ├─ False Positives:     9%   ✅        │
│  └─ Total ROI:           R$ 2.3M       │
│                                         │
│  Per-Site Breakdown:                    │
│  ├─ SP (Camargo)        [━━━━━] 15 ⚠️  │
│  ├─ MG (Odebrecht)      [━━━━━] 8 ✅   │
│  ├─ RJ (Queiroz)        [━━━━━] 28 🔴  │
│  ├─ DF (governo)        [━━━━━] 14 ✅  │
│  └─ AM (SUFRAMA)        [━━━━━] 22 ⚠️  │
│                                         │
│  Material Performance:                  │
│  ├─ Cimento CP II       78% ✅          │
│  ├─ Aço CA-50           65% ⚠️          │
│  ├─ Blocos              72% ✅          │
│  ├─ Vidro               45% 🔴          │
│  └─ Esquadrias          81% ✅          │
│                                         │
│  System Health:                         │
│  ├─ Latency P95:        340ms ✅        │
│  ├─ Cache Hit Rate:     85% ✅          │
│  ├─ Uptime:             99.9% ✅        │
│  └─ Last Updated:       2 min ago       │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔐 Data Privacy & Security

### LGPD Compliance

```
✅ Anonymize personal data (gestor names → IDs)
✅ Encrypt sensitive fields (supplier names)
✅ Access control (only authorized gestores)
✅ Data retention (delete after 2 years)
✅ Audit logging (all feedback recorded)
```

### Risk Mitigation

```
Risk:        Model makes bad predictions
Mitigation:  Humans must approve all actions
             False positive rate < 10% gate

Risk:        Gestor mistakes feedback outcome
Mitigation:  Cross-check with actual receipts
             Weekly validation calls

Risk:        Data quality issues
Mitigation:  Daily data audit
             Outlier detection alerts

Risk:        Supplier bias (bad supplier labeled good)
Mitigation:  Material-level analysis
             Track per-supplier patterns
```

---

## 📅 Week-by-Week Timeline

### Week 1
```
Mon-Tue:  Load historical data for all 5 sites
Wed:      Baseline predictions generated
Thu:      Gestor training sessions
Fri:      Sanity checks, data validation
```

### Week 2
```
Mon-Fri:  Soft launch begins (observation only)
          Daily monitoring
          Alert accuracy validation
```

### Week 3
```
Mon-Fri:  Active phase begins (gestores make decisions)
          Feedback recording enabled
          Model learning starts
```

### Weeks 4-5
```
Daily:    Monitor metrics, identify issues
Weekly:   Sync with site coordinators
          Review material-level patterns
          Adjust thresholds if needed
```

### Week 6
```
Mon-Wed:  Final analysis & report generation
Thu:      Executive presentation
Fri:      Go/No-Go decision
```

---

## 📞 Support & Escalation

### Daily Check-Ins
```
9:00 AM:  Automated health check (Slack notification)
2:00 PM:  Manual review of alerts/feedback
5:00 PM:  Daily metrics summary email
```

### Weekly Sync
```
Tuesday 10:00 AM UTC:
- Join: Zoom call with all 5 site coordinators
- Agenda: Blockers, questions, observations
- Duration: 1 hour
```

### Emergency Escalation
```
If Precision < 50%:
  → Immediate retrain
  → Notify executive sponsor
  → Pause new alerts until fixed

If False Positives > 20%:
  → Adjust thresholds within 24h
  → Notify gestores
  → Monitor next 48h

If System Down:
  → Fallback to manual monitoring
  → Alert all stakeholders
  → Target: 4-hour recovery
```

---

## 🎊 Success Celebration

### If Pilot Passes (Go Decision)

```
✅ Press release: "Buildly Brain goes live across 5 sites"
✅ Case studies: Per-site ROI breakdowns
✅ Training: Extend to 20 more sites
✅ Roadmap: Phase 4.4 (Enterprise Scale)
✅ Bonus: Celebrate team success! 🎉
```

### If Pilot Conditional (Retrain & Retry)

```
✅ Post-mortem: Identify gaps
✅ Improvements: Model retraining
✅ Retry: 2-3 month cycle
✅ Learnings: Document for next attempt
```

---

**Status:** Ready to Launch  
**Next Step:** Day 1 — Load historical data

