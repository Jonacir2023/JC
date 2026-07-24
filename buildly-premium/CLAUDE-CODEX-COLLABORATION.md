# 🤝 Claude × Codex Collaboration Contract

**Buildly Premium — Partnership Agreement**  
**Data:** Julho 2026  
**Status:** Active

---

## 📍 Visão Geral

Claude e Codex trabalham como **papéis complementares**, não como equipes concorrentes:

| Papel | Foco Principal |
|---|---|
| **Claude** | Arquitetura, documentação, análise de requisitos, desenho de fluxos, revisão crítica, decisões de produto |
| **Codex** | Implementação, exploração do repositório, criação de alterações, testes, correções, PRs |
| **Equipe Humana** (você) | Prioridades, acesso a dados, validação operacional, segurança, aprovação final |

---

## 🎯 Fase 1: Alinhamento (Semana 1)

### ✅ Checklist

- [ ] **Codex lê os materiais:**
  - CODEX-PARTNERSHIP-BRIEF.md
  - README.md
  - modules/brain/README.md
  - modules/brain/docs/INTEGRATION-GUIDE.md

- [ ] **Claude mapeia lacunas:**
  - O que falta entre Core e Brain?
  - Onde Brain precisa de expansão?
  - Quais são os riscos técnicos?

- [ ] **Definem piloto pequeno e mensurável:**
  - Não "Phase 3.9 inteira"
  - Algo com começo e fim claros
  - Exemplo: "Alerta de risco de atraso" (1 padrão, 1 obra de teste)

- [ ] **Escrevem definição de sucesso:**
  - Antes de qualquer código
  - Métricas claras (ex: 20% redução em late alerts)
  - Critérios de aceite explícitos

---

## 📋 Ideias de Piloto Pequeno (Escolha UM)

### Opção 1: Alerta de Risco de Atraso
**O que:** Detectar e alertar atrasos de material com 3 dias de antecedência  
**Dados:** Histórico de atrasos + cronograma da obra  
**Sucesso:** 75%+ precisão em teste piloto com 5 obras  
**Tempo:** 2-3 semanas  
**ROI:** Economia de R$ 15k-30k por atraso evitado

### Opção 2: Previsão de Consumo de Material
**O que:** Prever consumo semanal de cimento/aço/concreto  
**Dados:** Atividades planejadas + histórico de consumo  
**Sucesso:** MAPE < 15% (Mean Absolute % Error)  
**Tempo:** 2-3 semanas  
**ROI:** Reduzir desperdício 10-20%

### Opção 3: Recomendação de Replanejamento
**O que:** Sugerir mudanças no cronograma quando chuva é prevista  
**Dados:** Previsão do tempo + cronograma crítico  
**Sucesso:** Gestor aprova 80% das sugestões  
**Tempo:** 1-2 semanas  
**ROI:** Evitar 5-10 dias de atraso por obra

### Opção 4: Painel de Anomalias
**O que:** Dashboard em tempo real com desvios críticos por obra  
**Dados:** Eventos diários + metricas planejadas  
**Sucesso:** Detecta 90%+ das anomalias antes do gestor  
**Tempo:** 2 semanas  
**ROI:** Reduzir tempo de resposta de 24h para 2h

---

## 🔐 Contrato de Integração (Congelado)

Antes de qualquer código, defina formalmente:

### 1. Dados que Core Envia para Brain

```json
{
  "event": {
    "id": "uuid",
    "obra_id": "string",
    "tipo_evento": "material_delay|activity_complete|budget_change|weather",
    "data": {
      "material": "string?",
      "dias_atraso": "number?",
      "impacto_cronograma": "number?",
      "custo_estimado": "number?"
    },
    "timestamp": "ISO8601"
  }
}
```

### 2. Recomendações que Brain Retorna

```json
{
  "recommendation": {
    "id": "uuid",
    "obra_id": "string",
    "pattern_type": "delay|cost_optimization|resource_shortage",
    "urgency": "LOW|MEDIUM|HIGH|CRITICAL",
    "action_recommended": "string",
    "estimated_impact": "number (R$)",
    "confidence": "0-1",
    "requires_approval": "boolean"
  }
}
```

