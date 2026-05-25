---
name: symbolic-math
description: Cálculo simbólico exato, resolução de equações, derivadas, integrais e álgebra linear para matemática avançada.
---

# 📐 Symbolic Mathematics

Skill especializado em cálculo simbólico e matemática avançada com SymPy.

## ✅ DO Use When:

- Resolver equações (lineares, não-lineares, diferenciais)
- Calcular derivadas e integrais (simbólicas)
- Simplificar expressões algébricas
- Análise de sistemas lineares
- Séries de Taylor e análise assintótica
- Verificar soluções matematicamente

## ❌ DO NOT Use When:

- Cálculos numéricos puros → use `/symbolic-math` com numérico ou Python
- Engenharia aplicada → use `/engineering-calc`
- Análise estrutural → use `/structural-analysis`
- Programação ou código → use `/code-review`
- Visualização complexa → use `/web-artifacts-builder`

## 🎯 Trigger Automático

Skill ativa quando usuário menciona:
- "resolver equação", "encontrar solução"
- "derivada", "integral", "diferencial"
- "simplificar expressão", "expand", "factor"
- "sistema de equações", "álgebra linear"
- "série de Taylor", "série de Fourier"

## ⚠️ Anti-Trigger

NÃO ativa quando:
- Precisa de aproximação numérica apenas
- É aplicação engineering específica
- Precisa implementação de código
- Análise visual/gráfica complexa

## Funcionalidades

### Álgebra Simbólica
- Simplificação de expressões
- Expansão e fatoração
- Resolução de equações (lineares e não-lineares)
- Sistemas de equações

### Cálculo Diferencial
- Derivadas parciais e totais
- Gradiente, divergência, rotacional
- Séries de Taylor
- Análise de extremos

### Cálculo Integral
- Integrais indefinidas
- Integrais definidas
- Integração numérica
- Equações diferenciais

### Álgebra Linear
- Operações com matrizes
- Autovalores e autovetores
- Decomposição QR, SVD
- Sistemas lineares

### Funções Especiais
- Funções trigonométricas
- Funções hiperbólicas
- Funções especiais (Bessel, Legendre)
- Transformadas (Fourier, Laplace)

## Como Usar

**Trigger automático:**
- Usuário pede "resolver equação", "simplificar expressão"
- Solicita derivada ou integral
- Quer resolver sistema linear

**Comando direto:**
```
/symbolic-math <operação>
```

## Exemplo de Uso

```
/symbolic-math resolver a equação 3x² + 5x - 2 = 0
```

Retorna:
- Soluções exatas
- Forma simplificada
- Análise de raízes
- Gráfico da função

## Capacidades

- ✅ Cálculo exato (não numérico)
- ✅ Expressões simbólicas complexas
- ✅ Resolução em forma fechada
- ✅ Visualização de funções
- ✅ Documentação LaTeX
- ✅ Verificação de soluções

## 🤖 System Prompt Otimizado

```
Take your time. Para cada problema matemático:
1. Break down the problem into steps
2. Show symbolic solution first
3. Verify result by substitution
4. Provide exact form (not decimal)
5. Link to LaTeX notation when needed
6. Suggest related problems/extensions
```

## 🔗 Skill Stacking

### ✅ Stack Com:

| Skill | Resultado | Uso |
|-------|-----------|-----|
| **engineering-calc** | Resolver equações estruturais | Cargas críticas, flambagem |
| **structural-analysis** | Equações de movimento | Análise modal, dinâmica |
| **project-management** | Modelagem de riscos | Distribuições de probabilidade |
| **xlsx** | Documentar derivações | Planilhas matemáticas |
| **docx** | Relatórios matemáticos | Teses, papers |

### 🚫 NÃO Stack Com:
- `code-review` - contextos diferentes
- `web-artifacts-builder` - sem relação
- `canvas-design` - visual, não simbólico

## 🌍 Compatibilidade

| Plataforma | Suporte | Notas |
|-----------|---------|-------|
| Claude Opus 4.7 | ✅ Full | Análise simbólica complexa |
| Claude Sonnet 4.6 | ✅ Full | Equilibrium velocidade |
| Claude Haiku 4.5 | ⚠️ Partial | Equações simples |
| ChatGPT | ⚠️ Partial | Adaptar SymPy syntax |
| Gemini | ⚠️ Partial | Testar com exemplos |

## Integração

Usa bibliotecas:
- `sympy` - Cálculo simbólico exato
- `numpy/scipy` - Complemento numérico
- `matplotlib` - Visualização
- `pandas` - Dados simbólicos

## Casos de Uso

- Engenharia: análise de sistemas dinâmicos
- Física: equações de movimento, ondas
- Matemática pura: prova de teoremas
- Otimização: cálculo de derivadas
- Modelagem: equações diferenciais
