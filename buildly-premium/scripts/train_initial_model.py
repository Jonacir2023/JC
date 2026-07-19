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

    def _load_optuna_params(self) -> dict:
        """Carregar parâmetros tuned pelo Optuna se disponível"""
        optuna_file = self.model_path / 'optuna_results.json'

        if optuna_file.exists():
            try:
                with open(optuna_file, 'r') as f:
                    results = json.load(f)
                logger.info(f"✅ Carregando Optuna params (F1: {results.get('best_score', 0):.4f})")
                return results.get('best_params', {})
            except Exception as e:
                logger.warning(f"⚠️  Erro ao carregar Optuna params: {e}")
                return {}
        return {}

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

            # 3. Parâmetros XGBoost (usar Optuna se disponível)
            optuna_params = self._load_optuna_params()

            params = {
                'objective': 'multi:softmax',
                'num_class': 3,
                'max_depth': optuna_params.get('max_depth', 6),
                'learning_rate': optuna_params.get('learning_rate', 0.1),
                'subsample': optuna_params.get('subsample', 0.8),
                'colsample_bytree': optuna_params.get('colsample_bytree', 0.8),
                'min_child_weight': optuna_params.get('min_child_weight', 1),
                'gamma': optuna_params.get('gamma', 0),
                'reg_alpha': optuna_params.get('reg_alpha', 0),
                'reg_lambda': optuna_params.get('reg_lambda', 0),
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

    def _load_registry(self) -> dict:
        """Carregar registry de modelos anterior"""
        registry_file = self.model_path / 'registry.json'

        if registry_file.exists():
            try:
                with open(registry_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"⚠️  Erro ao carregar registry: {e}")
                return {'models': [], 'current_deployed': None}
        return {'models': [], 'current_deployed': None}

    def _should_deploy(self, previous_registry: dict) -> bool:
        """Decidir se deve fazer deploy (F1 improvement > 2%)"""
        if not previous_registry.get('current_deployed'):
            logger.info("✅ Primeiro deploy (sem modelo anterior)")
            return True

        current_f1 = self.metrics['f1_score']

        # Buscar F1 do modelo atual deployed
        deployed_version = previous_registry['current_deployed']
        for model in previous_registry.get('models', []):
            if model['version'] == deployed_version:
                previous_f1 = model.get('f1_score', 0)
                improvement = ((current_f1 - previous_f1) / previous_f1 * 100) if previous_f1 > 0 else 0
                logger.info(f"   Comparação: {previous_f1:.4f} → {current_f1:.4f} ({improvement:+.2f}%)")

                if improvement > 2:
                    logger.info(f"   ✅ Improvement {improvement:.2f}% > 2% threshold — DEPLOY")
                    return True
                else:
                    logger.info(f"   ❌ Improvement {improvement:.2f}% < 2% threshold — NO DEPLOY")
                    return False

        return True

    def _save_model(self, duration: float) -> bool:
        """Salvar modelo em arquivo com versionamento"""
        logger.info("💾 Salvando modelo...")

        try:
            # Carregar registry anterior
            registry = self._load_registry()

            # Determinar versão
            next_version_num = len(registry.get('models', [])) + 1
            version = f"v{next_version_num}.0"
            model_file_name = f'xgboost_{version}.model'
            metadata_file_name = f'xgboost_{version}.json'

            # Salvar modelo binário
            model_file = self.model_path / model_file_name
            self.model.save_model(str(model_file))
            logger.info(f"   ✅ Modelo salvo: {model_file_name}")

            # Salvar metadados
            metadata = {
                'version': version,
                'trained_at': datetime.now().isoformat(),
                'training_duration_seconds': duration,
                'metrics': self.metrics,
                'feature_importance': self.feature_importance,
                'status': 'trained',
            }

            metadata_file = self.model_path / metadata_file_name
            with open(metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2)

            logger.info(f"   ✅ Metadados salvos: {metadata_file_name}")

            # Decidir deploy
            should_deploy = self._should_deploy(registry)

            # Atualizar registry
            registry['models'].append({
                'version': version,
                'model_file': model_file_name,
                'metadata_file': metadata_file_name,
                'status': 'deployed' if should_deploy else 'trained',
                'f1_score': self.metrics['f1_score'],
                'trained_at': datetime.now().isoformat(),
                'improved_from': registry.get('current_deployed'),
            })

            if should_deploy:
                registry['current_deployed'] = version
                logger.info(f"   🚀 Modelo {version} deployado automaticamente")

            registry['updated_at'] = datetime.now().isoformat()

            registry_file = self.model_path / 'registry.json'
            with open(registry_file, 'w') as f:
                json.dump(registry, f, indent=2)

            logger.info(f"   ✅ Registry atualizado")
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
