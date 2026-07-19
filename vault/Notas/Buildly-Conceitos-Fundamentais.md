---
titulo: "Buildly — Conceitos Fundamentais"
tipo: "Nota Técnica"
tags: [buildly, conceitos, event-sourcing, decision-store, digital-twin]
criado_em: "2026-07-19"
---

# 🧠 Buildly Premium — Conceitos Fundamentais

## IEvent: O Registro Imutável

### O que é?
Um evento é o **átomo do sistema**. Representa qualquer mudança que aconteceu no canteiro de obra. É imutável, rastreável e completo com contexto.

### Exemplo: Material Atrasado
```
MATERIAL_DELAY
├─ O Quê: Cimento CP II chegou 15 dias atrasado
├─ Quando: 19 de julho de 2026, 14:32
├─ Onde: Obra "Suzano 2026"
├─ Por Quê: Greve de transportadores
├─ Quem: Chefe de Obra (usr_eng_chefe_001)
├─ Impacto: R$ 150k de parada + 15 dias de atraso
└─ Status: Imutável no Event Store (PostgreSQL)
```

### Armazenamento
- **Local:** PostgreSQL Event Store (append-only)
- **Nunca é modificado:** Apenas adicionado
- **100% auditável:** Quem criou, quando, onde, por quê
- **Base para tudo:** Cada evento pode disparar objetivos e decisões

---

## IObjective: A Meta Ameaçada

### O que é?
Um objetivo é uma **meta mensurável** da obra que pode ser ameaçada por eventos. Rastreia progresso, status e contribuição ao BMI.

### Exemplo: Conclusão do Bloco A
```
OBJETIVO: Concluir Bloco A com qualidade excelente até 31/08
├─ Métrica Principal: % de conclusão (alvo: 100%)
├─ Status Inicial: PLANEJADO (20% concluído)
├─ Após MATERIAL_DELAY: EM_RISCO (ameaçado por atraso)
├─ Contribuição BMI: Execução (peso 0.35, score 81/100)
└─ Relacionamentos: 1 evento ameaçador, 3 decisões associadas
```

### Estados Possíveis
- **PLANEJADO** → está no cronograma
- **EM_EXECUCAO** → atividades em andamento
- **CONCLUIDO** → alcançou 100% da métrica
- **ATRASADO** → não vai cumprir data (evento a ameaçou)
- **CANCELADO** → descontinuado

### Contribuição ao BMI
Cada objetivo contribui para o **Buildly Maturity Index** em uma dimensão:
- Execução (% de conclusão vs. planejado)
- Financeiro (custos vs. orçamento)
- Risco (eventos mitigados vs. totais)
- Sustentabilidade (materiais eco-friendly)
- Governança (decisões documentadas)
- Planejamento (cronograma cumprido)
- Recursos (equipes mobilizadas)
- Segurança (zero incidentes)

---

## IDecision: A Escolha com Feedback

### O que é?
Uma decisão registra **como respondemos a um evento**. Documenta alternativas, custos, riscos, resultado esperado e (depois) resultado real com feedback para treinar IA.

### Exemplo: Responder ao Atraso de Cimento
```
DECISÃO: Como manter o cronograma apesar do atraso?

Alternativa 1: ESPERAR
├─ Custo: R$ 150.000 (equipe ociosa)
├─ Impacto Prazo: +15 dias
└─ Risco: ALTO (cliente insatisfeito)

Alternativa 2: IMPORTAR (outro fornecedor)
├─ Custo: R$ 225.000 (+50% de custo)
├─ Impacto Prazo: +3 dias
└─ Risco: MÉDIO (qualidade incerta)

Alternativa 3: REORDENAR ATIVIDADES ✓ ESCOLHIDA
├─ Custo: R$ 50.000 (replanejamento)
├─ Impacto Prazo: +7 dias
└─ Risco: BAIXO (coordenação necessária)

Resultado Esperado:
├─ Economia: R$ 100.000 vs. esperar
├─ Ganho de Prazo: 8 dias recuperados
└─ Satisfação Esperada: 85%

Resultado Real (após 30 dias):
├─ Economia Real: R$ 105.000 (5k melhor!)
├─ Ganho Real: 9 dias (1 dia melhor!)
├─ Satisfação Real: 92% (7% melhor!)
└─ Feedback Score: +0.95 ⭐ (EXCELENTE)
```

