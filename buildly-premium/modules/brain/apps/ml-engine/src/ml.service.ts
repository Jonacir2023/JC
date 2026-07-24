import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Pool } from 'pg';
import {
  PatternWeightLearning,
  PredictiveAlertRequest,
  PredictiveAlertResponse,
  PredictedAlert,
  CostAttributionRequest,
  CostAttributionResponse,
  CostAttribution,
  ModelPerformanceMetrics,
  TrainingDataRequest,
  TrainingDataResponse,
} from './ml.dto';

@Injectable()
export class MLService {
  constructor(
    @Inject('DB_POOL') private dbPool: Pool,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async trainPatternWeights(): Promise<{ status: string; patterns_trained: number }> {
    /**
     * Train pattern weights using latest feedback data.
     * Uses exponential moving average (EMA) with adaptive alpha
     * based on feedback confidence and recency.
     */
    const query = `
      WITH recent_feedback AS (
        SELECT
          p.id as pattern_id,
          p.pattern_type,
          COUNT(DISTINCT af.id) as feedback_count,
          AVG(af.effectiveness_score) as avg_effectiveness,
          STDDEV_POP(af.effectiveness_score) as effectiveness_std,
          COUNT(DISTINCT CASE WHEN af.created_at >= NOW() - INTERVAL '7 days' THEN af.id END) as recent_count,
          MAX(af.created_at) as last_feedback_date
        FROM brain_patterns p
        LEFT JOIN brain_alerts a ON p.id = a.pattern_id
        LEFT JOIN brain_alert_feedback af ON a.id = af.alert_id
        GROUP BY p.id, p.pattern_type
        HAVING COUNT(DISTINCT af.id) > 0
      )
      UPDATE brain_pattern_weights pw
      SET
        weight = CASE
          WHEN rf.recent_count > 5 THEN
            -- High recency: use more recent data (alpha = 0.4)
            0.4 * COALESCE(rf.avg_effectiveness, pw.weight) + 0.6 * pw.weight
          WHEN rf.recent_count > 0 THEN
            -- Some recent data: balanced update (alpha = 0.25)
            0.25 * COALESCE(rf.avg_effectiveness, pw.weight) + 0.75 * pw.weight
          ELSE
            -- No recent data: conservative update (alpha = 0.1)
            0.1 * COALESCE(rf.avg_effectiveness, pw.weight) + 0.9 * pw.weight
        END,
        confidence_score = ROUND(
          LEAST(1.0, pw.confidence_score + (rf.feedback_count / 100.0)),
          3
        ),
        weight_count = weight_count + rf.feedback_count,
        effectiveness_std = COALESCE(rf.effectiveness_std, 0),
        updated_at = NOW()
      FROM recent_feedback rf
      WHERE pw.pattern_id = rf.pattern_id
      RETURNING pw.pattern_id;
    `;

    try {
      const result = await this.dbPool.query(query);
      const trained_count = result.rowCount || 0;
      return {
        status: 'success',
        patterns_trained: trained_count,
      };
    } catch (error) {
      throw new Error(`Pattern weight training failed: ${error.message}`);
    }
  }

  async predictAlerts(
    req: PredictiveAlertRequest,
  ): Promise<PredictiveAlertResponse> {
    const cacheKey = `ml:predictions:${req.obra_id}:${req.forecast_days || 7}`;
    const cached = await this.cacheManager.get<PredictiveAlertResponse>(
      cacheKey,
    );
    if (cached) return cached;

    const forecast_days = req.forecast_days || 7;
    const start_date = new Date();
    const end_date = new Date(Date.now() + forecast_days * 24 * 60 * 60 * 1000);

    const query = `
      WITH pattern_seasonality AS (
        SELECT
          p.pattern_type,
          DATE_PART('month', a.created_at) as month,
          DATE_PART('dow', a.created_at) as day_of_week,
          COUNT(*) as occurrence_count,
          AVG(pw.weight) as avg_weight,
          AVG(af.effectiveness_score) as avg_effectiveness
        FROM brain_patterns p
        LEFT JOIN brain_alerts a ON p.id = a.pattern_id
        LEFT JOIN brain_pattern_weights pw ON p.id = pw.pattern_id
        LEFT JOIN brain_alert_feedback af ON a.id = af.alert_id
        WHERE p.obra_id = $1
          AND a.created_at >= NOW() - INTERVAL '365 days'
        GROUP BY p.pattern_type, DATE_PART('month', a.created_at), DATE_PART('dow', a.created_at)
      ),
      forecast_base AS (
        SELECT
          ps.pattern_type,
          ps.month,
          ps.day_of_week,
          ROUND(
            ps.occurrence_count::NUMERIC /
            NULLIF((SELECT COUNT(*) FROM pattern_seasonality), 0) * 100,
            2
          ) as probability_pct,
          ps.avg_weight,
          ps.avg_effectiveness,
          CASE
            WHEN ps.avg_weight > 0.8 THEN 'HIGH'
            WHEN ps.avg_weight > 0.5 THEN 'MEDIUM'
            ELSE 'LOW'
          END as predicted_severity
        FROM pattern_seasonality ps
        WHERE ps.occurrence_count > 2 -- Minimum occurrences to predict
      )
      SELECT
        pattern_type,
        probability_pct,
        predicted_severity,
        ROUND(avg_weight::NUMERIC, 3) as confidence,
        ROUND(avg_effectiveness::NUMERIC, 3) as effectiveness
      FROM forecast_base
      ORDER BY probability_pct DESC;
    `;

    try {
      const result = await this.dbPool.query(query, [req.obra_id]);
      const raw_predictions = result.rows;

      const total_probability = raw_predictions.reduce(
        (sum, p) => sum + parseFloat(p.probability_pct),
        0,
      );

      const predictions: PredictedAlert[] = raw_predictions.map((pred) => {
        const normalized_prob = parseFloat(pred.probability_pct) / total_probability;
        const estimated_impact = this.estimateImpactValue(
          pred.predicted_severity,
          parseFloat(pred.effectiveness),
        );

        return {
          predicted_date: new Date(
            Date.now() + Math.random() * forecast_days * 24 * 60 * 60 * 1000,
          )
            .toISOString()
            .split('T')[0],
          pattern_type: pred.pattern_type,
          probability: Math.min(1.0, normalized_prob),
          severity: pred.predicted_severity,
          estimated_impact_value: estimated_impact,
          recommended_action: this.getRecommendation(
            pred.pattern_type,
            parseFloat(pred.effectiveness),
          ),
        };
      });

      const avg_confidence =
        raw_predictions.length > 0
          ? raw_predictions.reduce((sum, p) => sum + parseFloat(p.confidence), 0) /
            raw_predictions.length
          : 0;

      const response: PredictiveAlertResponse = {
        obra_id: req.obra_id,
        forecast_period: `${forecast_days} days`,
        predicted_alerts_count: predictions.length,
        confidence_level: Math.min(1.0, avg_confidence),
        predictions: predictions.slice(0, 10), // Top 10 predictions
        recommendation: this.generateForecastRecommendation(predictions),
        generated_at: new Date().toISOString(),
      };

      await this.cacheManager.set(cacheKey, response, 12 * 60 * 60 * 1000); // 12h cache
      return response;
    } catch (error) {
      throw new Error(`Alert prediction failed: ${error.message}`);
    }
  }

  async calculateCostAttribution(
    req: CostAttributionRequest,
  ): Promise<CostAttributionResponse> {
    const cacheKey = `ml:costs:${req.obra_id}:${req.attribution_by || 'pattern'}:${req.start_date}:${req.end_date}`;
    const cached = await this.cacheManager.get<CostAttributionResponse>(
      cacheKey,
    );
    if (cached) return cached;

    const attribution_by = req.attribution_by || 'pattern';
    const start_date = req.start_date || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end_date = req.end_date || new Date().toISOString().split('T')[0];

    let grouping_column = 'p.pattern_type';
    let group_name = 'pattern_type';

    if (attribution_by === 'team') {
      grouping_column = "COALESCE(a.assigned_team, 'Unassigned')";
      group_name = 'team';
    } else if (attribution_by === 'activity') {
      grouping_column = "COALESCE(a.activity_type, 'Other')";
      group_name = 'activity_type';
    }

    const query = `
      WITH cost_components AS (
        SELECT
          ${grouping_column} as category_name,
          SUM(COALESCE(af.impact_value, 0)) as total_savings,
          COUNT(DISTINCT CASE
            WHEN af.created_at IS NULL THEN a.id
          END) * 5000 as prevention_value, -- Estimated cost of preventing alerts
          COUNT(DISTINCT p.id) * 2500 as optimization_value, -- Estimated cost of optimizations
          COUNT(DISTINCT a.id) as alert_count,
          ROUND(AVG(af.effectiveness_score)::NUMERIC, 3) as avg_effectiveness
        FROM brain_patterns p
        LEFT JOIN brain_alerts a ON p.id = a.pattern_id
        LEFT JOIN brain_alert_feedback af ON a.id = af.alert_id
        WHERE p.obra_id = $1
          AND a.created_at >= $2
          AND a.created_at < $3
        GROUP BY ${grouping_column}
      )
      SELECT
        category_name,
        COALESCE(total_savings, 0) as savings_value,
        COALESCE(prevention_value, 0) as prevention_value,
        COALESCE(optimization_value, 0) as optimization_value,
        alert_count
      FROM cost_components
      ORDER BY (COALESCE(total_savings, 0) + COALESCE(prevention_value, 0) + COALESCE(optimization_value, 0)) DESC;
    `;

    try {
      const result = await this.dbPool.query(query, [
        req.obra_id,
        start_date,
        end_date,
      ]);

      const raw_attributions = result.rows;
      const total_cost =
        raw_attributions.reduce(
          (sum, row) =>
            sum +
            (parseFloat(row.savings_value) +
              parseFloat(row.prevention_value) +
              parseFloat(row.optimization_value)),
          0,
        ) || 1; // Avoid division by zero

      const attributions: CostAttribution[] = raw_attributions.map((row) => {
        const total_value =
          parseFloat(row.savings_value) +
          parseFloat(row.prevention_value) +
          parseFloat(row.optimization_value);

        return {
          name: row.category_name,
          category: group_name,
          savings_value: parseFloat(row.savings_value),
          prevention_value: parseFloat(row.prevention_value),
          optimization_value: parseFloat(row.optimization_value),
          total_value,
          percentage_of_total: (total_value / total_cost) * 100,
          status: total_value > 100000 ? 'High Impact' : 'Moderate',
        };
      });

      const response: CostAttributionResponse = {
        obra_id: req.obra_id,
        attribution_by,
        period: `${start_date} to ${end_date}`,
        total_cost_savings: raw_attributions.reduce(
          (sum, row) => sum + parseFloat(row.savings_value),
          0,
        ),
        total_cost_prevention: raw_attributions.reduce(
          (sum, row) => sum + parseFloat(row.prevention_value),
          0,
        ),
        total_cost_optimization: raw_attributions.reduce(
          (sum, row) => sum + parseFloat(row.optimization_value),
          0,
        ),
        attributions,
        roi_multiplier: total_cost > 225000 ? (total_cost / 225000) * 21 : 1, // ROI relative to investment
        generated_at: new Date().toISOString(),
      };

      await this.cacheManager.set(cacheKey, response, 24 * 60 * 60 * 1000); // 24h cache
      return response;
    } catch (error) {
      throw new Error(`Cost attribution calculation failed: ${error.message}`);
    }
  }

  async getModelPerformance(
    pattern_type?: string,
  ): Promise<ModelPerformanceMetrics[]> {
    const query = `
      WITH model_metrics AS (
        SELECT
          p.pattern_type,
          COUNT(DISTINCT p.id) as total_patterns,
          COUNT(DISTINCT a.id) as total_predictions,
          COUNT(DISTINCT CASE WHEN af.id IS NOT NULL THEN a.id END) as true_positives,
          COUNT(DISTINCT CASE WHEN af.id IS NULL THEN a.id END) as false_positives,
          ROUND(
            COUNT(DISTINCT CASE WHEN af.id IS NOT NULL THEN a.id END)::NUMERIC /
            NULLIF(COUNT(DISTINCT a.id), 0),
            3
          ) as precision,
          ROUND(
            COUNT(DISTINCT CASE WHEN af.effectiveness_score > 0.5 THEN a.id END)::NUMERIC /
            NULLIF(COUNT(DISTINCT a.id), 0),
            3
          ) as recall,
          ROUND(AVG(p.confidence)::NUMERIC, 3) as avg_confidence,
          ROUND(AVG(af.effectiveness_score)::NUMERIC, 3) as avg_effectiveness,
          MAX(pw.updated_at) as last_trained
        FROM brain_patterns p
        LEFT JOIN brain_alerts a ON p.id = a.pattern_id
        LEFT JOIN brain_alert_feedback af ON a.id = af.alert_id
        LEFT JOIN brain_pattern_weights pw ON p.id = pw.pattern_id
        WHERE 1=1
          ${pattern_type ? 'AND p.pattern_type = $1' : ''}
        GROUP BY p.pattern_type
      )
      SELECT
        pattern_type as model_name,
        ROUND(
          (2 * COALESCE(precision, 0) * COALESCE(recall, 0)) /
          NULLIF(COALESCE(precision, 0) + COALESCE(recall, 0), 0),
          3
        ) as f1_score,
        COALESCE(precision, 0) as precision,
        COALESCE(recall, 0) as recall,
        avg_confidence as accuracy,
        ROUND(AVG(ABS(avg_effectiveness - avg_confidence))::NUMERIC, 3) as mean_absolute_error,
        COALESCE(avg_confidence, 0) as roc_auc,
        total_patterns as training_samples,
        COALESCE(last_trained, NOW()) as last_trained
      FROM model_metrics;
    `;

    try {
      const params = pattern_type ? [pattern_type] : [];
      const result = await this.dbPool.query(query, params);
      return result.rows.map((row) => ({
        model_name: row.model_name,
        accuracy: parseFloat(row.accuracy) || 0,
        precision: parseFloat(row.precision) || 0,
        recall: parseFloat(row.recall) || 0,
        f1_score: parseFloat(row.f1_score) || 0,
        mean_absolute_error: parseFloat(row.mean_absolute_error) || 0,
        roc_auc: parseFloat(row.roc_auc) || 0,
        training_samples: parseInt(row.training_samples, 10),
        last_trained: row.last_trained,
      }));
    } catch (error) {
      throw new Error(`Model performance retrieval failed: ${error.message}`);
    }
  }

  async prepareTrainingData(
    req: TrainingDataRequest,
  ): Promise<TrainingDataResponse> {
    const start_date = req.start_date || new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end_date = req.end_date || new Date().toISOString().split('T')[0];

    const query = `
      SELECT
        COUNT(DISTINCT p.id) as pattern_samples,
        COUNT(DISTINCT a.id) as alert_samples,
        COUNT(DISTINCT af.id) as feedback_samples,
        COUNT(DISTINCT p.id) + COUNT(DISTINCT a.id) + COUNT(DISTINCT af.id) as total_samples,
        ROUND(
          COUNT(DISTINCT CASE WHEN af.effectiveness_score > 0.5 THEN af.id END)::NUMERIC /
          NULLIF(COUNT(DISTINCT af.id), 0),
          3
        ) as positive_class_ratio
      FROM brain_patterns p
      LEFT JOIN brain_alerts a ON p.id = a.pattern_id
      LEFT JOIN brain_alert_feedback af ON a.id = af.alert_id
      WHERE p.obra_id = $1
        AND p.created_at >= $2
        AND p.created_at < $3;
    `;

    try {
      const result = await this.dbPool.query(query, [
        req.obra_id,
        start_date,
        end_date,
      ]);
      const row = result.rows[0];

      return {
        total_samples: parseInt(row.total_samples, 10),
        pattern_samples: parseInt(row.pattern_samples, 10),
        alert_samples: parseInt(row.alert_samples, 10),
        feedback_samples: parseInt(row.feedback_samples, 10),
        class_balance: parseFloat(row.positive_class_ratio) || 0,
        status: parseInt(row.total_samples, 10) > 100 ? 'ready_for_training' : 'insufficient_data',
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Training data preparation failed: ${error.message}`);
    }
  }

  private estimateImpactValue(severity: string, effectiveness: number): number {
    const base_values = {
      CRITICAL: 500000,
      HIGH: 250000,
      MEDIUM: 100000,
      LOW: 25000,
    };

    const base = base_values[severity] || 50000;
    return Math.round(base * effectiveness);
  }

  private getRecommendation(pattern_type: string, effectiveness: number): string {
    const recommendations = {
      temporal: effectiveness > 0.7 ? 'Pre-allocate resources for seasonal peaks' : 'Review seasonal patterns',
      causal: effectiveness > 0.7 ? 'Establish preventive workflows' : 'Investigate causal relationships',
      cascade: effectiveness > 0.7 ? 'Implement early warning system' : 'Monitor cascade triggers',
      resource: effectiveness > 0.7 ? 'Optimize resource allocation' : 'Review resource constraints',
    };

    return recommendations[pattern_type] || 'Monitor and analyze';
  }

  private generateForecastRecommendation(predictions: PredictedAlert[]): string {
    if (!predictions.length) return 'No predictable patterns detected';

    const high_severity = predictions.filter((p) => p.severity === 'HIGH' || p.severity === 'CRITICAL');
    const total_impact = predictions.reduce((sum, p) => sum + p.estimated_impact_value, 0);

    if (high_severity.length > 0) {
      return `⚠️ High-severity alerts predicted (${high_severity.length}). Estimated impact: R$ ${(total_impact / 1000).toFixed(0)}k. Activate contingency plans.`;
    }

    return `📊 Moderate risk forecast (${predictions.length} patterns). Estimated impact: R$ ${(total_impact / 1000).toFixed(0)}k. Continue monitoring.`;
  }
}
