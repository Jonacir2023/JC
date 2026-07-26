# 📡 Buildly Premium — API Documentation

**Version:** 1.0.0  
**Base URLs:**
- Core API (REST/GraphQL): `http://localhost:3001`
- Decision API: `http://localhost:3003`
- Brain ML Engine: `http://localhost:3002`

---

## Authentication

All endpoints require JWT Bearer token:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/v1/alerts/obras/123
```

**Getting a Token:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "gestor@company.com", "password": "password"}'
```

---

## Core API (NestJS, Port 3001)

### Health Check
```
GET /health
```

### Alerts (Material Delays)

#### List Alerts
```
GET /api/v1/alerts/obras/{obraId}?status=open&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "alert-123",
      "material_name": "Vidro temperado 4mm",
      "delay_probability": 0.87,
      "confidence_score": 0.82,
      "predicted_delay_days": 7,
      "predicted_cost_impact_brl": 12500.00,
      "status": "open"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

#### Approve Alert
```
POST /api/v1/alerts/{alertId}/approve
```

**Request:**
```json
{
  "notes": "Expediting shipment with UPS",
  "approved_by": "gestor-123"
}
```

#### Reject Alert
```
POST /api/v1/alerts/{alertId}/reject
```

---

## Decision API (Express, Port 3003)

### Record Decision
```
POST /api/decisions
```

**Request:**
```json
{
  "alert_id": "alert-123",
  "site_id": "site-sp-01",
  "decision": "APPROVED",
  "notes": "Contacted supplier"
}
```

**Response:**
```json
{
  "id": "dec-456",
  "decision": "APPROVED",
  "recorded_at": "2026-07-26T08:15:30Z",
  "status": "pending_outcome"
}
```

### Record Outcome (7+ days later)
```
PUT /api/decisions/{decisionId}/outcome
```

**Request:**
```json
{
  "outcome": "DELAY_OCCURRED",
  "actual_delay_days": 8,
  "actual_cost_impact_brl": 15200.00
}
```

### Quality Metrics
```
GET /api/quality/{siteId}?period=week
```

**Response:**
```json
{
  "metrics": {
    "precision": 0.87,
    "recall": 0.79,
    "f1_score": 0.83,
    "cost_saved_brl": 45230.00
  }
}
```

---

## Brain ML Engine (FastAPI, Port 3002)

### Health Check
```
GET /ml/health
```

### Generate Predictions
```
GET /ml/predict/alerts?site_id=site-sp-01&limit=5
```

**Response:**
```json
{
  "predictions": [
    {
      "material_name": "Vidro temperado",
      "delay_probability": 0.87,
      "confidence_score": 0.82,
      "predicted_delay_days": 7,
      "predicted_cost_impact_brl": 12500.00
    }
  ]
}
```

### Retrain Model
```
POST /ml/train/patterns
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Missing required field: site_id",
  "error": "ValidationError"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Alert not found"
}
```

### 429 Too Many Requests
```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded: 100 requests per minute"
}
```

---

## Rate Limiting

**100 requests per minute** per IP address.

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1690361400
```

---

**Buildly Premium API — Complete Reference 📡**
