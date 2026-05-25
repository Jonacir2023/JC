---
name: structural-analysis
description: Analisar estruturas e calcular deslocamentos
---

# Structural Analysis

Execute análise estrutural avançada com FEM.

## Uso

Descreva a estrutura:
- Geometria e dimensões
- Materiais e propriedades
- Condições de contorno (apoios)
- Carregamentos aplicados

## Exemplos

**Análise de Pórtico:**
```
Pórtico plano 3x2 (3 pilares, 2 andares)
Pilares: 25x50cm, concreto C25
Vigas: 20x60cm, concreto C25
Carga: 20 kN/m em cada viga
Análise: deslocamentos, reações, frequências
```

**Análise Modal:**
```
Estrutura de 5 andares
Encontre os 5 primeiros modos de vibração
Calcule frequências naturais
Anime os modos de vibração
```

**Análise Dinâmica:**
```
Estrutura submetida a carregamento sísmico
Escala de Richter 6.5
Análise espectral e resposta estrutural
```

O skill retorna:
- Deslocamentos nodais
- Tensões em elementos
- Reações de apoio
- Frequências naturais
- Modos de vibração
- Visualização 3D deformada
- Verificação de segurança
- Recomendações de reforço