### 3. Autenticação & Autorização

```
- Header: X-Tenant-ID (obra_id)
- Header: Authorization: Bearer <token>
- RLS: Brain retorna dados apenas de obras que Core autorizou
```

### 4. Tratamento de Falha & Degradação

```
- Se Brain falhar: Core continua funcionando (sem recomendações)
- Retry automático: 3 tentativas com backoff exponencial
- Fallback: Se ML demora > 5s, retorna cache ou nil
- Logging: Todas as falhas registradas para análise
```

### 5. Quem Aprova Ações Recomendadas?

```
- CRITICAL: Requer aprovação de gestor (humano)
- HIGH: Notifica gestor, Codex executa se <1h sem resposta
- MEDIUM/LOW: Codex executa, gestor revisa depois
```

---

## 🚀 Fluxo de Trabalho

### Para Cada Feature/Bug

```
1. CLAUDE: Especifica arquitetura
   - Quais dados entram?
   - Quais saem?
   - Qual é a decisão crítica?
   - Quais são os riscos?
   
2. CODEX: Propõe plano de PRs
   - 3-5 pequenos PRs, não 1 gigante
   - Cada PR: 1 função, 1 teste, 1 integração
   - Critério de aceite explícito
   
3. HUMANO: Aprova plano
   - Confirma prioridades
   - Valida com dados reais
   - Aprova riscos
   
4. CODEX: Implementa em PRs pequenas
   - 1 PR por dia máximo
   - Cada PR pronta para review
   - Testes automatizados inclusos
   
5. CLAUDE: Revisa PRs
   - Design decisions corretos?
   - Testes cobrem casos críticos?
   - Documentação clara?
   
6. HUMANO: Aprova & Integra
   - Valida com dados de teste
   - Merge para staging
   - Monitora em produção
```

---

## 📊 Exemplo: Piloto "Alerta de Atraso"

### Semana 1: Alinhamento

**Claude:**
```markdown
## Alerta de Atraso — Arquitetura Proposta

### Entrada (do Core)
- material_delivery_event { material, dias_atraso, obra_id }

### Lógica (no Brain)
- Verificar histórico: últimos 12 meses
- Calcular probabilidade de recorrência
- Checar cronograma crítico (atividades depend deste material)

### Saída (para Core)
- Recomendação { pattern_type: 'delay', urgency: 'HIGH', 
    action: 'Reordenar sequência para X,Y,Z', confidence: 0.78 }

### Riscos
- False positives se histórico é pequeno (< 5 eventos)
- Replanejamento pode afetar outros prazos

### Métricas de Sucesso
- Precisão >= 75%
- Falsos positivos < 10%
- Economia estimada >= R$ 20k em teste
```

**Codex propõe:**
```
PR 1: Adicionar endpoint /brain/predict/delay
PR 2: Implementar query de histórico (últimos 12 meses)
PR 3: Calcular probabilidade (seasonal + recorrência)
PR 4: Testes unitários (casos: sem histórico, outliers, crítico)
PR 5: Integração com Core (chamada do Core)
PR 6: Documentação (exemplos de request/response)
```

**Humano aprova:**
- ✅ Prioridade: ALTA
- ✅ Dados disponíveis? SIM (histórico de 18 meses)
- ✅ Critério de aceite claro
- ✅ Timeline: 2 semanas
- ✅ Risco aceitável

### Semana 2-3: Implementação

**Dia 1 (Codex):**
- PR 1: Endpoint esqueleto + testes stub

**Dia 2 (Codex):**
- PR 2: Query de histórico + testes de dados

**Dia 3 (Codex + Claude review):**
- PR 3: Probabilidade + fórmula validada

**Dia 4 (Codex):**
- PR 4: Testes unitários completos

**Dia 5 (Codex + Integração):**
- PR 5: Core chama Brain com sucesso

**Dia 6 (Codex + Documentação):**
- PR 6: README atualizado

**Dia 7 (Humano):**
- Testa com 5 obras reais
- Valida precisão, falsos positivos
- Aprova merge

