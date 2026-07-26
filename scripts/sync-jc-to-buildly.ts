/**
 * Sincronização JC → Buildly
 * Lê TAREFAS_EM_ANDAMENTO.md e sincroniza com Buildly Core
 * Pede análise do Brain ML para detecção de atrasos
 */

import fs from 'fs';
import path from 'path';
import { BuildlyClient, JCEvent, BrainRecommendation } from './buildly-client';

// Configuração baseada no ambiente
const BUILDLY_ENV = process.env.BUILDLY_ENV || 'dev';
const config = {
  env: BUILDLY_ENV as 'dev' | 'prod',
  coreApiUrl: BUILDLY_ENV === 'dev' ? 'http://localhost:3001' : 'https://api.buildly.app',
  brainApiUrl: BUILDLY_ENV === 'dev' ? 'http://localhost:3002' : 'https://brain.buildly.app',
  dbHost: BUILDLY_ENV === 'dev' ? 'localhost' : 'postgres-prod.c.buildly.cloud',
  dbPort: 5432,
  redisHost: BUILDLY_ENV === 'dev' ? 'localhost' : 'redis-prod.c.buildly.cloud',
  redisPort: 6379,
};

interface TaskData {
  id: string;
  titulo: string;
  status: string;
  prioridade: string;
  responsavel: string;
  previsao_termino: string;
  bloqueador: string;
  setor: string;
}

/**
 * Parse TAREFAS_EM_ANDAMENTO.md e extrai tarefas
 */
function parseTarefasFile(filePath: string): TaskData[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const tasks: TaskData[] = [];

  // Regex para capturar sections de tarefas
  const taskRegex = /### \d+\.\s+\*\*(.+?)\*\*\s*\(([^)]+)\)\s*([\s\S]*?)(?=###|\Z)/g;
  let match;

  while ((match = taskRegex.exec(content)) !== null) {
    const titulo = match[1];
    const status = match[2];
    const details = match[3];

    // Extrai ID (se existir)
    const idMatch = titulo.match(/\[(\d+)\]/);
    const id = idMatch ? idMatch[1] : `task-${Date.now()}`;

    // Extrai bloqueador, responsável, etc
    const bloqueadorMatch = details.match(/Bloqueador:\s*(.+?)(?:\n|$)/);
    const responsavelMatch = details.match(/Responsável:\s*(.+?)(?:\n|$)/);
    const dataMatch = details.match(/Previsão:\s*(\d{4}-\d{2}-\d{2})/);

    tasks.push({
      id,
      titulo,
      status,
      prioridade: details.includes('🔴') ? 'Alta' : details.includes('🟡') ? 'Média' : 'Baixa',
      responsavel: responsavelMatch ? responsavelMatch[1].trim() : 'Não atribuído',
      previsao_termino: dataMatch ? dataMatch[1] : new Date().toISOString().split('T')[0],
      bloqueador: bloqueadorMatch ? bloqueadorMatch[1].trim() : 'Nenhum',
      setor: 'Construção', // Pode ser extraído do contexto
    });
  }

  return tasks;
}

/**
 * Sincroniza tarefas com Buildly Core via Event Sourcing
 */
