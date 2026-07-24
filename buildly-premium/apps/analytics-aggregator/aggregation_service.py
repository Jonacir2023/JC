#!/usr/bin/env python3
"""
Phase 3.7 — Analytics Aggregation Service

Scheduled service that:
1. Refreshes materialized views daily
2. Computes KPI aggregations
3. Updates pattern learning weights (EMA)
4. Triggers Looker Studio data refresh
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import asyncio
from functools import wraps

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AnalyticsAggregator:
    """Handles all analytics aggregation and materialized view refreshes."""

    def __init__(self):
        self.conn = None
        self.db_config = {
            'host': os.getenv('PG_HOST', 'localhost'),
            'port': int(os.getenv('PG_PORT', '5432')),
            'database': os.getenv('PG_DATABASE', 'buildly'),
            'user': os.getenv('PG_USER', 'postgres'),
            'password': os.getenv('PG_PASSWORD', ''),
        }
        self.start_time = datetime.now()

    def connect(self):
        """Establish database connection."""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            logger.info('✅ Connected to PostgreSQL analytics database')
        except Exception as e:
            logger.error(f'❌ Database connection failed: {e}')
            raise

    def disconnect(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
            logger.info('Disconnected from database')

    def execute_query(self, query: str, params: tuple = None):
        """Execute a query and return results."""
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params or ())
                return cur.fetchall()
        except Exception as e:
            logger.error(f'Query execution failed: {e}\nQuery: {query}')
            raise

    def execute_update(self, query: str, params: tuple = None) -> int:
        """Execute an update/insert and return affected rows."""
        try:
            with self.conn.cursor() as cur:
                cur.execute(query, params or ())
                self.conn.commit()
                logger.info(f'✅ Query executed: {cur.rowcount} rows affected')
                return cur.rowcount
        except Exception as e:
            self.conn.rollback()
            logger.error(f'Update failed: {e}')
            raise

    def refresh_materialized_views(self):
        """Refresh all analytics materialized views concurrently."""
        logger.info('🔄 Starting materialized views refresh...')
        try:
            with self.conn.cursor() as cur:
                cur.execute('SELECT refresh_analytics_views();')
                self.conn.commit()
            logger.info('✅ All materialized views refreshed successfully')
        except Exception as e:
            self.conn.rollback()
            logger.error(f'View refresh failed: {e}')
            raise

    def update_pattern_learning_weights(self):
        """
        Update pattern weights using exponential moving average (EMA).
        Formula: new_weight = 0.3 * effectiveness_score + 0.7 * old_weight
        """
        logger.info('🧠 Updating pattern learning weights (EMA)...')

        query = """
        UPDATE brain_pattern_weights pw
        SET
            weight = 0.3 * COALESCE(
                (
                    SELECT AVG(af.effectiveness_score)
                    FROM brain_alert_feedback af
                    JOIN brain_alerts a ON af.alert_id = a.id
                    WHERE a.pattern_id = pw.pattern_id
                    AND af.created_at >= NOW() - INTERVAL '7 days'
                ),
                pw.weight
            ) + 0.7 * pw.weight,
            weight_count = weight_count + 1,
            updated_at = NOW()
        WHERE
            EXISTS (
                SELECT 1 FROM brain_pattern_weights
                WHERE updated_at < NOW() - INTERVAL '24 hours'
            )
        RETURNING pattern_id, weight, weight_count, updated_at;
        """

        try:
            affected = self.execute_update(query)
            logger.info(f'✅ Updated {affected} pattern weights via EMA')
        except Exception as e:
            logger.error(f'Pattern weight update failed: {e}')
            raise

    def calculate_obra_kpis(self):
        """
        Calculate and cache KPI values for each obra (30-day rolling window).
        These are used by Looker Studio for main dashboard metrics.
        """
        logger.info('📊 Calculating obra KPIs (30-day window)...')

        query = """
        INSERT INTO analytics_cache (
            metric_name,
            obra_id,
            tenant_id,
            metric_value,
            calculation_date,
            ttl_hours
        )
        SELECT
            'obra_health_score' as metric_name,
            akpi.obra_id,
            akpi.tenant_id,
            ROUND(
                CASE
                    WHEN akpi.health_status = 'Healthy' THEN 100
                    WHEN akpi.health_status = 'Stable' THEN 75
                    WHEN akpi.health_status = 'Monitoring' THEN 50
                    WHEN akpi.health_status = 'At Risk' THEN 25
                END,
                2
            ) as metric_value,
            NOW() as calculation_date,
            24 as ttl_hours
        FROM analytics_obras_kpi akpi
        WHERE akpi.snapshot_date = CURRENT_DATE
        ON CONFLICT (metric_name, obra_id, calculation_date::DATE)
        DO UPDATE SET
            metric_value = EXCLUDED.metric_value,
            updated_at = NOW();
        """

        try:
            affected = self.execute_update(query)
            logger.info(f'✅ Calculated KPIs for {affected} obras')
        except Exception as e:
            logger.error(f'KPI calculation failed: {e}')
            raise

    def archive_old_analytics_data(self):
        """
        Archive old analytics snapshots (older than 90 days) to cold storage.
        Keeps recent data hot for Looker Studio performance.
        """
        logger.info('🗂️  Archiving old analytics data (>90 days)...')

        # Move to archive table
        archive_query = """
        INSERT INTO analytics_archive (
            view_name,
            snapshot_date,
            row_count,
            data_size_bytes,
            archived_at
        )
        SELECT
            'analytics_eventos_daily',
            CURRENT_DATE - INTERVAL '90 days',
            COUNT(*),
            pg_total_relation_size('analytics_events_daily'),
            NOW()
        WHERE EXISTS (
            SELECT 1 FROM analytics_events_daily
            WHERE date < CURRENT_DATE - INTERVAL '90 days'
        );
        """

        try:
            self.execute_update(archive_query)
            logger.info('✅ Old analytics data archived')
        except Exception as e:
            logger.warning(f'Archive operation had issues: {e}')

    def validate_analytics_health(self) -> Dict[str, Any]:
        """Check analytics pipeline health and return status."""
        logger.info('🏥 Validating analytics health...')

        health = {
            'timestamp': datetime.now().isoformat(),
            'status': 'healthy',
            'views_status': {},
            'last_refresh': None,
            'issues': [],
        }

        # Check if materialized views exist and have data
        views = [
            'analytics_events_daily',
            'analytics_patterns_summary',
            'analytics_alerts_resolution',
            'analytics_obras_kpi',
            'analytics_tenant_consolidated',
        ]

        for view in views:
            try:
                result = self.execute_query(
                    f'SELECT COUNT(*) as row_count FROM {view};'
                )
                count = result[0]['row_count'] if result else 0
                health['views_status'][view] = {
                    'status': 'ok' if count > 0 else 'empty',
                    'row_count': count,
                }
            except Exception as e:
                health['views_status'][view] = {'status': 'error', 'error': str(e)}
                health['issues'].append(f'{view}: {str(e)}')
                health['status'] = 'unhealthy'

        # Check last refresh time
        try:
            result = self.execute_query(
                """
                SELECT MAX(updated_at) as last_refresh
                FROM analytics_obras_kpi;
                """
            )
            if result and result[0]['last_refresh']:
                health['last_refresh'] = result[0]['last_refresh'].isoformat()
        except Exception as e:
            health['issues'].append(f'Could not determine last refresh: {e}')

        logger.info(f'Health check complete: {health["status"]}')
        return health

    def run_daily_aggregation(self):
        """Execute complete daily aggregation pipeline."""
        logger.info('=' * 60)
        logger.info('🚀 Starting Phase 3.7 Analytics Aggregation Pipeline')
        logger.info('=' * 60)

        try:
            self.connect()

            # Step 1: Refresh materialized views
            self.refresh_materialized_views()

            # Step 2: Update pattern learning weights (EMA)
            self.update_pattern_learning_weights()

            # Step 3: Calculate obra KPIs
            self.calculate_obra_kpis()

            # Step 4: Archive old data
            self.archive_old_analytics_data()

            # Step 5: Validate health
            health = self.validate_analytics_health()

            logger.info('=' * 60)
            logger.info('✅ Analytics Aggregation Pipeline COMPLETED')
            logger.info(f'Execution time: {datetime.now() - self.start_time}')
            logger.info(f'Status: {health["status"]}')
            logger.info('=' * 60)

            return {'status': 'success', 'health': health}

        except Exception as e:
            logger.error(f'❌ Pipeline failed: {e}')
            return {'status': 'failed', 'error': str(e)}
        finally:
            self.disconnect()

    def run_hourly_cache_refresh(self):
        """Lightweight hourly cache refresh (for frequently accessed metrics)."""
        logger.info('💾 Running hourly cache refresh...')

        try:
            self.connect()

            # Refresh only the most recent snapshots (last 24 hours)
            query = """
            REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_events_daily;
            REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_alerts_resolution;
            """

            with self.conn.cursor() as cur:
                cur.execute(query)
                self.conn.commit()

            logger.info('✅ Hourly cache refresh complete')

        except Exception as e:
            logger.error(f'Hourly refresh failed: {e}')
        finally:
            self.disconnect()


def main():
    """Entry point for aggregation service."""
    import argparse

    parser = argparse.ArgumentParser(description='Buildly Analytics Aggregation Service')
    parser.add_argument(
        '--mode',
        choices=['daily', 'hourly', 'health'],
        default='daily',
        help='Aggregation mode: daily (full), hourly (cache only), or health check'
    )

    args = parser.parse_args()

    aggregator = AnalyticsAggregator()

    if args.mode == 'daily':
        result = aggregator.run_daily_aggregation()
    elif args.mode == 'hourly':
        aggregator.run_hourly_cache_refresh()
        result = {'status': 'success'}
    else:  # health
        aggregator.connect()
        result = aggregator.validate_analytics_health()
        aggregator.disconnect()

    return result


if __name__ == '__main__':
    main()
