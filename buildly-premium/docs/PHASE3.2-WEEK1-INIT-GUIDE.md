# Phase 3.2 Week 1 — Initialization Guide

**Duration:** 2-3 days  
**Status:** Ready to execute (13 setembro 2026)  
**Effort:** ~30 hours (1 engineer)

---

## 📋 Pre-Flight Checklist

Before starting Week 1, verify:

- [ ] Access to staging environment (Docker, PostgreSQL, Neo4j)
- [ ] Claude API key configured in `.env` (CLAUDE_API_KEY)
- [ ] PostgreSQL connection string points to staging (buildly_staging)
- [ ] Neo4j 5.12+ running with APOC plugins enabled
- [ ] Python 3.9+ with dependencies: `pip install -r buildly-premium/scripts/requirements.txt`
- [ ] N8N instance running and accessible
- [ ] GitHub PAT token with repo contents:write access (for N8N GitHub sync)
- [ ] Slack webhook configured (for pipeline notifications)

---

## 🚀 Execution Steps

### Day 1: Database & Schema Setup (4-5 hours)

#### Step 1.1: Initialize PostgreSQL Brain Tables

Run the migration to create views and audit tables:

```bash
cd buildly-premium
psql -h localhost -U postgres -d buildly_staging < migrations/V004__brain_views.sql
```

**Expected Output:**
```
CREATE VIEW
CREATE MATERIALIZED VIEW
CREATE INDEX
CREATE TABLE
... (18 creation statements)
```

**Verification:**
```bash
# List views created
psql -h localhost -U postgres -d buildly_staging -c "\dv v_brain*"

# Check audit table exists
psql -h localhost -U postgres -d buildly_staging -c "\dt brain_extraction_audit"

# Verify materialized view
psql -h localhost -U postgres -d buildly_staging -c "\dm mv_brain*"
```

**Expected Result:**
- 6 views created: v_brain_stats, v_top_lessons, v_recurring_risks, v_event_patterns, v_seasonal_patterns, v_brain_health
- 1 materialized view: mv_brain_insights
- 1 audit table: brain_extraction_audit with 3 indexes
- 3 functions: check_extraction_health(), get_brain_trends(), alert_extraction_failures()

#### Step 1.2: Add Brain Columns to diario_obras

Update the diario_obras table to track extraction status:

```bash
psql -h localhost -U postgres -d buildly_staging << 'SQL'
ALTER TABLE diario_obras 
  ADD COLUMN IF NOT EXISTS brain_processado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS brain_processado_em TIMESTAMP,
  ADD COLUMN IF NOT EXISTS brain_error_message TEXT,
  ADD COLUMN IF NOT EXISTS brain_extraction_attempts INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_diario_brain_processado ON diario_obras(brain_processado);
CREATE INDEX IF NOT EXISTS idx_diario_brain_processado_em ON diario_obras(brain_processado_em DESC);
SQL
```

**Verification:**
```bash
psql -h localhost -U postgres -d buildly_staging -c "\d diario_obras" | grep brain_
```

---

### Day 1-2: Neo4j Schema Deployment (3-4 hours)

#### Step 1.3: Deploy Brain Schema to Neo4j

Connect to Neo4j and run the schema creation:

```bash
# Using Neo4j CLI
cypher-shell -a neo4j://localhost:7687 -u neo4j -p <password> << 'CYPHER'
$(cat buildly-premium/schemas/brain_schema.cypher)
CYPHER
```

**Or via Neo4j Browser:**
1. Open http://localhost:7474 (Neo4j Browser)
2. Login with neo4j / <password>
3. Copy-paste entire content of `buildly-premium/schemas/brain_schema.cypher`
4. Execute

**Expected Output:**
```
Added 5 indexes
Added 1 unique constraint
Added 2 property existence constraints
```

**Verification Queries:**

```cypher
// Check indexes created
SHOW INDEXES;

// Check constraints
SHOW CONSTRAINTS;

// Verify empty Brain graph (no data yet)
MATCH (b:Brain) RETURN COUNT(b) AS brain_count;
// Expected: 0 (we'll load data in Week 2)
```

