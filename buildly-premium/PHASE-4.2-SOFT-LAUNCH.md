# 🎯 Phase 4.2 — Soft Launch Observation (Weeks 2-3)

**Phase:** 4.2 (Pilot Validation - Silent Observation)  
**Duration:** 2 weeks (Weeks 2-3)  
**Status:** 🟡 Ready After Phase 4.1 Go-Ahead  
**Branch:** `claude/serene-einstein-em23qs`  
**Predecessor:** Phase 4.1 (Baseline)

---

## 🎯 Phase Objective

**Gestores observe predictions without making decisions** — System generates 5-8 predictions daily per site, gestores receive them via email, observe if predictions come true, but **do not take action**. System collects feedback, measures real-world accuracy, and prepares for live decision-making in Week 4.

**Key Transition:**
- Week 1: Measure baseline accuracy on historical data
- Weeks 2-3: Measure accuracy on *live* predictions ← **You are here**
- Weeks 4-5: Gestores make *binding* approval/rejection decisions
- Week 6: Analyze results & Go/No-Go for enterprise

---

## 📅 Weeks 2-3 Timeline

### Daily Workflow (Monday-Friday Each Week)

**6:00 AM — Predictions Generated & Delivered**

```bash
# Daily cron job: generate predictions for next 7 days
npx ts-node scripts/generate-daily-predictions.ts

# Output (example):
# 2026-08-02 06:00:00 — Generating daily predictions...
# 
# São Paulo (Camargo):
#   ✓ Prediction 1: Vidro atrasará 2 dias (confidence 0.82, CRITICAL)
#   ✓ Prediction 2: Aço atrasará 0 dias (confidence 0.71, LOW)
#   ✓ Prediction 3: Concreto atrasará 3 dias (confidence 0.78, HIGH)
#   [...]
# 
# Rio (Queiroz):
#   ✓ Prediction 1: Mão de obra atrasará 1 dia (confidence 0.75, MEDIUM)
#   [...]
#
# [Similar for other 4 sites]
#
# Total predictions generated: 38
# Storage: pilot_baseline_predictions table
# Email delivery: ✅ 5 gestores notified
```

**Email Format (Sent to Gestores):**

```
Subject: Buildly Brain — Previsões de Atraso (08/02)

Prezado [Gestor],

Aqui estão suas previsões de atraso para hoje:

CRÍTICA (Ação recomendada):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Vidro do fornecedor XYZ
  Atraso previsto: 2 dias
  Confiança: 82%
  Custo se atrasar: R$ 180.000
  Contexto: Este fornecedor atrasou 4x nos últimos 6 meses

ALTA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Concreto (fornecedor ABC)
  Atraso previsto: 3 dias
  Confiança: 78%
  
MÉDIA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Aço (fornecedor DEF)
  Atraso previsto: 0 dias (on-time)
  Confiança: 71%

BAIXA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Mão de obra local
  Atraso previsto: 0 dias
  Confiança: 65%

─────────────────────────────────────────
👉 O que fazer?
  
  ✅ FASE DE OBSERVAÇÃO — Você NÃO precisa tomar decisão ainda.
     Apenas observe se os atrasos previstos realmente ocorrem.
  
  📝 Feedback opcional:
     "Esta previsão faz sentido? Nosso fornecedor de Vidro 
      normalmente atrasa? Há fatores externos que o sistema 
      não sabe (strike, bloqueio de estrada)?"
  
  📧 Responda este email com feedback (muito valioso!)

─────────────────────────────────────────
Próxima semana continuaremos monitorando.
À sexta-feira, faremos uma análise de quantas previsões 
se concretizaram.

Dúvidas? Responda este email.

Att,
Equipe Buildly
```

---

### Mid-Day (Throughout Week)

**Gestores Observe & Collect Feedback**

```
Gestor activities (self-directed):
├─ Review morning predictions
├─ Observe site operations
├─ Note if predicted delays occur
├─ (Optional) Reply with feedback
└─ Note any external factors
```

---

### End-of-Day (5:00 PM)

**System Collects Observation Metrics**

```bash
# Nightly at 20:00 (8 PM):
npx ts-node scripts/collect-daily-observations.ts

# Process:
# 1. Fetch all predictions generated today
# 2. Compare to actual events on site
# 3. Calculate: did delay happen or not?
# 4. Record: TP, FP, TN, FN
# 5. Store in pilot_soft_launch_observations table
```

---

### End-of-Week (Friday 5:00 PM)

**Weekly Summary Report**

