/**
 * Brain ML Webhook Handler
 * Recebe recomendações do Buildly Brain e executa ações em JC
 *
 * Fluxo:
 * 1. Brain detecta risco de atraso
 * 2. Envia webhook para este handler
 * 3. Handler atualiza TAREFAS_EM_ANDAMENTO.md
 * 4. Registra decisão em Buildly Core
 */

import fs from 'fs';
import path from 'path';
import { BuildlyClient } from './buildly-client';

interface BrainWebhookPayload {
  taskId: string;
  prediction: string;
  confidence: number;
  recommendedAction: string;
  estimatedImpact: string;
  timeToEvent: number; // dias
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

class BrainWebhookHandler {
  private client: BuildlyClient;
  private tarefasPath: string;

  constructor(client: BuildlyClient, tarefasPath: string) {
    this.client = client;
    this.tarefasPath = tarefasPath;
  }

  /**
   * Processa webhook do Brain ML
   */
  async handleBrainRecommendation(payload: BrainWebhookPayload): Promise<void> {
    console.log(`\n🧠 Brain ML Webhook Recebido`);
    console.log(`   Task: ${payload.taskId}`);
    console.log(`   Risco: ${payload.riskLevel}`);
    console.log(`   Predição: ${payload.prediction}`);
    console.log(`   Recomendação: ${payload.recommendedAction}\n`);

    // 1. Atualiza TAREFAS_EM_ANDAMENTO.md com alerta
    await this.updateTaskWithAlert(payload);

    // 2. Registra decisão em Buildly
    await this.recordDecisionInBuildly(payload);

    // 3. Executa ação automática se risco é HIGH
    if (payload.riskLevel === 'HIGH') {
      await this.executeAutoAction(payload);
    }

    console.log('✅ Webhook processado com sucesso\n');
  }

  /**
   * Atualiza TAREFAS_EM_ANDAMENTO.md com alerta do Brain
   */
  private async updateTaskWithAlert(payload: BrainWebhookPayload): Promise<void> {
    try {
      let content = fs.readFileSync(this.tarefasPath, 'utf-8');

      // Encontra seção da tarefa
      const taskRegex = new RegExp(
        `(### \\d+\\. \\*\\*${payload.taskId}[^]+?)(?=###|$)`,
        'g'
      );

      const alert = `\n⚠️ **ALERTA BRAIN ML** (${new Date().toLocaleString('pt-BR')})\n` +
        `- Predição: ${payload.prediction}\n` +
        `- Confiança: ${payload.confidence}%\n` +
        `- Recomendação: ${payload.recommendedAction}\n` +
        `- Tempo para evento: ${payload.timeToEvent} dias\n` +
        `- Risco: ${payload.riskLevel}`;

      content = content.replace(taskRegex, `$1${alert}`);
      fs.writeFileSync(this.tarefasPath, content);

      console.log(`📝 TAREFAS_EM_ANDAMENTO.md atualizado com alerta`);
    } catch (error) {
      console.error('Erro ao atualizar TAREFAS_EM_ANDAMENTO.md:', error);
    }
  }

  /**
   * Registra decisão em Buildly Core
   */
  private async recordDecisionInBuildly(payload: BrainWebhookPayload): Promise<void> {
    try {
      await this.client.recordDecision({
        taskId: payload.taskId,
        decision: `Executar: ${payload.recommendedAction}`,
        reasoning: `Brain ML detectou: ${payload.prediction} (confiança ${payload.confidence}%)`,
        decidedBy: 'buildly-brain-automation',
        timestamp: new Date().toISOString(),
      });

      console.log(`📊 Decisão registrada em Buildly Core`);
    } catch (error) {
      console.error('Erro ao registrar decisão:', error);
    }
  }

  /**
   * Executa ação automática para riscos HIGH
   */
  private async executeAutoAction(payload: BrainWebhookPayload): Promise<void> {
    console.log(`\n🚨 RISCO ALTO - Executando ações automáticas`);

    // Exemplo: Se atraso de material, antecipar compra
    if (payload.prediction.includes('atraso') || payload.prediction.includes('delay')) {
      console.log(`   → Criando lembrete urgente para ${payload.taskId}`);
      // Implementar: enviar Slack, email, etc
    }

    // Exemplo: Se impacto é alto, escalar para gestor
    if (payload.estimatedImpact === 'CRITICAL') {
      console.log(`   → Escalando para gestor`);
      // Implementar: notificação ao responsável
    }

    console.log(`✅ Ações automáticas executadas\n`);
  }

  /**
   * Simula webhook para teste
   */
  static async simulateWebhook(client: BuildlyClient, tarefasPath: string): Promise<void> {
    const handler = new BrainWebhookHandler(client, tarefasPath);

    const testPayload: BrainWebhookPayload = {
      taskId: 'TAREFA-1-compra-cimento',
      prediction: 'Atraso de 7-10 dias na entrega de cimento CP II',
      confidence: 85,
      recommendedAction: 'Antecipar compra em 5 dias ou encontrar fornecedor alternativo',
      estimatedImpact: 'HIGH - Afeta cronograma geral da obra',
      timeToEvent: 7,
      riskLevel: 'HIGH',
    };

    console.log('🧪 Simulando webhook do Brain ML...\n');
    await handler.handleBrainRecommendation(testPayload);
  }
}

// Se executado diretamente, simula um webhook
if (require.main === module) {
  const client = new BuildlyClient({
    env: 'dev',
    coreApiUrl: 'http://localhost:3001',
    brainApiUrl: 'http://localhost:3002',
    dbHost: 'localhost',
    dbPort: 5432,
    redisHost: 'localhost',
    redisPort: 6379,
  });

  const tarefasPath = path.join(__dirname, '../TAREFAS_EM_ANDAMENTO.md');
  BrainWebhookHandler.simulateWebhook(client, tarefasPath).catch(console.error);
}

export { BrainWebhookHandler, BrainWebhookPayload };
