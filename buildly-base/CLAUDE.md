# 🛠️ Guia de Desenvolvimento Buildly Premium

**Para:** Claude Code  
**Versão:** 1.0.0  
**Última Atualização:** 2026-07-26

---

## 📋 Padrões de Código

### TypeScript

#### Interfaces e Types
```typescript
// ✅ BOM: Explícito e bem-nomeado
interface IMaterialDelay {
  material_id: string;
  delay_days: number;
  confidence_score: number;
  predicted_cost_impact_brl: number;
}

// ❌ RUIM: Genérico
interface Delay {
  id: string;
  days: number;
  score: number;
  cost: number;
}
```

#### Builders para Objetos Complexos
```typescript
// ✅ BOM: Usar Builder para lógica complexa
class EventBuilder {
  private event: IEvent;

  constructor(id: string, eventType: string) {
    this.event = { id, eventType, timestamp: new Date() };
  }

  withContext(context: object): EventBuilder {
    this.event.context = context;
    return this;
  }

  build(): IEvent {
    if (!this.event.context) throw new Error('Context required');
    return this.event;
  }
}

// Uso:
const evento = new EventBuilder(uuid(), 'MATERIAL_DELAY')
  .withContext({ obra_id: '123' })
  .build();
```

#### Enums para Tipos Fixos
```typescript
// ✅ BOM: Usar enums em vez de strings
enum EventType {
  MATERIAL_DELAY = 'MATERIAL_DELAY',
  COST_OVERRUN = 'COST_OVERRUN',
  SCHEDULE_DEVIATION = 'SCHEDULE_DEVIATION',
}

enum Severity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}
```

---

## 📂 Estrutura de Pastas

### `libs/` (Código Compartilhado)

```
libs/
├── common-types/
│   ├── src/
│   │   ├── event.interface.ts
│   │   ├── objective.interface.ts
│   │   ├── decision.interface.ts
│   │   └── index.ts
│   └── package.json
│
├── domain-logic/
│   ├── src/
│   │   ├── services/
│   │   │   ├── material-delay.service.ts
│   │   │   └── cost-attribution.service.ts
│   │   └── index.ts
│   └── package.json
│
└── infrastructure/
    ├── src/
    │   ├── database/
    │   ├── cache/
    │   ├── bus/
    │   └── index.ts
    └── package.json
```

### `apps/` (Aplicações)

```
apps/
├── core-api/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── use-cases/
│   │   ├── main.ts
│   │   └── app.module.ts
│   └── test/
│
└── ml-engine/
    ├── src/
    │   ├── models/
    │   ├── services/
    │   └── main.py
    └── requirements.txt
```

---

## 🔑 Nomes de Variáveis

### Domínio (Português)
```typescript
obra_id, site_id, material_categoria, atraso_dias, custo_impacto_brl
```

### Infraestrutura (Inglês)
```typescript
user_id, timestamp, version, pool_size, cache_ttl
```

### Sufixos Padrão

| Sufixo | Uso | Exemplo |
|--------|-----|---------|
| `_id` | Identificadores | `obra_id`, `user_id` |
| `_at` | Timestamps | `created_at`, `updated_at` |
| `_count` | Contadores | `prediction_count` |
| `_rate` | Percentuais | `precision_rate` |
| `_brl` | Valores em R$ | `custo_impacto_brl` |
| `_percent` | Percentuais (0-100) | `accuracy_percent` |

---

## 💾 Banco de Dados

### SQL Migrations

Localização: `supabase/migrations/`  
Nomenclatura: `V{número:03d}__{descrição}.sql`

Exemplo:
```sql
-- V013__init_approval_workflow.sql
BEGIN;

CREATE TABLE IF NOT EXISTS pilot_approval_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES pilot_sites(id),
  decision VARCHAR(20) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_decision CHECK (decision IN ('APPROVED', 'REJECTED'))
);

CREATE INDEX idx_approval_site ON pilot_approval_decisions(site_id);

COMMIT;
```

### Views com Prefixo `v_`

```sql
-- ✅ BOM
CREATE OR REPLACE VIEW v_baseline_performance AS ...

-- ❌ RUIM
CREATE OR REPLACE VIEW baseline_performance AS ...
```

---

## 🧪 Testes

### Estrutura
```
apps/core-api/
├── src/services/alert.service.ts
└── test/alert.service.spec.ts
```

### Exemplo de Teste
```typescript
describe('AlertService', () => {
  let service: AlertService;

  beforeEach(() => {
    service = new AlertService();
  });

  it('should calculate precision correctly', () => {
    const tp = 10, fp = 2;
    const precision = service.calculatePrecision(tp, fp);
    expect(precision).toBe(0.833);
  });

  it('should throw on invalid input', () => {
    expect(() => service.calculatePrecision(-1, 5)).toThrow();
  });
});
```

---

## 🔄 Git Workflow

### Branch Naming
```
main                            # Production-ready
develop                         # Integration branch
feature/{nome-curto}            # Nova feature
bugfix/{issue-number}           # Bug fix
hotfix/{issue-number}           # Production hotfix
chore/{tipo}                    # Maintenance
```

### Commit Message

```
{tipo}: {resumo curto}

{descrição detalhada se necessário}
{lista com - para mudanças importantes}

Fixes #123
Co-Authored-By: Nome <email>
```

Exemplo completo:
```
feat: implementa retreinamento nightly do modelo

- Adiciona script retrain-model-nightly.ts
- Calcula novos confidence thresholds por material
- Registra métricas em pilot_model_retraining_log
- Melhoria: +3.2% precision em categorias com feedback

Fixes #456
```

---

## 🚀 Deployment

### Ambientes

```
development  → Local (docker-compose up)
staging      → Pre-production (test antes de prod)
production   → Live (gestores + empresas reais)
```

---

## 🛡️ Security

### Variáveis Sensíveis
- NUNCA commit `.env` (use `.env.example`)
- Use GitHub Secrets para CI/CD
- Rotate tokens regularmente

### SQL Injection Prevention
```typescript
// ❌ RUIM: Concatenação
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ BOM: Parameterized
const query = 'SELECT * FROM users WHERE id = $1';
const result = await client.query(query, [userId]);
```

### API Security
- Rate limiting: 100 req/min por IP
- CORS: Whitelist domains
- Authentication: JWT + refresh tokens
- Authorization: Role-based access control (RBAC)

---

## 📊 Logging

### Níveis
```typescript
logger.debug('Iniciando geração de previsões');        // Development
logger.info('Previsões geradas: 150');                // Normal
logger.warn('Baixa confiança detectada: 0.45');       // Attention
logger.error('Falha ao conectar ao banco');           // Errors
logger.fatal('Serviço indisponível');                 // Critical
```

---

## ✅ Checklist Pre-Commit

- [ ] Código compila (`pnpm build`)
- [ ] Testes passam (`pnpm test`)
- [ ] Lint sem erros (`pnpm lint`)
- [ ] Sem console.log em produção
- [ ] Variáveis sensíveis em `.env`
- [ ] Migrations testadas
- [ ] Documentação atualizada

---

**Buildly Premium Development Guide — Keep it Simple, Keep it Clean 🧹**
