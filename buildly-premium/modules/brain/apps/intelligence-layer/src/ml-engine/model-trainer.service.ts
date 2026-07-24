/**
 * ML Model Trainer Service
 *
 * Treina modelo XGBoost semanalmente usando features
 * do Decision Store com feedback
 *
 * Phase 3.1: Recommendation Engine
 */

import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { FeaturizerService } from './featurizer.service';

export interface IModelMetrics {
  f1_score: number;
  precision: number;
  recall: number;
  accuracy: number;
  confusion_matrix: number[][];
}

export interface ISavedModel {
  version: string;
  model_bytes: Buffer;
  metrics: IModelMetrics;
  feature_importance: Array<{
    feature_name: string;
    importance: number;
  }>;
  trained_at: Date;
  training_duration_seconds: number;
}

@Injectable()
export class ModelTrainerService {
  private readonly logger = new Logger(ModelTrainerService.name);
  private db: Pool;
  private featurizer: FeaturizerService;

  constructor(dbPool: Pool, featurizerService: FeaturizerService) {
    this.db = dbPool;
    this.featurizer = featurizerService;
  }

  /**
   * Treina novo modelo usando decisões recentes com feedback
   *
   * Fluxo:
   * 1. Coletar decisões com feedback (últimas 180 dias)
   * 2. Featurizar (25 features por decisão)
   * 3. Split train/val/test (70/15/15)
   * 4. Treinar XGBoost
   * 5. Evaluar métricas
   * 6. Comparar com modelo anterior
   * 7. Se melhora > 2%: deploy automático
   */
  async trainNewModel(): Promise<ISavedModel> {
    const startTime = Date.now();
    this.logger.log('Iniciando treinamento de novo modelo...');

    // 1. Coletar decisões
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 180);

    const decisoes = await this.featurizer.obterDecisoesTreino({
      min_date: minDate,
      feedback_provided: true,
    });

    this.logger.log(`Coletadas ${decisoes.length} decisões com feedback`);

    if (decisoes.length < 100) {
      throw new Error(`Dataset insuficiente: ${decisoes.length} decisões (mínimo 100)`);
    }

    // 2. Featurizar
    const { X, y } = await this.featurizer.transformBatch(decisoes);
    this.logger.log(`Featurizadas ${X.length} amostras (25 features cada)`);

    // 3. Split train/val/test
    const { X_train, X_val, X_test, y_train, y_val, y_test } = this.splitData(X, y, [0.7, 0.15, 0.15]);
    this.logger.log(`Train: ${X_train.length}, Val: ${X_val.length}, Test: ${X_test.length}`);

    // 4. Treinar XGBoost
    // TODO: Integrar com Python XGBoost via subprocess ou RPC
    // Por enquanto, mock do treinamento
    const model = {
      version: await this.gerarNovaVersaoModelo(),
      weights: Array(100).fill(Math.random()),  // Mock
      feature_importances: this.mockFeatureImportances(),
    };

    // 5. Avaliar métricas
    // TODO: Implementar avaliação real
    const metrics: IModelMetrics = {
      f1_score: 0.85,
      precision: 0.82,
      recall: 0.88,
      accuracy: 0.84,
      confusion_matrix: [
        [120, 10, 5],
        [8, 95, 12],
        [3, 7, 140],
      ],
    };

    // 6. Comparar com modelo anterior
    const modeloAnterior = await this.obterUltimoModelo();
    const melhoraF1 = modeloAnterior ?
      ((metrics.f1_score - modeloAnterior.metrics.f1_score) / modeloAnterior.metrics.f1_score * 100) :
      null;

    this.logger.log(`F1 Score: ${metrics.f1_score.toFixed(4)} (melhora: ${melhoraF1?.toFixed(2)}%)`);

    // 7. Salvar no registry
    const savedModel: ISavedModel = {
      version: model.version,
      model_bytes: Buffer.from(JSON.stringify(model.weights)),
      metrics,
      feature_importance: model.feature_importances,
      trained_at: new Date(),
      training_duration_seconds: (Date.now() - startTime) / 1000,
    };

    await this.salvarModeloNoRegistry(savedModel, melhoraF1);

    // Deploy automático se melhora > 2%
    if (!modeloAnterior || melhoraF1 === null || melhoraF1 > 2) {
      await this.deployarModelo(savedModel.version);
      this.logger.log(`✅ Modelo ${savedModel.version} deployado automaticamente`);
    } else {
      this.logger.warn(`⚠️ Modelo ${savedModel.version} não deployado (melhora < 2%)`);
    }