```bash
./scripts/infrastructure.sh soft-launch-weekly-report

# Output example:
# ╔════════════════════════════════════════════════════════╗
# ║     Buildly Pilot — Week 2 Observation Summary         ║
# ╚════════════════════════════════════════════════════════╝
#
# São Paulo (Camargo):
#   Predictions: 38
#   Actual delays observed: 31
#   Correct predictions: 29 (TP)
#   Wrong predictions: 9 (FP+FN)
#   Precision this week: 78% (baseline was 85%)
#   Confidence avg: 0.76
#
# Rio (Queiroz):
#   Predictions: 43
#   Actual delays: 38
#   Correct: 33
#   Wrong: 10
#   Precision: 74%
#
# [Similar for other 3 sites]
#
# Overall Week 2:
#   Total predictions: 195
#   Actual delays: 167 (86% delay rate in real week)
#   Correct predictions: 155
#   Wrong predictions: 40
#   Precision: 79% (baseline 81% — on track!)
#   False positive rate: 12%
#
# ✅ All metrics within acceptable range
# ✅ Model accuracy stable vs baseline
# ✅ No blocking issues
#
# Gestores Engagement:
#   São Paulo: 8/5 feedback submissions (enthusiastic)
#   Rio: 5/5 feedback submissions
#   BH: 3/5 feedback submissions
#   Brasília: 4/5 feedback submissions
#   Manaus: 2/5 feedback submissions (sparse data expected)
#
# Top Feedback Themes:
#   • Vidro is very predictable (gestores trust these alerts)
#   • Aço is unpredictable (some gestores skeptical)
#   • External factors (strikes, weather) impact accuracy
#   • Port delays in Rio affect lead times
```

---

## 🎯 Daily Prediction Targets

### Prediction Volume

- **São Paulo:** 6-7 predictions/day (varied materials)
- **Belo Horizonte:** 5-7 predictions/day
- **Rio:** 7-8 predictions/day (port impacts)
- **Brasília:** 5-6 predictions/day
- **Manaus:** 3-5 predictions/day (fewer supplier options)

**Total per week:** ~150-175 predictions across all sites

---

### Severity Distribution (Expected)

```
CRITICAL (confidence >0.85):     5-10% of predictions
HIGH (confidence 0.75-0.85):      15-20% of predictions
MEDIUM (confidence 0.65-0.75):    25-30% of predictions
LOW (confidence <0.65):           30-40% of predictions
```

---

## 📊 Success Criteria (Phase 4.2 Go/No-Go)

**End of Week 3 Friday (2026-08-16):**

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| **Precision** | ≥75% | avg across all sites |
| **System Uptime** | ≥99% | monitoring dashboard |
| **Daily Predictions** | 150+ per week | prediction count |
| **Gestor Feedback** | >50% | participation rate |
| **No Blocking Issues** | 0 P1 bugs | incident log |

**Go/No-Go Decision:**
- ✅ All criteria met → **PROCEED TO WEEK 4 (ACTIVE PHASE)**
- ⚠️ Minor issues → **FIX & RETRY (extend to extra Week 3)**
- ❌ Precision <75% → **PAUSE & RETRAIN (delay to Week 4)**

---

## 🔧 Technical Implementation

### Migration V012 (Already Deployed)

**Table: pilot_soft_launch_observations**

```sql
-- Structure (from V012):
CREATE TABLE pilot_soft_launch_observations (
  id UUID,
  site_id UUID,
  observation_date DATE,
  predictions_generated INT,
  avg_confidence_score NUMERIC,
  critical_count INT,
  high_count INT,
  medium_count INT,
  low_count INT,
  actual_delays_observed INT,
  true_positives INT,
  false_positives INT,
  true_negatives INT,
  false_negatives INT,
  false_positive_rate NUMERIC,
  false_negative_rate NUMERIC,
  precision_rate NUMERIC,
  recall_rate NUMERIC,
  system_uptime_percent NUMERIC,
  recorded_at TIMESTAMP,
  -- ... more fields for metrics
);
```

### Daily Scripts (Phase 4.2)

1. **generate-daily-predictions.ts** (6:00 AM)
   - Fetch current material orders across all sites
   - Generate predictions using trained model
   - Assign severity & confidence
   - Store in pilot_baseline_predictions
   - Format email digest

2. **collect-daily-observations.ts** (8:00 PM)
   - Fetch predictions generated today
   - Check actual delivery events
   - Calculate TP/FP/TN/FN
   - Update pilot_soft_launch_observations
   - Calculate daily precision/recall

3. **weekly-summary-report.sh** (Friday 5:00 PM)
   - Aggregate 7 days of observation data
   - Generate per-site metrics
   - Create weekly summary email
   - Send to Product Manager & Sponsor

