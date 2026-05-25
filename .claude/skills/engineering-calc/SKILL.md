---
name: engineering-calc
description: Cálculos avançados de engenharia civil, resistência de materiais e dimensionamento estrutural. Use quando o usuário solicitar cálculos de vigas, colunas, fundações, dimensionamento de estruturas ou análise de cargas.
---

# Engineering Calculations

Skill especializado em cálculos de engenharia civil, resistência de materiais e análise estrutural.

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

## Integração

Usa bibliotecas:
- `numpy` - Cálculos numéricos
- `matplotlib` - Gráficos
- `sympy` - Cálculo simbólico
- `pandas` - Tabulação de resultados
