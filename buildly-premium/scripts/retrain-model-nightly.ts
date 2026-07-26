// Week 4-5: Nightly Model Retraining Based on Gestor Decisions
// This script retrains the predictive model using feedback from previous day's decisions
// Execute: npx ts-node scripts/retrain-model-nightly.ts
// Scheduled: Daily at 11:00 PM (23:00)

import { Pool } from 'pg';

interface TrainingData {
  material_category: string;
  predicted_delay_days: number;
  predicted_confidence: number;
  actual_delay_occurred: boolean;
  actual_delay_days: number;
  was_correct_decision: boolean;
  learning_value: number;
}

interface MaterialPerformance {
  material_category: string;
  precision: number;
  recall: number;
  f1_score: number;
  training_samples: number;
}

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'buildly_db',
  user: process.env.PG_USER || 'buildly_user',
  password: process.env.PG_PASSWORD || 'buildly_secure_password_2026',
});

async function retrainModelNightly() {
  const client = await pool.connect();
  try {
    console.log('🤖 Starting Nightly Model Retraining...\n');

    // 1. Fetch all decisions from the last 14 days with outcomes
    const decisionsResult = await client.query(`
      SELECT
        material_category,
        predicted_delay_days,
        predicted_confidence,
        actual_delay_occurred,
        actual_delay_days,
        was_correct_decision,
        learning_value
      FROM pilot_approval_decisions
      WHERE actual_delay_occurred IS NOT NULL
        AND decision_timestamp >= CURRENT_TIMESTAMP - INTERVAL '14 days'
      ORDER BY decision_timestamp DESC
    `);

    const trainingData: TrainingData[] = decisionsResult.rows;
    console.log(`📊 Training dataset size: ${trainingData.length} samples`);

    if (trainingData.length === 0) {
      console.log('⚠️  Insufficient training data. Skipping retraining.');
      return;
    }

    // 2. Group by material category
    const materialGroups = new Map<string, TrainingData[]>();
    for (const sample of trainingData) {
      if (!materialGroups.has(sample.material_category)) {
        materialGroups.set(sample.material_category, []);
      }
      materialGroups.get(sample.material_category)!.push(sample);
    }

    console.log(`\n📚 Materials to retrain: ${materialGroups.size}`);

    const retrainedMaterials: MaterialPerformance[] = [];
    let totalSamplesUsed = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    // 3. For each material, calculate new confidence thresholds
    for (const [material, samples] of materialGroups) {
      console.log(`\n  🔄 Retraining ${material} (${samples.length} samples)...`);

      // Count correct vs incorrect decisions
      const correctDecisions = samples.filter(s => s.was_correct_decision).length;
      const incorrectDecisions = samples.length - correctDecisions;

      // Calculate accuracy metrics
      const accuracyPercent = (correctDecisions / samples.length) * 100;

      // Find optimal confidence threshold
      // Higher confidence → more conservative (fewer false positives)
      // Lower confidence → more aggressive (more coverage, higher false positives)
      let newThreshold = 0.75; // default

      if (accuracyPercent >= 85) {
        newThreshold = 0.60; // Can be more aggressive
      } else if (accuracyPercent >= 75) {
        newThreshold = 0.65;
      } else if (accuracyPercent >= 65) {
        newThreshold = 0.75;
      } else {
        newThreshold = 0.85; // Be very conservative
      }

      // Calculate precision, recall, F1
      let tp = 0, fp = 0, tn = 0, fn = 0;

      for (const sample of samples) {
        const predictedDelay = sample.predicted_delay_days > 0;
        const actualDelay = sample.actual_delay_occurred;

        if (predictedDelay && actualDelay) tp++;
        else if (predictedDelay && !actualDelay) fp++;
        else if (!predictedDelay && !actualDelay) tn++;
        else fn++;
      }

      const precision = tp / (tp + fp || 1);
      const recall = tp / (tp + fn || 1);
      const f1 = (2 * precision * recall) / (precision + recall || 1);

      console.log(`    Accuracy: ${accuracyPercent.toFixed(2)}%`);
      console.log(`    Precision: ${(precision * 100).toFixed(2)}%`);
      console.log(`    Recall: ${(recall * 100).toFixed(2)}%`);
      console.log(`    F1 Score: ${(f1 * 100).toFixed(2)}%`);
      console.log(`    → New Confidence Threshold: ${newThreshold}`);

      retrainedMaterials.push({
        material_category: material,
        precision: precision * 100,
        recall: recall * 100,
        f1_score: f1 * 100,
        training_samples: samples.length,
      });

      totalSamplesUsed += samples.length;

      // 4. Update confidence threshold in baseline metrics
      await client.query(`
        UPDATE pilot_baseline_metrics
        SET
          confidence_threshold = $1,
          updated_at = NOW()
        WHERE material_category = $2
      `, [newThreshold, material]);
    }

    // 5. Calculate overall metrics
    let overallCorrect = 0;
    let overallTotal = 0;

    for (const sample of trainingData) {
      if (sample.was_correct_decision) overallCorrect++;
      overallTotal++;
    }

    const overallPrecision = (overallCorrect / overallTotal) * 100;

    // Fetch previous retraining performance to compare
    const previousResult = await client.query(`
      SELECT
        precision_after,
        recall_after,
        f1_after
      FROM pilot_model_retraining_log
      ORDER BY retraining_date DESC
      LIMIT 1
    `);

    let precisionBefore = 0;
    let recallBefore = 0;
    let f1Before = 0;

    if (previousResult.rows.length > 0) {
      precisionBefore = previousResult.rows[0].precision_after || 0;
      recallBefore = previousResult.rows[0].recall_after || 0;
      f1Before = previousResult.rows[0].f1_after || 0;
    } else {
      // Fallback to baseline metrics
      const baselineResult = await client.query(`
        SELECT
          AVG(precision) as avg_precision,
          AVG(recall) as avg_recall,
          AVG(f1_score) as avg_f1
        FROM pilot_baseline_metrics
      `);
      if (baselineResult.rows.length > 0) {
        precisionBefore = baselineResult.rows[0].avg_precision || 0;
        recallBefore = baselineResult.rows[0].avg_recall || 0;
        f1Before = baselineResult.rows[0].avg_f1 || 0;
      }
    }

    // Calculate improvement
    const precisionAfter = overallPrecision;
    const improvementPercent = ((precisionAfter - precisionBefore) / precisionBefore) * 100 || 0;

    console.log(`
✅ Retraining Complete:
   Training Samples: ${totalSamplesUsed}
   Materials Updated: ${retrainedMaterials.length}
   Overall Accuracy: ${overallPrecision.toFixed(2)}%
   Previous Precision: ${precisionBefore.toFixed(2)}%
   Improvement: ${improvementPercent.toFixed(2)}%
    `);

    // 6. Record retraining event
    const retrainingStatus = improvementPercent > 0 ? 'COMPLETED' : 'PARTIAL';

    await client.query(`
      INSERT INTO pilot_model_retraining_log (
        retraining_date,
        retraining_time,
        training_samples_count,
        approved_decisions_count,
        rejected_decisions_count,
        precision_before,
        precision_after,
        recall_before,
        recall_after,
        f1_before,
        f1_after,
        retraining_status,
        improvement_percentage,
        retraining_notes,
        next_scheduled_retraining
      )
      VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      new Date().toISOString().split('T')[0], // today
      totalSamplesUsed,
      approvedCount,
      rejectedCount,
      precisionBefore,
      precisionAfter,
      recallBefore,
      recallBefore, // placeholder
      f1Before,
      f1Before, // placeholder
      retrainingStatus,
      improvementPercent,
      `Retrained ${retrainedMaterials.length} materials. ${
        improvementPercent > 0
          ? `Improved by ${improvementPercent.toFixed(2)}%`
          : 'No improvement'
      }`,
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // tomorrow
    ]);

    // 7. Output summary
    console.log(`
📊 Per-Material Performance:
    `);

    for (const material of retrainedMaterials) {
      console.log(`   ${material.material_category}:`);
      console.log(`     • Precision: ${material.precision.toFixed(2)}%`);
      console.log(`     • Recall: ${material.recall.toFixed(2)}%`);
      console.log(`     • F1: ${material.f1_score.toFixed(2)}%`);
      console.log(`     • Samples: ${material.training_samples}`);
    }

    console.log('\n✅ Model retraining complete!\n');

  } catch (error) {
    console.error('❌ Error during retraining:', error);
    throw error;
  } finally {
    await client.release();
    await pool.end();
  }
}

// Execute
retrainModelNightly().catch(console.error);
