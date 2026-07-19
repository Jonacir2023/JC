#!/usr/bin/env python3
"""
Setup ML Environment — Infrastructure Initialization

Phase 3.1: Recommendation Engine
Valida e inicializa:
- PostgreSQL connection
- Neo4j connection
- Model registry directory
- Database migrations
"""

import os
import sys
import logging
from pathlib import Path
from typing import Optional
import json

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MLEnvironmentSetup:
    def __init__(self):
        self.env_file = Path(__file__).parent.parent / '.env'
        self.config = {}
        self.issues = []

    def run(self) -> bool:
        """Execute complete setup"""
        logger.info("🚀 Iniciando setup do ambiente ML...")

        # 1. Verificar .env
        if not self._check_env_file():
            return False

        # 2. Carregar configuração
        if not self._load_config():
            return False

        # 3. Validar PostgreSQL
        if not self._validate_postgres():
            return False

        # 4. Validar Neo4j
        if not self._validate_neo4j():
            return False

        # 5. Criar diretórios necessários
        if not self._create_directories():
            return False

        # 6. Criar model registry
        if not self._create_model_registry():
            return False

        # 7. Executar V001 migration (optional)
        # if not self._run_migrations():
        #     return False

        logger.info("✅ Setup completo com sucesso!")
        return True

    def _check_env_file(self) -> bool:
        """Verificar se arquivo .env existe"""
        logger.info("📋 Verificando arquivo .env...")

        if not self.env_file.exists():
            logger.warning(f"⚠️  Arquivo .env não encontrado: {self.env_file}")
            logger.info("   Copie de .env.example e preencha os valores")
            self.issues.append("Missing .env file")
            return False

        logger.info("✅ .env encontrado")
        return True

    def _load_config(self) -> bool:
        """Carregar configuração do .env"""
        logger.info("⚙️  Carregando configuração...")

        try:
            from dotenv import dotenv_values
            self.config = dotenv_values(self.env_file)
            logger.info(f"✅ Configuração carregada ({len(self.config)} variáveis)")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao carregar .env: {e}")
            self.issues.append(f"Config load error: {e}")
            return False

    def _validate_postgres(self) -> bool:
        """Validar conexão PostgreSQL"""
        logger.info("🐘 Validando PostgreSQL...")

        try:
            import psycopg2

            conn = psycopg2.connect(
                host=self.config.get('PG_HOST', 'localhost'),
                port=self.config.get('PG_PORT', 5432),
                database=self.config.get('PG_DATABASE', 'buildly_db'),
                user=self.config.get('PG_USER', 'buildly_user'),
                password=self.config.get('PG_PASSWORD', ''),
                connect_timeout=5
            )

            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            logger.info(f"✅ PostgreSQL conectado: {version[0].split(',')[0]}")

            cursor.close()
            conn.close()
            return True

        except Exception as e:
            logger.error(f"❌ Erro ao conectar PostgreSQL: {e}")
            self.issues.append(f"PostgreSQL connection failed: {e}")
            return False

    def _validate_neo4j(self) -> bool:
        """Validar conexão Neo4j"""
        logger.info("📊 Validando Neo4j...")

        try:
            from neo4j import GraphDatabase

            uri = f"neo4j://{self.config.get('NEO4J_HOST', 'localhost')}:{self.config.get('NEO4J_PORT', 7687)}"
            driver = GraphDatabase.driver(
                uri,
                auth=(
                    self.config.get('NEO4J_USER', 'neo4j'),
                    self.config.get('NEO4J_PASSWORD', '')
                ),
                encrypted=False
            )

            with driver.session() as session:
                result = session.run("RETURN 1")
                result.consume()

            logger.info("✅ Neo4j conectado")
            driver.close()
            return True

        except Exception as e:
            logger.warning(f"⚠️  Neo4j não disponível (OK para esta fase): {e}")
            # Neo4j é opcional nesta fase
            return True

    def _create_directories(self) -> bool:
        """Criar diretórios necessários"""
        logger.info("📁 Criando diretórios...")

        directories = [
            Path(__file__).parent.parent / 'data' / 'models',
            Path(__file__).parent.parent / 'data' / 'datasets',
            Path(__file__).parent.parent / 'logs',
            Path(__file__).parent.parent / '.artifacts',
        ]

        try:
            for directory in directories:
                directory.mkdir(parents=True, exist_ok=True)
                logger.info(f"✅ Diretório criado: {directory}")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao criar diretórios: {e}")
            self.issues.append(f"Directory creation error: {e}")
            return False

    def _create_model_registry(self) -> bool:
        """Criar arquivo de registry de modelos"""
        logger.info("🎯 Criando model registry...")

        try:
            registry_path = Path(__file__).parent.parent / 'data' / 'models' / 'registry.json'

            if not registry_path.exists():
                registry = {
                    "version": "1.0",
                    "created_at": __import__('datetime').datetime.now().isoformat(),
                    "models": [],
                    "current_deployed": None
                }

                with open(registry_path, 'w') as f:
                    json.dump(registry, f, indent=2)

                logger.info(f"✅ Model registry criado: {registry_path}")
            else:
                logger.info(f"✅ Model registry já existe: {registry_path}")

            return True
        except Exception as e:
            logger.error(f"❌ Erro ao criar model registry: {e}")
            self.issues.append(f"Registry creation error: {e}")
            return False

    def print_summary(self):
        """Print summary dos checks"""
        logger.info("\n" + "="*60)
        logger.info("📊 RESUMO DO SETUP")
        logger.info("="*60)

        if not self.issues:
            logger.info("✅ Todos os checks passaram!")
            logger.info("\n🚀 Próximas ações:")
            logger.info("  1. pip install -r requirements.txt")
            logger.info("  2. python scripts/collect_training_data.py")
            logger.info("  3. python scripts/train_initial_model.py")
        else:
            logger.warning("⚠️  Alguns checks falharam:")
            for issue in self.issues:
                logger.warning(f"  - {issue}")

        logger.info("="*60 + "\n")


def main():
    setup = MLEnvironmentSetup()
    success = setup.run()
    setup.print_summary()
    return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())
