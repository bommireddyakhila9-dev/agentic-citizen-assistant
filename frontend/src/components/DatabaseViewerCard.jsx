import React, { useState, useEffect } from 'react';
import { Database, Search, CheckCircle2, Clock, AlertTriangle, Printer } from './Icons';
import { fetchGrievances, fetchGrievanceByTicket, fetchServices } from '../services/api';

export default function DatabaseViewerCard({ onOpenReceipt }) {
  const [ticketInput, setTicketInput] = useState('');
  const [searchedTicket, setSearchedTicket] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [grievances, setGrievances] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'schemes'

  useEffect(() => {
    loadDatabaseData();
  }, []);

  const loadDatabaseData = async () => {
    setLoading(true);
    const [grvRes, srvRes] = await Promise.all([fetchGrievances(), fetchServices()]);
    if (grvRes.success) setGrievances(grvRes.data);
    if (srvRes.success) setServices(srvRes.data);
    setLoading(false);
  };

  const handleTrackTicket = async (ticket) => {
    const target = ticket || ticketInput;
    if (!target.trim()) return;
    setSearchError('');
    setSearchedTicket(null);
    setLoading(true);

    const res = await fetchGrievanceByTicket(target.trim());
    if (res.success) {
      setSearchedTicket(res.data);
    } else {
      setSearchError(res.error || 'Ticket not found in municipal records.');
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return <span className="status-pill connected"><CheckCircle2 size={13} /> Resolved</span>;
      case 'in progress':
        return <span className="status-pill connecting"><Clock size={13} /> In Progress</span>;
      default:
        return <span className="status-pill disconnected"><AlertTriangle size={13} /> Pending</span>;
    }
  };

  return (
    <div className="health-card" style={{ maxWidth: '820px' }}>
      <div className="health-header">
        <div className="health-title-group">
          <div className="health-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Database size={22} />
          </div>
          <div>
            <h3 className="health-title">Municipal Records & Welfare Schemes</h3>
            <p className="health-endpoint">SQLAlchemy ORM • SQLite / MySQL Live Records</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn-test"
            style={{ 
              padding: '7px 15px', 
              fontSize: '0.8rem', 
              background: activeTab === 'tickets' ? 'var(--accent)' : 'var(--bg-card-subtle)', 
              color: activeTab === 'tickets' ? '#ffffff' : 'var(--text-muted)',
              border: activeTab === 'tickets' ? 'none' : '1px solid var(--border)',
              boxShadow: activeTab === 'tickets' ? '0 4px 12px var(--accent-glow)' : 'none',
            }}
            onClick={() => setActiveTab('tickets')}
          >
            Grievances ({grievances.length})
          </button>
          <button 
            className="btn-test"
            style={{ 
              padding: '7px 15px', 
              fontSize: '0.8rem', 
              background: activeTab === 'schemes' ? 'var(--accent)' : 'var(--bg-card-subtle)', 
              color: activeTab === 'schemes' ? '#ffffff' : 'var(--text-muted)',
              border: activeTab === 'schemes' ? 'none' : '1px solid var(--border)',
              boxShadow: activeTab === 'schemes' ? '0 4px 12px var(--accent-glow)' : 'none',
            }}
            onClick={() => setActiveTab('schemes')}
          >
            Schemes ({services.length})
          </button>
        </div>
      </div>

      {/* Ticket Tracker Search Box */}
      {activeTab === 'tickets' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="Enter Ticket ID (e.g. GRV-1001, GRV-1002)..."
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrackTicket()}
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <button 
              className="btn-test"
              onClick={() => handleTrackTicket()}
              disabled={loading}
              style={{ padding: '0 20px', borderRadius: '10px' }}
            >
              <Search size={16} />
              <span>Track</span>
            </button>
          </div>

          {/* Quick-click sample pills */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Try sample tickets:</span>
            {['GRV-1001', 'GRV-1002', 'GRV-1003', 'GRV-1004'].map((tk) => (
              <button 
                key={tk} 
                onClick={() => { setTicketInput(tk); handleTrackTicket(tk); }}
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--accent)',
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '0.75rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                {tk}
              </button>
            ))}
          </div>

          {/* Search Result */}
          {searchedTicket && (
            <div style={{ 
              background: 'var(--bg-card-subtle)', 
              border: '1px solid var(--border)', 
              borderRadius: '12px', 
              padding: '18px', 
              marginBottom: '20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--accent)', fontSize: '1rem' }}>
                  {searchedTicket.ticket_number}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getStatusBadge(searchedTicket.status)}
                  {onOpenReceipt && (
                    <button
                      onClick={() => onOpenReceipt(searchedTicket)}
                      title="Download or Print Official Slip"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: 'var(--accent)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Printer size={13} />
                      <span>Print Slip</span>
                    </button>
                  )}
                </div>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                {searchedTicket.title}
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
                {searchedTicket.description}
              </p>
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-main)', 
                background: 'var(--bg-card)', 
                padding: '10px 14px', 
                borderRadius: '8px', 
                border: '1px solid var(--border)' 
              }}>
                <strong style={{ color: 'var(--accent)' }}>Department Notes:</strong> {searchedTicket.department_notes || 'Under review by municipal authorities.'}
              </div>
            </div>
          )}

          {searchError && (
            <div style={{ 
              background: 'var(--danger-bg)', 
              border: '1px solid var(--danger)', 
              color: 'var(--danger-text)', 
              padding: '12px 16px', 
              borderRadius: '10px', 
              fontSize: '0.85rem', 
              marginBottom: '16px' 
            }}>
              {searchError}
            </div>
          )}

          {/* Grievance list summary table */}
          <div style={{ 
            maxHeight: '260px', 
            overflowY: 'auto', 
            overflowX: 'auto', 
            border: '1px solid var(--border)', 
            borderRadius: '10px',
            background: 'var(--bg-card)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.835rem', textAlign: 'left', minWidth: '550px' }}>
              <thead style={{ background: 'var(--bg-card-subtle)', position: 'sticky', top: 0, borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Ticket</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Title</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map((g) => (
                  <tr 
                    key={g.id} 
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s ease' }} 
                    onClick={() => { setTicketInput(g.ticket_number); handleTrackTicket(g.ticket_number); }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)', fontWeight: 600 }}>
                      {g.ticket_number}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{g.category}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text-main)' }}>{g.title}</td>
                    <td style={{ padding: '12px 16px' }}>{getStatusBadge(g.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schemes tab */}
      {activeTab === 'schemes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', maxHeight: '340px', overflowY: 'auto' }}>
          {services.map((s) => (
            <div 
              key={s.id} 
              style={{ 
                background: 'var(--bg-card-subtle)', 
                border: '1px solid var(--border)', 
                borderRadius: '12px', 
                padding: '18px',
                transition: 'border-color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  background: 'rgba(56, 189, 248, 0.15)', 
                  color: 'var(--accent)', 
                  padding: '3px 9px', 
                  borderRadius: '6px', 
                  fontWeight: 700, 
                  fontFamily: 'JetBrains Mono, monospace',
                  border: '1px solid var(--border)',
                }}>
                  {s.service_code}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.category}</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '6px 0', color: 'var(--text-main)' }}>{s.title}</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.55 }}>{s.description}</p>
              <div style={{ 
                fontSize: '0.825rem', 
                color: 'var(--success-text)', 
                background: 'var(--success-bg)', 
                padding: '10px 14px', 
                borderRadius: '8px', 
                border: '1px solid var(--success)' 
              }}>
                <strong>Eligibility:</strong> {s.eligibility_criteria}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
