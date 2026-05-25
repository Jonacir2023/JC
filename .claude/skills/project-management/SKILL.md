---
name: project-management
description: Gerenciamento de projetos, planejamento PERT/CPM, cronogramas, orçamentos e análise de riscos. Use quando o usuário solicitar criar cronogramas, analisar redes de atividades, orçar projetos ou gerenciar prazos.
---

# Project Management

Skill especializado em gerenciamento de projetos, planejamento, cronogramas e orçamentação.

## Funcionalidades

### Planejamento de Projetos
- Work Breakdown Structure (WBS)
- Estrutura analítica do projeto
- Matriz de responsabilidades (RACI)
- Definição de escopo

### Cronograma (PERT/CPM)
- Cálculo do caminho crítico
- Duração esperada do projeto
- Folgas e buffers
- Análise de rede de atividades
- Gráfico de Gantt

### Orçamentação
- Estimativa de custos
- Orçamento base (baseline)
- Curva de agregação de custos
- Análise de valor agregado (EVM)
- ROI e payback

### Análise de Riscos
- Identificação de riscos
- Matriz de probabilidade/impacto
- Plano de respostas
- Monitoramento de riscos
- Indicadores de risco

### Recursos e Alocação
- Alocação de recursos
- Levantamento de necessidades
- Nivelamento de recursos
- Capacidade disponível

### Acompanhamento
- Indicadores de desempenho (KPIs)
- Relatórios de status
- Variação de prazo (SV)
- Variação de custo (CV)
- Tendências

## Como Usar

**Trigger automático:**
- Usuário pede "cronograma", "criar Gantt", "planejar projeto"
- Solicita "orçamento de projeto"
- Quer "análise de risco"

**Comando direto:**
```
/project-management <comando>
```

## Exemplo de Uso

```
/project-management criar cronograma para projeto com 5 atividades:
A (3 dias), B (5 dias, depende de A), C (4 dias, depende de A),
D (2 dias, depende de B e C), E (1 dia, depende de D)
```

Retorna:
- Caminho crítico
- Duração total do projeto
- Gráfico de Gantt
- Folgas de cada atividade
- Análise de risco de prazos

## Capacidades

- ✅ PERT/CPM automático
- ✅ Gráficos Gantt interativos
- ✅ Análise de valor agregado
- ✅ Simulação Monte Carlo para riscos
- ✅ Exportação de cronogramas
- ✅ Relatórios de desempenho
- ✅ Integração com metodologias (Agile, Waterfall)

## Integração

Usa bibliotecas:
- `networkx` - Análise de redes
- `matplotlib/plotly` - Gráficos e Gantt
- `pandas` - Dados de projeto
- `numpy` - Cálculos estatísticos

## Metodologias Suportadas

- ✅ Waterfall/Cascata
- ✅ Agile/Scrum
- ✅ Híbrido
- ✅ PMBoK
- ✅ PRINCE2