---

## ⚠️ Failure Modes & Mitigations

### Issue 1: Precision Drops to 70% (Below 75% Target)

**Scenario:** Live predictions less accurate than baseline

**Causes:**
- Real-world data distribution differs from historical
- External factors (strikes, weather) not captured
- Supplier behavior changed since baseline period

**Mitigation:**
1. Add external factor data (weather API, strike alerts)
2. Retrain model on recent data
3. Extend Week 3 by 1 additional week
4. If still <75%: Escalate to technical team for architecture review

---

### Issue 2: Low Gestor Engagement (<50% Feedback)

**Scenario:** Gestores not responding to predictions

**Causes:**
- Prediction quality is poor (too many false positives)
- Email format is confusing
- Gestores lack time/interest

**Mitigation:**
1. Simplify email format (single-line predictions)
2. Highlight high-confidence predictions (0.80+)
3. Personal outreach: calls with each site manager
4. Add Slack/WhatsApp as alternative notification channel

---

### Issue 3: System Outage (Uptime <99%)

**Scenario:** Daily prediction generation fails or is delayed

**Causes:**
- Database connection issues
- Email service failure
- Prediction API timeout
- Cron job misconfiguration

**Mitigation:**
1. Real-time monitoring & alerting (PagerDuty)
2. 15-minute retry logic for failed predictions
3. Fallback email via manual delivery if automation fails
4. Daily health check email to team

---

## 📈 Expected Outcomes (By End of Week 3)

### Metrics Summary

- ✅ 320+ predictions generated (2 weeks × 160/week)
- ✅ 79% precision (stable vs 81% baseline, expected slight drop)
- ✅ 74% recall (stable vs 76% baseline)
- ✅ 99.2% system uptime
- ✅ 60%+ gestor feedback rate
- ✅ 5 confidence thresholds calibrated
- ✅ External factor patterns identified

### Learnings Captured

- "Vidro predictions are highly accurate (gestores trust them)"
- "Aço predictions are noisy (gestores skeptical)"
- "Rio port delays correlate with East African port status"
- "Brasília government bureaucracy adds 5-7 days regularly"
- "Manaus has sparse data but high-value predictions are accurate"

### Readiness for Week 4

- Model is production-ready
- Gestores understand the system
- Confidence thresholds are calibrated
- External factors identified for Phase 5 integration
- System is stable & reliable

---

## 📞 Communication Template

### Email to Gestores (Mondays, Weeks 2-3)

**Subject:** Buildly Brain Pilot — Semana [2 ou 3] Começou

```
Prezados Gestores,

Bem-vindos à Semana [2 ou 3] do Pilot Buildly Brain!

Nesta semana, continuamos observando como o sistema prevê atrasos.

🔍 O QUE MUDAR DESTA SEMANA:
   • Continuamos gerando previsões diárias (5-8 por site)
   • Vocês AINDA NÃO precisam tomar decisões
   • Continuamos coletando feedback (MUITO VALIOSO)
   • No final da semana, mostraremos quantos acertos tivemos

📊 COMO VOCÊS AJUDAM:
   1. Recebem previsões às 6:00 AM
   2. Observam se o atraso realmente ocorreu
   3. Respondent com feedback (opcional mas valioso)
   4. À sexta, recebem summary de acertos

✅ PROGRESSO ATÉ AGORA:
   • Semana 1: 81% acurácia no dados históricos
   • Semana 2: 79% acurácia em dados reais (excelente!)
   • Confiança gestores: Vidro 95%, Aço 60%

🚀 PRÓXIMOS PASSOS:
   • Semana 4: Vocês começam a APROVAR/REJEITAR previsões
   • Semana 5: Sistema aprende com suas decisões
   • Semana 6: Analisamos resultados e decidimos expansão enterprise

Dúvidas ou feedback? Responda este email anytime.

Att,
Equipe Buildly
```

---

## ✅ Checklist (Start of Week 2)

- [ ] V012 migration deployed (soft_launch_observations table)
- [ ] Daily prediction cron job configured (6:00 AM)
- [ ] Email template finalized & tested
- [ ] Gestor email list verified (5 gestores)
- [ ] Monitoring & alerting configured
- [ ] Fallback manual processes documented
- [ ] Weekly summary script tested
- [ ] Team on-call schedule published

---

**Status:** 🟡 **Ready After Phase 4.1 Go-Ahead**

**Next Phase:** Phase 4.3 (Active Phase - Weeks 4-5) — Gestores Make Decisions

**Timeline:** Weeks 2-3: 2026-08-02 to 2026-08-16
