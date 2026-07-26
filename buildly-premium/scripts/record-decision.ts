// Week 4-5: Record Gestor Approval/Rejection Decisions
// This API endpoint receives decisions from gestores via web form or API call
// Execute: npx ts-node scripts/record-decision.ts (starts server)

import express from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'buildly_db',
  user: process.env.PG_USER || 'buildly_user',
  password: process.env.PG_PASSWORD || 'buildly_secure_password_2026',
});

interface DecisionPayload {
  site_id: string;
  prediction_id?: string;
  prediction_date: string;
  material_category: string;
  predicted_delay_days: number;
  predicted_confidence: number;
  predicted_severity: string;
  gestor_id: string;
  decision: 'APPROVED' | 'REJECTED' | 'DEFERRED';
  decision_notes?: string;
}

// Endpoint: POST /api/decisions
app.post('/api/decisions', async (req, res) => {
  const client = await pool.connect();
  try {
    const payload: DecisionPayload = req.body;

    // Validate required fields
    if (!payload.site_id || !payload.gestor_id || !payload.decision) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['site_id', 'gestor_id', 'decision'],
      });
    }

    // Validate decision value
    if (!['APPROVED', 'REJECTED', 'DEFERRED'].includes(payload.decision)) {
      return res.status(400).json({ error: 'Invalid decision value' });
    }

    const decisionId = uuidv4();

    // Record the decision
    const result = await client.query(`
      INSERT INTO pilot_approval_decisions (
        id,
        site_id,
        prediction_id,
        prediction_date,
        material_category,
        predicted_delay_days,
        predicted_confidence,
        predicted_severity,
        gestor_id,
        decision,
        decision_notes,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id, decision_timestamp
    `, [
      decisionId,
      payload.site_id,
      payload.prediction_id || null,
      payload.prediction_date,
      payload.material_category,
      payload.predicted_delay_days,
      payload.predicted_confidence,
      payload.predicted_severity,
      payload.gestor_id,
      payload.decision,
      payload.decision_notes || null,
    ]);

    console.log(`📝 Decision recorded:
  Site: ${payload.site_id}
  Gestor: ${payload.gestor_id}
  Material: ${payload.material_category}
  Decision: ${payload.decision}
  Confidence: ${payload.predicted_confidence}
  Notes: ${payload.decision_notes || 'N/A'}
    `);

    res.status(201).json({
      status: 'ok',
      decision_id: result.rows[0].id,
      decision_timestamp: result.rows[0].decision_timestamp,
      message: `Decision recorded for ${payload.material_category}`,
    });

  } catch (error) {
    console.error('❌ Error recording decision:', error);
    res.status(500).json({ error: 'Failed to record decision' });
  } finally {
    client.release();
  }
});

// Endpoint: GET /api/decisions (fetch pending decisions for a site)
app.get('/api/decisions/:siteId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { siteId } = req.params;
    const { pending_only } = req.query;

    let query = `
      SELECT
        id,
        prediction_date,
        material_category,
        predicted_delay_days,
        predicted_confidence,
        predicted_severity,
        gesture_id,
        decision,
        decision_timestamp,
        decision_notes
      FROM pilot_approval_decisions
      WHERE site_id = $1
    `;

    if (pending_only === 'true') {
      query += ` AND actual_delay_occurred IS NULL`;
    }

    query += ` ORDER BY decision_timestamp DESC LIMIT 50`;

    const result = await client.query(query, [siteId]);

    res.status(200).json({
      status: 'ok',
      site_id: siteId,
      total_decisions: result.rows.length,
      decisions: result.rows,
    });

  } catch (error) {
    console.error('❌ Error fetching decisions:', error);
    res.status(500).json({ error: 'Failed to fetch decisions' });
  } finally {
    client.release();
  }
});

// Endpoint: PUT /api/decisions/:decisionId/outcome
// Record actual outcome (7+ days after decision)
app.put('/api/decisions/:decisionId/outcome', async (req, res) => {
  const client = await pool.connect();
  try {
    const { decisionId } = req.params;
    const { actual_delay_occurred, actual_delay_days } = req.body;

    // Fetch the decision to calculate impact
    const decisionResult = await client.query(`
      SELECT
        predicted_delay_days,
        predicted_severity,
        decision
      FROM pilot_approval_decisions
      WHERE id = $1
    `, [decisionId]);

    if (decisionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    const decision = decisionResult.rows[0];

    // Determine if decision was correct
    const predictedDelay = decision.predicted_delay_days > 0;
    let wasCorrect = false;

    if (decision.decision === 'APPROVED' && actual_delay_occurred) {
      wasCorrect = true; // Correctly approved (delay prevention action taken)
    } else if (decision.decision === 'REJECTED' && !actual_delay_occurred) {
      wasCorrect = true; // Correctly rejected (no false alarm)
    }

    // Calculate learning value (0-100 scale)
    // High learning value for: surprising outcomes, edge cases
    let learningValue = 50; // baseline

    if (wasCorrect) {
      learningValue = 30; // Low learning value for correct predictions
    } else {
      learningValue = 85; // High learning value for incorrect predictions (need to improve)
    }

    // Update decision with outcome
    const updateResult = await client.query(`
      UPDATE pilot_approval_decisions
      SET
        actual_delay_occurred = $1,
        actual_delay_days = $2,
        outcome_recorded_at = NOW(),
        was_correct_decision = $3,
        learning_value = $4,
        updated_at = NOW()
      WHERE id = $5
      RETURNING
        id,
        was_correct_decision,
        learning_value
    `, [
      actual_delay_occurred,
      actual_delay_days || null,
      wasCorrect,
      learningValue,
      decisionId,
    ]);

    console.log(`✅ Outcome recorded:
  Decision: ${decisionId}
  Actual Delay: ${actual_delay_occurred ? `Yes (${actual_delay_days}d)` : 'No'}
  Was Correct: ${wasCorrect}
  Learning Value: ${learningValue}/100
    `);

    res.status(200).json({
      status: 'ok',
      decision_id: decisionId,
      actual_delay_occurred,
      actual_delay_days,
      was_correct_decision: wasCorrect,
      learning_value: learningValue,
      message: `Outcome recorded for decision ${decisionId}`,
    });

  } catch (error) {
    console.error('❌ Error recording outcome:', error);
    res.status(500).json({ error: 'Failed to record outcome' });
  } finally {
    client.release();
  }
});

// Endpoint: GET /api/quality (get gestor quality metrics)
app.get('/api/quality/:siteId', async (req, res) => {
  const client = await pool.connect();
  try {
    const { siteId } = req.params;

    const result = await client.query(`
      SELECT * FROM v_approval_gestor_quality
      WHERE site_id = $1
      ORDER BY accuracy_percent DESC
    `, [siteId]);

    res.status(200).json({
      status: 'ok',
      site_id: siteId,
      gestor_quality_metrics: result.rows,
    });

  } catch (error) {
    console.error('❌ Error fetching quality metrics:', error);
    res.status(500).json({ error: 'Failed to fetch quality metrics' });
  } finally {
    client.release();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'decision-recorder' });
});

// Start server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`🚀 Decision Recorder API running on port ${PORT}`);
  console.log(`📝 POST /api/decisions — Record a new decision`);
  console.log(`📋 GET /api/decisions/:siteId — List decisions for site`);
  console.log(`✅ PUT /api/decisions/:decisionId/outcome — Record actual outcome`);
  console.log(`📊 GET /api/quality/:siteId — Get quality metrics`);
});

export default app;
