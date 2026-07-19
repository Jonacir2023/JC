/**
 * 📊 DEMO: BMI Calculator — Buildly Maturity Index
 *
 * Executar: npx ts-node bmi-demo.ts
 *
 * Este arquivo demonstra o BMI Calculator em ação:
 * Calcula score de maturidade da obra após o evento de atraso de material
 */

import { BMICalculatorService } from './src/bmi-engine/bmi-calculator.service';

async function main() {
  console.log('\n');
  console.log('📊 BUILDLY PREMIUM — BMI CALCULATOR PHASE 2');
  console.log('='.repeat(70));
  console.log('\n');

  const calculator = new BMICalculatorService();

  // ========== CENÁRIO: Atraso de Cimento ==========
  console.log('📍 CENÁRIO: Atraso de Cimento — Impacto no BMI');
  console.log('');
  console.log('Situação:');
  console.log('  - Cimento chegou 15 dias atrasado');
  console.log('  - Decisão: Reordenar atividades');
  console.log('  - Resultado: +7 dias de atraso acumulado (vs. +15 se esperasse)');
  console.log('  - Economia: R$ 20k (vs. R$ 150k de parada)');
  console.log('  - Feedback Score da decisão: +0.95 (excelente)');
  console.log('\n');

  // ========== INPUTS DO BMI ==========
  const bmi_input = {
    obra_id: 'obr_suzano_2026',
    eventos_totais: 5, // Material delay + outros
    eventos_mitigados: 4, // Evento do material foi mitigado
    objetivos_totais: 8, // Bloco A, Bloco B, etc
    objetivos_concluidos: 2, // Alguns objetivos concluídos
    objetivos_atrasados: 1, // Bloco A atrasou 7 dias
    decisoes_totais: 3, // Esperar, Importar, Reordenar
    decisoes_feedback_positivo: 2, // Reordenar +0.95, outra +0.78
    custo_orcado: 500000,
    custo_realizado: 480000, // Economizou 20k até agora
    conformidade_processos: 92, // Documentação completa
    incidentes_seguranca: 0, // Zero acidentes
    materiais_sustentaveis_percentual: 35, // 35% dos materiais são eco-friendly
    atraso_cronograma_dias: 7, // Acumulado: 7 dias
  };

  console.log('📋 INPUTS DO BMI:');
  console.log(`   Eventos: ${bmi_input.eventos_totais} (${bmi_input.eventos_mitigados} mitigados)`);
  console.log(
    `   Objetivos: ${bmi_input.objetivos_totais} (${bmi_input.objetivos_concluidos} concluídos, ${bmi_input.objetivos_atrasados} atrasados)`
  );
  console.log(
    `   Decisões: ${bmi_input.decisoes_totais} (${bmi_input.decisoes_feedback_positivo} com feedback positivo)`
  );
  console.log(`   Custo: R$ ${bmi_input.custo_realizado} de ${bmi_input.custo_orcado}`);
  console.log(`   Conformidade: ${bmi_input.conformidade_processos}%`);
  console.log(`   Segurança: ${bmi_input.incidentes_seguranca} incidentes`);
  console.log(`   Sustentabilidade: ${bmi_input.materiais_sustentaveis_percentual}% eco-friendly`);
  console.log(`   Atraso: ${bmi_input.atraso_cronograma_dias} dias`);
  console.log('\n');

  // ========== CALCULAR BMI ==========
  const bmi_score = await calculator.calcularBMI(bmi_input);

  // ========== ANÁLISE PROFUNDA ==========
  console.log('\n');
  console.log('='.repeat(70));
  console.log('🔍 ANÁLISE PROFUNDA DO BMI');
  console.log('='.repeat(70));

  console.log(`
📊 BREAKDOWN DE DIMENSÕES:

1️⃣  EXECUÇÃO (Peso: 0.35)
    Score: ${bmi_score.dimensoes.execucao?.score_atual.toFixed(1)}/100
    Contribuição: ${bmi_score.dimensoes.execucao?.contribuicao_ao_bmi.toFixed(2)}
    Insight: Taxa de conclusão 25%, no prazo 87%, atraso 7 dias
    Status: ${bmi_score.dimensoes.execucao?.score_atual! >= 60 ? '🟢 OK' : '🔴 ATENÇÃO'}

2️⃣  FINANCEIRO (Peso: 0.25)
    Score: ${bmi_score.dimensoes.financeiro?.score_atual.toFixed(1)}/100
    Contribuição: ${bmi_score.dimensoes.financeiro?.contribuicao_ao_bmi.toFixed(2)}
    Insight: Custo 96% do orçado (economizou 4%)
    Status: ${bmi_score.dimensoes.financeiro?.score_atual! >= 60 ? '🟢 OK' : '🔴 ATENÇÃO'}

3️⃣  RISCO (Peso: 0.15)
    Score: ${bmi_score.dimensoes.risco?.score_atual.toFixed(1)}/100
    Contribuição: ${bmi_score.dimensoes.risco?.contribuicao_ao_bmi.toFixed(2)}
    Insight: 80% de eventos mitigados, 67% de decisões com feedback positivo
    Status: ${bmi_score.dimensoes.risco?.score_atual! >= 60 ? '🟢 OK' : '🔴 ATENÇÃO'}

4️⃣  GOVERNANÇA (Peso: 0.10)
    Score: ${bmi_score.dimensoes.governanca?.score_atual.toFixed(1)}/100
    Contribuição: ${bmi_score.dimensoes.governanca?.contribuicao_ao_bmi.toFixed(2)}
    Insight: 92% conformidade com processos (documentação completa)
    Status: 🟢 EXCELENTE

5️⃣  PLANEJAMENTO (Peso: 0.10)
    Score: ${bmi_score.dimensoes.planejamento?.score_atual.toFixed(1)}/100
    Contribuição: ${bmi_score.dimensoes.planejamento?.contribuicao_ao_bmi.toFixed(2)}
    Insight: Atraso de 7 dias (penalidade de 10.5 pontos)
    Status: ${bmi_score.dimensoes.planejamento?.score_atual! >= 60 ? '🟢 OK' : '🔴 ATENÇÃO'}

6️⃣  RECURSOS (Peso: 0.03)
    Score: ${bmi_score.dimensoes.recursos?.score_atual.toFixed(1)}/100
    Contribuição: ${bmi_score.dimensoes.recursos?.contribuicao_ao_bmi.toFixed(2)}
    Insight: Equipe mobilizada normalmente (sem dados de produtividade)
    Status: 🟢 OK

7️⃣  SUSTENTABILIDADE (Peso: 0.02)
    Score: ${bmi_score.dimensoes.sustentabilidade?.score_atual.toFixed(1)}/100
    Contribuição: ${bmi_score.dimensoes.sustentabilidade?.contribuicao_ao_bmi.toFixed(2)}
    Insight: 35% de materiais eco-friendly (oportunidade: aumentar)
    Status: 🟡 BAIXO

8️⃣  SEGURANÇA (Peso: 0.0)
    Score: ${bmi_score.dimensoes.seguranca?.score_atual.toFixed(1)}/100
    Contribuição: ${bmi_score.dimensoes.seguranca?.contribuicao_ao_bmi.toFixed(2)}
    Insight: Zero incidentes de segurança (excelente)
    Status: 🟢 PERFEITO
  `);

  // ========== CONTEXTO GERAL ==========
  console.log(`
📌 CONTEXTO GERAL:
   Total de eventos: ${bmi_score.totalEventos}
   Total de objetivos: ${bmi_score.totalObjetivos}
   Objetivos ameaçados: ${bmi_score.totalObjetivosAmeacados}
   Total de decisões: ${bmi_score.totalDecisoes}
   Decisões com feedback positivo: ${bmi_score.decisoes_com_feedback_positivo}
  `);

  // ========== INSIGHTS ==========
  if (bmi_score.aspectos_criticos && bmi_score.aspectos_criticos.length > 0) {
    console.log(`
⚠️  ASPECTOS CRÍTICOS:
   ${bmi_score.aspectos_criticos.map((a) => `• ${a}`).join('\n   ')}
    `);
  }

  if (bmi_score.oportunidades_melhoria && bmi_score.oportunidades_melhoria.length > 0) {
    console.log(`
💡 OPORTUNIDADES DE MELHORIA:
   ${bmi_score.oportunidades_melhoria.map((o) => `• ${o}`).join('\n   ')}
    `);
  }

  // ========== RESULTADO FINAL ==========
  console.log('\n');
  console.log('='.repeat(70));
  console.log('✅ RESULTADO FINAL DO BMI');
  console.log('='.repeat(70));
  console.log(`
🎯 BMI SCORE: ${bmi_score.bmi_total.toFixed(1)}/100
   Classificação: ${bmi_score.classificacao}

📈 INTERPRETAÇÃO:
   • Score 77.5 significa a obra está em "BOM" status
   • Dimensões fortes: Governança (95), Segurança (100), Risco (80)
   • Dimensões fracas: Sustentabilidade (52), Planejamento (74)
   • Recomendação: Aumentar buffers no cronograma, expandir materiais eco-friendly

🔄 PRÓXIMAS AÇÕES:
   1. Monitorar Planejamento (atraso de 7 dias ainda é gerenciável)
   2. Implementar mais materiais sustentáveis (oportunidade: +30 pontos potencial)
   3. Continuar com excelente Governança e Segurança
   4. Próximo ciclo BMI: 2026-07-26 (previsão: 80/100 se mantiver ritmo)

🧠 INTEGRAÇÃO COM DECISION STORE:
   • Decisão "Reordenar" teve feedback +0.95
   • Impacto no BMI: +3 pontos em Risco
   • ML aprende: Próximas crises similares → recomendar reordenação
   • Histórico: 3 decisões com feedback positivo → confiança aumentando
  `);

  console.log('='.repeat(70));
  console.log('🎓 LIÇÃO APRENDIDA:');
  console.log('='.repeat(70));
  console.log(`
O BMI consolidou o impacto da decisão de reordenação:

Phase 1 (IEvent → IObjective → IDecision):
  → Evento (atraso) → Objetivo (ameaçado) → Decisão (reordenar)

Phase 2A (Neo4j Sync):
  → Evento sincronizado para grafo
  → Relacionamentos estabelecidos
  → Cascata detectada via pathfinding

Phase 2B (Digital Twin):
  → REAL: 25% progresso, +7 dias atraso
  → PLANEJADO: 20% progresso, +15 dias atraso
  → FORECAST: 60% progresso projetado em 30 dias

Phase 2C (BMI):
  → Score 77.5/100 (BOM)
  → 8 dimensões de maturidade calculadas
  → Oportunidades de melhoria identificadas
  → Histórico criado para próximos ciclos

Phase 3 (ML Training — Próximo):
  → Decision Store aprenderá com feedback +0.95
  → Recomendação automática melhorará
  → Próximas crises terão recomendações mais acuradas
  `);
}

main().catch(console.error);
