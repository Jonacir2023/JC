#!/usr/bin/env python3
"""
Collect Training Data — Decision Store Featurizer

Phase 3.1: Recommendation Engine — Semana 1
Coleta decisões com feedback do PostgreSQL
e converte em feature vectors para treinamento
"""

import os
import sys
import logging
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Tuple, Optional, Dict, Any

import pandas as pd
import numpy as np
import psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
load_dotenv()


class DecisionStoreFeaturizer:
    """Extrai 25 features de decisões históricas"""

    FEATURE_NAMES = [
        'event_type_encoded', 'num_opcoes', 'opcao_escolhida_ranking',
        'fase_obra_encoded', 'top1_option_cost_norm', 'top2_option_cost_norm',
        'top3_option_cost_norm', 'top1_option_prazo', 'top2_option_prazo',
        'top3_option_prazo', 'top1_option_risco', 'top2_option_risco',
        'top3_option_risco', 'obra_completion_pct', 'equipe_tamanho_norm',
        'fornecedor_confiabilidade', 'dias_desde_ultimo_atraso',
        'custo_acumulado_obra', 'variacao_custo_vs_planejado',
        'escolha_era_mais_cara', 'escolha_era_mais_rapida',
        'escolha_era_menor_risco', 'season_encoded', 'day_of_week_encoded',
        'historical_success_rate_similar_events'
    ]

    EVENT_TYPE_MAP = {
        'MATERIAL_DELAY': 0,
        'COST_OVERRUN': 1,
        'RISK_ALERT': 2,
        'QUALITY_ISSUE': 3,
        'RESOURCE_SHORTAGE': 4,
        'WEATHER_IMPACT': 5,
        'SAFETY_INCIDENT': 6,
        'SCHEDULE_CHANGE': 7
    }

    FASE_OBRA_MAP = {
        'fundacao': 0,
        'estrutura': 1,
        'acabamento': 2,
        'entrega': 3
    }

    def __init__(self, db_conn=None):
        self.db_conn = db_conn
        self.feature_names = self.FEATURE_NAMES

        # Database configuration from .env
        self.pg_host = os.getenv('PG_HOST', 'localhost')
        self.pg_port = int(os.getenv('PG_PORT', 5432))
        self.pg_database = os.getenv('PG_DATABASE', 'buildly')
        self.pg_user = os.getenv('PG_USER', 'postgres')
        self.pg_password = os.getenv('PG_PASSWORD', '')

    def transform_decisao(self, decisao: dict) -> Optional[Tuple[List[float], int]]:
        """Transforma decisão em feature vector + label"""
        try:
            features = []

            # 1. event_type_encoded
            event_type = self.EVENT_TYPE_MAP.get(decisao.get('tipo_evento', 'MATERIAL_DELAY'), 0)
            features.append(event_type)

            # 2. num_opcoes
            opcoes = decisao.get('opcoes', [])
            features.append(len(opcoes))

            # 3. opcao_escolhida_ranking
            if opcoes:
                opcao_ids = [o['id'] for o in opcoes]
                try:
                    idx = opcao_ids.index(decisao.get('opcao_escolhida_id'))
                    features.append(idx + 1)
                except ValueError:
                    features.append(len(opcoes))
            else:
                features.append(1)

            # 4. fase_obra_encoded
            contexto = decisao.get('contexto', {})
            fase = self.FASE_OBRA_MAP.get(contexto.get('fase_obra', 'estrutura'), 0)
            features.append(fase)

            # 5-7. top3 custos normalizados
            if opcoes:
                custos = sorted([o.get('custo_estimado', 0) for o in opcoes])
                max_custo = max(custos) if custos else 1
                features.append(custos[0] / max_custo if max_custo > 0 else 0)
                features.append((custos[1] if len(custos) > 1 else custos[0]) / max_custo if max_custo > 0 else 0)
                features.append((custos[2] if len(custos) > 2 else custos[0]) / max_custo if max_custo > 0 else 0)
            else:
                features.extend([0, 0, 0])

            # 8-10. top3 prazos normalizados
            if opcoes:
                prazos = sorted([o.get('prazo_dias', 0) for o in opcoes])
                max_prazo = max(prazos) if prazos else 1
                features.append(prazos[0] / max_prazo if max_prazo > 0 else 0)
                features.append((prazos[1] if len(prazos) > 1 else prazos[0]) / max_prazo if max_prazo > 0 else 0)
                features.append((prazos[2] if len(prazos) > 2 else prazos[0]) / max_prazo if max_prazo > 0 else 0)
            else:
                features.extend([0, 0, 0])

            # 11-13. top3 riscos normalizados
            if opcoes:
                riscos = sorted([o.get('risco_score', 0) for o in opcoes])
                max_risco = max(riscos) if riscos else 1
                features.append(riscos[0] / max_risco if max_risco > 0 else 0)
                features.append((riscos[1] if len(riscos) > 1 else riscos[0]) / max_risco if max_risco > 0 else 0)
                features.append((riscos[2] if len(riscos) > 2 else riscos[0]) / max_risco if max_risco > 0 else 0)
            else:
                features.extend([0, 0, 0])

            # 14. obra_completion_pct (0-100)
            completion = contexto.get('% conclusao', 50)
            features.append(completion / 100)

            # 15. equipe_tamanho_norm (0-100 pessoas)
            equipe = contexto.get('equipe_tamanho', 20)
            features.append(min(equipe / 100, 1.0))

            # 16. fornecedor_confiabilidade (0-100)
            confiabilidade = contexto.get('fornecedor_confiabilidade', 75)
            features.append(confiabilidade / 100)

            # 17-25. Features adicionais (defaults para MVP)
            features.extend([
                0.3,  # 17. dias_desde_ultimo_atraso (normalizado)
                0.5,  # 18. custo_acumulado_obra (normalizado)
                0.1,  # 19. variacao_custo_vs_planejado
                0,    # 20. escolha_era_mais_cara
                0,    # 21. escolha_era_mais_rapida
                0,    # 22. escolha_era_menor_risco
                datetime.now().month // 3,  # 23. season_encoded (0-3)
                datetime.now().weekday(),   # 24. day_of_week_encoded (0-6)
                0.75  # 25. historical_success_rate_similar_events
            ])

            # Label (feedback_score: -1, 0, 1)
            label = decisao.get('feedback_score', 0)

            return (features, label)

        except Exception as e:
            logger.error(f"Erro ao transformar decisão: {e}")
            return None

    def _connect_db(self) -> Optional[psycopg2.extensions.connection]:
        """Conectar ao PostgreSQL"""
        try:
            conn = psycopg2.connect(
                host=self.pg_host,
                port=self.pg_port,
                database=self.pg_database,
                user=self.pg_user,
                password=self.pg_password
            )
            logger.info(f"✅ Conectado ao PostgreSQL ({self.pg_host}:{self.pg_port})")
            return conn
        except Exception as e:
            logger.warning(f"⚠️  Erro ao conectar ao PostgreSQL: {e}")
            logger.info("   Usando dados mock para MVP...")
            return None

    def _fetch_decisoes_from_db(self, conn: psycopg2.extensions.connection, min_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Fetch decisões com feedback do banco"""
        cursor = conn.cursor(cursor_factory=DictCursor)

        sql = """
            SELECT
                d.id,
                d.evento_id,
                d.opcoes,
                d.opcao_escolhida_id,
                d.feedback_score,
                e.tipo as tipo_evento,
                e.contexto,
                o.conclusao_pct,
                o.orcamento_total,
                o.gasto_atual
            FROM decisoes d
            LEFT JOIN eventos e ON d.evento_id = e.id
            LEFT JOIN obras o ON e.obra_id = o.id
            WHERE d.feedback_score IS NOT NULL
        """

        params = []
        if min_date:
            sql += " AND d.criado_em >= %s"
            params.append(min_date)

        sql += " ORDER BY d.criado_em DESC LIMIT 500"

        try:
            cursor.execute(sql, params)
            decisoes = cursor.fetchall()
            cursor.close()
            logger.info(f"✅ Fetched {len(decisoes)} decisões do banco")
            return decisoes
        except Exception as e:
            logger.error(f"❌ Erro ao buscar decisões: {e}")
            cursor.close()
            return []

    def transformBatch(self, decisoes: List[Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray]:
        """Transforma lote de decisões em feature vectors"""
        features_list = []
        labels_list = []

        for decisao in decisoes:
            # Parsear JSONB fields
            try:
                opcoes = decisao.get('opcoes', [])
                if isinstance(opcoes, str):
                    opcoes = json.loads(opcoes)

                contexto = decisao.get('contexto', {})
                if isinstance(contexto, str):
                    contexto = json.loads(contexto)

                decisao_dict = {
                    'tipo_evento': decisao.get('tipo_evento', 'MATERIAL_DELAY'),
                    'opcoes': opcoes,
                    'opcao_escolhida_id': decisao.get('opcao_escolhida_id'),
                    'contexto': contexto,
                    'feedback_score': decisao.get('feedback_score', 0)
                }

                result = self.transform_decisao(decisao_dict)
                if result:
                    features, label = result
                    features_list.append(features)
                    labels_list.append(label)
            except Exception as e:
                logger.warning(f"Erro ao transformar decisão: {e}")
                continue

        if not features_list:
            logger.warning("Nenhuma decisão foi transformada com sucesso")
            return np.array([]), np.array([])

        X = np.array(features_list)
        y = np.array(labels_list)

        return X, y

    def coletar_decisoes_treino(self, min_date: Optional[datetime] = None) -> Tuple[np.ndarray, np.ndarray]:
        """Coleta decisões com feedback do banco"""
        logger.info("Coletando decisões com feedback...")

        # Tentar conectar ao banco
        conn = self._connect_db()

        if conn is None:
            # Usar dados mock se falhar conexão
            logger.info("Usando mock data para MVP")
            X = np.random.rand(100, len(self.FEATURE_NAMES))
            y = np.random.choice([-1, 0, 1], size=100, p=[0.2, 0.3, 0.5])
        else:
            try:
                # Buscar decisões do banco
                decisoes = self._fetch_decisoes_from_db(conn, min_date)

                if not decisoes:
                    logger.warning("⚠️  Nenhuma decisão com feedback encontrada")
                    logger.info("Usando mock data para MVP")
                    X = np.random.rand(100, len(self.FEATURE_NAMES))
                    y = np.random.choice([-1, 0, 1], size=100, p=[0.2, 0.3, 0.5])
                else:
                    # Transformar para features
                    X, y = self.transformBatch(decisoes)

                    if len(X) == 0:
                        logger.warning("Falha ao transformar decisões, usando mock data")
                        X = np.random.rand(100, len(self.FEATURE_NAMES))
                        y = np.random.choice([-1, 0, 1], size=100, p=[0.2, 0.3, 0.5])
            finally:
                conn.close()

        logger.info(f"✅ Coletadas {len(X)} decisões")
        logger.info(f"   - Features shape: {X.shape}")
        logger.info(f"   - Labels distribution: {np.bincount(y + 1)}")  # +1 para indices 0-2

        return X, y


def main():
    """Executar coleta de dados"""
    logger.info("🚀 Iniciando coleta de dados de treinamento...")

    featurizer = DecisionStoreFeaturizer()

    # Mostrar feature names
    logger.info(f"📊 Feature names ({len(featurizer.FEATURE_NAMES)}):")
    for i, name in enumerate(featurizer.FEATURE_NAMES, 1):
        logger.info(f"   {i:2d}. {name}")

    # Coletar dados (tenta banco, fallback para mock)
    logger.info("\n📡 Tentando coletar dados do PostgreSQL...")
    X, y = featurizer.coletar_decisoes_treino(
        min_date=datetime.now() - timedelta(days=180)  # Últimos 180 dias
    )

    # Salvar estrutura de features
    output_path = Path(__file__).parent.parent / 'data' / 'features.json'
    output_path.parent.mkdir(parents=True, exist_ok=True)

    features_info = {
        "version": "1.0",
        "count": len(featurizer.FEATURE_NAMES),
        "names": featurizer.FEATURE_NAMES,
        "samples_collected": int(len(X)),
        "label_distribution": {
            "erro": int(np.sum(y == -1)),
            "neutro": int(np.sum(y == 0)),
            "sucesso": int(np.sum(y == 1))
        },
        "created_at": datetime.now().isoformat()
    }

    with open(output_path, 'w') as f:
        json.dump(features_info, f, indent=2)

    logger.info(f"✅ Feature schema salvo: {output_path}")
    logger.info(f"\n📊 Resumo:")
    logger.info(f"   - Total amostras: {len(X)}")
    logger.info(f"   - Erros (label=-1): {np.sum(y == -1)}")
    logger.info(f"   - Neutro (label=0): {np.sum(y == 0)}")
    logger.info(f"   - Sucessos (label=1): {np.sum(y == 1)}")
    logger.info(f"\n🚀 Próximo passo: python scripts/train_initial_model.py")

    return 0


if __name__ == '__main__':
    sys.exit(main())
