/**
 * Testes do Cliente Buildly
 * Valida sincronização de eventos e análise Brain ML
 */

import { BuildlyClient, JCEvent } from './buildly-client';

async function runTests() {
  console.log('🧪 === Testes de Integração Buildly ===\n');

  const client = new BuildlyClient({
    env: 'dev',
    coreApiUrl: 'http://localhost:3001',
    brainApiUrl: 'http://localhost:3002',
    dbHost: 'localhost',
    dbPort: 5432,
    redisHost: 'localhost',
    redisPort: 6379,
  });

  // Teste 1: Health Check
  console.log('Test 1️⃣  Health Check');
  try {
    const isHealthy = await client.healthCheck();
    if (isHealthy) {
      console.log('  ✅ Buildly está online\n');
    } else {
      console.log('  ⚠️  Buildly offline (modo simulado ativo)\n');
    }
  } catch (error) {
    console.log('  ❌ Erro no health check\n');
  }

  // Teste 2: Sincronizar Evento
  console.log('Test 2️⃣  Sincronizar Evento');
  const testEvent: JCEvent = {
    type: 'TASK_CREATED',
    taskId: 'TAREFA-1-compra-cimento',
    timestamp: new Date().toISOString(),
    data: {
      titulo: 'Compra de Cimento CP II',
      descricao: '50 sacos de cimento',
      setor: 'Suprimentos',
      prioridade: 'Alta',
      responsavel: 'Aline',
      dataTermino: '2026-07-31',
    },
    userId: 'jonacir70@icloud.com',
  };

  try {
    await client.syncEvent(testEvent);
    console.log('  ✅ Evento sincronizado\n');
  } catch (error) {
    console.log('  ⚠️  Evento não pode ser sincronizado (Buildly offline)\n');
  }

  // Teste 3: Análise Brain ML
  console.log('Test 3️⃣  Análise Brain ML');
  try {
    const recommendations = await client.analyzeWithBrain({
      diaryEntries: [
        'Atraso na entrega de tijolos - fornecedor não confirmou',
        'Problema com logística - chuvas no trajeto',
      ],
      taskHistory: [
        { id: 'T1', name: 'Compra A', status: 'delayed' },
        { id: 'T2', name: 'Compra B', status: 'delayed' },
      ],
      timeline: {
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`  ✅ Brain retornou ${recommendations.length} recomendações\n`);
  } catch (error) {
    console.log('  ⚠️  Brain ML offline (modo simulado)\n');
  }

  // Teste 4: Registrar Decisão
  console.log('Test 4️⃣  Registrar Decisão');
  try {
    await client.recordDecision({
      taskId: 'TAREFA-1-compra-cimento',
      decision: 'Antecipar compra em 5 dias',
      reasoning: 'Brain predisse atraso de fornecedor',
      decidedBy: 'jonacir70@icloud.com',
      timestamp: new Date().toISOString(),
    });
    console.log('  ✅ Decisão registrada no Decision Store\n');
  } catch (error) {
    console.log('  ⚠️  Decisão não pode ser registrada (offline)\n');
  }

  console.log('✅ Testes concluídos!\n');
  console.log('💡 Próximos passos:');
  console.log('   1. Iniciar Buildly localmente (docker-compose up)');
  console.log('   2. Rodar: npm run sync:dev');
  console.log('   3. Monitorar webhooks do Brain ML');
}

runTests().catch(console.error);
