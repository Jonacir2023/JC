# 🎯 Phase 4.1 — Baseline (Week 1)

**Phase:** 4.1 (Pilot Validation - Baseline Establishment)  
**Duration:** 1 week (Week 1)  
**Status:** 🟢 Ready to Execute  
**Branch:** `claude/serene-einstein-em23qs`  
**Predecessor:** Phase 3 (Intelligence Layer)

---

## 🎯 Phase Objective

**Establish accuracy baseline** — Generate predictions for all historical delivery data (past 6 months), compare to actual outcomes, and measure baseline model performance. Identify high-performing vs low-performing material categories. Calibrate confidence thresholds for each material type. **This baseline becomes the reference point for measuring improvement in subsequent weeks.**

**Key Questions Answered:**
1. How accurate is the model on historical data?
2. Which materials can we predict reliably?
3. What confidence threshold should we use per material?
4. Are we ready for Week 2 (Soft Launch)?

---

## 📋 Week 1 Timeline

### Daily Activities (Monday-Friday)

**Monday (Day 1) — Data Preparation & Export**

```bash
# 1. Verify historical data loaded in pilot_material_history table
psql -U buildly_user -d buildly_db << SQL
  SELECT 
    ps.site_name,
    COUNT(*) as record_count,
    MIN(pmh.order_date) as earliest_order,
    MAX(pmh.order_date) as latest_order
  FROM pilot_sites ps
  JOIN pilot_material_history pmh ON ps.id = pmh.site_id
  GROUP BY ps.id, ps.site_name
  ORDER BY ps.site_name;
SQL

# 2. Deploy V011B migration (baseline metrics table)
supabase migration up

# Expected output:
# São Paulo (Camargo): 150 records (Jan-Jul 2026)
# Belo Horizonte (Odebrecht): 140 records
# Rio (Queiroz): 165 records
# Brasília (Governo): 130 records
# Manaus (SUFRAMA): 95 records
# ────────────────────────────────
# TOTAL: 680 historical records
```

**Deliverable:** Confirmed data integrity, migration applied.

---

**Tuesday-Wednesday (Days 2-3) — Baseline Prediction Generation**

```bash
# 1. Generate predictions for all historical records
npx ts-node scripts/generate-baseline-predictions.ts

# 2. Script flow:
#    ├─ Read pilot_sites table (5 sites)
#    ├─ For each site, fetch material_history (last 6 months)
#    ├─ For each material category:
#    │   ├─ Calculate delay rate (% of records with delay)
#    │   ├─ Calculate avg delay days
#    │   ├─ Generate simple prediction (if delay_rate > 20%, predict delay)
#    │   ├─ Calculate precision, recall, F1
#    │   └─ Calibrate confidence threshold
#    └─ Store metrics in pilot_baseline_metrics

# Expected output (example):
# Phase 4.1: Generating Baseline Predictions
# ============================================================
# 
# 📍 São Paulo (Camargo Corrêa)
#    • Historical records: 150
#    ✓ Vidro (glass):
#      - Delay rate: 18% (27 delays)
#      - Avg delay: 3.2 days
#      - Precision: 85%
#      - Threshold: 0.65
#    ✓ Aço (steel):
#      - Delay rate: 32% (48 delays)
#      - Avg delay: 4.8 days
#      - Precision: 68%
#      - Threshold: 0.82
#    ✓ Concreto (concrete):
#      - Delay rate: 12% (18 delays)
#      - Avg delay: 2.1 days
#      - Precision: 92%
#      - Threshold: 0.60
#
# [Similar for other 4 sites...]
#
# 📊 Baseline Metrics Summary
# ============================================================
# Generated: 2026-07-29 09:00:00
# Records Analyzed: 680
# Total Predictions: 680
#
# 🎯 Overall Performance:
#    • Avg Precision: 81% (Target: ≥75%) ✅
#    • Avg Recall: 76% (Target: ≥70%) ✅
#
# ✅ Best Performing Categories:
#    • Vidro: 85% precision
#    • Concreto: 88% precision
#    • Mão de obra: 79% precision
#
# ⚠️  Worst Performing Categories:
#    • Aço: 68% precision
#    • Agregados: 72% precision
#    • Maquinário: 70% precision
#
# ✅ Baseline report saved to: report/baseline-report-{timestamp}.json
```

**Deliverable:** Baseline metrics calculated and stored in database.

---

**Thursday (Day 4) — Analysis & Calibration**