#### Step 1.4: Create Staging Brain Node

Create a test Brain node for staging work:

```cypher
MERGE (brain:Brain {
  id: 'test-brain-staging',
  obra_id: 'STAGING-001',
  nome_obra: 'Test Staging Project',
  created_at: datetime(),
  updated_at: datetime(),
  total_lessons: 0,
  total_decisions: 0,
  total_risks: 0,
  total_successful_lessons: 0,
  total_failed_lessons: 0,
  average_confidence: 0.0
})
RETURN brain;
```

**Verification:**
```cypher
MATCH (b:Brain {obra_id: 'STAGING-001'}) RETURN b;
```

---

### Day 2: Python Pipeline Setup (4-5 hours)

#### Step 1.5: Prepare Python Environment

```bash
cd buildly-premium/scripts

# Install dependencies
pip install -r requirements.txt

# Verify dependencies
python -c "import psycopg2; import neo4j; import anthropic; print('✓ All deps OK')"
```

**requirements.txt should include:**
```
psycopg2-binary==2.9.9
neo4j==5.14.0
anthropic==0.25.0
python-dotenv==1.0.0
```

#### Step 1.6: Configure Environment Variables

Create `.env` file for staging:

```bash
cat > buildly-premium/.env.staging << 'EOF'
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<password>
DB_NAME=buildly_staging

# Neo4j
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=<password>

# Claude API
CLAUDE_API_KEY=<your-api-key>
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# Logging
LOG_LEVEL=INFO
EOF
```

**Load environment:**
```bash
export $(cat buildly-premium/.env.staging | xargs)
```

#### Step 1.7: Test Pipeline with Mock RDO

Run a test extraction to validate the entire pipeline:

```bash
cd buildly-premium/scripts

python -c "
from brain_extraction_pipeline import BrainExtractionPipeline
import json

# Create pipeline instance
pipeline = BrainExtractionPipeline()

# Mock RDO data
mock_rdo = {
    'id': 'MOCK-RDO-001',
    'obra_id': 'STAGING-001',
    'data': '2026-07-20',
    'setor': 'Estrutura',
    'responsavel': 'Jonacir',
    'atividades': 'Preparação de concreto para pilares',
    'materiais': 'Cimento CP II (40 sacos), brita, areia',
    'ocorrencias': 'Cimento chegou com 3 dias de atraso. Fornecedor atrasou entrega.',
    'status': 'Concluído',
    'observacoes': 'Reordenamos tarefas para não impactar cronograma. Resultado positivo.'
}

# Test extraction (will call Claude API)
print('Testing brain extraction with mock RDO...')
result = pipeline._extract_lesson_from_rdo(mock_rdo)

print('\\n✓ Extraction successful!')
print(json.dumps(result, indent=2, ensure_ascii=False))
"
```

**Expected Output:**
```json
{
  "resumo": "Cimento chegou 3 dias atrasado...",
  "tipo_evento": "ATRASO_MATERIAL",
  "resultado": "sucesso",
  "decisoes": [...],
  "causas": ["fornecedor_atraso"],
  "solucoes": ["reordenacao_tarefas"],
  "confiabilidade": 0.82,
  ...
}
```

**If error occurs:**
- Check Claude API key validity: `curl https://api.anthropic.com/v1/messages -H "Authorization: Bearer $CLAUDE_API_KEY"`
- Check Neo4j connection: `cypher-shell -a neo4j://localhost:7687 "RETURN 1 as status"`
- Check PostgreSQL: `psql -h localhost -U postgres -d buildly_staging -c "SELECT version()"`

#### Step 1.8: Test Full Pipeline (Mock → Neo4j → PostgreSQL)

