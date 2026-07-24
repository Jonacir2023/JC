/**
 * Digital Twin Demo Service
 *
 * Demonstra como o Digital Twin funciona:
 * Compara REAL vs PLANEJADO vs FORECAST para o cenário de atraso de material
 *
 * Cenário: Mesmo do Phase 1 — Cimento atrasou 15 dias
 * Agora vemos como isso impacta nos 3 estados paralelos
 */

import { v4 as uuid } from 'uuid';
import {
  IDigitalTwinSnapshot,
  ITwinObjetivoState,
  ITwinComparacao,
  DigitalTwinBuilder,
} from '@buildly/intelligence-types';

export interface IDigitalTwinDemoOutput {
  snapshot: IDigitalTwinSnapshot;
  analise_textual: string;
}

export class DigitalTwinDemoService {
  /**
   * Gera um snapshot do Digital Twin mostrando impacto do atraso
   */
  async gerarSnapshotAtrasoMaterial(): Promise<IDigitalTwinDemoOutput> {
    console.log('\n');
    console.log('🧬 DIGITAL TWIN — DEMONSTRAÇÃO DO IMPACTO DE ATRASO');
    console.log('='.repeat(70));
    console.log('\n');

    const obra_id = 'obr_suzano_2026';
    const data_evento_atraso = '2026-07-19';
    const data_comparacao = '2026-07-19'; // Data de hoje

    // ========== OBJETIVO: Concluir Bloco A ==========
    console.log('📍 ESTADO 1: PLANEJADO (Cronograma Original)');
    console.log(
      'Objetivo: Concluir Bloco A até 31 de agosto com 100% qualidade'
    );

    const objetivo_planejado: ITwinObjetivoState = {
      objetivo_id: 'obj_bloco_a',
      obra_id,
      nome: 'Concluir Bloco A com qualidade excelente',
      dominio: 'execucao',
      progresso_percentual: 20, // No planejamento era para estar em 20%
      valor_atual_metrica: 20,
      valor_alvo_metrica: 100,
      data_inicio: '2026-07-20',
      data_alvo: '2026-08-31',
      status: 'EM_EXECUCAO',
      custo_total_estimado: 500000,
    };

    console.log(`  ✓ Progresso esperado: ${objetivo_planejado.progresso_percentual}%`);
    console.log(
      `  ✓ Cronograma: ${objetivo_planejado.data_inicio} até ${objetivo_planejado.data_alvo}`
    );
    console.log(
      `  ✓ Custo orçado: R$ ${objetivo_planejado.custo_total_estimado.toLocaleString('pt-BR')}\n`
    );

    // ========== OBJETIVO: Após decisão de Reordenação ==========
    console.log('📍 ESTADO 2: REAL (Após Decisão de Reordenação)');
    console.log(
      'Decisão: Pausar Atividade B, reordenar sequência (executada com sucesso)'
    );

    const objetivo_real: ITwinObjetivoState = {
      objetivo_id: 'obj_bloco_a',
      obra_id,
      nome: 'Concluir Bloco A com qualidade excelente',
      dominio: 'execucao',
      progresso_percentual: 25, // Progrediu mais que esperado
      valor_atual_metrica: 25,
      valor_alvo_metrica: 100,
      data_inicio: '2026-07-20',
      data_alvo: '2026-08-31',
      status: 'EM_EXECUCAO',
      custo_total_estimado: 500000,
      custo_realizado: 480000, // Economizou R$ 20k até agora
      custos_adicionais: 50000, // Mas gastou 50k com replanejamento
      eventos_afetadores: ['evt_material_delay'],
      dias_atraso: 7, // Ganhou 8 dias vs. esperar (que teria +15)
    };

    console.log(`  ✓ Progresso real: ${objetivo_real.progresso_percentual}%`);
    console.log(`  ✓ Atraso acumulado: ${objetivo_real.dias_atraso} dias`);
    console.log(
      `  ✓ Custo realizado: R$ ${objetivo_real.custo_realizado?.toLocaleString('pt-BR')}`
    );
    console.log(
      `  ✓ Custos adicionais: R$ ${objetivo_real.custos_adicionais?.toLocaleString('pt-BR')}\n`
    );

    // ========== OBJETIVO: Forecast (Previsão) ==========
    console.log('📍 ESTADO 3: FORECAST (Projeção para 30 dias)');
    console.log('Machine Learning projeta continuação com reordenação bem-sucedida');

    const objetivo_forecast: ITwinObjetivoState = {
      objetivo_id: 'obj_bloco_a',
      obra_id,
      nome: 'Concluir Bloco A com qualidade excelente',
      dominio: 'execucao',
      progresso_percentual: 60, // Pode chegar a 60% em 30 dias
      valor_atual_metrica: 60,
      valor_alvo_metrica: 100,
      data_inicio: '2026-07-20',
      data_alvo: '2026-08-31',
      status: 'EM_EXECUCAO',
      custo_total_estimado: 500000,
    };

    console.log(`  ✓ Progresso projetado: ${objetivo_forecast.progresso_percentual}%`);
    console.log(`  ✓ Data conclusão projetada: ~15 de setembro`);
    console.log(`  ✓ Risco de overrun: BAIXO (confiança: 92%)\n`);

    // ========== COMPARAÇÕES ==========
    console.log('=' .repeat(70));
    console.log('📊 COMPARAÇÕES');
    console.log('='.repeat(70));

    // Real vs Planejado
    const comparacao_real_vs_planejado: ITwinComparacao = {
      de: 'REAL',
      para: 'PLANEJADO',
      variancia_progresso: objetivo_real.progresso_percentual - objetivo_planejado.progresso_percentual, // +5%
      variancia_prazo_dias: -7, // -7 dias (adiantado!)
      variancia_custo:
        (objetivo_planejado.custo_total_estimado - (objetivo_real.custo_realizado ?? 0) + (objetivo_real.custos_adicionais ?? 0)) *
        -1, // +20k economizado
      divergencia_nivel: 'VERDE',
      confianca_forecast: 1.0,
      descricao: 'Reordenação funcionou melhor que previsto. Estamos 7 dias adiantados vs. esperar.',
    };

    console.log('\n🟢 REAL vs PLANEJADO:');
    console.log(
      `   Progresso: ${comparacao_real_vs_planejado.variancia_progresso > 0 ? '+' : ''}${comparacao_real_vs_planejado.variancia_progresso.toFixed(1)}%`
    );
    console.log(
      `   Prazo: ${comparacao_real_vs_planejado.variancia_prazo_dias > 0 ? '+' : ''}${comparacao_real_vs_planejado.variancia_prazo_dias} dias (ADIANTADO)`
    );
    console.log(
      `   Custo: R$ ${comparacao_real_vs_planejado.variancia_custo > 0 ? '+' : ''}${comparacao_real_vs_planejado.variancia_custo.toLocaleString('pt-BR')} (ECONOMIZADO)`
    );
    console.log(`   Insight: ${comparacao_real_vs_planejado.descricao}\n`);

    // Real vs Forecast
    const comparacao_real_vs_forecast: ITwinComparacao = {
      de: 'REAL',
      para: 'FORECAST',
      variancia_progresso:
        objetivo_real.progresso_percentual - objetivo_forecast.progresso_percentual,
      variancia_prazo_dias: 20, // 20 dias de espaço até o forecast
      variancia_custo: 0, // Ainda não sabemos
      divergencia_nivel: 'VERDE',
      confianca_forecast: 0.92,
      descricao:
        'Forecast indica que reordenação manterá ritmo. Se sim, Bloco A pronto em 15 de setembro.',
    };

    console.log('🟢 REAL vs FORECAST (próximos 30 dias):');
    console.log(
      `   Progresso projetado: +${comparacao_real_vs_forecast.variancia_progresso.toFixed(1)}% (35% ganhos)`
    );
    console.log(
      `   Espaço até conclusão: ${comparacao_real_vs_forecast.variancia_prazo_dias} dias`
    );
    console.log(`   Confiança do modelo: ${(comparacao_real_vs_forecast.confianca_forecast * 100).toFixed(0)}%`);
    console.log(`   Insight: ${comparacao_real_vs_forecast.descricao}\n`);

    // ========== CONSTRUIR SNAPSHOT ==========
    const builder = new DigitalTwinBuilder(obra_id);
    builder
      .withDataComparacao(data_comparacao)
      .addObjetivoReal(objetivo_real)
      .addObjetivoPlaynejado(objetivo_planejado)
      .addObjetivoForecast(objetivo_forecast)
      .withComparacao('real_vs_planejado', comparacao_real_vs_planejado)
      .withComparacao('real_vs_forecast', comparacao_real_vs_forecast)
      .withInsight(
        'risco_nao_conclusao',
        'BAIXO — Reordenação funcionando bem, ritmo sendo mantido'
      )
      .withInsight(
        'oportunidades_economia',
        'MÉDIA — Otimizar sequenciamento de atividades pode economizar 10-15k'
      );

    const snapshot = builder.build();

    // ========== RESUMO ==========
    console.log('=' .repeat(70));
    console.log('✅ ANÁLISE DO DIGITAL TWIN');
    console.log('='.repeat(70));

    const analise = `
🧠 O QUE O DIGITAL TWIN REVELOU:

1. IMPACTO DO EVENTO (Material atrasou 15 dias):
   • Se tivéssemos apenas ESPERADO: +15 dias de atraso, R$ 150k parada
   • Com REORDENAÇÃO: apenas +7 dias de atraso, R$ 20k de economia

2. COMPARAÇÃO DOS 3 ESTADOS:
   • PLANEJADO: Bloco A 20% em 19 de julho
   • REAL: Bloco A 25% em 19 de julho (+5% graças à reordenação)
   • FORECAST: Bloco A 60% projetado em 15 de agosto

3. PREVISIBILIDADE:
   • Modelo ML: 92% confiante que reordenação continuará bem
   • Risco de não conclusão até 31 de agosto: BAIXO
   • Buffer de segurança: +2 semanas (margem confortável)

4. APRENDIZADO PARA PRÓXIMOS EVENTOS:
   • Reordenação demonstrou ser +0.95 efetiva (conforme Phase 1)
   • Digital Twin confirma: +7 dias ganhos vs. pior cenário
   • Decision Store: Incrementar peso de "reordenação" para próximas crises

🎯 PRÓXIMO PASSO:
   BMI consolidará impacto nas 8 dimensões:
   → Execução: Subir (mais progresso)
   → Financeiro: Subir (economia 20k)
   → Risco: Subir (evento mitigado com sucesso)
   → Governança: Manter (decisão documentada)
    `;

    return {
      snapshot,
      analise_textual: analise,
    };
  }
}

/**
 * Exemplo de uso:
 *
 * const service = new DigitalTwinDemoService();
 * const resultado = await service.gerarSnapshotAtrasoMaterial();
 *
 * console.log("Snapshot JSON:");
 * console.log(JSON.stringify(resultado.snapshot, null, 2));
 *
 * console.log("Análise Textual:");
 * console.log(resultado.analise_textual);
 */
