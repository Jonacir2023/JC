/**
 * AlertGenerator
 * Gera alertas e recomendações baseado em padrões detectados
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DetectedPatternDto,
  AlertDto,
  RecommendationDto,
  PatternType,
  AlertSeverity,
} from '../dto/alert.dto';
import { v4 as uuid } from 'uuid';

interface Recommendation {
  id: string;
  action_title: string;
  action_description: string;
  historical_effectiveness: number;
  estimated_savings?: number;
  responsible_team?: string;
}

@Injectable()
export class AlertGeneratorService {
  private readonly logger = new Logger('AlertGeneratorService');

  constructor(private configService: ConfigService) {}

  /**
   * Gerar alerta de um padrão detectado
   */
  generateAlert(pattern: DetectedPatternDto, severity: AlertSeverity): AlertDto {
    const alert: AlertDto = {
      id: `alert-${uuid()}`,
      rdo_id: pattern.rdo_id,
      obra_id: pattern.obra_id,
      pattern_type: pattern.type,
      severity,
      description: pattern.description,
      confidence: pattern.confidence,
      recommended_action: this.getRecommendedAction(pattern),
      detected_at: new Date().toISOString(),
      expires_at: this.calculateExpirationTime(severity),
    };

    this.logger.log(
      `Alert generated: ${alert.id} (severity: ${alert.severity})`
    );

    return alert;
  }

  /**
   * Gerar recomendações para um alerta
   */
  async generateRecommendations(
    alert: AlertDto,
    pattern: DetectedPatternDto
  ): Promise<RecommendationDto[]> {
    const recommendations: RecommendationDto[] = [];

    switch (pattern.type) {
      case PatternType.TEMPORAL:
        recommendations.push(
          ...this.generateTemporalRecommendations(alert, pattern)
        );
        break;

      case PatternType.CAUSAL:
        recommendations.push(
          ...this.generateCausalRecommendations(alert, pattern)
        );
        break;

      case PatternType.CASCADE:
        recommendations.push(
          ...this.generateCascadeRecommendations(alert, pattern)
        );
        break;

      case PatternType.RESOURCE:
        recommendations.push(
          ...this.generateResourceRecommendations(alert, pattern)
        );
        break;
    }

    this.logger.log(
      `Generated ${recommendations.length} recommendations for alert: ${alert.id}`
    );

    return recommendations;
  }

  /**
   * Recomendações para padrões temporais
   */
  private generateTemporalRecommendations(
    alert: AlertDto,
    pattern: DetectedPatternDto
  ): RecommendationDto[] {
    return [
      {
        id: `rec-${uuid()}`,
        alert_id: alert.id,
        action_title: 'Aumentar alocação de recursos',
        action_description:
          'Pre-contratar 30% extra de mão de obra para este mês, baseado em padrão histórico',
        historical_effectiveness: 0.85,
        estimated_savings: 150000,
        responsible_team: 'Recursos Humanos',
      },
      {
        id: `rec-${uuid()}`,
        alert_id: alert.id,
        action_title: 'Negociar prazos de fornecimento',
        action_description:
          'Antecipar pedidos de materiais críticos 2 semanas antes (sazonalidade conhecida)',
        historical_effectiveness: 0.78,
        estimated_savings: 200000,
        responsible_team: 'Suprimentos',
      },
    ];
  }

  /**
   * Recomendações para padrões causais
   */
  private generateCausalRecommendations(
    alert: AlertDto,
    pattern: DetectedPatternDto
  ): RecommendationDto[] {
    // Check if it's climate-related
    if (pattern.description.includes('Chuva')) {
      return [
        {
          id: `rec-${uuid()}`,
          alert_id: alert.id,
          action_title: 'Reordenar atividades',
          action_description:
            'Movimentar escavação para galpão/coberto quando chover. Histórico: reduz atraso de 8 dias para 2 dias (75% eficaz)',
          historical_effectiveness: 0.75,
          estimated_savings: 200000,
          responsible_team: 'Engenharia de Obra',
        },
        {
          id: `rec-${uuid()}`,
          alert_id: alert.id,
          action_title: 'Pré-posicionar equipamento',
          action_description:
            'Colocar lona/equipamento de drenagem antes da chuva prevista',
          historical_effectiveness: 0.62,
          estimated_savings: 100000,
          responsible_team: 'Operações',
        },
      ];
    }

    // Supplier delay
    if (pattern.description.includes('fornecedor')) {
      return [
        {
          id: `rec-${uuid()}`,
          alert_id: alert.id,
          action_title: 'Ativar fornecedor secundário',
          action_description:
            'Contactar fornecedor backup (10% mais caro, mas 98% on-time)',
          historical_effectiveness: 0.98,
          estimated_savings: 150000,
          responsible_team: 'Suprimentos',
        },
        {
          id: `rec-${uuid()}`,
          alert_id: alert.id,
          action_title: 'Negociar penalidade contratual',
          action_description:
            'Executar cláusula de multa por atraso no contrato. Histórico: 60% chegam no prazo após primeira multa',
          historical_effectiveness: 0.6,
          estimated_savings: 200000,
          responsible_team: 'Legal',
        },
      ];
    }

    return [];
  }

  /**
   * Recomendações para padrões de cascata
   */
  private generateCascadeRecommendations(
    alert: AlertDto,
    pattern: DetectedPatternDto
  ): RecommendationDto[] {
    return [
      {
        id: `rec-${uuid()}`,
        alert_id: alert.id,
        action_title: 'Ativar retorno ao mercado',
        action_description:
          'Executar cláusula de retorno ao mercado com terceirizados se obra para > 3 dias (histórico: evita 80% das saídas)',
        historical_effectiveness: 0.8,
        estimated_savings: 500000,
        responsible_team: 'RH + Legal',
      },
      {
        id: `rec-${uuid()}`,
        alert_id: alert.id,
        action_title: 'Comunicação proativa',
        action_description:
          'Avisar terceirizados imediatamente e oferecer bonus se completarem a fase',
        historical_effectiveness: 0.72,
        estimated_savings: 300000,
        responsible_team: 'RH',
      },
      {
        id: `rec-${uuid()}`,
        alert_id: alert.id,
        action_title: 'Alocação de trabalho alternativo',
        action_description:
          'Identificar obra próxima que pode receber pessoal terceirizado (manter engajamento)',
        historical_effectiveness: 0.65,
        estimated_savings: 200000,
        responsible_team: 'Planejamento',
      },
    ];
  }

  /**
   * Recomendações para padrões de escassez
   */
  private generateResourceRecommendations(
    alert: AlertDto,
    pattern: DetectedPatternDto
  ): RecommendationDto[] {
    return [
      {
        id: `rec-${uuid()}`,
        alert_id: alert.id,
        action_title: 'Negociar contrato priorizado',
        action_description:
          'Oferecer volume premium ou prazo maior para garantir prioridade com fornecedor',
        historical_effectiveness: 0.89,
        estimated_savings: 250000,
        responsible_team: 'Suprimentos',
      },
      {
        id: `rec-${uuid()}`,
        alert_id: alert.id,
        action_title: 'Diversificar fornecedores',
        action_description:
          'Contratar 2º fornecedor para 30% do volume (reduz dependência de um único fornecedor)',
        historical_effectiveness: 0.76,
        estimated_savings: 300000,
        responsible_team: 'Suprimentos',
      },
    ];
  }

  /**
   * Retornar ação recomendada baseado no padrão
   */
  private getRecommendedAction(pattern: DetectedPatternDto): string {
    switch (pattern.type) {
      case PatternType.TEMPORAL:
        return 'Pre-contratar recursos para sazonalidade conhecida';
      case PatternType.CAUSAL:
        return 'Implementar mitigação de causa raiz';
      case PatternType.CASCADE:
        return 'Ativar protocolos de paralisação';
      case PatternType.RESOURCE:
        return 'Negociar contrato priorizado com fornecedor';
      default:
        return 'Revisar alerta e tomar ação apropriada';
    }
  }

  /**
   * Calcular tempo de expiração do alerta
   */
  private calculateExpirationTime(severity: AlertSeverity): string {
    const now = new Date();
    let hoursToAdd = 24; // Default

    switch (severity) {
      case AlertSeverity.CRITICAL:
        hoursToAdd = 1; // Critical expires in 1 hour
        break;
      case AlertSeverity.HIGH:
        hoursToAdd = 6;
        break;
      case AlertSeverity.MEDIUM:
        hoursToAdd = 12;
        break;
      case AlertSeverity.LOW:
        hoursToAdd = 48;
        break;
    }

    const expirationTime = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
    return expirationTime.toISOString();
  }
}
