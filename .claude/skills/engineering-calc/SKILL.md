---
name: engineering-calc
description: Cálculos avançados de engenharia civil, resistência de materiais e dimensionamento estrutural com verificação de segurança.
---

# 🏗️ Engineering Calculations

Skill especializado em cálculos de engenharia civil, resistência de materiais e análise estrutural.

## ✅ DO Use When:

- Calcular tensões em vigas, colunas ou placas
- Dimensionar estruturas (aço, concreto, madeira)
- Analisar cargas e carregamentos
- Verificar segurança estrutural
- Calcular fundações e capacidade de suporte
- Análise de deformações e deslocamentos
- Cálculos com normas técnicas (NBR, EUROCODE, ACI)
- Resolver problemas de resistência de materiais

## ❌ DO NOT Use When:

- Cálculos gerais de física ou matemática → use `/symbolic-math`
- Análise estrutural com elementos finitos → use `/structural-analysis`
- Engenharia de software ou programação
- Cálculos não-estruturais (ex: circuitos elétricos)
- Análise sísmica avançada → use `/structural-analysis`
- Projeto arquitetônico ou estético
- Cálculos econômicos ou financeiros

## 🎯 Trigger Automático

Skill ativa quando usuário menciona:
- "calcular viga", "tensão", "momento fletor"
- "dimensionar coluna", "flambagem"
- "fundação", "capacidade portante"
- "resistência de materiais"
- "verificação de segurança estrutural"
- "carregamento", "carga distribuída"

## ⚠️ Anti-Trigger

NÃO ativa quando:
- É cálculo puramente matemático
- É análise dinâmica ou modal
- Precisa de visualização 3D complexa
- É projeto gráfico ou arquitetônico

## Funcionalidades

### Resistência de Materiais
- Cálculo de tensões (normal, cisalhante)
- Deformações e deslocamentos
- Análise de seções transversais
- Momento de inércia e momento estático

### Dimensionamento Estrutural
- Dimensionamento de vigas (aço e concreto)
- Dimensionamento de colunas (flambagem)
- Verificação de segurança estrutural
- Capacidade portante

### Análise de Cargas
- Cálculo de cargas permanentes
- Cargas acidentais e dinâmicas
- Combinações de carregamento
- Distribuição de esforços

### Fundações
- Cálculo de capacidade de suporte
- Dimensionamento de sapatas
- Análise de grupos de estacas
- Recalques

## Como Usar

**Trigger automático:**
- Usuário menciona "calcular viga", "dimensionar coluna", "tensão em aço"
- Solicita análise de cargas ou carregamento estrutural
- Pede verificação de segurança

**Comando direto:**
```
/engineering-calc <problema>
```

## Exemplo de Uso

```
/engineering-calc calcular tensão em uma viga biapoiada com 6m de vão, 
carga distribuída de 10 kN/m, seção retangular 20x40cm
```

Retorna:
- Reações de apoio
- Diagrama de momentos
- Diagrama de esforço cortante
- Tensões máximas
- Verificação de segurança

## Capacidades

- ✅ Cálculos com Python/NumPy/SymPy
- ✅ Gera gráficos de diagramas
- ✅ Normas técnicas (NBR, EUROCODE, ACI)
- ✅ Materiais: aço, concreto, madeira
- ✅ Verifica segurança estrutural
- ✅ Exporta cálculos em PDF

## 🤖 System Prompt Otimizado

```
Take your time. Para cada problema de engenharia:
1. Break down o problema em componentes
2. Show step-by-step calculations
3. Draw ASCII diagrams when helpful
4. Verify results and check safety factors
5. Provide design recommendations
6. Link to relevant standards (NBR/EUROCODE)
```

## 🔗 Skill Stacking

### ✅ Stack Com:

| Skill | Resultado | Uso |
|-------|-----------|-----|
| **symbolic-math** | Resolver equações estruturais | Determinar cargas críticas |
| **structural-analysis** | Análise FEM completa | Validar cálculos manuais |
| **project-management** | Gestão com cálculos | Cronograma incluindo análises |
| **xlsx** | Documentar resultados | Planilhas automáticas de cálculo |
| **docx** | Gerar relatórios | Pareceres técnicos automatizados |
| **pdf** | Exportar cálculos | Memórias de cálculo em PDF |

### 🚫 NÃO Stack Com:

- `web-artifacts-builder` - contextos diferentes
- `slack-gif-creator` - sem relação
- `internal-comms` - pode usar docx em vez disso

## 🌍 Compatibilidade

| Plataforma | Suporte | Notas |
|-----------|---------|-------|
| Claude Opus 4.7 | ✅ Full | Análise complexa otimizada |
| Claude Sonnet 4.6 | ✅ Full | Balance velocidade/qualidade |
| Claude Haiku 4.5 | ⚠️ Partial | Cálculos simples apenas |
| ChatGPT | ⚠️ Partial | Adaptar nomenclatura |
| Gemini | ⚠️ Partial | Testar com exemplos simples |

## Integração

Usa bibliotecas:
- `numpy` - Cálculos numéricos
- `matplotlib` - Gráficos e diagramas
- `sympy` - Cálculo simbólico
- `pandas` - Tabulação de resultados
- `scipy` - Equações diferenciais