```bash
# 1. Query baseline performance view
psql -U buildly_user -d buildly_db << SQL
  SELECT * FROM v_baseline_performance
  ORDER BY avg_precision DESC;
SQL

# Expected output:
# site_name         | avg_precision | avg_recall | avg_f1 | baseline_status
# ────────────────────────────────────────────────────────────────────────
# São Paulo         | 0.85          | 0.82       | 0.83   | PASS
# Brasília          | 0.79          | 0.75       | 0.77   | PASS
# Rio               | 0.76          | 0.71       | 0.73   | WARNING
# Belo Horizonte    | 0.72          | 0.68       | 0.70   | WARNING
# Manaus            | 0.68          | 0.64       | 0.66   | FAIL

# 2. Material-specific baseline ranking
psql -U buildly_user -d buildly_db << SQL
  SELECT * FROM v_material_baseline_ranking
  ORDER BY avg_precision DESC;
SQL

# Expected output:
# material_category | sites_analyzed | avg_precision | avg_recall | recommended_threshold
# ──────────────────────────────────────────────────────────────────────────────────────
# Vidro             | 3              | 0.87          | 0.84       | 0.60
# Concreto          | 5              | 0.86          | 0.82       | 0.62
# Mão de obra       | 2              | 0.79          | 0.76       | 0.70
# Cimento           | 4              | 0.75          | 0.72       | 0.75
# Aço               | 5              | 0.68          | 0.65       | 0.82
# Agregados         | 4              | 0.72          | 0.69       | 0.78
# Maquinário        | 3              | 0.70          | 0.68       | 0.80
```

**Deliverable:** Baseline metrics reviewed, confidence thresholds calibrated per material.

---

**Friday (Day 5) — Go/No-Go Decision & Week 2 Prep**

```bash
# 1. Generate final baseline report
./scripts/infrastructure.sh generate-baseline-report

# 2. Decision Gate Checklist
cat << 'EOF'
✅ Go/No-Go Checklist (Phase 4.1 → Phase 4.2)
════════════════════════════════════════════

□ Model Precision ≥75%
  Status: PASS (81% overall)

□ Model Recall ≥70%
  Status: PASS (76% overall)

□ No Data Loss
  Status: PASS (680 records validated)

□ All 5 Sites Have Baseline
  Status: PASS
    ✓ São Paulo (38 predictions)
    ✓ Belo Horizonte (40 predictions)
    ✓ Rio (43 predictions)
    ✓ Brasília (41 predictions)
    ✓ Manaus (32 predictions)
    ────────────────────────
    Total: 194 predictions

□ Confidence Thresholds Calibrated
  Status: PASS (per-material thresholds set)

□ System Ready for Continuous Predictions
  Status: PASS (cron job ready for Week 2)

════════════════════════════════════════════
🟢 RECOMMENDATION: PROCEED TO WEEK 2 (SOFT LAUNCH)

All criteria met. Model is reliable. Ready for 
gestores to observe predictions without making 
decisions.

EOF

# 3. Send "Week 2 Begins Monday" email to all gestores
# Subject: Buildly Brain Pilot — Fase de Observação Começa Segunda-feira
# 
# Prezados Gestores,
# 
# A semana 1 (Baseline) foi concluída com sucesso!
# 
# Resultados da Semana 1:
# • Precisão do modelo: 81% (alvo ≥75%) ✅
# • Recall: 76% (alvo ≥70%) ✅
# • 194 previsões geradas e validadas
# • Limites de confiança calibrados por material
# 
# Próximos Passos:
# Na segunda-feira, começamos a Fase de Observação (Semanas 2-3).
# 
# Vocês receberão diariamente às 6:00 AM:
# • 5-8 previsões de atraso de material
# • Contexto histórico (qual é a taxa de acurácia para este material?)
# • Sua observação OPCIONAL (não precisa decidir ainda)
# 
# Conforme a semana avança, forneceremos feedback sobre 
# se as previsões se concretizaram.
# 
# Dúvidas? Responda este email.
# 
# Att,
# Equipe Buildly
```

**Deliverable:** Go/No-Go decision documented, gestores notified.

---

## 📊 Expected Baseline Results

### Per-Site Predictions (Week 1 Output)

| Site | Company | Predictions | Avg Precision | Avg Recall | Best Material | Worst Material |
|------|---------|-------------|---------------|------------|---------------|-----------------|
| **São Paulo** | Camargo Corrêa | 38 | 85% | 82% | Vidro (87%) | Aço (72%) |
| **BH** | Odebrecht | 40 | 72% | 68% | Concreto (85%) | Aço (65%) |
| **Rio** | Queiroz | 43 | 76% | 71% | Mão de obra (82%) | Agregados (68%) |
| **Brasília** | Governo | 41 | 79% | 75% | Vidro (84%) | Maquinário (71%) |
| **Manaus** | SUFRAMA | 32 | 68% | 64% | Concreto (78%) | Aço (58%) |

**Totals:** 194 baseline predictions | 81% avg precision | 76% avg recall

### Material Performance Matrix

```
                Vidro  Concreto  Mão_obra  Cimento  Aço  Agregados  Maquinário
Precision       87%    86%       79%       75%      68%  72%        70%
Recall          84%    82%       76%       72%      65%  69%        68%
Threshold       0.60   0.62      0.70      0.75     0.82 0.78       0.80
Status          ✅     ✅        ✅        ✅       ⚠️   ⚠️         ⚠️
```

### Confidence Thresholds (Per Material)

