#!/usr/bin/env python3
"""
Train Initial Model — XGBoost Baseline

Phase 3.1: Recommendation Engine — Semana 1
Treina modelo baseline com dados coletados
"""

import os
import sys
import logging
import json
from pathlib import Path
from datetime import datetime
from typing import Tuple

import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score, precision_score, recall_score, confusion_matrix
import xgboost as xgb
import joblib

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class XGBoostModelTrainer:
    """Treina modelo XGBoost para recomendações"""

    def __init__(self):
        self.model = None
        self.metrics = {}
        self.feature_importance = None
        self.model_path = Path(__file__).parent.parent / 'data' / 'models'
        self.model_path.mkdir(parents=True, exist_ok=True)

    def train(self, X: np.ndarray, y: np.ndarray) -> bool:
        """Treina modelo com pipeline completo"""
        logger.info("🤖 Iniciando treinamento XGBoost...")
        start_time = datetime.now()

        try:
            # 1. Split train/val/test (70/15/15)
            X_temp, X_test, y_temp, y_test = train_test_split(
                X, y, test_size=0.15, random_state=42, stratify=y
            )
            X_train, X_val, y_train, y_val = train_test_split(
                X_temp, y_temp, test_size=0.1765, random_state=42, stratify=y_temp
            )

            logger.info(f"   Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")

            # 2. Criar DMatrix (formato otimizado XGBoost)
            dtrain = xgb.DMatrix(X_train, label=y_train + 1)  # +1 para labels 0-2
            dval = xgb.DMatrix(X_val, label=y_val + 1)
            dtest = xgb.DMatrix(X_test, label=y_test + 1)

            # 3. Parâmetros XGBoost
            params = {
                'objective': 'multi:softmax',
                'num_class': 3,
                'max_depth': 6,
                'learning_rate': 0.1,
                'subsample': 0.8,
                'colsample_bytree': 0.8,
                'min_child_weight': 1,
                'eval_metric': 'mlogloss',
                'tree_method': 'hist',
                'device': 'cpu',
            }

            logger.info("   Hyperparâmetros:")
            for k, v in params.items():
                logger.info(f"     {k}: {v}")

            # 4. Treinar com early stopping
            evals = [(dtrain, 'train'), (dval, 'validation')]
            evals_result = {}

            self.model = xgb.train(
                params,
                dtrain,
                num_boost_round=100,
                evals=evals,
                evals_result=evals_result,
                early_stopping_rounds=10,
                verbose_eval=10
            )

            logger.info(f"   ✅ Modelo treinado em {self.model.best_iteration + 1} rodadas")

            # 5. Avaliar
            y_pred = self.model.predict(dtest)
            y_pred = np.argmax(y_pred, axis=1) if y_pred.ndim > 1 else y_pred
            y_test_labels = y_test + 1

            self.metrics = {
                'f1_score': float(f1_score(y_test_labels, y_pred, average='weighted')),
                'precision': float(precision_score(y_test_labels, y_pred, average='weighted', zero_division=0)),
                'recall': float(recall_score(y_test_labels, y_pred, average='weighted', zero_division=0)),
                'confusion_matrix': confusion_matrix(y_test_labels, y_pred).tolist(),
            }

            logger.info("   📊 Métricas:")
            logger.info(f"     F1 Score: {self.metrics['f1_score']:.4f}")
            logger.info(f"     Precision: {self.metrics['precision']:.4f}")
            logger.info(f"     Recall: {self.metrics['recall']:.4f}")

            # 6. Feature importance
            self.feature_importance = self.model.get_score(importance_type='weight')

            logger.info("   🎯 Top 5 features:")
            sorted_importance = sorted(
                self.feature_importance.items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]
            for feat, score in sorted_importance:
                logger.info(f"     {feat}: {score}")

            # 7. Salvar modelo
            duration = (datetime.now() - start_time).total_seconds()
            success = self._save_model(duration)

            if success:
                logger.info("✅ Treinamento completo com sucesso!")
                return True
            else:
                logger.error("❌ Erro ao salvar modelo")
                return False

        except Exception as e:
            logger.error(f"❌ Erro durante treinamento: {e}")
            import traceback
            traceback.print_exc()
            return False

    def _save_model(self, duration: float) -> bool:
        """Salvar modelo em arquivo"""
        logger.info("💾 Salvando modelo...")

        try:
            # Salvar modelo em arquivo binário
            model_file = self.model_path / 'xgboost_v1.0.model'
            self.model.save_model(str(model_file))
            logger.info(f"   ✅ Modelo salvo: {model_file}")

            # Salvar metadados em JSON
            metadata = {
                'version': 'v1.0',
                'trained_at': datetime.now().isoformat(),
                'training_duration_seconds': duration,
                'metrics': self.metrics,
                'feature_importance': self.feature_importance,
                'status': 'trained',
            }

            metadata_file = self.model_path / 'xgboost_v1.0.json'
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)

            logger.info(f"   ✅ Metadados salvos: {metadata_file}")

            # Criar registry entry
            registry_file = self.model_path / 'registry.json'
            registry = {
                'version': '1.0',
                'created_at': datetime.now().isoformat(),
                'models': [
                    {
                        'version': 'v1.0',
                        'model_file': 'xgboost_v1.0.model',
                        'metadata_file': 'xgboost_v1.0.json',
                        'status': 'trained',
                        'f1_score': self.metrics['f1_score'],
                        'trained_at': datetime.now().isoformat(),
                    }
                ],
                'current_deployed': None
            }

            with open(registry_file, 'w') as f:
                json.dump(registry, f, indent=2)

            logger.info(f"   ✅ Registry atualizado: {registry_file}")
            return True

        except Exception as e:
            logger.error(f"   ❌ Erro ao salvar: {e}")
            return False


def main():
    """Executar treinamento"""
    logger.info("🚀 Iniciando treinamento do modelo baseline...")

    # Load dados de exemplo (mock para MVP)
    logger.info("📦 Carregando dados de treinamento...")
    X = np.random.rand(100, 25)  # 100 amostras, 25 features
    y = np.random.choice([-1, 0, 1], size=100, p=[0.2, 0.3, 0.5])

    logger.info(f"   ✅ Dados carregados: X shape {X.shape}, y shape {y.shape}")
    logger.info(f"   - Label distribution: {np.bincount(y + 1)}")

    # Treinar
    trainer = XGBoostModelTrainer()
    success = trainer.train(X, y)

    if success:
        logger.info("\n✅ Modelo baseline pronto para Phase 3.1!")
        logger.info("📊 Próximas etapas:")
        logger.info("  1. Integrar com dados reais do PostgreSQL")
        logger.info("  2. Hyperparameter tuning com Optuna")
        logger.info("  3. Setup de retraining semanal")
    else:
        logger.error("\n❌ Treinamento falhou")
        return 1

    return 0


if __name__ == '__main__':
    sys.exit(main())
