/**
 * Buildly Integration Client
 * Sincroniza JC (Task Management) com Buildly (Operational Platform)
 *
 * Responsabilidades:
 * - Event Sourcing: registra tarefas como eventos em Buildly Core
 * - Brain Integration: envia dados para análise de atrasos
 * - Decision Store: registra decisões tomadas
 */

import axios, { AxiosInstance } from 'axios';

interface BuildlyConfig {
  env: 'dev' | 'prod';
  coreApiUrl: string;
  brainApiUrl: string;
  dbHost: string;
  dbPort: number;
  redisHost: string;
  redisPort: number;
}

interface JCEvent {
  type: 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_COMPLETED' | 'TASK_BLOCKED';
  taskId: string;
  timestamp: string;
  data: Record<string, any>;
  userId: string;
}

interface BrainRecommendation {
  prediction: string;
  confidence: number;
  recommendedAction: string;
  estimatedImpact: string;
  timeToEvent: number; // dias
}

class BuildlyClient {
  private config: BuildlyConfig;
  private coreClient: AxiosInstance;
  private brainClient: AxiosInstance;

  constructor(config: BuildlyConfig) {
    this.config = config;

    this.coreClient = axios.create({
      baseURL: config.coreApiUrl,
      timeout: 5000,
    });

    this.brainClient = axios.create({
      baseURL: config.brainApiUrl,
      timeout: 5000,
    });
  }

  /**
   * Testa conexão com Buildly Core
   */
  async healthCheck(): Promise<boolean> {
    try {
      const coreHealth = await this.coreClient.get('/health');
      const brainHealth = await this.brainClient.get('/ml/health');
      return coreHealth.status === 200 && brainHealth.status === 200;
    } catch (error) {
      console.error('Buildly health check failed:', error);
      return false;
    }
  }

  /**
   * Sincroniza evento JC → Buildly Core (Event Sourcing)
   * Registro imutável de cada ação
   */
  async syncEvent(event: JCEvent): Promise<void> {
    try {
      const payload = {
        eventType: event.type,
        eventId: `${event.taskId}-${Date.now()}`,
        timestamp: event.timestamp,
        source: 'JC',
        data: event.data,
        userId: event.userId,
      };

      const response = await this.coreClient.post('/events/register', payload);
      console.log(`✅ Event synced: ${event.type} (${event.taskId})`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to sync event: ${event.type}`, error);
      throw error;
    }
  }

  /**
   * Envia contexto de tarefas para Brain ML analisar
   * Brain detecta padrões e previne atrasos
   */
  async analyzeWithBrain(context: {
    diaryEntries: string[];
    taskHistory: any[];
    timeline: any;
  }): Promise<BrainRecommendation[]> {
    try {
      const payload = {
        context: context,
        analysisType: 'DELAY_PREDICTION',
      };

      const response = await this.brainClient.post(
        '/analyze',
        payload
      );

      const recommendations: BrainRecommendation[] = response.data.recommendations;
      console.log(`🧠 Brain returned ${recommendations.length} recommendations`);

      return recommendations;
    } catch (error) {
      console.error('Brain analysis failed:', error);
      throw error;
    }
  }

  /**
   * Registra decisão no Decision Store
   * Rastreabilidade 100% com histórico imutável
   */
  async recordDecision(decision: {
    taskId: string;
    decision: string;
    reasoning: string;
    decidedBy: string;
    timestamp: string;
  }): Promise<void> {
    try {
      const response = await this.coreClient.post(
        '/decisions/record',
        decision
      );
      console.log(`📝 Decision recorded for task ${decision.taskId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to record decision:', error);
      throw error;
    }
  }

  /**
   * Busca recomendações do Brain para tarefa específica
   */
  async getRecommendations(taskId: string): Promise<BrainRecommendation[]> {
    try {
      const response = await this.brainClient.get(
        `/recommendations/${taskId}`
      );
      return response.data.recommendations;
    } catch (error) {
      console.error(`Failed to get recommendations for ${taskId}:`, error);
      return [];
    }
  }

  /**
   * Sincroniza todas as tarefas ativas do TAREFAS_EM_ANDAMENTO.md
   */
  async syncAllActiveTasks(tasks: any[]): Promise<void> {
    console.log(`\n📤 Syncing ${tasks.length} active tasks to Buildly...`);

    for (const task of tasks) {
      const event: JCEvent = {
        type: 'TASK_UPDATED',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        data: {
          title: task.titulo,
          status: task.status,
          priority: task.prioridade,
          assignee: task.responsavel,
          dueDate: task.previsao_termino,
          blockers: task.bloqueador,
        },
        userId: 'system',
      };

      try {
        await this.syncEvent(event);
      } catch (error) {
        console.error(`Failed to sync task ${task.id}:`, error);
      }
    }

    console.log('✅ All tasks synced');
  }

  /**
   * Webhook para quando Brain detecta risco de atraso
   * Recebe recomendações e pode acionar automações
   */
  async registerBrainWebhook(callbackUrl: string): Promise<void> {
    try {
      await this.brainClient.post('/webhooks/register', {
        event: 'DELAY_RISK_DETECTED',
        callbackUrl: callbackUrl,
      });
      console.log('🔔 Brain webhook registered');
    } catch (error) {
      console.error('Failed to register Brain webhook:', error);
    }
  }
}

export { BuildlyClient, JCEvent, BrainRecommendation, BuildlyConfig };
