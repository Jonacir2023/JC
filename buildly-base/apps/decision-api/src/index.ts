import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'UP',
    service: 'Decision API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.post('/decisions', (req, res) => {
  const { type, context } = req.body;

  return res.json({
    decision_id: crypto.randomUUID(),
    type,
    status: 'pending_review',
    context,
    created_at: new Date().toISOString(),
  });
});

app.get('/decisions/:id', (req, res) => {
  const { id } = req.params;

  return res.json({
    decision_id: id,
    status: 'approved',
    approved_at: new Date().toISOString(),
    approver_id: 'user-1',
  });
});

app.listen(PORT, () => {
  console.log(`✅ Decision API rodando em http://0.0.0.0:${PORT}`);
});