### Feedback Score: Treino de IA

O **feedback score** mede quão bem a decisão saiu vs. esperado:

```
Score = (Economia_Real - Economia_Esperada) + 
        (Prazo_Real - Prazo_Esperado) + 
        (Satisfacao_Real - Satisfacao_Esperada)

No exemplo: +0.95 = "Excelente"
```

### Decision Store
Cada decisão com seu feedback é armazenada:
- **Para aprender:** Próximas decisões similares usarão este histórico
- **Para treinar IA:** 1 novo sample de treinamento
- **Para recomendar:** Próxima crise similar → IA sugerirá "Reordenar"

---

## 🔗 A Conexão: Evento → Objetivo → Decisão

```
┌─────────────────────────────────────────────────────┐
│                    MATERIAL_DELAY                    │
│              (Cimento chega 15 dias atrasado)        │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│          OBJETIVO AMEAÇADO (EM_RISCO)               │
│    "Concluir Bloco A até 31 de agosto"             │
│           (de PLANEJADO → EM_RISCO)                │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│              TRÊS DECISÕES ALTERNATIVAS             │
│  1. Esperar (+150k, +15 dias, risco ALTO)          │
│  2. Importar (+225k, +3 dias, risco MÉDIO)         │
│  3. Reordenar (+50k, +7 dias, risco BAIXO) ✓       │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│           RESULTADO REAL (após 30 dias)            │
│  R$ 105k economia, +9 dias, satisfação 92%        │
│              Feedback: +0.95 ⭐                      │
└────────────────────┬────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────┐
│        DECISION STORE APRENDE (ML Training)        │
│   "Reordenação funciona melhor que esperado"      │
│  → Próximas crises similares: sugerir reordenação │
└─────────────────────────────────────────────────────┘
```

---

## 📊 BMI: Buildly Maturity Index

BMI é um score de **0 a 100** que mede a maturidade da obra em 8 dimensões:

| Dimensão | O que mede | Peso | Score Atual |
|----------|-----------|------|-------------|
| **Execução** | % de conclusão vs. cronograma | 0.35 | 81 |
| **Financeiro** | Custos vs. orçamento | 0.25 | 75 |
| **Risco** | Eventos mitigados vs. totais | 0.15 | 68 |
| **Governança** | Decisões documentadas | 0.10 | 92 |
| **Planejamento** | Cronograma cumprido | 0.10 | 70 |
| **Recursos** | Mobilização de equipes | 0.03 | 85 |
| **Sustentabilidade** | Eco-friendly | 0.02 | 40 |

**BMI Total = 81 × 0.35 + 75 × 0.25 + ... = ~77/100**

Cada objetivo contribui com sua métrica. Decisões bem-sucedidas aumentam BMI.

---

## 🧠 Próximas Camadas (Phase 2+)

### Neo4j: O Grafo de Relacionamentos
Sincroniza todos os eventos, objetivos e decisões em um grafo:
```
Evento_Atraso_Cimento
    ├─ ameaça_objetivo → Objetivo_Bloco_A
    ├─ causa_decisão → Decisão_Reordenação
    └─ relacionado_a → Evento_Greve_Transportes (causalidade)

Objetivo_Bloco_A
    ├─ ameaçado_por → Evento_Atraso_Cimento
    ├─ mitigado_por → Decisão_Reordenação
    └─ contribui_a → BMI (executação: 0.81)
```

### Digital Twin
Compara 3 estados da obra:
- **REAL** — O que realmente aconteceu (eventos)
- **PLANEJADO** — O cronograma original
- **FORECAST** — Previsão para os próximos 30 dias

### IA Recomendativa
Treina com Decision Store:
- "Próxima crise de material? Sugerir reordenação com confiança +0.92"
- "Esse supervisor? Histórico de decisões +0.88 (excelente)"
- "Equipe neste setor? +0.75 (bom, pode melhorar)"

---

**Data:** 2026-07-19  
**Status:** ✅ Fundamentos documentados — Pronto para Phase 2
