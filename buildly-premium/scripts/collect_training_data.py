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
from typing import List, Tuple, Optional

import pandas as pd
import numpy as np

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


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

    def __init__(self, db_pool=None):
        self.db_pool = db_pool
        self.feature_names = self.FEATURE_NAMES

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

    async def coletar_decisoes_treino(self, min_date: Optional[datetime] = None) -> Tuple[np.ndarray, np.ndarray]:
        """Coleta decisões com feedback do banco"""
        logger.info("Coletando decisões com feedback...")

        # TODO: Implementar query real ao banco
        # Por enquanto, retornar dados mock para MVP
        X = np.random.rand(100, len(self.FEATURE_NAMES))
        y = np.random.choice([-1, 0, 1], size=100, p=[0.2, 0.3, 0.5])

        logger.info(f"✅ Coletadas {len(X)} decisões")
        logger.info(f"   - Features shape: {X.shape}")
        logger.info(f"   - Labels distribution: {np.bincount(y + 1)}")  # +1 para indices 0-2

        return X, y


def main():
    """Executar coleta de dados"""
    logger.info("🚀 Iniciando coleta de dados de treinamento...")

    featurizer = DecisionStoreFeaturizer()

    # TODO: Integrar com banco de dados real
    # Por enquanto, mostrar estrutura
    logger.info(f"📊 Feature names ({len(featurizer.FEATURE_NAMES)}):")
    for i, name in enumerate(featurizer.FEATURE_NAMES, 1):
        logger.info(f"   {i:2d}. {name}")

    logger.info("\n⚠️  [MVP] Dados mock sendo usados")
    logger.info("   Integração com banco virá em next commit")

    # Salvar estrutura de features
    output_path = Path(__file__).parent.parent / 'data' / 'features.json'
    output_path.parent.mkdir(parents=True, exist_ok=True)

    features_info = {
        "version": "1.0",
        "count": len(featurizer.FEATURE_NAMES),
        "names": featurizer.FEATURE_NAMES,
        "created_at": datetime.now().isoformat()
    }

    with open(output_path, 'w') as f:
        json.dump(features_info, f, indent=2)

    logger.info(f"✅ Feature schema salvo: {output_path}")
    logger.info("\n🚀 Próximo passo: python scripts/train_initial_model.py")


if __name__ == '__main__':
    import asyncio
    asyncio.run(main()) if sys.version_info >= (3, 7) else main()