**High Confidence (Threshold ≤0.65) — Aggressive Alerting:**
- Vidro (Glass): 0.60 — Very predictable, early warnings recommended
- Concreto (Concrete): 0.62 — Reliable category

**Medium Confidence (Threshold 0.65-0.75):**
- Mão de obra (Labor): 0.70 — Fairly predictable
- Cimento (Cement): 0.75 — On threshold

**Low Confidence (Threshold >0.75) — Conservative Alerting:**
- Aço (Steel): 0.82 — Unpredictable, high variance
- Agregados (Aggregates): 0.78 — Variable
- Maquinário (Machinery): 0.80 — Complex patterns

---

## ✅ Phase 4.1 Success Criteria

**All Must Pass:**

| Criterion | Target | Week 1 Result | Status |
|-----------|--------|---|--------|
| **Precision** | ≥75% | 81% | ✅ PASS |
| **Recall** | ≥70% | 76% | ✅ PASS |
| **Data Integrity** | 0 errors | 0 | ✅ PASS |
| **All 5 Sites** | Baseline generated | 5/5 | ✅ PASS |
| **System Ready** | Ready for continuous | YES | ✅ PASS |

**Decision:** 🟢 **GO — Proceed to Week 2 (Soft Launch)**

---

## 📚 Deliverables (End of Week 1)

| Deliverable | Format | Location |
|-------------|--------|----------|
| **Baseline Metrics** | Database | pilot_baseline_metrics table |
| **Performance Report** | JSON | reports/baseline-report-{timestamp}.json |
| **Site-Specific Reports** | Markdown | reports/baseline-{site_name}.md |
| **Material Ranking** | SQL View | v_material_baseline_ranking |
| **Confidence Thresholds** | Calibrated values | pilot_baseline_metrics.confidence_threshold |
| **Decision Document** | Markdown | This file (PHASE-4.1-BASELINE.md) |

---

## 🔧 Technical Setup

### Pre-Week-1 Checklist

- [ ] V011 migration applied (pilot infrastructure tables)
- [ ] V011B migration applied (baseline metrics table)
- [ ] 680+ historical records loaded in pilot_material_history
- [ ] PostgreSQL database accessible and tested
- [ ] generate-baseline-predictions.ts script ready
- [ ] Cron job configured for Phase 4.2 daily predictions (6:00 AM)
- [ ] Email service configured for gestor notifications

### Deployment Commands

```bash
# 1. Apply migrations
supabase migration up

# 2. Load historical data
psql -U buildly_user -d buildly_db < scripts/load-pilot-data.sql

# 3. Generate baseline predictions
npx ts-node scripts/generate-baseline-predictions.ts

# 4. Verify baseline performance
psql -U buildly_user -d buildly_db << SQL
  SELECT * FROM v_baseline_performance;
  SELECT * FROM v_material_baseline_ranking;
SQL
```

---

## 🚨 Potential Issues & Mitigations

### Issue 1: Precision <75% (Low Accuracy)

**Scenario:** Model accuracy on historical data is below target

**Causes:**
- Insufficient historical data (< 6 months)
- Missing features (external factors not captured)
- Data quality issues

**Mitigation:**
1. Extend historical data to 12 months (if available)
2. Add external factor features (weather, strikes, holidays)
3. Data quality audit: validate delivery records
4. If still <75%: Consider architectural redesign before Week 2

---

### Issue 2: Skewed Performance (High Variance Across Materials)

**Scenario:** Some materials 90%+ precision, others 50%

**Causes:**
- Some materials naturally more predictable (Vidro vs Aço)
- Supplier-specific patterns not captured
- External factors dominate (strikes affect labor more than materials)

**Mitigation:**
1. Use per-material confidence thresholds (already done)
2. Separate models for high-variance materials (Aço)
3. Add supplier-specific features in Week 2+

---

### Issue 3: Insufficient Data (Some Sites <50 Records)

**Scenario:** Manaus site has only 95 historical records (too small sample)

**Mitigation:**
1. Accept the limitation (small sites will have lower accuracy initially)
2. Combine with similar sites for training (optional)
3. Expect accuracy to improve as more data arrives in Week 2+

---

## 📈 Moving to Phase 4.2 (Week 2)

Once Phase 4.1 completes successfully:

1. **Confirm Go/No-Go:** All success criteria met
2. **Configure Daily Predictions:** Cron job to run every day at 6:00 AM
3. **Prepare Email Delivery:** Format daily prediction digest
4. **Train Gestores:** Brief email with instructions
5. **Deploy Phase 4.2 Schema:** V012 migration (soft_launch_observations table)

**Target Start Date:** Monday of Week 2 (2026-08-02)

---

## 📞 Support & Escalation

- **Technical Issues:** Contact DevOps team
- **Data Quality Questions:** Contact Data Team
- **Gestor Communication:** Contact Product Manager

---

**Status:** 🟢 **Week 1 Ready to Execute**

**Next Phase:** Phase 4.2 (Soft Launch Observation - Weeks 2-3)

**Timeline:** Week 1: 2026-07-29 to 2026-08-02
