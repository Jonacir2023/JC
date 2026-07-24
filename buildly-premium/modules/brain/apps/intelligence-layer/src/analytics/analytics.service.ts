import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Pool } from 'pg';
import {
  EventsAggregatedRequest,
  EventsAggregatedResponse,
  EventCountMetric,
  AggregationPeriod,
  PatternEffectivenessRequest,
  PatternEffectivenessResponse,
  PatternEffectivenessMetric,
  AlertsTimelineRequest,
  AlertsTimelineResponse,
  AlertMetric,
  ObrasSummaryRequest,
  ObrasSummaryResponse,
  ObraKPI,
} from './analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject('DB_POOL') private dbPool: Pool,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getEventsAggregated(
    req: EventsAggregatedRequest,
  ): Promise<EventsAggregatedResponse> {
    const cacheKey = `analytics:events:${req.obra_id}:${req.period}:${req.start_date}:${req.end_date}`;
    const cached = await this.cacheManager.get<EventsAggregatedResponse>(
      cacheKey,
    );
    if (cached) return cached;

    const { start_date, end_date } = this.getDateRange(req.period);
    const query = `
      SELECT
        DATE_TRUNC('${this.getPgInterval(req.period)}', created_at)::DATE as date,
        COUNT(*) as count,
        COUNT(CASE WHEN extracted_at IS NOT NULL THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0) as extraction_rate,
        EXTRACT(EPOCH FROM AVG(extracted_at - created_at)) / 60 as avg_duration_minutes
      FROM brain_events
      WHERE obra_id = $1
        AND created_at >= $2
        AND created_at < $3
      GROUP BY DATE_TRUNC('${this.getPgInterval(req.period)}', created_at)
      ORDER BY date DESC
    `;

    const result = await this.dbPool.query(query, [
      req.obra_id,
      req.start_date || start_date,
      req.end_date || end_date,
    ]);

    const metrics: EventCountMetric[] = result.rows.map((row) => ({
      date: row.date,
      count: parseInt(row.count, 10),
      extraction_rate: parseFloat(row.extraction_rate) || 0,
      avg_duration_minutes: parseFloat(row.avg_duration_minutes) || 0,
    }));

    const response: EventsAggregatedResponse = {
      obra_id: req.obra_id,
      period: req.period || AggregationPeriod.DAILY,
      start_date: req.start_date || start_date,
      end_date: req.end_date || end_date,
      metrics,
      total_events: metrics.reduce((sum, m) => sum + m.count, 0),
      daily_average:
        metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.count, 0) / metrics.length
          : 0,
    };

    await this.cacheManager.set(cacheKey, response, 24 * 60 * 60 * 1000); // 24h TTL
    return response;
  }

  async getPatternEffectiveness(
    req: PatternEffectivenessRequest,
  ): Promise<PatternEffectivenessResponse> {
    const cacheKey = `analytics:patterns:${req.obra_id}:${req.start_date}:${req.end_date}`;
    const cached = await this.cacheManager.get<PatternEffectivenessResponse>(
      cacheKey,
    );
    if (cached) return cached;

    const { start_date, end_date } = this.getDateRange(AggregationPeriod.MONTHLY);

    const query = `
      SELECT
        p.pattern_type,
        ROUND(AVG(p.confidence)::NUMERIC, 2) as confidence,
        ROUND(AVG(pw.weight)::NUMERIC, 2) as effectiveness_score,
        COUNT(DISTINCT a.id) as recommendations_generated,
        COUNT(DISTINCT af.id) as recommendations_accepted,
        COALESCE(SUM(af.impact_value), 0) as actual_impact_value,
        CASE
          WHEN AVG(pw.weight) > 0.7 THEN 'High Performing'
          WHEN AVG(pw.weight) > 0.4 THEN 'Moderate Performing'
          ELSE 'Needs Improvement'
        END as status
      FROM brain_patterns p
      LEFT JOIN brain_pattern_weights pw ON p.id = pw.pattern_id
      LEFT JOIN brain_alerts a ON p.id = a.pattern_id
      LEFT JOIN brain_alert_feedback af ON a.id = af.alert_id
      WHERE p.obra_id = $1
        AND p.created_at >= $2
        AND p.created_at < $3
      GROUP BY p.pattern_type
      ORDER BY effectiveness_score DESC
    `;

    const result = await this.dbPool.query(query, [
      req.obra_id,
      req.start_date || start_date,
      req.end_date || end_date,
    ]);

    const patterns: PatternEffectivenessMetric[] = result.rows.map((row) => ({
      pattern_type: row.pattern_type,
      confidence: parseFloat(row.confidence) || 0,
      effectiveness_score: parseFloat(row.effectiveness_score) || 0,
      recommendations_generated: parseInt(row.recommendations_generated, 10),
      recommendations_accepted: parseInt(row.recommendations_accepted, 10),
      actual_impact_value: parseFloat(row.actual_impact_value) || 0,
      status: row.status,
    }));

    const total_patterns_detected = patterns.length;
    const total_recommended = patterns.reduce(
      (sum, p) => sum + p.recommendations_generated,
      0,
    );
    const total_accepted = patterns.reduce(
      (sum, p) => sum + p.recommendations_accepted,
      0,
    );

    const response: PatternEffectivenessResponse = {
      obra_id: req.obra_id,
      start_date: req.start_date || start_date,
      end_date: req.end_date || end_date,
      patterns,
      overall_effectiveness:
        patterns.length > 0
          ? patterns.reduce((sum, p) => sum + p.effectiveness_score, 0) /
            patterns.length
          : 0,
      total_patterns_detected,
      recommendation_adoption_rate:
        total_recommended > 0 ? total_accepted / total_recommended : 0,
    };

    await this.cacheManager.set(cacheKey, response, 24 * 60 * 60 * 1000);
    return response;
  }

  async getAlertsTimeline(
    req: AlertsTimelineRequest,
  ): Promise<AlertsTimelineResponse> {
    const cacheKey = `analytics:alerts:${req.obra_id}:${req.start_date}:${req.end_date}:${req.severity || 'all'}`;
    const cached = await this.cacheManager.get<AlertsTimelineResponse>(
      cacheKey,
    );
    if (cached) return cached;

    const { start_date, end_date } = this.getDateRange(AggregationPeriod.DAILY);

    let severityFilter = '';
    const params: any[] = [req.obra_id, req.start_date || start_date, req.end_date || end_date];

    if (req.severity) {
      severityFilter = ' AND a.severity = $4';
      params.push(req.severity);
    }

    const query = `
      SELECT
        DATE(a.created_at)::DATE as date,
        a.severity,
        COUNT(*) as count,
        EXTRACT(EPOCH FROM AVG(COALESCE(af.resolution_date, NOW()) - a.created_at)) / 3600 as avg_resolution_hours,
        (
          SELECT p.pattern_type
          FROM brain_patterns p
          WHERE p.id = a.pattern_id
          LIMIT 1
        ) as most_common_pattern_type
      FROM brain_alerts a
      LEFT JOIN brain_alert_feedback af ON a.id = af.alert_id
      WHERE a.obra_id = $1
        AND a.created_at >= $2
        AND a.created_at < $3
        ${severityFilter}
      GROUP BY DATE(a.created_at), a.severity
      ORDER BY date DESC
    `;

    const result = await this.dbPool.query(query, params);

    const timeline: AlertMetric[] = result.rows.map((row) => ({
      date: row.date,
      severity: row.severity,
      count: parseInt(row.count, 10),
      avg_resolution_hours: parseFloat(row.avg_resolution_hours) || 0,
      most_common_pattern_type: row.most_common_pattern_type || 'Unknown',
    }));

    const allAlertsQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical,
        EXTRACT(EPOCH FROM AVG(COALESCE(af.resolution_date, NOW()) - a.created_at)) / 3600 as avg_resolution,
        COUNT(CASE WHEN af.id IS NOT NULL THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0) as resolution_rate
      FROM brain_alerts a
      LEFT JOIN brain_alert_feedback af ON a.id = af.alert_id
      WHERE a.obra_id = $1
        AND a.created_at >= $2
        AND a.created_at < $3
        ${severityFilter}
    `;

    const summaryResult = await this.dbPool.query(allAlertsQuery, params);
    const summary = summaryResult.rows[0];

    const response: AlertsTimelineResponse = {
      obra_id: req.obra_id,
      start_date: req.start_date || start_date,
      end_date: req.end_date || end_date,
      timeline,
      total_alerts: parseInt(summary.total, 10),
      critical_alerts: parseInt(summary.critical, 10),
      avg_resolution_time: parseFloat(summary.avg_resolution) || 0,
      alert_resolution_rate: parseFloat(summary.resolution_rate) || 0,
    };

    await this.cacheManager.set(cacheKey, response, 24 * 60 * 60 * 1000);
    return response;
  }

  async getObrasSummary(
    req: ObrasSummaryRequest,
  ): Promise<ObrasSummaryResponse> {
    const cacheKey = `analytics:summary:${req.tenant_id}:${req.period_start}:${req.period_end}`;
    const cached = await this.cacheManager.get<ObrasSummaryResponse>(cacheKey);
    if (cached) return cached;

    const { start_date, end_date } = this.getDateRange(AggregationPeriod.MONTHLY);

    const query = `
      SELECT
        o.id as obra_id,
        o.name as obra_name,
        COUNT(DISTINCT e.id) as total_events,
        COUNT(DISTINCT a.id) as total_alerts,
        COUNT(DISTINCT p.id) as active_patterns,
        ROUND(AVG(pw.weight)::NUMERIC, 2) as effectiveness_score,
        COUNT(DISTINCT af.id) as recommendations_implemented,
        COALESCE(SUM(af.impact_value), 0) as cost_savings_estimated,
        CASE
          WHEN COUNT(DISTINCT a.id) > 10 THEN 'At Risk'
          WHEN COUNT(DISTINCT a.id) > 5 THEN 'Monitoring'
          ELSE 'Healthy'
        END as status,
        MAX(a.created_at) as last_alert_date
      FROM obras o
      LEFT JOIN brain_events e ON o.id = e.obra_id
      LEFT JOIN brain_patterns p ON o.id = p.obra_id
      LEFT JOIN brain_alerts a ON p.id = a.pattern_id
      LEFT JOIN brain_pattern_weights pw ON p.id = pw.pattern_id
      LEFT JOIN brain_alert_feedback af ON a.id = af.alert_id
      WHERE o.tenant_id = $1
        AND e.created_at >= $2
        AND e.created_at < $3
      GROUP BY o.id, o.name
      ORDER BY total_alerts DESC
    `;

    const result = await this.dbPool.query(query, [
      req.tenant_id || 'default',
      req.period_start || start_date,
      req.period_end || end_date,
    ]);

    const obras: ObraKPI[] = result.rows.map((row) => ({
      obra_id: row.obra_id,
      obra_name: row.obra_name,
      total_events: parseInt(row.total_events, 10),
      total_alerts: parseInt(row.total_alerts, 10),
      active_patterns: parseInt(row.active_patterns, 10),
      effectiveness_score: parseFloat(row.effectiveness_score) || 0,
      recommendations_implemented: parseInt(row.recommendations_implemented, 10),
      cost_savings_estimated: parseFloat(row.cost_savings_estimated) || 0,
      status: row.status,
      last_alert_date: row.last_alert_date || new Date().toISOString(),
    }));

    const response: ObrasSummaryResponse = {
      tenant_id: req.tenant_id || 'default',
      total_obras: obras.length,
      total_events: obras.reduce((sum, o) => sum + o.total_events, 0),
      total_alerts: obras.reduce((sum, o) => sum + o.total_alerts, 0),
      avg_effectiveness:
        obras.length > 0
          ? obras.reduce((sum, o) => sum + o.effectiveness_score, 0) /
            obras.length
          : 0,
      obras,
      generated_at: new Date().toISOString(),
    };

    await this.cacheManager.set(cacheKey, response, 24 * 60 * 60 * 1000);
    return response;
  }

  private getDateRange(
    period: AggregationPeriod,
  ): { start_date: string; end_date: string } {
    const now = new Date();
    let start_date: Date;

    switch (period) {
      case AggregationPeriod.DAILY:
        start_date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case AggregationPeriod.WEEKLY:
        start_date = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
        break;
      case AggregationPeriod.MONTHLY:
        start_date = new Date(now.getFullYear(), now.getMonth() - 12, 1);
        break;
      case AggregationPeriod.QUARTERLY:
        start_date = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case AggregationPeriod.YEARLY:
        start_date = new Date(now.getFullYear() - 3, 0, 1);
        break;
      default:
        start_date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      start_date: start_date.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    };
  }

  private getPgInterval(period: AggregationPeriod): string {
    switch (period) {
      case AggregationPeriod.DAILY:
        return 'day';
      case AggregationPeriod.WEEKLY:
        return 'week';
      case AggregationPeriod.MONTHLY:
        return 'month';
      case AggregationPeriod.QUARTERLY:
        return 'quarter';
      case AggregationPeriod.YEARLY:
        return 'year';
      default:
        return 'day';
    }
  }
}
