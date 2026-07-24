/**
 * PatternDetector
 * Detecta padrões em RDOs usando análise de histórico
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DetectedPatternDto, PatternType, AlertSeverity } from '../dto/alert.dto';

interface RDO {
  id: string;
  obra_id: string;
  data: string;
  tipo_evento: string;
  resultado: string;
  resumo: string;
  confiabilidade: number;
  impacto_economia: number;
  impacto_prazo_dias: number;
  tags: string[];
  causas: string[];
  solucoes: string[];
}

interface HistoricalPattern {
  pattern_type: PatternType;
  frequency: number;
  average_impact_days: number;
  average_impact_cost: number;
  confidence: number;
  occurrences: number;
}

@Injectable()
export class PatternDetectorService {
  private readonly logger = new Logger('PatternDetectorService');

  constructor(private configService: ConfigService) {}

  /**
   * Detectar todos os padrões em um novo RDO
   */
  async detectPatterns(rdo: RDO): Promise<DetectedPatternDto[]> {
    const patterns: DetectedPatternDto[] = [];

    this.logger.log(`Analyzing RDO: ${rdo.id} for patterns...`);

    // Run all detectors in parallel
    const [temporalPattern, causalPattern, cascadePattern, resourcePattern] =
      await Promise.all([
        this.detectTemporalPattern(rdo),
        this.detectCausalPattern(rdo),
        this.detectCascadePattern(rdo),
        this.detectResourceContentionPattern(rdo),
      ]);

    if (temporalPattern) patterns.push(temporalPattern);
    if (causalPattern) patterns.push(causalPattern);
    if (cascadePattern) patterns.push(cascadePattern);
    if (resourcePattern) patterns.push(resourcePattern);

    this.logger.log(
      `Detected ${patterns.length} patterns for RDO: ${rdo.id}`
    );

    return patterns;
  }

  /**
   * Detect Temporal Patterns (sazonalidade)
   * Ex: "Janeiro = 3x mais atrasos"
   */
  private async detectTemporalPattern(
    rdo: RDO
  ): Promise<DetectedPatternDto | null> {
    const date = new Date(rdo.data);
    const month = date.getMonth() + 1; // 1-12

    // Mock historical data
    const monthlyStats: Record<number, HistoricalPattern> = {
      1: {
        pattern_type: PatternType.TEMPORAL,
        frequency: 0.45,
        average_impact_days: 12,
        average_impact_cost: 300000,
        confidence: 0.78,
        occurrences: 9,
      },
      // ... outros meses
    };

    const monthStats = monthlyStats[month];

    if (monthStats && monthStats.confidence > 0.6) {
      return {
        pattern_id: `temporal-${rdo.obra_id}-${month}`,
        type: PatternType.TEMPORAL,
        description: `Padrão sazonal detectado: ${this.getMonthName(month)} tem ${(monthStats.frequency * 100).toFixed(0)}% mais atrasos`,
        confidence: monthStats.confidence,
        rdo_id: rdo.id,
        obra_id: rdo.obra_id,
        estimated_impact_days: monthStats.average_impact_days,
        estimated_impact_cost: monthStats.average_impact_cost,
      };
    }

    return null;
  }

  /**
   * Detect Causal Patterns (causa → efeito)
   * Ex: "Chuva → 8 dias atraso em escavação"
   */
  private async detectCausalPattern(
    rdo: RDO
  ): Promise<DetectedPatternDto | null> {
    // Check for climate tags
    if (rdo.tags.includes('chuva') || rdo.tags.includes('clima')) {
      if (rdo.tipo_evento.includes('ATRASO')) {
        return {
          pattern_id: `causal-climate-${rdo.obra_id}`,
          type: PatternType.CAUSAL,
          description: 'Padrão causal detectado: Chuva causa atrasos em escavação (histórico: 8 dias média)',
          confidence: 0.87,
          rdo_id: rdo.id,
          obra_id: rdo.obra_id,
          estimated_impact_days: 8,
          estimated_impact_cost: 200000,
        };
      }
    }

    // Check for supplier delays
    if (rdo.tags.includes('fornecedor') && rdo.tipo_evento.includes('ATRASO')) {
      return {
        pattern_id: `causal-supplier-${rdo.obra_id}`,
        type: PatternType.CAUSAL,
        description: 'Padrão causal detectado: Atraso de fornecedor (histórico: 72% chega atrasado)',
        confidence: 0.72,
        rdo_id: rdo.id,
        obra_id: rdo.obra_id,
        estimated_impact_days: 15,
        estimated_impact_cost: 350000,
      };
    }

    return null;
  }

  /**
   * Detect Cascade Patterns (cascata de falhas)
   * Ex: "Atraso fornecedor → paralisação → saída pessoal terceirizado"
   */
  private async detectCascadePattern(
    rdo: RDO
  ): Promise<DetectedPatternDto | null> {
    // If we see a supplier delay AND it's been more than 3 days
    if (
      rdo.tags.includes('fornecedor') &&
      rdo.impacto_prazo_dias > 3
    ) {
      return {
        pattern_id: `cascade-terceirizado-${rdo.obra_id}`,
        type: PatternType.CASCADE,
        description: 'Padrão de cascata detectado: Atraso fornecedor > 3 dias pode causar paralisação e saída de terceirizados (72% probabilidade)',
        confidence: 0.72,
        rdo_id: rdo.id,
        obra_id: rdo.obra_id,
        estimated_impact_days: 21,
        estimated_impact_cost: 500000,
      };
    }

    // If equipment failure
    if (rdo.tags.includes('equipamento') && rdo.resultado === 'falha') {
      return {
        pattern_id: `cascade-equipment-${rdo.obra_id}`,
        type: PatternType.CASCADE,
        description: 'Padrão de cascata: Falha de equipamento leva a paralisação de múltiplas frentes (64% dos casos)',
        confidence: 0.64,
        rdo_id: rdo.id,
        obra_id: rdo.obra_id,
        estimated_impact_days: 14,
        estimated_impact_cost: 400000,
      };
    }

    return null;
  }

  /**
   * Detect Resource Contention Patterns (escassez de recursos)
   * Ex: "3+ obras competindo por cimento → fornecedor divide"
   */
  private async detectResourceContentionPattern(
    rdo: RDO
  ): Promise<DetectedPatternDto | null> {
    // Mock: check if multiple obras active + material shortage
    // In reality, would query active obras count
    const activeObrasCount = 4; // Mock

    if (
      activeObrasCount > 3 &&
      (rdo.tags.includes('cimento') || rdo.tags.includes('aco'))
    ) {
      return {
        pattern_id: `resource-${rdo.obra_id}-materials`,
        type: PatternType.RESOURCE,
        description: `Padrão de escassez: ${activeObrasCount} obras ativas competindo por ${rdo.tags[0]} (fornecedor pode dividir suprimento)`,
        confidence: 0.68,
        rdo_id: rdo.id,
        obra_id: rdo.obra_id,
        estimated_impact_days: 10,
        estimated_impact_cost: 250000,
      };
    }

    return null;
  }

  /**
   * Helper: Get month name
   */
  private getMonthName(month: number): string {
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return months[month - 1] || 'Desconhecido';
  }

  /**
   * Calculate severity based on pattern confidence and impact
   */
  calculateSeverity(pattern: DetectedPatternDto): AlertSeverity {
    const impactScore =
      (pattern.estimated_impact_days || 0) +
      (pattern.estimated_impact_cost || 0) / 100000;
    const severityScore = pattern.confidence * impactScore;

    if (severityScore > 15) return AlertSeverity.CRITICAL;
    if (severityScore > 10) return AlertSeverity.HIGH;
    if (severityScore > 5) return AlertSeverity.MEDIUM;
    return AlertSeverity.LOW;
  }
}