---

## 📈 Governança de PRs Pequenas

### O que é uma boa PR?

✅ **BOM:**
```
Título: feat: add delay prediction to brain
- 200 linhas de código
- 1 função nova + 1 teste
- Pronto para merge isolado
- Descrição clara do quê/por quê
```

❌ **RUIM:**
```
Título: Implementa Phase 3.9
- 5.000 linhas de código
- 50 funções novas
- Não funciona sem as próximas PRs
- "Vou explicar no sync"
```

### Checklist de PR

- [ ] Título descritivo (50 chars max)
- [ ] Descrição: O que? Por quê? Como testar?
- [ ] Testes: 100% de cobertura da lógica nova
- [ ] Documentação: README/CLAUDE.md atualizado
- [ ] Sem conflitos com main/staging
- [ ] Pronta para merge isolada (não depende de outra PR)

---

## 🔄 Comunicação

### Daily Standup (Async, se possível)

**Format (texto em thread GitHub):**
```
Claude:
- ✅ Revisou PR de previsão
- 🔍 Identificou edge case de "sem histórico"
- ⏭️ Próximo: Revisar PR de integração

Codex:
- ✅ Implementou query de histórico
- 🔍 Teste falhou em outliers
- ⏭️ Próximo: Ajustar fórmula para outliers
```

### Weekly Sync (15 min)

**Agenda:**
1. PRs merged (o que funcionou)
2. PRs bloqueadas (por quê?)
3. Métricas do piloto (precisão, tempo)
4. Próximas prioridades

---

## 🎯 Definição de Sucesso (Piloto Atraso)

| Métrica | Target | Real | Status |
|---------|--------|------|--------|
| Precisão | >= 75% | 78% | ✅ |
| Falsos positivos | < 10% | 8% | ✅ |
| Latência P95 | < 500ms | 340ms | ✅ |
| Economia estimada | >= R$ 20k | R$ 45k | ✅ |
| Gestor aprova | 100% | 95% | ✅ |

**Se passar:** Merge para staging → Próximo piloto  
**Se falhar:** Retro, ajusta, replica

---

## 📚 Documentação Congelada

Estes arquivos definem o contrato e NÃO devem mudar sem aprovação:

```
✅ INTEGRATION-GUIDE.md (APIs, request/response)
✅ modules/brain/CLAUDE.md (arquitetura)
✅ modules/brain/docs/PHASE3.X-*.md (algoritmos)
```

Quando mudarem requisitos, atualize explicitamente com novo commit.

---

## 🚨 Escalação

**Se Claude acha que Codex está fora de rumo:**
```
@codex "Parei na PR #123. Acho que a abordagem está errada porque [motivo].
Proposta alternativa: [design alternativo]. Vamos discutir antes?"
```

**Se Codex acha que Claude está pedindo muito:**
```
"Entendi a arquitetura, mas acho que 5 PRs é otimista. 
Proposta: 8 PRs com mais pequenas, 3 semanas ao invés de 2. Concorda?"
```

**Se Humano acha que ambos estão errados:**
```
"Cancelamos piloto, mudamos prioridade para X. Nova definição de sucesso: ..."
```

---

## ✨ Princípios

1. **Transparência** — Todos sabem quem faz o quê
2. **Pequeninhas vitórias** — PRs pequenas, merges frequentes
3. **Testes primeiro** — Defeitos em testes, não em produção
4. **Falha rápida** — Piloto cai? Aprendemos em 2 dias, não 2 meses
5. **Humano no loop** — Nada crítico executa sem aprovação humana

---

## 📞 Próximos Passos

1. **Semana 1:**
   - Claude lê tudo, mapeia lacunas
   - Codex explora repo, propõe plano
   - Humano escolhe piloto

2. **Semana 2-3:**
   - Implementação em PRs pequenas
   - Reviews diários
   - Iteração rápida

3. **Semana 4:**
   - Piloto com dados reais
   - Métricas validadas
   - Decisão: merge ou retry?

---

**Claude × Codex × Humano = Buildly Sucesso 🚀**