```bash
python << 'PYTHON'
from brain_extraction_pipeline import BrainExtractionPipeline
import logging

logging.basicConfig(level=logging.INFO)

pipeline = BrainExtractionPipeline()

# Mock RDO (simulating real database record)
mock_rdo = {
    'id': 'TEST-RDO-20260720',
    'obra_id': 'STAGING-001',
    'data': '2026-07-20',
    'setor': 'Estrutura',
    'responsavel': 'Jonacir',
    'atividades': 'Fundação - Escavação e compactação',
    'materiais': 'Brita, areia, geotêxtil',
    'ocorrencias': 'Nenhuma',
    'status': 'Concluído',
    'observacoes': 'Tudo dentro do previsto.'
}

# Extract lesson from RDO
lesson = pipeline._extract_lesson_from_rdo(mock_rdo)

# Ensure Brain exists in Neo4j
pipeline._ensure_brain_exists(mock_rdo['obra_id'])

# Store lesson in Neo4j
pipeline._store_lesson_in_brain(lesson)

# Link similar lessons (will find none on first run)
pipeline._link_similar_lessons(lesson)

# Update Brain statistics
pipeline._update_brain_statistics(mock_rdo['obra_id'])

print('✓ Full pipeline test successful!')
print(f'  Lesson stored: {lesson.rdo_id}')
print(f'  Brain updated for obra: {mock_rdo["obra_id"]}')

# Verify in Neo4j
from neo4j import GraphDatabase
driver = GraphDatabase.driver('neo4j://localhost:7687', auth=('neo4j', '<password>'))
with driver.session() as session:
    result = session.run(
        "MATCH (brain:Brain {obra_id: $obra_id}) RETURN brain.total_lessons",
        obra_id='STAGING-001'
    )
    for record in result:
        print(f'  Neo4j total_lessons: {record[0]}')
PYTHON
```

---

### Day 3: N8N Workflow Activation (2-3 hours)

#### Step 1.9: Deploy N8N Workflow

Import the daily extraction workflow into N8N:

**Option A: Via N8N UI**
1. Open N8N instance (`http://localhost:5678`)
2. Create new workflow
3. Import JSON from `buildly-premium/n8n/workflows/brain_daily_extraction.json`
4. Configure credentials:
   - PostgreSQL: `buildly_staging` database connection
   - Neo4j: staging instance credentials
   - Slack: webhook URL for notifications
5. Test the workflow with "Test Workflow" button
6. Set to Active (toggle on)

**Option B: Via API (if using N8N programmatically)**
```bash
curl -X POST http://localhost:5678/api/v1/workflows \
  -H "Authorization: Bearer <n8n-api-token>" \
  -H "Content-Type: application/json" \
  -d @buildly-premium/n8n/workflows/brain_daily_extraction.json
```

#### Step 1.10: Verify N8N Workflow

Test the workflow with manual execution:

1. In N8N, click "Execute Workflow"
2. Verify flow:
   - Daily Trigger (manual fire) → ✓
   - Execute Brain Extraction → ✓ (should log to PostgreSQL)
   - Check for Errors → ✓
   - Slack notification → ✓

**Expected Slack message:**
```
✅ Brain Updated

Lessons processed: 1
Lessons with 'sucesso': 1
Avg confidence: 0.82

Brain now contains: 1 lessons
```

#### Step 1.11: Schedule Workflow

Set the trigger to run daily at 02:00 UTC:

1. Edit "Daily Trigger (02:00 UTC)" node
2. Set: Every 24 hours at minute 0 (this will trigger at 02:00 UTC)
3. Save and activate workflow

**Verification:**
- Workflow shows "Active" status
- Next run time displays correctly
- Workflow executes automatically at scheduled time

---

## ✅ Week 1 Validation Checklist

After completing all steps, verify:

- [ ] PostgreSQL: V004 migration applied successfully
- [ ] PostgreSQL: diario_obras has 4 new brain_* columns
- [ ] PostgreSQL: Views v_brain_stats, v_top_lessons, etc. created and queryable
- [ ] PostgreSQL: brain_extraction_audit table with audit data exists
- [ ] Neo4j: 5 indexes created (idx_brain_obra_id, idx_lesson_*, etc.)
- [ ] Neo4j: 3 constraints created (brain_obra_unique, lesson_resultado_valid, lesson_confiabilidade_range)
- [ ] Neo4j: Test Brain node exists (STAGING-001)
- [ ] Python: Requirements installed and imports work
- [ ] Python: Mock RDO extraction produces valid JSON
- [ ] Python: Full pipeline test (extract → store → link) completes successfully
- [ ] N8N: Workflow imported and configured
- [ ] N8N: Manual workflow execution succeeds
- [ ] N8N: Slack notifications working (success and error cases)
- [ ] N8N: Scheduled trigger set for 02:00 UTC daily
- [ ] Claude API: Cost tracking shows < $0.003 per test RDO

