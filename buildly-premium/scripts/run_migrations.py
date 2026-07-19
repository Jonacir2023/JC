#!/usr/bin/env python3
"""
Run Database Migrations

Phase 3.2: Persistence Layer — Executa migrations V001 + V002
Inicializa schema PostgreSQL e Neo4j sync tracking
"""

import os
import sys
import logging
from pathlib import Path

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PostgreSQLMigrationRunner:
    """Executa SQL migrations em ordem"""

    def __init__(self, migrations_dir: str = None):
        load_dotenv()
        self.host = os.getenv('PG_HOST', 'localhost')
        self.port = int(os.getenv('PG_PORT', 5432))
        self.database = os.getenv('PG_DATABASE', 'buildly')
        self.user = os.getenv('PG_USER', 'postgres')
        self.password = os.getenv('PG_PASSWORD', '')
        self.migrations_dir = Path(migrations_dir or 'migrations')
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
            self.conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            logger.info(f"✅ Conectado ao PostgreSQL ({self.host}:{self.port}/{self.database})")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao conectar: {e}")
            return False

    def run_migrations(self) -> bool:
        """Executar migrations em ordem"""
        if not self.conn:
            logger.error("Não conectado ao banco. Execute connect() primeiro.")
            return False

        migrations = sorted(self.migrations_dir.glob('V*.sql'))
        if not migrations:
            logger.warning(f"⚠️ Nenhuma migration encontrada em {self.migrations_dir}")
            return True

        logger.info(f"📋 Encontradas {len(migrations)} migrations")

        cursor = self.conn.cursor()

        for migration_file in migrations:
            logger.info(f"▶️  Executando {migration_file.name}...")

            try:
                with open(migration_file, 'r') as f:
                    sql = f.read()

                # Executar migration
                cursor.execute(sql)
                logger.info(f"   ✅ {migration_file.name} OK")

            except Exception as e:
                logger.error(f"   ❌ Erro em {migration_file.name}: {e}")
                cursor.close()
                return False

        cursor.close()
        logger.info("✅ Todas as migrations executadas com sucesso!")
        return True

    def close(self):
        """Fechar conexão"""
        if self.conn:
            self.conn.close()


def main():
    """Executar migrations"""
    logger.info("🚀 Iniciando execução de migrations...")

    # Resolver diretório de migrations
    script_dir = Path(__file__).parent
    migrations_dir = script_dir.parent / 'migrations'

    runner = PostgreSQLMigrationRunner(migrations_dir=str(migrations_dir))

    if not runner.connect():
        logger.error("Não foi possível conectar ao banco de dados")
        return 1

    try:
        if runner.run_migrations():
            logger.info("\n✅ Database setup completo!")
            logger.info("📊 Próximas etapas:")
            logger.info("  1. python scripts/collect_training_data.py")
            logger.info("  2. python scripts/train_initial_model.py")
            logger.info("  3. Monitorar metricas em PostgreSQL")
            return 0
        else:
            logger.error("Falha na execução de migrations")
            return 1
    finally:
        runner.close()


if __name__ == '__main__':
    sys.exit(main())
