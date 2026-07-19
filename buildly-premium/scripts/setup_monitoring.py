#!/usr/bin/env python3
"""
Setup PostgreSQL Monitoring & Alerts

Phase 3.2: Persistence Layer — Monitoring Configuration
Configura logging e alerts para performance crítica
"""

import os
import sys
import logging
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
load_dotenv()


class PostgreSQLMonitoringSetup:
    """Configura extensões e views de monitoring"""

    def __init__(self):
        self.host = os.getenv('PG_HOST', 'localhost')
        self.port = int(os.getenv('PG_PORT', 5432))
        self.database = os.getenv('PG_DATABASE', 'buildly')
        self.user = os.getenv('PG_USER', 'postgres')
        self.password = os.getenv('PG_PASSWORD', '')
        self.conn = None

    def connect(self) -> bool:
        """Conectar ao PostgreSQL"""
        try:
            self.conn = psycopg2.connect(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.user,
                password=self.password
            )
            logger.info(f"✅ Conectado ao PostgreSQL")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao conectar: {e}")
            return False

    def enable_extensions(self) -> bool:
        """Habilitar extensões de monitoring"""
        logger.info("📦 Habilitando extensões...")

        cursor = self.conn.cursor()
        extensions = ['pg_stat_statements', 'pg_trgm']

        for ext in extensions:
            try:
                cursor.execute(f"CREATE EXTENSION IF NOT EXISTS {ext};")
                logger.info(f"   ✅ {ext}")
            except Exception as e:
                logger.warning(f"   ⚠️  {ext}: {e}")

        self.conn.commit()
        cursor.close()
        return True

    def create_monitoring_views(self) -> bool:
        """Criar views para monitoring"""
        logger.info("📊 Criando monitoring views...")

        cursor = self.conn.cursor()

        # View: Query Performance
        cursor.execute("""
            CREATE OR REPLACE VIEW v_query_performance AS
            SELECT
              query,
              calls,
              total_time,
              mean_time,
              max_time,
              rows,
              100 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) as cache_hit_pct
            FROM pg_stat_statements
            ORDER BY mean_time DESC
            LIMIT 20;
        """)
        logger.info("   ✅ v_query_performance")

        # View: Connection Health
        cursor.execute("""
            CREATE OR REPLACE VIEW v_connection_health AS
            SELECT
              datname,
              count(*) as active_connections,
              max(now() - query_start) as longest_query_duration,
              count(*) FILTER (WHERE state = 'idle') as idle_connections,
              count(*) FILTER (WHERE state = 'active') as active_queries
            FROM pg_stat_activity
            WHERE datname IS NOT NULL
            GROUP BY datname;
        """)
        logger.info("   ✅ v_connection_health")

        # View: Table Health
        cursor.execute("""
            CREATE OR REPLACE VIEW v_table_health AS
            SELECT
              schemaname,
              tablename,
              pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size,
              n_live_tup as row_count,
              n_dead_tup as dead_rows,
              last_vacuum,
              last_autovacuum
            FROM pg_stat_user_tables
            ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
        """)
        logger.info("   ✅ v_table_health")

        # View: Index Usage
        cursor.execute("""
            CREATE OR REPLACE VIEW v_index_usage AS
            SELECT
              schemaname,
              tablename,
              indexname,
              idx_scan as scans,
              idx_tup_read as tuples_read,
              idx_tup_fetch as tuples_fetched,
              pg_size_pretty(pg_relation_size(indexrelid)) as size
            FROM pg_stat_user_indexes
            ORDER BY idx_scan DESC;
        """)
        logger.info("   ✅ v_index_usage")

        # View: Missing Indexes (queries that do seq scans)
        cursor.execute("""
            CREATE OR REPLACE VIEW v_missing_indexes AS
            SELECT
              schemaname,
              tablename,
              seq_scan as seq_scans,
              seq_tup_read as rows_read,
              seq_scan - idx_scan as seq_minus_idx,
              pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) as size
            FROM pg_stat_user_tables
            WHERE seq_scan > idx_scan
              AND seq_scan > 100  -- Only show significant tables
            ORDER BY seq_scan DESC;
        """)
        logger.info("   ✅ v_missing_indexes")

        self.conn.commit()
        cursor.close()
        return True

    def create_monitoring_functions(self) -> bool:
        """Criar funções para alertas"""
        logger.info("🚨 Criando funções de alertas...")

        cursor = self.conn.cursor()

        # Function: Check slow queries
        cursor.execute("""
            CREATE OR REPLACE FUNCTION check_slow_queries(threshold_ms INT DEFAULT 1000)
            RETURNS TABLE(
              query_text TEXT,
              calls BIGINT,
              mean_time_ms FLOAT,
              max_time_ms FLOAT,
              total_time_ms FLOAT
            ) AS $$
            SELECT
              query,
              calls,
              mean_time,
              max_time,
              total_time
            FROM pg_stat_statements
            WHERE mean_time > threshold_ms
            ORDER BY mean_time DESC;
            $$ LANGUAGE SQL SECURITY DEFINER;
        """)
        logger.info("   ✅ check_slow_queries()")

        # Function: Check connection limits
        cursor.execute("""
            CREATE OR REPLACE FUNCTION check_connection_limits()
            RETURNS TABLE(
              database_name TEXT,
              current_connections INT,
              max_connections INT,
              percent_used FLOAT
            ) AS $$
            SELECT
              datname,
              count(*),
              (SELECT setting::int FROM pg_settings WHERE name = 'max_connections'),
              (count(*) * 100.0 / (SELECT setting::int FROM pg_settings WHERE name = 'max_connections'))
            FROM pg_stat_activity
            WHERE datname IS NOT NULL
            GROUP BY datname;
            $$ LANGUAGE SQL SECURITY DEFINER;
        """)
        logger.info("   ✅ check_connection_limits()")

        # Function: Check table bloat
        cursor.execute("""
            CREATE OR REPLACE FUNCTION check_table_bloat()
            RETURNS TABLE(
              schema_name TEXT,
              table_name TEXT,
              bloat_ratio FLOAT,
              wasted_bytes BIGINT
            ) AS $$
            SELECT
              schemaname,
              tablename,
              ROUND((n_dead_tup::FLOAT / (n_live_tup + n_dead_tup)) * 100, 2),
              (n_dead_tup * avg_tuple_len)::BIGINT
            FROM pg_stat_user_tables
            WHERE n_dead_tup > 1000
            ORDER BY n_dead_tup DESC;
            $$ LANGUAGE SQL SECURITY DEFINER;
        """)
        logger.info("   ✅ check_table_bloat()")

        self.conn.commit()
        cursor.close()
        return True

    def create_alert_rules(self) -> bool:
        """Documentar regras de alerta (para implementação posterior)"""
        logger.info("📋 Documentando regras de alerta...")

        alert_rules = {
            "HIGH_QUERY_LATENCY": {
                "description": "Mean query time > 1000ms",
                "query": "SELECT * FROM check_slow_queries(1000)",
                "severity": "WARNING",
                "action": "Review query plan, add indexes if needed"
            },
            "CONNECTION_POOL_EXHAUSTION": {
                "description": "Used connections > 80% of max",
                "query": "SELECT * FROM check_connection_limits() WHERE percent_used > 80",
                "severity": "CRITICAL",
                "action": "Increase max_connections or add pgBouncer"
            },
            "TABLE_BLOAT": {
                "description": "Dead rows > 1000 in table",
                "query": "SELECT * FROM check_table_bloat()",
                "severity": "WARNING",
                "action": "Run VACUUM FULL on affected tables"
            },
            "LONG_RUNNING_TRANSACTION": {
                "description": "Transaction running > 30 minutes",
                "query": "SELECT * FROM pg_stat_activity WHERE query_start < now() - interval '30 min' AND state = 'active'",
                "severity": "WARNING",
                "action": "Investigate and optimize transaction"
            },
            "CACHE_HIT_RATIO_LOW": {
                "description": "Cache hit ratio < 99%",
                "query": "SELECT 100 * sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) FROM pg_statio_user_tables",
                "severity": "WARNING",
                "action": "Increase shared_buffers or optimize queries"
            }
        }

        # Save to file for documentation
        output_file = Path(__file__).parent.parent / 'docs' / 'MONITORING_RULES.json'
        output_file.parent.mkdir(parents=True, exist_ok=True)

        import json
        with open(output_file, 'w') as f:
            json.dump(alert_rules, f, indent=2)

        logger.info(f"   ✅ Regras documentadas: {output_file}")
        return True

    def close(self):
        """Fechar conexão"""
        if self.conn:
            self.conn.close()


def main():
    """Executar setup de monitoring"""
    logger.info("🚀 Iniciando setup de monitoring...")

    setup = PostgreSQLMonitoringSetup()

    if not setup.connect():
        logger.error("Não foi possível conectar ao banco de dados")
        return 1

    try:
        setup.enable_extensions()
        setup.create_monitoring_views()
        setup.create_monitoring_functions()
        setup.create_alert_rules()

        logger.info("\n✅ Monitoring setup completo!")
        logger.info("📊 Views disponíveis:")
        logger.info("   - SELECT * FROM v_query_performance;")
        logger.info("   - SELECT * FROM v_connection_health;")
        logger.info("   - SELECT * FROM v_table_health;")
        logger.info("   - SELECT * FROM v_index_usage;")
        logger.info("   - SELECT * FROM v_missing_indexes;")
        logger.info("\n🚨 Funções de alerta:")
        logger.info("   - SELECT * FROM check_slow_queries(1000);")
        logger.info("   - SELECT * FROM check_connection_limits();")
        logger.info("   - SELECT * FROM check_table_bloat();")

        return 0
    finally:
        setup.close()


if __name__ == '__main__':
    sys.exit(main())