---

## 🧪 Testing the Foundation

### Test 1: Extract from Mock RDO
```bash
cd buildly-premium/scripts
python -c "from brain_extraction_pipeline import BrainExtractionPipeline; print('✓ Import OK')"
```

### Test 2: Query Brain Statistics
```bash
psql -h localhost -U postgres -d buildly_staging -c "SELECT * FROM v_brain_stats;"
```

### Test 3: Check Neo4j Brain Node
```cypher
MATCH (b:Brain {obra_id: 'STAGING-001'}) 
RETURN b.total_lessons, b.average_confidence, b.brain_maturity;
```

### Test 4: Verify Audit Trail
```bash
psql -h localhost -U postgres -d buildly_staging -c "SELECT * FROM brain_extraction_audit ORDER BY extraction_timestamp DESC LIMIT 1;"
```

---

## 📊 Expected State After Week 1

| Component | Status | Expected Value |
|-----------|--------|-----------------|
| PostgreSQL Brain Tables | ✓ Created | 6 views + 1 mat. view + audit |
| Neo4j Brain Schema | ✓ Deployed | 5 indexes + 3 constraints |
| Test Brain Node | ✓ Created | STAGING-001 with 1+ lessons |
| Python Pipeline | ✓ Working | Can extract RDO → JSON → Neo4j |
| N8N Workflow | ✓ Active | Scheduled for 02:00 UTC daily |
| Claude API Calls | ✓ Tracked | < 5 calls/test in audit table |
| Slack Notifications | ✓ Working | Success + error messages received |

---

## 🚀 Next: Week 2 (20-26 setembro)

Once Week 1 validation is complete:

1. **Load 50+ historical RDOs** into Brain via batch processing
2. **Run quality validation** script on extracted lessons
3. **Test similarity search** accuracy and relevance
4. **Build Brain dashboard** with real statistics visualization
5. **Performance test** Neo4j with 100+ concurrent queries

See: `PHASE3.2-BRAIN-BLUEPRINT.md` Week 2 section for details.

---

## 🆘 Troubleshooting

### PostgreSQL Migration Fails
```bash
# Check existing columns
psql -h localhost -U postgres -d buildly_staging -c "\d diario_obras"

# Rollback and retry
psql -h localhost -U postgres -d buildly_staging -c "DROP VIEW IF EXISTS v_brain_stats CASCADE;"
```

### Neo4j Connection Error
```bash
# Verify Neo4j is running
docker ps | grep neo4j

# Check connection
cypher-shell -a neo4j://localhost:7687 "RETURN 1"

# View Neo4j logs
docker logs buildly-neo4j
```

### Python Import Error
```bash
# Reinstall dependencies
pip install --force-reinstall -r buildly-premium/scripts/requirements.txt

# Check Python version
python --version  # Should be 3.9+
```

### Claude API Rate Limit
```
Error: rate_limit_error
Solution: Wait 60 seconds, retry. Check .env for valid API key.
Cost: Should be < $0.003 per test (check billing dashboard)
```

### N8N Workflow Won't Start
```bash
# Check N8N logs
docker logs buildly-n8n

# Verify credentials exist
# In N8N UI: Settings → Credentials → Verify PostgreSQL, Neo4j, Slack
```

---

## 📞 Support

For issues during Week 1 initialization:

1. Check this guide's troubleshooting section
2. Review log files (PostgreSQL, Neo4j, Python stderr)
3. Verify environment variables are loaded
4. Consult PHASE3.2-BRAIN-BLUEPRINT.md for architecture context
5. Check Claude API status page (api.anthropic.com)

---

**Week 1 Status:** Ready to execute (13 setembro 2026)  
**Estimated Completion:** 15 setembro 2026  
**Next Milestone:** Week 2 initialization (20 setembro)
