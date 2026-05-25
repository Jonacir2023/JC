---
name: symbolic-math
description: Cálculo simbólico, resolução de equações, derivadas, integrais e álgebra linear. Use quando o usuário solicitar cálculos matemáticos avançados, resolver sistemas de equações ou trabalhar com expressões algébricas.
---

# Symbolic Mathematics

Skill de cálculo simbólico para matemática avançada, usando SymPy e bibliotecas científicas.

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

## Integração

Usa bibliotecas:
- `sympy` - Cálculo simbólico
- `numpy/scipy` - Cálculos numéricos
- `matplotlib` - Gráficos
- `pandas` - Análise de dados

## Casos de Uso

- Engenharia: análise de sistemas dinâmicos
- Física: equações de movimento, ondas
- Matemática pura: prova de teoremas
- Otimização: cálculo de derivadas para otimização
- Modelagem: equações diferenciais
