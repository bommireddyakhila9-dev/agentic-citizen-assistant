import React, { useState } from 'react';
import { Server, RefreshCw, CheckCircle2, AlertTriangle, Clock } from './Icons';
import { checkHealth } from '../services/api';

export default function HealthStatusCard({ initialHealth, onRefreshParent }) {
  const [healthData, setHealthData] = useState(initialHealth);
  const [loading, setLoading] = useState(false);

  const handleTestConnection = async () => {
    setLoading(true);
    const result = await checkHealth();
    setHealthData(result);
    setLoading(false);
    if (onRefreshParent) {
      onRefreshParent(result.success ? 'connected' : 'disconnected');
    }
  };

  return (
    <div className="health-card">
      <div className="health-header">
        <div className="health-title-group">
          <div className="health-icon-box">
            <Server size={22} />
          </div>
          <div>
            <h3 className="health-title">FastAPI Backend Health Monitor</h3>
            <p className="health-endpoint">GET http://127.0.0.1:8000/api/v1/health</p>
          </div>
        </div>

        <button 
          onClick={handleTestConnection} 
          disabled={loading}
          className="btn-test"
        >
          <RefreshCw size={16} className={loading ? 'pulse' : ''} />
          <span>{loading ? 'Pinging...' : 'Test Connection'}</span>
        </button>
      </div>

      <div className="health-stats">
        <div className="stat-box">
          <div className="stat-label">System Status</div>
          <div className="stat-value" style={{ color: healthData?.success ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {healthData?.success ? (
              <>
                <CheckCircle2 size={18} />
                <span>ONLINE</span>
              </>
            ) : (
              <>
                <AlertTriangle size={18} />
                <span>OFFLINE</span>
              </>
            )}
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Round-Trip Latency</div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={18} color="#64748b" />
            <span>{healthData?.latency ?? '--'} ms</span>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-label">HTTP Status Code</div>
          <div className="stat-value" style={{ color: healthData?.status === 200 ? '#10b981' : '#64748b' }}>
            {healthData?.status ? `${healthData.status} OK` : 'No Response'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Server Response Payload (Live JSON)
        </div>
        <pre className="json-preview">
          {healthData?.data 
            ? JSON.stringify(healthData.data, null, 2) 
            : JSON.stringify({ error: healthData?.error || 'No response from server yet. Please ensure FastAPI is running.' }, null, 2)
          }
        </pre>
      </div>
    </div>
  );
}
