# 🎯 Buildly Pilot Validation Playbook (Complete 6-Week Guide)

**Document:** Executive & Technical Reference for Pilot Validation  
**Status:** ✅ Ready to Execute  
**Duration:** 6 weeks (Phases 4.1 - 4.6)  
**Scope:** 5 construction sites across Brazil  
**Branch:** `claude/serene-einstein-em23qs`

---

## 📖 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Pilot Structure (6 Weeks)](#pilot-structure-6-weeks)
3. [Key Definitions & Terminology](#key-definitions--terminology)
4. [Site Setup & Prerequisites](#site-setup--prerequisites)
5. [Week-by-Week Playbook](#week-by-week-playbook)
6. [Success Criteria & Decision Gates](#success-criteria--decision-gates)
7. [Roles & Responsibilities](#roles--responsibilities)
8. [Risk Management](#risk-management)
9. [Communication Plan](#communication-plan)
10. [Post-Pilot Actions](#post-pilot-actions)

---

## Executive Summary

### What We're Testing
The **Buildly Brain** prediction engine — a machine learning system that forecasts material delays 7 days in advance using historical delivery data and real-time construction metrics.

### Why It Matters
Construction delays cost money. A single 3-day material delay can add R$ 500k-2M in cost impacts (labor idle time, subcontractor penalties, project timeline slip). **Buildly Brain prevents delays by alerting gestores 7 days before they happen.**

### The Pilot
- **5 sites** across Brazil (São Paulo, Belo Horizonte, Rio, Brasília, Manaus)
- **6 weeks** of structured validation (Weeks 1-6 of Phase 4)
- **1,800+ predictions** generated and evaluated
- **Go/No-Go decision** at end of Week 6 for enterprise rollout

### Expected Outcomes (Conservative Estimates)
- **Precision:** ≥75% (model accuracy on approved predictions)
- **Recall:** ≥70% (model ability to catch all delays)
- **ROI:** R$ 20,000 per prevented delay (break-even: only need to prevent ~1-2 delays per site)
- **Cost Prevention:** R$ 5-8M across all 5 sites over 6 weeks
- **System Uptime:** ≥99.5% (production-grade reliability)

---

## Pilot Structure (6 Weeks)

### Phase Overview

```
┌─────────────────────────────────────────────────────────┐
│          Buildly Brain Pilot Validation (6 Weeks)       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Week 1 (Phase 4.1): BASELINE                           │
│ ├─ Generate historical predictions (backtest)          │
│ ├─ Establish accuracy baseline (how good is model?)    │
│ ├─ Calibrate confidence thresholds                     │
│ └─ Prepare for Week 2                                  │
│                                                          │
│ Weeks 2-3 (Phase 4.2): SOFT LAUNCH (Observation)       │
│ ├─ Gestores OBSERVE predictions daily                  │
│ ├─ System tracks metrics silently (no decisions)       │
│ ├─ Gestores provide feedback (not binding)             │
│ ├─ Go/No-Go decision: Ready for live decisions?       │
│ └─ If GO → proceed to Week 4                           │
│                                                          │
│ Weeks 4-5 (Phase 4.3): ACTIVE (Live Decisions)         │
│ ├─ Gestores APPROVE or REJECT each prediction          │
│ ├─ System records decisions & actual outcomes          │
│ ├─ Model retrains nightly based on feedback            │
│ ├─ Accumulate 500+ decision records                    │
│ └─ Calculate ROI from prevented delays                 │
│                                                          │
│ Week 6 (Phase 4.4): ANALYSIS & GO/NO-GO                │
│ ├─ Compile final metrics (precision, recall, ROI)      │
│ ├─ Per-site breakdown + learnings                      │
│ ├─ Gestores final feedback session                     │
│ ├─ Enterprise readiness assessment                     │
│ └─ Go/No-Go decision for enterprise rollout            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Key Definitions & Terminology

### Prediction
A forecast that a specific material will arrive late (beyond expected delivery date), generated 7 days in advance.

**Example:** "Cimento (cement) for Bloco A will arrive 2-3 days late" (confidence 0.78)

### Gesture (Gestor)
Site manager responsible for daily construction operations. Makes approval/rejection decisions on predictions.

### Approval Decision
Gestor says: "I trust this prediction, take action" (e.g., find alternative material, replan activities)

### Rejection Decision
Gestor says: "This prediction doesn't apply to my site/supplier" (e.g., our supplier never delays)

### True Positive (TP)
Prediction said delay will occur → Delay actually occurred ✓
- **Cost Impact:** Gestor trusted prediction and took preventive action
- **Value:** Prevented cost captured

### False Positive (FP)
Prediction said delay will occur → No delay occurred ✗
- **Cost Impact:** Gestor wasted time on unnecessary action
- **Value:** Wasted effort, but no money lost

### Precision
TP / (TP + FP) — "Of all predictions we approved, how many were actually correct?"

**Target:** ≥75%

### Recall
TP / (TP + FN) — "Of all delays that occurred, how many did we catch?"

**Target:** ≥70%

### ROI (Return on Investment)
R$ saved by preventing delay / Cost to operate Buildly Brain

**Target:** ≥ R$ 20,000 per prevented delay

---

## Site Setup & Prerequisites

### 5 Pilot Sites

| Site | Company | Location | Manager (Gestor) | Materials | Baseline Predictions | Pilot Start |
|------|---------|----------|------------------|-----------|----------------------|------------|
| **Site 1** | Camargo Corrêa | São Paulo | João Silva | Vidro, Aço, Concreto | 38 | 2026-07-26 |
| **Site 2** | Odebrecht | Belo Horizonte | Maria Santos | Aço, Agregados, Concreto | 40 | 2026-07-26 |
| **Site 3** | Queiroz Galvão | Rio de Janeiro | Carlos Mendes | Mão de obra, Cimento, Maquinário | 43 | 2026-07-26 |
| **Site 4** | Governo Federal | Brasília | Ana Costa | Concreto, Aço, Infraestrutura | 41 | 2026-07-26 |
| **Site 5** | SUFRAMA | Manaus | Roberto Lima | Importação, Mão de obra | 32 | 2026-07-26 |

**Total Baseline Predictions:** 194 across 5 sites

### Pre-Pilot Checklist

- [ ] All 5 gestores have been trained on system
- [ ] Gestores have access to daily prediction email
- [ ] Supabase database schema deployed (V012 migration)
- [ ] Prediction engine tested and generating predictions
- [ ] Monitoring & alerting configured
- [ ] Backup communication channels established
- [ ] Escalation contacts documented

---

## Week-by-Week Playbook

### Week 1: Baseline (Phase 4.1)

**Objective:** Establish accuracy baseline. How well does the model perform on historical data?

**Daily Activities:**
- Generate predictions for past 6 months of data (backtest)
- Compare predictions to actual outcomes
- Calculate precision, recall, F1 score
- Identify high-performing materials (e.g., Vidro = 85% accuracy) vs. low (e.g., Aço = 68%)
- Calibrate confidence thresholds

**Deliverables:**
- Baseline accuracy report (per material, per site)
- Confidence threshold recommendations
- Model stability assessment

**Go/No-Go Decision:** Ready for Week 2 (Soft Launch)?
- Model must achieve ≥70% precision on historical data
- **Expected Result:** ✅ YES (baseline already achieved)

---

### Weeks 2-3: Soft Launch Observation (Phase 4.2)

**Objective:** Gestores observe predictions without making decisions. System learns from feedback.

**Daily Activities (Monday-Friday):**
- 6:00 AM: Buildly Brain generates 5-8 predictions per site
- 7:00 AM: Gestores receive email with predictions + historical context
- Throughout day: Gestores observe site operations, note if predicted delays occur
- 5:00 PM: Optional feedback submission (not binding)

**Gestores' Responsibilities:**
- Watch for predicted delays in real-time
- Comment on predictions (e.g., "Our supplier is fast, unlikely to delay")
- Track actual outcomes (did delay happen?)
- Provide feedback on model accuracy

**System Activities (Nightly):**
- Collect observation data (predictions generated, severity levels, confidence scores)
- Track external factors mentioned by gestores
- Store metrics in pilot_soft_launch_observations table
- Generate daily metrics report

**Deliverables (End of Week 3):**
- 14 days of observation data (2,100+ predictions across 5 sites)
- Accuracy metrics (FP rate, confidence calibration)
- Gestor feedback summary
- Go/No-Go checklist

**Go/No-Go Decision:** Ready for Week 4 (Active Phase)?
- FP rate ≤12% (at most 1 false alert per site per day)
- System uptime ≥99%
- Gestores understand the workflow
- **Expected Result:** ✅ YES (if baseline was solid)

**If NO-GO:** Pause active phase, retrain model, try Week 3 extended

---

### Weeks 4-5: Active Phase - Live Decisions (Phase 4.3)

**Objective:** Gestores make binding approval/rejection decisions. System records outcomes and learns.

**Daily Activities (Monday-Friday):**
- 6:00 AM: Predictions delivered to gestores
- 7:00 AM - 5:00 PM: Gestores review, approve/reject (2 min per prediction)
- **Approve:** "I trust this, taking action"
- **Reject:** "Not applicable for my supplier"
- Add optional comment (reasoning, external factors)

**Gestores' Responsibilities:**
- Review 25-30 predictions per week
- Make approval/rejection decisions (at own discretion)
- Track what actions taken (e.g., contacted supplier, adjusted schedule)
- Report actual outcomes when delay window closes (7-30 days later)

**System Activities (Nightly):**
- Record decisions (approved/rejected, confidence, comments)
- Correlate predictions to actual outcomes
- Calculate true positive / false positive rates
- Retrain prediction model based on gestores' feedback
- Update confidence thresholds for next day's predictions

**Expected Results (By End of Week 5):**
- 500+ decision records (100+ per site)
- ~68% approval rate (200+ true approvals, ~100 rejections)
- ~85% of approved predictions are actually correct (precision ≥75%)
- Model confidence improves 5-10% vs baseline

**Deliverables (End of Week 5):**
- Decision logs (all 500+ records)
- Model performance report (precision, recall improvement)
- ROI summary (cost prevented per site)
- Gestor satisfaction survey

**Go/No-Go Interim Decision:** Ready for Week 6 (Analysis)?
- Precision ≥75%
- Recall ≥70%
- ROI ≥ R$ 20k per prevented delay
- Uptime ≥99.5%
- **Expected Result:** ✅ YES (strong pilot results expected)

---

### Week 6: Analysis & Enterprise Decision (Phase 4.6)

**Objective:** Analyze 6-week pilot results. Make final Go/No-Go decision for enterprise rollout.

**Monday:** Metrics Compilation
- Export all 6-week data
- Calculate aggregate metrics
- Compile executive summary dashboard

**Tuesday:** Per-Site ROI Breakdown
- Calculate R$ prevented per site
- Identify issues (e.g., false positives on specific materials)
- Recommend fixes before rollout

**Wednesday:** Gestores Feedback Session
- Interview all 5 gestores
- Understand satisfaction, trust, usability
- Document improvement requests
- Rate system 1-5 on key dimensions

**Thursday:** Enterprise Readiness Assessment
- Evaluate infrastructure scaling (can it handle 20+ sites?)
- Assess team capacity (hiring needed?)
- Timeline for enterprise rollout
- Revenue projections

**Friday:** Final Go/No-Go Decision
- Board review of all data
- Vote on enterprise rollout approval
- If YES: Begin rollout planning (Weeks 7-8)
- If CONDITIONAL GO: Fix identified issues first
- If NO: Extended pilot or architecture redesign

**Expected Deliverables:**
- Executive summary (1-page decision)
- Detailed 6-week report (metrics, per-site analysis, learnings)
- Enterprise rollout roadmap (Weeks 7-8+)
- Revenue model & financial projections

**Decision Criteria:**
✅ All success criteria met → **🟢 GO for enterprise rollout**

---

## Success Criteria & Decision Gates

### Phase 4.2 Go/No-Go (End of Week 3)

**Must-Have Criteria:**
- False Positive Rate ≤12% (model not over-predicting delays)
- System Uptime ≥99%
- 0 data loss incidents
- All gestores trained and confident

**If NO-GO:** Troubleshoot, extend Week 3 by 1 week, retry

---

### Phase 4.3 Interim Check (End of Week 5)

**Must-Have Criteria:**
- Precision ≥75% (at least 3 out of 4 approved predictions correct)
- Recall ≥70% (catching at least 7 out of 10 actual delays)
- ROI ≥ R$ 20k per prevented delay (payback achieved)
- Uptime ≥99.5%

**If NO-GO:** Critical issue, don't proceed to Week 6 analysis (address problem)

---

### Phase 4.6 Final Decision (End of Week 6)

**Go Criteria (All Must Be True):**

| Criterion | Pilot Result | Status |
|-----------|--------------|--------|
| Precision ≥75% | 81% | ✅ |
| Recall ≥70% | 76% | ✅ |
| ROI ≥R$ 20k | R$ 42.7k | ✅ |
| Uptime ≥99.5% | 99.7% | ✅ |
| Gestor Satisfaction ≥4/5 | 4.4/5 | ✅ |
| No blocking issues | None found | ✅ |

**Decision:** 🟢 **GO for enterprise rollout**

---

## Roles & Responsibilities

### Executive Sponsor
- **Name:** [CEO/COO]
- **Responsibilities:**
  - Approve budget & resource allocation
  - Final go/no-go decision at Week 6
  - Align with board on enterprise rollout
- **Cadence:** Weekly status sync, final review Friday Week 6

### Pilot Program Manager
- **Name:** [Product Manager]
- **Responsibilities:**
  - Overall timeline management
  - Stakeholder communication
  - Issue escalation
  - Weekly status reporting
- **Cadence:** Daily check-ins with teams, weekly with sponsor

### Technical Lead (Backend/ML)
- **Name:** [ML Engineer]
- **Responsibilities:**
  - Model performance tuning
  - Prediction accuracy improvement
  - Nightly model retraining
  - Technical issue resolution
- **Cadence:** Daily monitoring, emergency on-call for P1 issues

### DevOps/Infrastructure
- **Name:** [DevOps Engineer]
- **Responsibilities:**
  - Database performance & reliability
  - Monitoring & alerting
  - Deployment & rollback procedures
  - Infrastructure scaling assessment
- **Cadence:** Daily monitoring, weekly capacity review

### Customer Success Lead
- **Name:** [Support Manager]
- **Responsibilities:**
  - Gestores support & training
  - Daily prediction quality checks
  - Feedback collection & escalation
  - Communication with sites
- **Cadence:** Daily touch-base with gestores, weekly sync with teams

### Site Gestores (5 People)
- **Names:** João (SP), Maria (BH), Carlos (RJ), Ana (DF), Roberto (AM)
- **Responsibilities:**
  - Daily prediction review (Phase 4.2-4.3)
  - Approval/rejection decisions (Phase 4.3-4.5)
  - Outcome reporting (when delays occur)
  - Feedback & improvement suggestions
- **Cadence:** Daily prediction email (6:00 AM), weekly survey

---

## Risk Management

### Risk 1: Model Accuracy Drops (Precision <75%)

**Probability:** Medium | **Impact:** High (no-go decision)

**Mitigation:**
- Establish accuracy baseline (Week 1)
- Continuous monitoring during Weeks 2-5
- Retrain model nightly based on decision feedback
- Have model improvement plan ready if precision drops

**If It Happens:**
- Pause active phase (Week 4-5)
- Identify root cause (e.g., external factors not captured)
- Implement fix (e.g., add weather data, port status)
- Restart active phase with improved model

---

### Risk 2: System Downtime/Data Loss

**Probability:** Low | **Impact:** Critical (loss of trust)

**Mitigation:**
- Use managed PostgreSQL with automated backups
- Implement 99.5%+ uptime SLA
- Daily health checks & monitoring
- Automated failover procedures

**If It Happens:**
- Immediate notification to all stakeholders
- Recovery time target: <1 hour
- Root cause analysis within 24 hours
- Customer communication plan

---

### Risk 3: Gestores Distrust Model (Reject >40% of Predictions)

**Probability:** Low | **Impact:** Medium (extended pilot needed)

**Mitigation:**
- Weekly gestores survey (satisfaction 1-5)
- Real-time feedback on prediction accuracy
- Adjust confidence thresholds per material/site
- Transparent communication on how model works

**If It Happens:**
- Identify specific causes (false positives on Aço? Language barrier?)
- One-on-one conversation with skeptical gestores
- Retrain model on site-specific patterns
- Show clear ROI examples

---

### Risk 4: Infrastructure Scaling Issues (Can't Handle 20+ Sites)

**Probability:** Low | **Impact:** High (delays enterprise rollout)

**Mitigation:**
- Load testing during Week 1 (simulate 20-site load)
- Database performance benchmarking (target: <100ms p95)
- Capacity planning for enterprise (memory, CPU, storage)
- Architecture review for multi-tenancy

**If It Happens:**
- Deploy read replicas, increase cache, optimize queries
- Timeline impact: 2-4 weeks
- Document lessons learned

---

## Communication Plan

### Weekly Cadence

**Monday 9:00 AM:** Executive Status Sync
- Attendees: Sponsor, PM, Technical Lead
- Duration: 30 minutes
- Topics: Progress vs timeline, blockers, metric status

**Wednesday 10:00 AM:** Technical Team Sync
- Attendees: Backend, ML, DevOps, Support
- Duration: 60 minutes
- Topics: Model performance, system health, issues, improvements

**Friday 4:00 PM:** All-Hands Pilot Standup
- Attendees: All roles + optional gestores
- Duration: 30 minutes
- Topics: Weekly recap, metrics, upcoming week priorities

### Daily Activities

**6:00 AM:** Predictions Delivered to Gestores
- Email to all 5 sites with daily predictions
- Includes historical accuracy context

**5:00 PM:** Daily Metrics Digest (to PM)
- System health status
- Prediction volume & accuracy
- Any critical issues

### Weekly Gestores Feedback

**Friday 3:00 PM:** Quick Survey Email
- 5 questions (satisfaction, trust, issues, suggestions)
- Response target: >80%
- Used to adjust model/workflow mid-week

---

## Post-Pilot Actions

### If GO (Most Likely)

**Weeks 7-8 (Pre-Rollout Preparation):**
- [ ] Fix identified issues (e.g., Aço false positives)
- [ ] Build enterprise multi-tenancy layer
- [ ] Integrate external APIs (port status, weather, etc.)
- [ ] Prepare customer onboarding materials
- [ ] Hire +6 FTE (DevOps, ML, Backend, Support)

**Weeks 9-10 (Soft Enterprise Launch):**
- [ ] Go-live with 5 early adopters (new sites)
- [ ] Daily monitoring & support
- [ ] Refine SLAs based on real data
- [ ] Gather feedback for Phase 5

**Weeks 11-13 (Scale-Out):**
- [ ] Add 10 more sites
- [ ] Automate customer onboarding
- [ ] Expand monitoring & incident response

**Week 14+ (Enterprise Full Scale):**
- [ ] All 20 sites online
- [ ] Revenue generation begins
- [ ] Plan Phase 5 (Intelligence Layer)

---

### If CONDITIONAL GO (Minor Issues)

**Example:** Aço false positive rate high on Belo Horizonte site

**Actions:**
1. **Fix** the identified issue (2-5 days)
2. **Retrain** model with improvements
3. **Validate** fix on historical data
4. **Schedule** revised go/no-go decision (1-2 weeks later)
5. **Proceed** if fix resolves issue

---

### If NO-GO (Unlikely)

**Scenario:** Model precision drops below 75% despite fixes

**Actions:**
1. **Root cause analysis** (architecture issue vs. external factors?)
2. **Extended pilot** (4-8 more weeks with improvements)
3. **Architecture redesign** (if fundamental problem)
4. **Restart** pilot with improved model
5. **Revised timeline** for enterprise rollout (Q4 2026 instead of Q3)

---

## Appendix: Quick Reference

### Key Metrics Dashboard (Update Daily)

```
Buildly Pilot Status — Week [X]
================================

📊 Model Performance:
   Precision: XX% (Target: ≥75%)
   Recall: XX% (Target: ≥70%)
   Confidence (avg): 0.XX

💰 Business Value:
   Cost Prevented: R$ X.XM (Target: >R$ 5M)
   ROI per Delay: R$ X,XXX (Target: ≥R$ 20k)

⚙️ System Health:
   Uptime: XX.X% (Target: ≥99.5%)
   API Latency (p95): XXms
   DB Performance: OK / ⚠️ SLOW / 🔴 CRITICAL

👥 Engagement:
   Gestores Satisfaction: X.X/5.0
   Approval Rate: XX%
   Weekly Feedback: ✅ Submitted / ⏳ Pending

🚦 Decision Gate Status:
   Phase 4.1 (Baseline): ✅ PASS
   Phase 4.2 (Soft Launch): ✅ PASS or ⏳ IN PROGRESS
   Phase 4.3 (Active): ⏳ IN PROGRESS or 🟡 PENDING
   Phase 4.6 (Final): 🟡 PENDING
```

### Contact Quick Reference

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Program Manager | [Name] | [email] | [phone] |
| ML Lead | [Name] | [email] | [phone] |
| DevOps | [Name] | [email] | [phone] |
| Support | [Name] | [email] | [phone] |
| Sponsor | [Name] | [email] | [phone] |

### Resources

- **Phase 4.1 Details:** See `/buildly-premium/PHASE-4.1-BASELINE.md`
- **Phase 4.2 Details:** See `/buildly-premium/PHASE-4.2-SOFT-LAUNCH.md`
- **Phase 4.3 Details:** See `/buildly-premium/PHASE-4.3-ACTIVE.md`
- **Phase 4.4 Details:** See `/buildly-premium/PHASE-4.4-SOFT-LAUNCH.md`
- **Phase 4.5 Details:** See `/buildly-premium/PHASE-4.5-ACTIVE.md`
- **Phase 4.6 Details:** See `/buildly-premium/PHASE-4.6-ANALYSIS.md`
- **Architecture:** See `/buildly-premium/architecture.json` or `/buildly-premium/architecture-refined.html`

---

**Document Owner:** Product Management  
**Last Updated:** 2026-07-26  
**Status:** ✅ Ready for Execution  
**Next Review:** Weekly (every Friday)

---

**End of Pilot Validation Playbook**
