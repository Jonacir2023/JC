# 🚀 Quick Start — Week 1 Execution

**Para executar o Week 1 localmente em sua máquina**

---

## ✅ Pré-requisitos (Verifique Primeiro)

```bash
# Verificar Docker
docker --version      # Necessário: >= 20.10
docker compose version # Necessário: >= 2.0

# Verificar Node.js
node --version        # Necessário: >= 18
npm --version         # Necessário: >= 8

# Verificar TypeScript
npx tsc --version     # Para gerar previsões baseline
```

Se algum faltar, instale:
- **Docker:** https://docs.docker.com/get-docker/
- **Node.js:** https://nodejs.org/ (LTS 18+)

---

## 🎯 Execução Rápida (Recomendado)

### Opção 1: Script Automático (5 minutos total)

```bash
cd buildly-premium

# Tornar script executável
chmod +x scripts/week1-execute.sh

# Executar toda Week 1 automaticamente
./scripts/week1-execute.sh
```

**Saída esperada:**
```
✅ Docker stack started
✅ Pilot schema initialized
✅ 4,050 historical records loaded
✅ 38-43 baseline predictions generated
✅ ALL WEEK 1 ACTIVITIES COMPLETE
```

---

## 📋 Execução Manual (Passo a Passo)

Se preferir executar manualmente, siga os passos abaixo:

### **Day 1 (Monday) — Infrastructure & Schema Setup**

```bash
cd buildly-premium

# 1. Iniciar Docker stack
docker compose up -d

# 2. Aguardar 30 segundos para serviços iniciarem
sleep 30

# 3. Verificar status
./scripts/infrastructure.sh status

# Esperado: Todos os 4 serviços "healthy"
# ✅ Brain ML Engine: healthy
# ✅ Core API: healthy
# ✅ PostgreSQL: healthy
# ✅ Redis: healthy

# 4. Inicializar schema pilot
./scripts/infrastructure.sh pilot-setup

# 5. Verificar se schema foi criado
docker compose exec -T postgres psql -U buildly_user -d buildly_db \
  -c "SELECT COUNT(*) as pilot_tables FROM information_schema.tables WHERE table_name LIKE 'pilot_%';"

# Esperado: 8 (8 tabelas pilot criadas)
```

---

### **Day 2 (Tuesday) — Historical Data Loading**

```bash
# 1. Carregar dados históricos (~ 60 segundos)
./scripts/infrastructure.sh pilot-load-data

# Esperado:
# ✅ Pilot data loaded successfully
#    • 950+ records: São Paulo (Camargo Corrêa)
#    • 650+ records: Belo Horizonte (Odebrecht)
#    • 1,200+ records: Rio de Janeiro (Queiroz Galvão)
#    • 800+ records: Brasília (governo do Brasil)
#    • 450+ records: Manaus (SUFRAMA)

# 2. Verificar integridade dos dados
./scripts/infrastructure.sh pilot-status

# Esperado: Tabela mostrando cada site com ~950-1200 registros

# 3. Criar backup do database
./scripts/infrastructure.sh db-backup

# Esperado: backup-YYYYMMDD-HHMMSS.sql criado
```

---

### **Day 3 (Wednesday) — Baseline Predictions**

```bash
# 1. Gerar previsões baseline (~ 2-3 minutos)
npx ts-node scripts/generate-baseline-predictions.ts

# Esperado:
# ✅ Baseline Prediction Generation Complete!
# ✅ Total predictions created: 38-43
# 
# Summary by Site:
# Site Name                    Predictions  Critical  High  Avg Confidence
# Porto Maravilha (RJ)         9            3         4     0.78
# Edificio Corporate SP        8            2         3     0.75
# ...

# 2. Verificar predictions criadas
docker compose exec -T postgres psql -U buildly_user -d buildly_db << SQL
  SELECT
    ps.site_name,
    COUNT(pbp.id) as prediction_count,
    ROUND(AVG(pbp.confidence)::NUMERIC, 4) as avg_confidence,
    ROUND(SUM(pbp.predicted_cost_impact_brl) / 1000000, 2) as cost_exposure_m
  FROM pilot_sites ps
  LEFT JOIN pilot_baseline_predictions pbp ON ps.id = pbp.site_id
  GROUP BY ps.id, ps.site_name
  ORDER BY cost_exposure_m DESC;
SQL

# Esperado: 5 linhas com predictions para cada site
```

---

### **Day 4 (Thursday) — Gestor Training**

```bash
# 1. Criar template de sign-off
cat > reports/week1-gestores-sign-off.txt << 'EOF'
BUILDLY BRAIN PILOT — GESTOR TRAINING & SIGN-OFF

Site 1: São Paulo (Camargo Corrêa)
  Gestor: João Silva (joao.silva@camargo.com.br)
  Status: [ ] Training Scheduled [ ] Completed [ ] Signed Off
  
Site 2: Belo Horizonte (Odebrecht)
  Gestor: Maria Santos (maria.santos@odebrecht.com.br)
  Status: [ ] Training Scheduled [ ] Completed [ ] Signed Off
  
Site 3: Rio de Janeiro (Queiroz Galvão)
  Gestor: Carlos Oliveira (carlos.oliveira@queiroz.com.br)
  Status: [ ] Training Scheduled [ ] Completed [ ] Signed Off
  
Site 4: Brasília (governo do Brasil)
  Gestor: Ana Paula Lima (ana.paula@gov.br)
  Status: [ ] Training Scheduled [ ] Completed [ ] Signed Off
  
Site 5: Manaus (SUFRAMA)
  Gestor: Roberto Ferreira (roberto.ferreira@suframa.gov.br)
  Status: [ ] Training Scheduled [ ] Completed [ ] Signed Off

Training Completed: _______________
All Gestores Signed Off: YES / NO
EOF

# 2. Enviar emails para gestores com:
#    - Convite para treinamento
#    - Link para slides (PILOT-VALIDATION-PLAN.md)
#    - Previsões baseline para seu site
#    - Info de contato para dúvidas

# 3. Coletar confirmações de participação
```

