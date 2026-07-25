import React, { useState, useEffect } from 'react';
import './DelayAlertsCard.css';

/**
 * Delay Alerts Card Component
 * Displays material delay predictions with Approve/Reject workflow
 *
 * Props:
 *  - obraId: string (construction site ID)
 *  - forecastDays: number (default 7)
 *  - onFeedbackSubmitted: callback after feedback
 */

interface DelayAlert {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  material: string;
  predictedDate: string;
  estimatedDelay: number;
  estimatedImpact: string;
  recommendation: string;
  requiresApproval: boolean;
}

interface AlertsResponse {
  status: 'success' | 'partial' | 'error';
  alerts: DelayAlert[];
  summary: {
    total: number;
    critical: number;
    high: number;
    totalImpact: string;
  };
  metadata: {
    obraId: string;
    forecastDays: number;
    retrievedAt: string;
    brainHealthy: boolean;
  };
  errors?: string[];
}

interface DelayAlertsCardProps {
  obraId: string;
  forecastDays?: number;
  onFeedbackSubmitted?: (prediction_id: string, outcome: string) => void;
}

export const DelayAlertsCard: React.FC<DelayAlertsCardProps> = ({
  obraId,
  forecastDays = 7,
  onFeedbackSubmitted,
}) => {
  const [alerts, setAlerts] = useState<DelayAlert[]>([]);
  const [summary, setSummary] = useState<AlertsResponse['summary'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Fetch alerts on mount or when obraId changes
  useEffect(() => {
    fetchAlerts();
  }, [obraId, forecastDays]);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/alerts/obras/${obraId}/delay-alerts?forecast_days=${forecastDays}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data: AlertsResponse = await response.json();

      if (data.status === 'success' || data.status === 'partial') {
        setAlerts(data.alerts);
        setSummary(data.summary);

        if (data.errors && data.errors.length > 0) {
          setError(`Warning: ${data.errors.join(', ')}`);
        }
      } else {
        setError('Failed to fetch alerts');
        setAlerts([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load alerts: ${message}`);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (alert: DelayAlert) => {
    setSubmitting(alert.id);

    try {
      const response = await fetch(`/api/alerts/alerts/${alert.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obra_id: obraId,
          actual_date: new Date().toISOString().split('T')[0],
          notes: `Approved alert for ${alert.material}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit approval');
      }

      // Remove alert from list
      setAlerts((prev) => prev.filter((a) => a.id !== alert.id));

      // Update summary
      if (summary) {
        setSummary({
          ...summary,
          total: summary.total - 1,
          [alert.severity.toLowerCase()]: Math.max(
            0,
            summary[alert.severity.toLowerCase() as keyof typeof summary] - 1
          ),
        });
      }

      onFeedbackSubmitted?.(alert.id, 'occurred');
    } catch (err) {
      setError(
        `Failed to approve: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async (alert: DelayAlert) => {
    setSubmitting(alert.id);

    try {
      const response = await fetch(`/api/alerts/alerts/${alert.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obra_id: obraId,
          notes: `Rejected as false positive: ${alert.material}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit rejection');
      }

      // Remove alert from list
      setAlerts((prev) => prev.filter((a) => a.id !== alert.id));

      // Update summary
      if (summary) {
        setSummary({
          ...summary,
          total: summary.total - 1,
        });
      }

      onFeedbackSubmitted?.(alert.id, 'false_positive');
    } catch (err) {
      setError(
        `Failed to reject: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setSubmitting(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      CRITICAL: '#dc2626',
      HIGH: '#ea580c',
      MEDIUM: '#eab308',
      LOW: '#16a34a',
    };
    return colors[severity] || '#6b7280';
  };

  // Loading state
  if (loading) {
    return (
      <div className="delay-alerts-card loading">
        <div className="spinner"></div>
        <p>Carregando alertas...</p>
      </div>
    );
  }

  // Empty state
  if (alerts.length === 0 && !error) {
    return (
      <div className="delay-alerts-card empty">
        <div className="empty-icon">✨</div>
        <h3>Sem alertas de atraso</h3>
        <p>Nenhum atraso de material previsto para os próximos {forecastDays} dias</p>
      </div>
    );
  }

  // Main render
  return (
    <div className="delay-alerts-card">
      <div className="card-header">
        <h2>⚠️ Alertas de Atraso de Material</h2>
        <button onClick={fetchAlerts} className="btn-refresh" disabled={loading}>
          🔄 Atualizar
        </button>
      </div>

      {error && (
        <div className="alert-error">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {summary && (
        <div className="summary">
          <div className="summary-item">
            <span className="label">Total</span>
            <span className="value">{summary.total}</span>
          </div>
          <div className="summary-item critical">
            <span className="label">Críticos</span>
            <span className="value">{summary.critical}</span>
          </div>
          <div className="summary-item high">
            <span className="label">Altos</span>
            <span className="value">{summary.high}</span>
          </div>
          <div className="summary-item impact">
            <span className="label">Impacto</span>
            <span className="value">{summary.totalImpact}</span>
          </div>
        </div>
      )}

      <div className="alerts-list">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`alert-item severity-${alert.severity.toLowerCase()}`}
            style={{
              borderLeftColor: getSeverityColor(alert.severity),
            }}
          >
            <div className="alert-header">
              <div className="alert-title">{alert.title}</div>
              <div className="alert-confidence">
                <span className="badge">{alert.confidence}%</span>
              </div>
            </div>

            <div className="alert-details">
              <div className="detail-row">
                <span className="label">Material:</span>
                <span className="value">{alert.material}</span>
              </div>
              <div className="detail-row">
                <span className="label">Atraso Esperado:</span>
                <span className="value">{alert.estimatedDelay} dias</span>
              </div>
              <div className="detail-row">
                <span className="label">Data Prevista:</span>
                <span className="value">{alert.predictedDate}</span>
              </div>
              <div className="detail-row">
                <span className="label">Impacto Estimado:</span>
                <span className="value">{alert.estimatedImpact}</span>
              </div>
            </div>

            <div className="alert-recommendation">
              <strong>Recomendação:</strong>
              <p>{alert.recommendation}</p>
            </div>

            {alert.requiresApproval && (
              <div className="alert-actions">
                <button
                  onClick={() => handleApprove(alert)}
                  disabled={submitting === alert.id}
                  className="btn btn-approve"
                >
                  ✅ Aprovar
                </button>
                <button
                  onClick={() => handleReject(alert)}
                  disabled={submitting === alert.id}
                  className="btn btn-reject"
                >
                  ❌ Rejeitar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card-footer">
        <small>
          Próxima atualização em {forecastDays} dias | Alimentado por Buildly Brain
        </small>
      </div>
    </div>
  );
};

export default DelayAlertsCard;
