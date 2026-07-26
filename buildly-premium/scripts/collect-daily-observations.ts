// Week 2-3: Collect Daily Observations and Calculate Accuracy Metrics
// Execute: npx ts-node scripts/collect-daily-observations.ts
// Scheduled: Daily at 8:00 PM (20:00)

import { Pool } from 'pg';

interface PilotSite {
  id: string;
  site_name: string;
  client_name: string;
}

interface DailyPrediction {
  id: string;
  site_id: string;
  material_category: string;
  predicted_delay_days: number;
  confidence_score: number;
  severity: string;
  prediction_date: string;
}

interface AccuracyMetrics {
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
  precision_rate: number;
  recall_rate: number;
  false_positive_rate: number;
  false_negative_rate: number;
}

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'buildly_db',
  user: process.env.PG_USER || 'buildly_user',
  password: process.env.PG_PASSWORD || 'buildly_secure_password_2026',
});

async function collectDailyObservations() {
  const client = await pool.connect();
  try {
    console.log('📊 Starting Daily Observation Collection...\n');

    // 1. Fetch all pilot sites
    const sitesResult = await client.query(`
      SELECT id, site_name, client_name FROM pilot_sites
    `);
    const sites: PilotSite[] = sitesResult.rows;

    // 2. For each site, collect observations for today
    for (const site of sites) {
      console.log(`\n📍 Processing ${site.site_name} (${site.client_name})`);

      // Fetch predictions generated yesterday (to compare with actual outcomes)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const predictionsResult = await client.query(`
        SELECT
          id,
          site_id,
          material_category,
          predicted_delay_days,
          confidence_score,
          severity,
          prediction_date
        FROM pilot_baseline_predictions
        WHERE site_id = $1
          AND prediction_date = $2::date
        ORDER BY confidence_score DESC
      `, [site.id, yesterdayStr]);

      const predictions: DailyPrediction[] = predictionsResult.rows;
      console.log(`  ✓ Found ${predictions.length} predictions from ${yesterdayStr}`);

      // For each prediction, check actual delivery outcome
      let truePositives = 0;
      let falsePositives = 0;
      let trueNegatives = 0;
      let falseNegatives = 0;
      let totalCostExposure = 0;
      let preventedCost = 0;
      let criticalCount = 0;
      let highCount = 0;
      let mediumCount = 0;
      let lowCount = 0;
      let totalConfidence = 0;

      for (const prediction of predictions) {
        // Check if material actually arrived on time or late
        // In real scenario, this queries delivery logs or IoT sensors
        const outcomeResult = await client.query(`
          SELECT
            actual_delay_days,
            cost_impact_brl
          FROM pilot_delivery_outcomes
          WHERE site_id = $1
            AND material_category = $2
            AND delivery_date = $3::date
          LIMIT 1
        `, [site.id, prediction.material_category, yesterdayStr]);

        let actualDelayDays = 0;
        let costImpact = 0;

        if (outcomeResult.rows.length > 0) {
          actualDelayDays = outcomeResult.rows[0].actual_delay_days || 0;
          costImpact = outcomeResult.rows[0].cost_impact_brl || 0;
        }

        // Calculate TP/FP/TN/FN
        const predictedDelay = prediction.predicted_delay_days > 0;
        const actualDelay = actualDelayDays > 0;

        if (predictedDelay && actualDelay) {
          truePositives++;
          console.log(`    TP: Predicted ${prediction.material_category} would delay, confirmed (${actualDelayDays}d)`);
        } else if (predictedDelay && !actualDelay) {
          falsePositives++;
          console.log(`    FP: Predicted ${prediction.material_category} would delay, but arrived on-time`);
        } else if (!predictedDelay && !actualDelay) {
          trueNegatives++;
        } else {
          falseNegatives++;
          console.log(`    FN: Predicted ${prediction.material_category} on-time, but delayed (${actualDelayDays}d)`);
        }

        // Track severity distribution
        switch (prediction.severity) {
          case 'CRITICAL': criticalCount++; break;
          case 'HIGH': highCount++; break;
          case 'MEDIUM': mediumCount++; break;
          case 'LOW': lowCount++; break;
        }

        totalConfidence += prediction.confidence_score;
        totalCostExposure += costImpact;

        // Cost prevention: if TP, assume prediction prevented the delay cost
        if (predictedDelay && actualDelay && costImpact > 0) {
          preventedCost += costImpact * 0.7; // Optimistic: 70% of cost would've been saved
        }
      }

      // Calculate metrics
      const totalPredictions = predictions.length || 1;
      const metrics: AccuracyMetrics = {
        true_positives: truePositives,
        false_positives: falsePositives,
        true_negatives: trueNegatives,
        false_negatives: falseNegatives,
        precision_rate: (truePositives / (truePositives + falsePositives || 1)) * 100,
        recall_rate: (truePositives / (truePositives + falseNegatives || 1)) * 100,
        false_positive_rate: (falsePositives / (falsePositives + truePositives || 1)) * 100,
        false_negative_rate: (falseNegatives / (falseNegatives + truePositives || 1)) * 100,
      };

      const avgConfidence = totalConfidence / totalPredictions;

      console.log(`
  📈 Daily Metrics for ${yesterdayStr}:
     • Predictions: ${totalPredictions}
     • TP: ${truePositives} | FP: ${falsePositives} | TN: ${trueNegatives} | FN: ${falseNegatives}
     • Precision: ${metrics.precision_rate.toFixed(2)}%
     • Recall: ${metrics.recall_rate.toFixed(2)}%
     • Avg Confidence: ${avgConfidence.toFixed(4)}
     • Severity: CRITICAL=${criticalCount}, HIGH=${highCount}, MEDIUM=${mediumCount}, LOW=${lowCount}
     • Cost Exposure: R$ ${(totalCostExposure / 1000000).toFixed(2)}M
     • Cost Prevented: R$ ${(preventedCost / 1000000).toFixed(2)}M
      `);

      // 3. Insert daily observation record
      const observationResult = await client.query(`
        INSERT INTO pilot_soft_launch_observations (
          site_id,
          observation_date,
          predictions_generated,
          avg_confidence_score,
          critical_count,
          high_count,
          medium_count,
          low_count,
          actual_delays_observed,
          true_positives,
          false_positives,
          true_negatives,
          false_negatives,
          false_positive_rate,
          false_negative_rate,
          precision_rate,
          recall_rate,
          total_cost_exposure_brl,
          prevented_cost_brl,
          recorded_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
        ON CONFLICT (site_id, observation_date)
        DO UPDATE SET
          predictions_generated = EXCLUDED.predictions_generated,
          avg_confidence_score = EXCLUDED.avg_confidence_score,
          critical_count = EXCLUDED.critical_count,
          high_count = EXCLUDED.high_count,
          medium_count = EXCLUDED.medium_count,
          low_count = EXCLUDED.low_count,
          actual_delays_observed = EXCLUDED.actual_delays_observed,
          true_positives = EXCLUDED.true_positives,
          false_positives = EXCLUDED.false_positives,
          true_negatives = EXCLUDED.true_negatives,
          false_negatives = EXCLUDED.false_negatives,
          false_positive_rate = EXCLUDED.false_positive_rate,
          false_negative_rate = EXCLUDED.false_negative_rate,
          precision_rate = EXCLUDED.precision_rate,
          recall_rate = EXCLUDED.recall_rate,
          total_cost_exposure_brl = EXCLUDED.total_cost_exposure_brl,
          prevented_cost_brl = EXCLUDED.prevented_cost_brl,
          updated_at = NOW()
        RETURNING id
      `, [
        site.id,
        yesterdayStr,
        totalPredictions,
        parseFloat(avgConfidence.toFixed(4)),
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        truePositives + falseNegatives, // actual delays observed
        truePositives,
        falsePositives,
        trueNegatives,
        falseNegatives,
        parseFloat(metrics.false_positive_rate.toFixed(2)),
        parseFloat(metrics.false_negative_rate.toFixed(2)),
        parseFloat(metrics.precision_rate.toFixed(2)),
        parseFloat(metrics.recall_rate.toFixed(2)),
        totalCostExposure,
        preventedCost,
      ]);

      console.log(`  ✓ Observation recorded: ${observationResult.rows[0].id}`);
    }

    // Query daily aggregate summary
    const summaryResult = await client.query(`
      SELECT * FROM v_soft_launch_daily_aggregate
      WHERE observation_date = CURRENT_DATE - INTERVAL '1 day'
    `);

    if (summaryResult.rows.length > 0) {
      const summary = summaryResult.rows[0];
      console.log(`
✅ Daily Summary (${summary.observation_date}):
   Sites: ${summary.sites_observed}
   Total Predictions: ${summary.total_predictions}
   Avg Confidence: ${summary.avg_confidence_overall}
   Overall Precision: ${summary.precision_rate_overall || 'N/A'}%
   Overall Recall: ${summary.recall_rate_overall || 'N/A'}%
   System Uptime: ${summary.avg_uptime || 'N/A'}%
      `);
    }

    console.log('\n✅ Daily observation collection complete!\n');

  } catch (error) {
    console.error('❌ Error collecting observations:', error);
    throw error;
  } finally {
    await client.release();
    await pool.end();
  }
}

// Execute
collectDailyObservations().catch(console.error);
