---
name: structural-analysis
description: Análise estrutural avançada, cálculo de deslocamentos, frequências naturais e análise dinâmica. Use quando o usuário solicitar análise de vigas contínuas, pórticos, estruturas hiperestáticas ou análise modal.
---

# Structural Analysis

Skill especializado em análise estrutural numérica, incluindo método dos elementos finitos e análise dinâmica.

## Funcionalidades

### Análise Estática
- Método dos elementos finitos (FEM)
- Cálculo de deslocamentos
- Reações de apoio
- Diagramas de esforços (M, V, N)
- Análise de estruturas hiperestáticas
- Vigas contínuas
- Pórticos planos e espaciais

### Análise Dinâmica
- Frequências naturais
- Modos de vibração
- Análise modal
- Amortecimento
- Resposta a excitações

### Análise Avançada
- Análise não-linear
- Análise de segunda ordem (efeitos P-Delta)
- Flambagem (análise de estabilidade)
- Fenômenos de ressonância
- Integração temporal (Newmark, Runge-Kutta)

### Cargas e Combinações
- Cargas estáticas e dinâmicas
- Cargas sísmicas
- Combinações de carregamento
- Envoltórias de esforços

### Propriedades dos Materiais
- Aço (múltiplas classes)
- Concreto (armado e protendido)
- Madeira
- Compósitos

## Como Usar

**Trigger automático:**
- Usuário pede "analisar estrutura", "calcular deslocamento", "frequência natural"
- Solicita "análise de pórtico" ou "viga contínua"
- Quer "modo de vibração" ou "análise sísmica"

**Comando direto:**
```
/structural-analysis <problema>
```

## Exemplo de Uso

```
/structural-analysis analisar pórtico plano com:
- 3 pilares (h=4m, 25x50cm concreto)
- 2 vigas (L=6m, 20x60cm concreto)
- Carga distribuída 20 kN/m na viga superior
- Mostrar diagramas, deslocamentos e frequências naturais
```

Retorna:
- Matriz de rigidez
- Deslocamentos nodais
- Reações de apoio
- Diagramas de M, V, N
- Primeiros modos de vibração
- Frequências naturais
- Gráficos em 3D

## Capacidades

- ✅ Análise FEM 2D/3D
- ✅ Múltiplos tipos de elementos (barra, viga, placa, sólido)
- ✅ Análise modal automática
- ✅ Visualização 3D deformada
- ✅ Animação de modos de vibração
- ✅ Verificação de segurança
- ✅ Exportação de resultados
- ✅ Compatibilidade com normas técnicas

## Integração

Usa bibliotecas:
- `numpy/scipy` - Álgebra linear e solução de sistemas
- `matplotlib/mayavi` - Visualização 2D/3D
- `pandas` - Tabulação de resultados
- `sympy` - Análise simbólica

## Metodologia

Implementa:
- ✅ Método de Rigidez Direto
- ✅ Superposição de Efeitos
- ✅ Transformação de Coordenadas
- ✅ Assemblagem de Matriz Global
- ✅ Condições de Contorno

## Aplicações

- Análise de edifícios
- Estruturas metálicas
- Estruturas de concreto
- Obras de arte especiais
- Análise sísmica
- Avaliação de segurança estrutural
