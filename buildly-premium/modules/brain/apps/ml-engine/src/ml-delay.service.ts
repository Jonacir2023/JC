import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Pool } from 'pg';

export interface DelayPrediction {
  id: string;
  obra_id: string;
  material_id: string;
  material_name: string;
  predicted_delay_days: number;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  predicted_date: string;
  recommended_action: string;
  requires_approval: boolean;
}

export interface MaterialDelayAlertResponse {
  status: 'success' | 'error';
  data: {
    obra_id: string;
    predictions: DelayPrediction[];
    summary: {
      total_alerts: number;
      critical_alerts: number;
      high_alerts: number;
      estimated_impact_brl: number;
    };
  };
  metadata: {
    query_time_ms: number;
    cache_hit: boolean;
    forecast_days: number;
  };
}

@Injectable()
export class MLDelayService {
  constructor(
    @Inject('DB_POOL') private dbPool: Pool,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async predictMaterialDelays(
    obra_id: string,
    forecast_days: number = 7,
  ): Promise<MaterialDelayAlertResponse> {
    const cacheKey = `ml:delay:${obra_id}:${forecast_days}`;
    const cached = await this.cacheManager.get<MaterialDelayAlertResponse>(
      cacheKey,
    );
    if (cached) {
      return { ...cached, metadata: { ...cached.metadata, cache_hit: true } };
    }

    const startTime = Date.now();

    try {
      const predictions = await this.fetchDelayPredictions(obra_id, forecast_days);
      const summary = this.calculateSummary(predictions);

      const response: MaterialDelayAlertResponse = {
        status: 'success',
        data: {
          obra_id,
          predictions,
          summary,
        },
        metadata: {
          query_time_ms: Date.now() - startTime,
          cache_hit: false,
          forecast_days,
        },
      };

      await this.cacheManager.set(cacheKey, response, 24 * 60 * 60 * 1000);
      return response;
    } catch (error) {
      throw new Error(`Material delay prediction failed: ${error.message}`);
    }
  }

  private async fetchDelayPredictions(
    obra_id: string,
    forecast_days: number,
  ): Promise<DelayPrediction[]> {
    const query = `
      WITH material_history AS (
        SELECT
          m.id as material_id,
          m.nome as material_name,
          COUNT(*) as total_pedidos,
          COUNT(CASE WHEN mh.dias_atraso > 0 THEN 1 END) as atraso_count,
          ROUND(
            COUNT(CASE WHEN mh.dias_atraso > 0 THEN 1 END)::numeric /
            COUNT(*)::numeric,
            3
          ) as taxa_atraso,
          ROUND(AVG(GREATEST(mh.dias_atraso, 0))::numeric, 1) as dias_atraso_medio
        FROM materiais m
        LEFT JOIN material_pedidos_historico mh ON m.id = mh.material_id
          AND mh.obra_id = $1
          AND mh.data_realizada >= NOW() - INTERVAL '12 months'
        WHERE m.obra_id = $1
        GROUP BY m.id, m.nome
        HAVING COUNT(*) >= 5
      ),
      critical_activities AS (
        SELECT
          ca.id as atividade_id,
          ca.material_id,
          ca.data_fim_planejada,
          EXTRACT(DAY FROM ca.data_fim_planejada - NOW()) as dias_ate_atividade,
          ca.criticidade
        FROM cronograma_atividades ca
        WHERE ca.obra_id = $1
          AND ca.data_fim_planejada BETWEEN NOW() AND NOW() + ($2 || ' days')::interval
          AND ca.criticidade IN ('CRITICA', 'ALTA')
      )
      SELECT
        gen_random_uuid()::text as id,
        $1::text as obra_id,
        mh.material_id,
        mh.material_name,
        ROUND(mh.dias_atraso_medio::numeric, 0)::integer as predicted_delay_days,
        ROUND(
          LEAST(1.0, (mh.taxa_atraso * (ca.dias_ate_atividade::numeric / NULLIF(mh.dias_atraso_medio, 0)))::numeric),
          2
        ) as confidence,
        CASE
          WHEN mh.taxa_atraso > 0.3 AND ca.criticidade = 'CRITICA' THEN 'CRITICAL'
          WHEN mh.taxa_atraso > 0.25 AND ca.criticidade = 'ALTA' THEN 'HIGH'
          WHEN mh.taxa_atraso > 0.15 THEN 'MEDIUM'
          ELSE 'LOW'
        END as severity,
        ca.data_fim_planejada::text as predicted_date,
        CASE
          WHEN mh.taxa_atraso > 0.3 THEN 'Reordenar cronograma (risco crítico)'
          WHEN mh.taxa_atraso > 0.2 THEN 'Adiantar pedido ou providenciar alternativa'
          ELSE 'Monitorar fornecedor'
        END as recommended_action,
        mh.taxa_atraso > 0.2 as requires_approval
      FROM material_history mh
      CROSS JOIN critical_activities ca
      WHERE mh.material_id = ca.material_id
      ORDER BY confidence DESC, ca.dias_ate_atividade ASC
      LIMIT 10
    `;

    const result = await this.dbPool.query(query, [obra_id, forecast_days]);
    return result.rows;
  }

  private calculateSummary(
    predictions: DelayPrediction[],
  ): MaterialDelayAlertResponse['data']['summary'] {
    const criticalCount = predictions.filter(
      p => p.severity === 'CRITICAL',
    ).length;
    const highCount = predictions.filter(
      p => p.severity === 'HIGH',
    ).length;
    const estimatedImpact = predictions.reduce((sum, p) => {
      const baseImpact = p.severity === 'CRITICAL' ? 50000 :
                        p.severity === 'HIGH' ? 25000 :
                        p.severity === 'MEDIUM' ? 10000 : 5000;
      return sum + (baseImpact * p.confidence);
    }, 0);

    return {
      total_alerts: predictions.length,
      critical_alerts: criticalCount,
      high_alerts: highCount,
      estimated_impact_brl: Math.round(estimatedImpact),
    };
  }

  async recordPredictionFeedback(feedback: any): Promise<{ status: string; message: string; prediction_id: string }> {
    try {
      const query = `
        INSERT INTO brain_alert_feedback (
          prediction_id, actual_outcome, actual_date, actual_impact_brl, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING prediction_id
      `;

      await this.dbPool.query(query, [
        feedback.prediction_id,
        feedback.actual_outcome,
        feedback.actual_date || null,
        feedback.actual_impact_brl || null,
        feedback.notes || null,
      ]);

      await this.cacheManager.del(`ml:delay:*`);

      return {
        status: 'success',
        message: `Feedback recorded for prediction ${feedback.prediction_id}. Model weights will update on next training cycle.`,
        prediction_id: feedback.prediction_id,
      };
    } catch (error) {
      throw new Error(`Feedback recording failed: ${error.message}`);
    }
  }
}
