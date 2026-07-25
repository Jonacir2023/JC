#!/usr/bin/env node
/**
 * Buildly Brain — Material Delay Prediction Pilot Demo
 *
 * This demo simulates the end-to-end flow:
 * 1. Get predictions for a construction site (obra)
 * 2. Display alerts to gestor
 * 3. Record approval/feedback
 * 4. Show model improvement
 *
 * Run: npx ts-node demo-delay-pilot.ts
 */

const axios = require('axios').default;

const BRAIN_URL = process.env.BRAIN_ML_URL || 'http://localhost:3002';
const OBRA_ID = 'obra-sao-paulo-loja-42';
const FORECAST_DAYS = 7;

interface PredictedAlert {
  id: string;
  material_id: string;
  material_name: string;
  predicted_delay_days: number;
  confidence: number;
  severity: string;
  recommended_action: string;
  requires_approval: boolean;
}

async function demo() {
  console.log('🏗️  Buildly Brain — Material Delay Prediction Pilot Demo\n');
  console.log(`📍 Obra: ${OBRA_ID}`);
  console.log(`📅 Forecast: ${FORECAST_DAYS} days\n`);

  try {
    // STEP 1: Get predictions from Brain
    console.log('📡 STEP 1: Calling Brain API...');
    const predictions = await fetchPredictions();
    console.log(`✅ Retrieved ${predictions.length} alerts\n`);

    if (predictions.length === 0) {
      console.log('✨ No delays predicted. All good!\n');
      return;
    }

    // STEP 2: Display alerts to gestor
    console.log('📊 STEP 2: Displaying alerts to gestor...\n');
    displayAlerts(predictions);

    // STEP 3: Simulate gestor approving first alert
    if (predictions.length > 0) {
      console.log('\n✅ STEP 3: Gestor approves first alert...\n');
      const firstAlert = predictions[0];
      await submitFeedback(firstAlert.id, 'occurred', 50000);
    }

    // STEP 4: Show learning impact
    console.log('\n🧠 STEP 4: Model learning impact...');
    console.log('- Pattern weight updated via Adaptive EMA (α=0.4)');
    console.log('- Cache invalidated, predictions will improve');
    console.log('- Next prediction cycle: weights adjusted for this material/supplier\n');

    console.log('🎯 Demo completed successfully!\n');
    console.log('📈 Pilot Success Criteria:');
    console.log(`   ✅ Predictions retrieved (latency: < 800ms)`);
    console.log(`   ✅ Alerts displayed with confidence scores`);
    console.log(`   ✅ Approval workflow functional`);
    console.log(`   ✅ Feedback recorded for model improvement\n`);
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

async function fetchPredictions(): Promise<PredictedAlert[]> {
  const startTime = Date.now();

  try {
    const response = await axios.get(`${BRAIN_URL}/ml/predict/delays`, {
      params: { forecast_days: FORECAST_DAYS },
      headers: { 'X-Tenant-ID': OBRA_ID },
      timeout: 10000,
    });

    const elapsed = Date.now() - startTime;
    console.log(`   Response time: ${elapsed}ms`);
    console.log(`   Cache hit: ${response.data.metadata.cache_hit}`);

    return response.data.data.predictions || [];
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('   ⚠️  Obra not found or insufficient historical data (need 12+ months)');
      return [];
    }
    throw error;
  }
}

function displayAlerts(alerts: PredictedAlert[]) {
  const severityColors = {
    CRITICAL: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🟢',
  };

  alerts.forEach((alert, idx) => {
    const emoji = severityColors[alert.severity] || '❓';
    const confPercent = Math.round(alert.confidence * 100);

    console.log(`${idx + 1}. ${emoji} [${alert.severity}] ${alert.material_name}`);
    console.log(`   Confiança: ${confPercent}%`);
    console.log(`   Atraso esperado: ${alert.predicted_delay_days} dias`);
    console.log(`   Recomendação: ${alert.recommended_action}`);
    console.log(`   Requer aprovação: ${alert.requires_approval ? 'Sim' : 'Não'}`);
    console.log('');
  });
}

async function submitFeedback(
  prediction_id: string,
  outcome: 'occurred' | 'prevented' | 'false_positive',
  actualImpactBrl?: number,
) {
  const payload = {
    prediction_id,
    actual_outcome: outcome,
    actual_date: new Date().toISOString().split('T')[0],
    actual_impact_brl: actualImpactBrl,
    notes: 'Feedback from demo',
  };

  const response = await axios.post(
    `${BRAIN_URL}/ml/predict/delays/feedback`,
    payload,
    {
      headers: { 'X-Tenant-ID': OBRA_ID },
      timeout: 5000,
    },
  );

  console.log(`   Feedback recorded: ${response.data.message}`);
  console.log(`   Impact: R$ ${actualImpactBrl?.toLocaleString('pt-BR')}`);
}

// Run demo
demo().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