---

### **Day 5 (Friday) — Final Validation & Go/No-Go**

```bash
# 1. Executar teste completo do workflow
./scripts/infrastructure.sh test-workflow

# Esperado:
# ✅ Brain ML Engine: healthy
# ✅ Core API: healthy
# ✅ Retrieved NNN predictions
# ✅ Retrieved NNN alerts via Core API
# ✅ Approval workflow functional
# ✅ Full workflow test passed!

# 2. Gerar relatório final
docker compose exec -T postgres psql -U buildly_user -d buildly_db \
  -c "SELECT * FROM pilot_performance_summary ORDER BY total_prevented_cost DESC;" \
  > reports/week1-final-summary.txt

cat reports/week1-final-summary.txt

# 3. Validar métricas
echo "Week 1 Checklist:"
echo "✅ 5 pilot sites registered"
echo "✅ 4,050 historical records loaded"
echo "✅ 38-43 baseline predictions generated"
echo "✅ All 5 gestores trained and signed off"
echo "✅ API health checks passing"
echo "✅ System latency < 500ms"
echo ""
echo "GO/NO-GO DECISION: ✅ GO"
echo "Proceed to Week 2 (Soft Launch)"
```

---

## 📊 Acessar Sistemas Durante Week 1

| Sistema | URL | Credenciais |
|---------|-----|-------------|
| **Core API** | http://localhost:3001 | N/A |
| **Brain ML** | http://localhost:3002 | N/A |
| **PostgreSQL** | localhost:5432 | user: `buildly_user` / pass: `buildly_secure_password_2026` |
| **PgAdmin** | http://localhost:5050 | admin@buildly.local / admin |
| **Redis Commander** | http://localhost:8081 | N/A |

---

## 🔍 Monitorar Progresso

```bash
# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f postgres
docker compose logs -f brain-ml
docker compose logs -f core-api

# Ver status dos containers
docker compose ps

# Ver resource usage
docker stats buildly-postgres buildly-redis buildly-brain-ml buildly-core-api
```

---

## ⚠️ Troubleshooting

### Problema: "Docker daemon not running"
```bash
# Solução: Iniciar Docker
sudo systemctl start docker
# ou abrir Docker Desktop (Mac/Windows)
```

### Problema: "Port already in use"
```bash
# Solução: Parar containers anteriores
docker compose down

# ou mudar portas em docker-compose.yml
# Trocar: ports: ["3001:3001"]
# Por: ports: ["3001:3001"]  (ou outra porta)
```

### Problema: "Out of memory"
```bash
# Solução: Aumentar recursos do Docker
# Via Docker Desktop: Settings → Resources → Memory (aumentar para 4GB+)

# ou limpar espaço:
docker system prune -a
```

### Problema: "psql: command not found"
```bash
# Solução: Conectar via container
docker compose exec postgres psql -U buildly_user -d buildly_db
```

---

## ✅ Checklist de Conclusão (Week 1)

- [ ] Docker stack iniciado (`docker compose up -d`)
- [ ] Pilot schema criado (`pilot-setup`)
- [ ] 4,050 registros históricos carregados (`pilot-load-data`)
- [ ] 38-43 previsões baseline geradas (`generate-baseline-predictions.ts`)
- [ ] Gestores treinados (5/5)
- [ ] Gestores assinaram confirmação (5/5)
- [ ] Testes de workflow passaram (`test-workflow`)
- [ ] Relatório final gerado
- [ ] **GO/NO-GO DECISION: GO** ✅

---

## 📅 Timeline

| Dia | Atividade | Duração |
|-----|-----------|---------|
| **Monday** | Setup + Schema | 30 min |
| **Tuesday** | Carregar dados | 5 min (+ deploy) |
| **Wednesday** | Gerar predictions | 5 min (+ deploy) |
| **Thursday** | Treinar gestores | 4 horas (5 × 1h) |
| **Friday** | Validação + Go/No-Go | 2 horas |

**Total Week 1: ~12 horas (5 dias)**

---

## 🎯 Próxima Fase

**Week 2-3: Soft Launch (Observation Only)**

Após conclusão de Week 1:
1. Manter stack rodando
2. Gerar previsões diárias
3. Gestores observam (não tomam decisões)
4. Monitorar false positives
5. Coletar métricas

---

## 📞 Suporte

Se alguma coisa der errado:

1. **Verifique os logs:**
   ```bash
   docker compose logs --tail=100 postgres
   docker compose logs --tail=100 core-api
   ```

2. **Consulte a documentação:**
   - `WEEK-1-EXECUTION.md` — Detalhes dia a dia
   - `PHASE-4.3-STATUS.md` — Status completo
   - `INFRASTRUCTURE-SETUP.md` — Troubleshooting
   - `PILOT-VALIDATION-PLAN.md` — Estratégia 6 semanas

3. **Resetar ambiente (se necessário):**
   ```bash
   docker compose down -v  # Remove containers e volumes
   docker compose up -d    # Reiniciar do zero
   ./scripts/infrastructure.sh pilot-setup
   ./scripts/infrastructure.sh pilot-load-data
   ```

---

## 🚀 Ready to Go!

```bash
cd buildly-premium
./scripts/week1-execute.sh
```

Aproveite! 🎉