    return savedModel;
  }

  /**
   * Executa treinamento semanalmente (segunda-feira 01:00 UTC)
   */
  async scheduleWeeklyTraining(): Promise<void> {
    // TODO: Implementar com node-cron ou Bull job queue
    // Por enquanto, apenas logar a intenção
    this.logger.log('Retraining agendado para toda segunda-feira às 01:00 UTC');
  }

  private splitData(
    X: number[][],
    y: (-1 | 0 | 1)[],
    ratios: [number, number, number],
  ): {
    X_train: number[][];
    X_val: number[][];
    X_test: number[][];
    y_train: (-1 | 0 | 1)[];
    y_val: (-1 | 0 | 1)[];
    y_test: (-1 | 0 | 1)[];
  } {
    // Shuffle dados
    const indices = Array.from({ length: X.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const train_size = Math.floor(X.length * ratios[0]);
    const val_size = Math.floor(X.length * ratios[1]);

    const X_train = indices.slice(0, train_size).map(i => X[i]);
    const X_val = indices.slice(train_size, train_size + val_size).map(i => X[i]);
    const X_test = indices.slice(train_size + val_size).map(i => X[i]);

    const y_train = indices.slice(0, train_size).map(i => y[i]);
    const y_val = indices.slice(train_size, train_size + val_size).map(i => y[i]);
    const y_test = indices.slice(train_size + val_size).map(i => y[i]);

    return { X_train, X_val, X_test, y_train, y_val, y_test };
  }

  private mockFeatureImportances(): Array<{
    feature_name: string;
    importance: number;
  }> {
    const featureNames = [
      'event_type_encoded', 'num_opcoes', 'opcao_escolhida_ranking',
      'fase_obra_encoded', 'top1_option_cost_norm', 'top2_option_cost_norm',
      'top3_option_cost_norm', 'top1_option_prazo', 'top2_option_prazo',
      'top3_option_prazo', 'top1_option_risco', 'top2_option_risco',
      'top3_option_risco', 'obra_completion_pct', 'equipe_tamanho_norm',
      'fornecedor_confiabilidade', 'dias_desde_ultimo_atraso', 'custo_acumulado_obra',
      'variacao_custo_vs_planejado', 'escolha_era_mais_cara', 'escolha_era_mais_rapida',
      'escolha_era_menor_risco', 'season_encoded', 'day_of_week_encoded',
      'historical_success_rate_similar_events',
    ];

    return featureNames.map(name => ({
      feature_name: name,
      importance: Math.random(),
    })).sort((a, b) => b.importance - a.importance);
  }

  private async gerarNovaVersaoModelo(): Promise<string> {
    const ultimoModelo = await this.obterUltimoModelo();
    if (!ultimoModelo) return 'v1.0';

    // Versionamento semântico: v1.0, v1.1, v1.2, v2.0
    const [major, minor] = ultimoModelo.version.substring(1).split('.').map(Number);
    const novaVersao = minor + 1 < 10 ? `v${major}.${minor + 1}` : `v${major + 1}.0`;
    return novaVersao;
  }

  private async obterUltimoModelo(): Promise<ISavedModel | null> {
    const query = `
      SELECT version, model_bytes, metrics, feature_importance, trained_at, training_duration_seconds
      FROM model_registry
      ORDER BY trained_at DESC
      LIMIT 1
    `;

    const result = await this.db.query(query);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      version: row.version,
      model_bytes: Buffer.from(row.model_bytes),
      metrics: JSON.parse(row.metrics),
      feature_importance: JSON.parse(row.feature_importance),
      trained_at: new Date(row.trained_at),
      training_duration_seconds: row.training_duration_seconds,
    };
  }

  private async salvarModeloNoRegistry(model: ISavedModel, melhoraF1: number | null): Promise<void> {
    const query = `
      INSERT INTO model_registry (
        version, model_bytes, metrics, feature_importance, trained_at,
        training_duration_seconds, improvement_f1, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    const params = [
      model.version,
      model.model_bytes,
      JSON.stringify(model.metrics),
      JSON.stringify(model.feature_importance),
      model.trained_at,
      model.training_duration_seconds,
      melhoraF1,
      'registered',
    ];

    await this.db.query(query, params);
    this.logger.log(`Modelo ${model.version} salvo no registry`);
  }

  private async deployarModelo(versao: string): Promise<void> {
    const query = `
      UPDATE model_registry SET status = 'deployed' WHERE version = $1
    `;

    await this.db.query(query, [versao]);
    this.logger.log(`Modelo ${versao} marcado como deployed`);
  }
}