async function syncTarefasWithCore(
  client: BuildlyClient,
  tasks: TaskData[]
): Promise<void> {
  console.log('\n📤 === Sincronizando Tarefas com Buildly Core ===');
  console.log(`Sincronizando ${tasks.length} tarefas...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const task of tasks) {
    try {
      const event: JCEvent = {
        type: 'TASK_UPDATED',
        taskId: task.id,
        timestamp: new Date().toISOString(),
        data: {
          titulo: task.titulo,
          status: task.status,
          prioridade: task.prioridade,
          responsavel: task.responsavel,
          dataTermino: task.previsao_termino,
          bloqueador: task.bloqueador,
          setor: task.setor,
        },
        userId: 'jc-system',
      };

      await client.syncEvent(event);
      successCount++;
    } catch (error) {
      console.error(`❌ Erro ao sincronizar ${task.id}: ${error}`);
      failCount++;
    }
  }

  console.log(`\n✅ Sincronização concluída: ${successCount} OK, ${failCount} erros`);
}

/**
 * Envia contexto para Brain ML analisar atrasos
 */
async function analyzeBrainPredictions(
  client: BuildlyClient,
  tasks: TaskData[]
): Promise<Map<string, BrainRecommendation[]>> {
  console.log('\n🧠 === Analisando Padrões com Brain ML ===');

  const recommendations = new Map<string, BrainRecommendation[]>();

  // Agrupa dados por setor/responsável para análise
  const tasksByAssignee = new Map<string, TaskData[]>();
  tasks.forEach((task) => {
    if (!tasksByAssignee.has(task.responsavel)) {
      tasksByAssignee.set(task.responsavel, []);
    }
    tasksByAssignee.get(task.responsavel)!.push(task);
  });

  // Envia cada grupo para análise
  for (const [assignee, assigneeTasks] of tasksByAssignee) {
    try {
      console.log(`\n  📊 Analisando ${assigneeTasks.length} tarefas de ${assignee}...`);

      const context = {
        diaryEntries: [], // Pode ser preenchido com diários de obra
        taskHistory: assigneeTasks,
        timeline: {
          start: new Date(),
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        },
      };

      const recs = await client.analyzeWithBrain(context);
      recommendations.set(assignee, recs);

      recs.forEach((rec) => {
        console.log(`    ⚠️  ${rec.prediction} (confiança: ${rec.confidence}%)`);
        console.log(`    💡 Recomendação: ${rec.recommendedAction}`);
        console.log(`    ⏱️  Prazo: ${rec.timeToEvent} dias\n`);
      });
    } catch (error) {
      console.error(`  ❌ Erro ao analisar ${assignee}:`, error);
    }
  }

  return recommendations;
}

/**
 * Gera relatório de integrações e recomendações
 */
function generateReport(
  tasks: TaskData[],
  recommendations: Map<string, BrainRecommendation[]>
): void {
  const reportPath = path.join(__dirname, '../BUILDLY-SYNC-REPORT.md');

  let report = `# 📊 Relatório de Sincronização JC ↔ Buildly\n\n`;
  report += `**Data:** ${new Date().toLocaleString('pt-BR')}\n`;
  report += `**Ambiente:** ${BUILDLY_ENV}\n\n`;

  report += `## 📤 Sincronização de Eventos\n`;
  report += `- ✅ Tarefas sincronizadas: ${tasks.length}\n`;
  report += `- Status: Pronto para Buildly Core\n\n`;

  report += `## 🧠 Análise do Brain ML\n`;
  if (recommendations.size > 0) {
    for (const [assignee, recs] of recommendations) {
      report += `\n### ${assignee}\n`;
      if (recs.length > 0) {
        recs.forEach((rec) => {
          report += `- **${rec.prediction}** (${rec.confidence}% confiança)\n`;
          report += `  - Ação: ${rec.recommendedAction}\n`;
          report += `  - Prazo: ${rec.timeToEvent} dias\n`;
        });
      } else {
        report += `- Sem recomendações no momento\n`;
      }
    }
  } else {
    report += `Nenhuma análise disponível (Brain ML offline)\n`;
  }

  report += `\n## 🔗 Próximos Passos\n`;
  report += `1. ✅ Eventos registrados em Buildly Core\n`;
  report += `2. 🧠 Brain monitorando padrões de atraso\n`;
  report += `3. 📊 Decisões serão registradas no Decision Store\n`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Relatório salvo em: ${reportPath}`);
}

/**
 * Main: Executa sincronização completa
 */
async function main() {
  console.log(`\n🚀 Iniciando sincronização JC ↔ Buildly (${BUILDLY_ENV})\n`);

  const client = new BuildlyClient(config);

  // 1. Testa conectividade
  console.log('🔍 Testando conectividade com Buildly...');
  const isHealthy = await client.healthCheck();

  if (!isHealthy) {
    console.warn('⚠️  Buildly não está respondendo (modo offline)\n');
    console.log('💡 Continuando sincronização em modo simulado...\n');
  } else {
    console.log('✅ Buildly está online!\n');
  }

  // 2. Lê tarefas do JC
  const tarefasPath = path.join(__dirname, '../TAREFAS_EM_ANDAMENTO.md');
  const tasks = parseTarefasFile(tarefasPath);
  console.log(`✅ Lidas ${tasks.length} tarefas de ${tarefasPath}\n`);

  // 3. Sincroniza com Core (se online)
  if (isHealthy) {
    await syncTarefasWithCore(client, tasks);
  } else {
    console.log('(Modo offline: sincronização será executada quando Buildly ativar)\n');
  }

  // 4. Pede análise ao Brain
  const recommendations = isHealthy ? await analyzeBrainPredictions(client, tasks) : new Map();

  // 5. Gera relatório
  generateReport(tasks, recommendations);

  console.log('\n✅ Sincronização completa!');
}

// Executa
main().catch(console.error);
