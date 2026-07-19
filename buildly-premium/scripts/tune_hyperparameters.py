#!/usr/bin/env python3
"""
Hyperparameter Tuning with Optuna

Phase 3.1: Recommendation Engine — Semana 2
Auto-tune XGBoost hyperparameters usando Optuna (50 trials)
"""

import os
import sys
import logging
import json
from pathlib import Path
from datetime import datetime

import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score
import xgboost as xgb
import optuna
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
load_dotenv()


class XGBoostHyperparameterTuner:
    """Auto-tunes XGBoost hiperparâmetros com Optuna"""

    def __init__(self, n_trials: int = None):
        self.n_trials = n_trials or int(os.getenv('OPTUNA_N_TRIALS', 50))
        self.n_jobs = int(os.getenv('OPTUNA_N_JOBS', 4))
        self.timeout = int(os.getenv('OPTUNA_TIMEOUT', 3600))
        self.study = None
        self.best_params = None
        self.best_score = 0
        self.model_path = Path(__file__).parent.parent / 'data' / 'models'
        self.model_path.mkdir(parents=True, exist_ok=True)

    def objective(self, trial: optuna.trial.Trial, X_train, X_val, y_train, y_val) -> float:
        """Função objetivo para Optuna (maximizar F1 score)"""

        # Sugerir hiperparâmetros
        params = {
            'objective': 'multi:softmax',
            'num_class': 3,
            'max_depth': trial.suggest_int('max_depth', 3, 10),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.5, log=True),
            'subsample': trial.suggest_float('subsample', 0.5, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
            'min_child_weight': trial.suggest_int('min_child_weight', 1, 7),
            'gamma': trial.suggest_float('gamma', 0, 5),
            'reg_alpha': trial.suggest_float('reg_alpha', 0, 1),
            'reg_lambda': trial.suggest_float('reg_lambda', 0, 1),
            'eval_metric': 'mlogloss',
            'tree_method': 'hist',
            'device': 'cpu',
        }

        try:
            # Converter para DMatrix
            dtrain = xgb.DMatrix(X_train, label=y_train + 1)
            dval = xgb.DMatrix(X_val, label=y_val + 1)

            # Treinar com early stopping
            evals = [(dtrain, 'train'), (dval, 'validation')]
            evals_result = {}

            booster = xgb.train(
                params,
                dtrain,
                num_boost_round=100,
                evals=evals,
                evals_result=evals_result,
                early_stopping_rounds=10,
                verbose_eval=False
            )

            # Avaliar
            y_pred = booster.predict(dval)
            y_pred = np.argmax(y_pred, axis=1) if y_pred.ndim > 1 else y_pred
            y_val_labels = y_val + 1

            f1 = f1_score(y_val_labels, y_pred, average='weighted', zero_division=0)

            return f1

        except Exception as e:
            logger.warning(f"Trial falhou: {e}")
            return 0.0

    def tune(self, X: np.ndarray, y: np.ndarray) -> bool:
        """Executar tuning com Optuna"""
        logger.info(f"🔧 Iniciando tuning com Optuna ({self.n_trials} trials)...")
        logger.info(f"   Amostras: {len(X)}, Features: {X.shape[1]}")

        start_time = datetime.now()

        try:
            # Split train/val/test
            X_temp, X_test, y_temp, y_test = train_test_split(
                X, y, test_size=0.15, random_state=42, stratify=y
            )
            X_train, X_val, y_train, y_val = train_test_split(
                X_temp, y_temp, test_size=0.1765, random_state=42, stratify=y_temp
            )

            logger.info(f"   Split: Train {len(X_train)} | Val {len(X_val)} | Test {len(X_test)}")

            # Criar study
            sampler = optuna.samplers.TPESampler(seed=42)
            self.study = optuna.create_study(
                direction='maximize',
                sampler=sampler
            )

            # Otimizar
            self.study.optimize(
                lambda trial: self.objective(trial, X_train, X_val, y_train, y_val),
                n_trials=self.n_trials,
                timeout=self.timeout,
                show_progress_bar=True
            )

            # Extrair melhores parâmetros
            self.best_params = self.study.best_params
            self.best_score = self.study.best_value

            logger.info(f"\n✅ Tuning completo!")
            logger.info(f"   Best F1 Score (validation): {self.best_score:.4f}")
            logger.info(f"   Best Hyperparameters:")
            for param, value in self.best_params.items():
                logger.info(f"     {param}: {value}")

            # Salvar resultados
            duration = (datetime.now() - start_time).total_seconds()
            self._save_results(duration)

            return True

        except Exception as e:
            logger.error(f"❌ Erro durante tuning: {e}")
            import traceback
            traceback.print_exc()
            return False

    def _save_results(self, duration: float):
        """Salvar resultados do tuning"""
        logger.info("💾 Salvando resultados...")

        results = {
            'tuning_date': datetime.now().isoformat(),
            'duration_seconds': duration,
            'n_trials': self.n_trials,
            'best_score': float(self.best_score),
            'best_params': self.best_params,
            'trials': [
                {
                    'number': trial.number,
                    'value': float(trial.value) if trial.value else 0,
                    'params': trial.params,
                    'state': str(trial.state)
                }
                for trial in self.study.trials
            ]
        }

        results_file = self.model_path / 'optuna_results.json'
        with open(results_file, 'w') as f:
            json.dump(results, f, indent=2)

        logger.info(f"   ✅ Resultados salvos: {results_file}")


def main():
    """Executar tuning"""
    logger.info("🚀 Iniciando hyperparameter tuning...")

    # Carregar dados de treino
    from collect_training_data import DecisionStoreFeaturizer

    featurizer = DecisionStoreFeaturizer()
    X, y = featurizer.coletar_decisoes_treino()

    if len(X) == 0:
        logger.error("❌ Falha ao carregar dados")
        return 1

    # Tunar hiperparâmetros
    tuner = XGBoostHyperparameterTuner()
    success = tuner.tune(X, y)

    if success:
        logger.info("\n✅ Tuning completo!")
        logger.info("📊 Próximas etapas:")
        logger.info("  1. python scripts/train_initial_model.py (com best_params)")
        logger.info("  2. Integrar modelo no inference service")
        logger.info("  3. Setup model versioning em PostgreSQL")
    else:
        logger.error("\n❌ Tuning falhou")
        return 1

    return 0


if __name__ == '__main__':
    sys.exit(main())
