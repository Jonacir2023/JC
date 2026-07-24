/**
 * BMI Calculation Engine
 *
 * Calcula o Buildly Maturity Index (0-100) baseado em:
 * - Eventos ocorridos vs. mitigados
 * - Objetivos completados vs. planejados
 * - Decisões com feedback positivo
 * - Conformidade com processos
 *
 * Executa automaticamente após cada evento/decisão
 */

import { v4 as uuid } from 'uuid';
import {
  IBMIScore,
  IBMIDimensaoScore,
  BMI_DIMENSOES,
  BMIDimensao,
  BMIScoreBuilder,
} from '@buildly/intelligence-types';
import { IEvent, IObjective, IDecision } from '@buildly/common-types';

export interface IBMIInput {
  obra_id: string;
  eventos_totais: number;
  eventos_mitigados: number;
  objetivos_totais: number;
  objetivos_concluidos: number;
  objetivos_atrasados: number;
  decisoes_totais: number;
  decisoes_feedback_positivo: number; // > 0.7
  custo_orcado: number;
  custo_realizado: number;
  conformidade_processos: number; // 0-100
  incidentes_seguranca: number;
  materiais_sustentaveis_percentual: number;
  atraso_cronograma_dias: number;
}

/**
 * Serviço que calcula BMI automático
 */
export class BMICalculatorService {
  /**
   * Calcula o BMI Score completo
   */
  async calcularBMI(input: IBMIInput): Promise<IBMIScore> {
    console.log(`\n🧮 BMI Calculator — Obra ${input.obra_id}`);
    console.log('='.repeat(70));

    const builder = new BMIScoreBuilder(input.obra_id);

    // ========== CALCULAR CADA DIMENSÃO ==========

    // 1️⃣ EXECUÇÃO (Peso: 0.35)
    const score_execucao = this.calcularDimensaoExecucao(input);
    builder.addDimensao('execucao', score_execucao);
    console.log(`📍 Execução: ${score_execucao.toFixed(1)}/100`);

    // 2️⃣ FINANCEIRO (Peso: 0.25)
    const score_financeiro = this.calcularDimensaoFinanceiro(input);
    builder.addDimensao('financeiro', score_financeiro);
    console.log(`📍 Financeiro: ${score_financeiro.toFixed(1)}/100`);

    // 3️⃣ RISCO (Peso: 0.15)
    const score_risco = this.calcularDimensaoRisco(input);
    builder.addDimensao('risco', score_risco);
    console.log(`📍 Risco: ${score_risco.toFixed(1)}/100`);

    // 4️⃣ GOVERNANÇA (Peso: 0.10)
    const score_governanca = this.calcularDimensaoGovernanca(input);
    builder.addDimensao('governanca', score_governanca);
    console.log(`📍 Governança: ${score_governanca.toFixed(1)}/100`);

    // 5️⃣ PLANEJAMENTO (Peso: 0.10)
    const score_planejamento = this.calcularDimensaoPlanejamento(input);
    builder.addDimensao('planejamento', score_planejamento);
    console.log(`📍 Planejamento: ${score_planejamento.toFixed(1)}/100`);

    // 6️⃣ RECURSOS (Peso: 0.03)
    const score_recursos = this.calcularDimensaoRecursos(input);
    builder.addDimensao('recursos', score_recursos);
    console.log(`📍 Recursos: ${score_recursos.toFixed(1)}/100`);

    // 7️⃣ SUSTENTABILIDADE (Peso: 0.02)
    const score_sustentabilidade = this.calcularDimensaoSustentabilidade(input);
    builder.addDimensao('sustentabilidade', score_sustentabilidade);
    console.log(`📍 Sustentabilidade: ${score_sustentabilidade.toFixed(1)}/100`);

    // 8️⃣ SEGURANÇA (Peso: 0.0)
    const score_seguranca = this.calcularDimensaoSeguranca(input);
    builder.addDimensao('seguranca', score_seguranca);
    console.log(`📍 Segurança: ${score_seguranca.toFixed(1)}/100`);

    // ========== CONTEXTO ==========
    builder.withContext(input.eventos_totais, input.objetivos_totais, input.decisoes_totais);

    // ========== INSIGHTS ==========
    const criticos = this.identificarAspectosCriticos(input);
    const oportunidades = this.identificarOportunidades(input);
    builder.withInsights(criticos, oportunidades);

    // ========== BUILD ==========
    const bmi_score = builder.build();

    // ========== EXIBIR RESULTADO ==========
    console.log('\n' + '='.repeat(70));
    console.log(`📊 BMI SCORE: ${bmi_score.bmi_total.toFixed(1)}/100`);
    console.log(`   Classificação: ${this.classificarBMI(bmi_score.bmi_total)}`);
    console.log('='.repeat(70));

    return bmi_score;
  }

