// Week 1: Generate Baseline Predictions for Pilot Sites
// Execute: npx ts-node scripts/generate-baseline-predictions.ts

import { Pool } from 'pg';

interface PilotSite {
  id: string;
  site_name: string;
  client_name: string;
}

interface MaterialHistory {
  material_name: string;
  material_category: string;
  total_records: number;
  delayed_records: number;
  avg_delay_days: number;
  max_delay_days: number;
  min_delay_days: number;
}

interface BaselinePrediction {
  site_id: string;
  material_name: string;
  material_category: string;
  predicted_delay_days: number;
  confidence: number;
  severity: string;
  predicted_cost_impact_brl: number;
  historical_occurrences: number;
  average_historical_delay_days: number;
  prediction_notes: string;
}

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'buildly_db',
  user: process.env.PG_USER || 'buildly_user',
  password: process.env.PG_PASSWORD || 'buildly_secure_password_2026',
});

async function generateBaselinePredictions() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Baseline Prediction Generation for Pilot Sites...\n');

    // 1. Fetch all pilot sites
    const sitesResult = await client.query(`
      SELECT id, site_name, client_name FROM pilot_sites
      WHERE status IN ('data_loaded', 'baseline_ready')
      ORDER BY created_at
    `);

    const sites: PilotSite[] = sitesResult.rows;
    console.log(`📍 Found ${sites.length} pilot sites ready for baseline predictions\n`);

    let totalPredictionsCreated = 0;

    for (const site of sites) {
      console.log(`\n📊 Processing: ${site.site_name} (${site.client_name})`);
      console.log(`   Location: ${site.id}`);

      // 2. Analyze material history for this site
      const historyResult = await client.query(`
        SELECT
          material_name,
          material_category,
          COUNT(*) as total_records,
          COUNT(CASE WHEN delay_days > 0 THEN 1 END) as delayed_records,
          ROUND(AVG(CASE WHEN delay_days > 0 THEN delay_days ELSE NULL END)::NUMERIC, 2) as avg_delay_days,
          MAX(CASE WHEN delay_days > 0 THEN delay_days ELSE NULL END) as max_delay_days,
          MIN(CASE WHEN delay_days > 0 THEN delay_days ELSE NULL END) as min_delay_days
        FROM pilot_material_history
        WHERE site_id = $1
        GROUP BY material_name, material_category
        ORDER BY delayed_records DESC
      `, [site.id]);

      const materials: MaterialHistory[] = historyResult.rows;
      console.log(`   📦 Analyzing ${materials.length} material types`);

      // 3. Generate baseline predictions for each material
      const predictions: BaselinePrediction[] = [];

      for (const material of materials) {
        const delayRate = material.delayed_records / material.total_records;
        const avgDelay = material.avg_delay_days || 0;

        // Confidence = (# of samples * delay rate) / total possible = statistical confidence
        const confidence = Math.min(
          (material.total_records / 100) * (1 - Math.abs(delayRate - 0.5) * 2),
          0.95 // Cap at 95% confidence for realism
        );

        // Predict delay if historical rate > 10%
        const predictedDelayDays = delayRate > 0.1 ? Math.ceil(avgDelay * 0.9) : 0;

        // Severity based on predicted delay and cost impact
        let severity = 'LOW';
        if (predictedDelayDays >= 15) severity = 'CRITICAL';
        else if (predictedDelayDays >= 10) severity = 'HIGH';
        else if (predictedDelayDays >= 5) severity = 'MEDIUM';

        // Cost impact from material category
        const costPerDayMap: Record<string, number> = {
          'Cimento': 12000,
          'Aço': 15000,
          'Blocos': 8000,
          'Vidro': 25000,
          'Esquadrias': 20000,
          'Maquinário': 50000,
          'Diesel': 5000,
          'Alvenaria': 7000,
          'Acabamentos': 10000,
        };

        const costPerDay = costPerDayMap[material.material_category] || 10000;
        const predictedCostImpact = predictedDelayDays * costPerDay;

        const prediction: BaselinePrediction = {
          site_id: site.id,
          material_name: material.material_name,
          material_category: material.material_category,
          predicted_delay_days: predictedDelayDays,
          confidence: Math.round(confidence * 10000) / 10000,
          severity,
          predicted_cost_impact_brl: predictedCostImpact,
          historical_occurrences: material.delayed_records,
          average_historical_delay_days: Math.round(avgDelay * 100) / 100,
          prediction_notes: `Based on ${material.total_records} historical records (${material.delayed_records} delays). Delay rate: ${(delayRate * 100).toFixed(1)}%. Max historical delay: ${material.max_delay_days} days.`,
        };

        predictions.push(prediction);
      }

      // 4. Insert predictions into database
      for (const pred of predictions) {
        await client.query(`
          INSERT INTO pilot_baseline_predictions (
            site_id, material_name, material_category, predicted_delay_days,
            confidence, severity, predicted_cost_impact_brl,
            historical_occurrences, average_historical_delay_days, prediction_notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT DO NOTHING
        `, [
          pred.site_id,
          pred.material_name,
          pred.material_category,
          pred.predicted_delay_days,
          pred.confidence,
          pred.severity,
          pred.predicted_cost_impact_brl,
          pred.historical_occurrences,
          pred.average_historical_delay_days,
          pred.prediction_notes,
        ]);

        totalPredictionsCreated++;
      }

      // 5. Log results for this site
      const criticalCount = predictions.filter(p => p.severity === 'CRITICAL').length;
      const highCount = predictions.filter(p => p.severity === 'HIGH').length;
      const totalCost = predictions.reduce((sum, p) => sum + p.predicted_cost_impact_brl, 0);

      console.log(`   ✅ Generated ${predictions.length} baseline predictions`);
      console.log(`      - Critical risk: ${criticalCount} materials`);
      console.log(`      - High risk: ${highCount} materials`);
      console.log(`      - Potential cost exposure: R$ ${totalCost.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`);
    }

    // 6. Update site status to baseline_ready
    await client.query(`
      UPDATE pilot_sites
      SET status = 'baseline_ready', updated_at = NOW()
      WHERE status = 'data_loaded'
    `);

    console.log(`\n\n📈 Baseline Prediction Generation Complete!`);
    console.log(`✅ Total predictions created: ${totalPredictionsCreated}`);
    console.log(`📍 All sites now in 'baseline_ready' status\n`);

    // 7. Display summary statistics
    const summaryResult = await client.query(`
      SELECT
        ps.site_name,
        COUNT(pbp.id) as prediction_count,
        COUNT(CASE WHEN pbp.severity = 'CRITICAL' THEN 1 END) as critical_count,
        COUNT(CASE WHEN pbp.severity = 'HIGH' THEN 1 END) as high_count,
        ROUND(AVG(pbp.confidence)::NUMERIC, 4) as avg_confidence,
        SUM(pbp.predicted_cost_impact_brl) as total_cost_exposure
      FROM pilot_sites ps
      LEFT JOIN pilot_baseline_predictions pbp ON ps.id = pbp.site_id
      WHERE ps.status = 'baseline_ready'
      GROUP BY ps.site_name
      ORDER BY total_cost_exposure DESC
    `);

    console.log('Summary by Site:');
    console.log('═'.repeat(120));
    console.log(
      'Site Name'.padEnd(35) +
      'Predictions'.padEnd(15) +
      'Critical'.padEnd(12) +
      'High'.padEnd(12) +
      'Avg Confidence'.padEnd(18) +
      'Cost Exposure (R$)'
    );
    console.log('═'.repeat(120));

    for (const row of summaryResult.rows) {
      console.log(
        (row.site_name || 'N/A').padEnd(35) +
        (row.prediction_count || 0).toString().padEnd(15) +
        (row.critical_count || 0).toString().padEnd(12) +
        (row.high_count || 0).toString().padEnd(12) +
        (row.avg_confidence || 0).toFixed(4).padEnd(18) +
        `R$ ${(row.total_cost_exposure || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      );
    }
    console.log('═'.repeat(120) + '\n');

  } catch (error) {
    console.error('❌ Error generating baseline predictions:', error);
    throw error;
  } finally {
    await client.release();
    await pool.end();
  }
}

generateBaselinePredictions().catch(error => {
  console.error(error);
  process.exit(1);
});