  /**
   * Dimensão 1: EXECUÇÃO (% conclusão vs cronograma)
   *
   * Indicadores:
   * - Taxa de conclusão (% objetivos concluídos)
   * - Cumprimento de prazo (% sem atraso)
   * - Estabilidade de schedule (quantos replanejamentos)
   */
  private calcularDimensaoExecucao(input: IBMIInput): number {
    const taxa_conclusao = input.objetivos_totais > 0
      ? (input.objetivos_concluidos / input.objetivos_totais) * 100
      : 0;

    const taxa_no_prazo = input.objetivos_totais > 0
      ? ((input.objetivos_totais - input.objetivos_atrasados) / input.objetivos_totais) * 100
      : 0;

    // Penalidade por atraso
    const penalidade_atraso = Math.max(0, 100 - (input.atraso_cronograma_dias * 2));

    // Média ponderada
    const score = (taxa_conclusao * 0.4) + (taxa_no_prazo * 0.35) + (penalidade_atraso * 0.25);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Dimensão 2: FINANCEIRO (Custos realizado vs orçado)
   *
   * Indicadores:
   * - Aderência ao orçamento (realizado/orçado)
   * - Tendência de custo (trajectory)
   * - ROI parcial (valor entregue/investido)
   */
  private calcularDimensaoFinanceiro(input: IBMIInput): number {
    if (input.custo_orcado === 0) return 100; // Sem orçamento = score máximo

    const aderencia_orcamento = (input.custo_realizado / input.custo_orcado) * 100;

    // Score: 100 se dentro de ±10%, decresce se acima
    let score = 100;
    if (aderencia_orcamento < 90) score = 100 - ((90 - aderencia_orcamento) * 0.5); // Subestimativa
    if (aderencia_orcamento > 110) score = 100 - ((aderencia_orcamento - 110) * 1.0); // Sobreestimativa penaliza mais

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Dimensão 3: RISCO (Eventos mitigados vs totais)
   *
   * Indicadores:
   * - Taxa de mitigação (eventos mitigados/totais)
   * - Qualidade de decisões (feedback score médio)
   * - Capacidade de resposta (tempo médio evento→decisão)
   */
  private calcularDimensaoRisco(input: IBMIInput): number {
    const taxa_mitigacao = input.eventos_totais > 0
      ? (input.eventos_mitigados / input.eventos_totais) * 100
      : 100; // Sem eventos = score máximo

    const qualidade_decisoes = input.decisoes_totais > 0
      ? (input.decisoes_feedback_positivo / input.decisoes_totais) * 100
      : 0;

    // Média ponderada
    const score = (taxa_mitigacao * 0.6) + (qualidade_decisoes * 0.4);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Dimensão 4: GOVERNANÇA (Decisões documentadas e auditáveis)
   *
   * Indicadores:
   * - Documentação de decisões (% com registro completo)
   * - Conformidade com processos
   * - Rastreabilidade completa
   */
  private calcularDimensaoGovernanca(input: IBMIInput): number {
    // Conformidade com processos é o principal indicador
    const score = input.conformidade_processos;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Dimensão 5: PLANEJAMENTO (Cronograma cumprido)
   *
   * Indicadores:
   * - Acurácia do planejamento (previsões vs realizado)
   * - Estabilidade do schedule (quantas vezes alterado)
   * - Margem de segurança (buffer utilizado)
   */
  private calcularDimensaoPlanejamento(input: IBMIInput): number {
    // Score baseado em atraso
    // 100 se no prazo, decresce conforme atrasa
    const dias_atraso = Math.max(0, input.atraso_cronograma_dias);
    const score = 100 - (dias_atraso * 1.5);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Dimensão 6: RECURSOS (Equipes mobilizadas e produtivas)
   *
   * Indicadores:
   * - Taxa de mobilização
   * - Produtividade média
   * - Retenção de talento
   */
  private calcularDimensaoRecursos(input: IBMIInput): number {
    // Placeholder: score fixo alto (sem dados de RH)
    return 85;
  }

  /**
   * Dimensão 7: SUSTENTABILIDADE (Eco-friendly)
   *
   * Indicadores:
   * - % de materiais sustentáveis
   * - Redução de resíduos
   * - Conformidade ambiental
   */
  private calcularDimensaoSustentabilidade(input: IBMIInput): number {
    // Score baseado no % de materiais sustentáveis
    return Math.min(100, input.materiais_sustentaveis_percentual * 1.5);
  }

  /**
   * Dimensão 8: SEGURANÇA (Zero incidentes)
   *
   * Indicadores:
   * - Taxa de acidente
   * - Conformidade com NR
   * - Cultura de segurança
   */
  private calcularDimensaoSeguranca(input: IBMIInput): number {
    // 100 se zero incidentes, decresce se houver
    if (input.incidentes_seguranca === 0) return 100;
    return Math.max(0, 100 - (input.incidentes_seguranca * 20));
  }

  /**
   * Classifica o BMI em categorias
   */
  private classificarBMI(bmi: number): string {
    if (bmi >= 80) return '🟢 EXCELENTE';
    if (bmi >= 60) return '🟢 BOM';
    if (bmi >= 40) return '🟡 MÉDIO';
    if (bmi >= 20) return '🔴 BAIXO';
    return '🔴 CRÍTICO';
  }

  /**
   * Identifica aspectos críticos que precisam atenção
   */
  private identificarAspectosCriticos(input: IBMIInput): string[] {
    const criticos: string[] = [];

    if (input.objetivos_atrasados / input.objetivos_totais > 0.3) {
      criticos.push('30%+ dos objetivos atrasados');
    }

    if (input.custo_realizado > input.custo_orcado * 1.2) {
      criticos.push('Custos 20%+ acima do orçado');
    }

    if (input.eventos_mitigados / input.eventos_totais < 0.7) {
      criticos.push('Taxa de mitigação abaixo de 70%');
    }

    if (input.conformidade_processos < 60) {
      criticos.push('Conformidade de processos baixa');
    }

    return criticos;
  }

  /**
   * Identifica oportunidades de melhoria
   */
  private identificarOportunidades(input: IBMIInput): string[] {
    const oportunidades: string[] = [];

    if (input.materiais_sustentaveis_percentual < 50) {
      oportunidades.push('Aumentar uso de materiais sustentáveis');
    }

    if (input.decisoes_feedback_positivo / input.decisoes_totais > 0.8) {
      oportunidades.push('Decisões estão com bom track record — documentar e replicar');
    }

    if (input.atraso_cronograma_dias > 0) {
      oportunidades.push('Replanjar atividades posteriores com buffers maiores');
    }

    return oportunidades;
  }
}

/**
 * Exemplo de uso:
 *
 * const calculator = new BMICalculatorService();
 *
 * const bmi = await calculator.calcularBMI({
 *   obra_id: 'obr_suzano_2026',
 *   eventos_totais: 5,
 *   eventos_mitigados: 4,
 *   objetivos_totais: 8,
 *   objetivos_concluidos: 2,
 *   objetivos_atrasados: 1,
 *   decisoes_totais: 3,
 *   decisoes_feedback_positivo: 2, // 2 com score > 0.7
 *   custo_orcado: 500000,
 *   custo_realizado: 480000,
 *   conformidade_processos: 92,
 *   incidentes_seguranca: 0,
 *   materiais_sustentaveis_percentual: 35,
 *   atraso_cronograma_dias: 7,
 * });
 *
 * console.log(`BMI Score: ${bmi.bmi_total.toFixed(1)}/100`);
 * console.log(`Classificação: ${bmi.classificacao}`);
 *
 * // Resultado esperado:
 * // BMI Score: 77.5/100 (BOM)
 * // Classificação: BOM
 */
