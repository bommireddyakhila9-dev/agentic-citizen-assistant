import React, { useState, useEffect } from 'react';
import { Briefcase, CheckCircle2, Clock, AlertTriangle, RefreshCw, Send, Image, Search, ShieldCheck } from './Icons';
import { fetchGrievances, updateGrievanceStatus, getAssetUrl } from '../services/api';

export default function OfficerPortalCard({ onSelectTicketForPrint }) {
  const [grievances, setGrievances] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [statusVal, setStatusVal] = useState('In Progress');
  const [notesVal, setNotesVal] = useState('');
  const [officerName, setOfficerName] = useState('Eng. Rajesh Kumar (ID: PWD-409)');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [filterCat, setFilterCat] = useState('ALL');

  useEffect(() => {
    loadOfficerQueue();
  }, []);

  const loadOfficerQueue = async () => {
    setLoading(true);
    const res = await fetchGrievances();
    if (res.success && Array.isArray(res.data)) {
      setGrievances(res.data);
      if (res.data.length > 0 && !selectedTicket) {
        setSelectedTicket(res.data[0]);
        setStatusVal(res.data[0].status || 'In Progress');
        setNotesVal(res.data[0].department_notes || '');
      }
    }
    setLoading(false);
  };

  const handleTicketSelect = (g) => {
    setSelectedTicket(g);
    setStatusVal(g.status || 'In Progress');
    setNotesVal(g.department_notes || '');
    setActionSuccess('');
  };

  const handleSubmitResolution = async () => {
    if (!selectedTicket || submitting) return;
    setSubmitting(true);
    setActionSuccess('');

    const res = await updateGrievanceStatus(
      selectedTicket.ticket_number,
      statusVal,
      notesVal || `Status updated to ${statusVal} by municipal engineering team.`,
      officerName
    );

    if (res.success) {
      setActionSuccess(`✓ Ticket ${selectedTicket.ticket_number} successfully updated to [${statusVal}]. Citizen alerted via SMS & Email.`);
      // Refresh local list
      await loadOfficerQueue();
    }
    setSubmitting(false);
  };

  const filtered = grievances.filter((g) => {
    if (filterCat === 'ALL') return true;
    return g.category.toLowerCase().includes(filterCat.toLowerCase());
  });

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
    <div className="health-card" style={{ maxWidth: '820px', padding: 0, overflow: 'hidden' }}>
      {/* Officer Console Header */}
      <div style={{
        padding: '16px 24px',
        background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(56, 189, 248, 0.2)',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(56, 189, 248, 0.3)',
          }}>
            <Briefcase size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'white' }}>
              Municipal Officer Redressal Console
            </h3>
            <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>
              Official Engineering Workspace • Live Citizen Dispatch Triggers
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '8px',
            padding: '5px 12px',
            fontSize: '0.75rem',
            color: '#38bdf8',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <ShieldCheck size={14} />
            <span>Eng. Rajesh Kumar (ID: PWD-409)</span>
          </div>

          <button
            onClick={loadOfficerQueue}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: 'white',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} color="white" />
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="no-scrollbar" style={{
        padding: '12px 20px',
        background: 'var(--bg-card-subtle)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          Department Queue:
        </span>
        {['ALL', 'Roads', 'Water', 'Sanitation', 'Electricity'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            style={{
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: '1px solid var(--border)',
              background: filterCat === cat ? 'var(--accent)' : 'var(--bg-card)',
              color: filterCat === cat ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Two-Column Console Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.25fr',
        minHeight: '440px',
        background: 'var(--bg-card)',
      }}>
        {/* Left Column: Queue List */}
        <div style={{
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
          maxHeight: '480px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--bg-card-subtle)',
        }}>
          {filtered.map((g) => {
            const isSelected = selectedTicket?.id === g.id;
            return (
              <div
                key={g.id}
                onClick={() => handleTicketSelect(g)}
                style={{
                  background: isSelected ? 'var(--bg-card)' : 'transparent',
                  border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent)' }}>
                    {g.ticket_number}
                  </span>
                  {getStatusBadge(g.status)}
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px', lineHeight: 1.3 }}>
                  {g.title}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  📍 {g.location || 'Municipal Ward'} • {g.category}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Resolution Panel */}
        {selectedTicket ? (
          <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '1.15rem', color: 'var(--accent)' }}>
                  {selectedTicket.ticket_number}
                </span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0' }}>
                  {selectedTicket.title}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  {selectedTicket.description}
                </p>
              </div>

              {onSelectTicketForPrint && (
                <button
                  onClick={() => onSelectTicketForPrint(selectedTicket)}
                  style={{
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: 'var(--accent)',
                    flexShrink: 0,
                  }}
                >
                  Print Official Slip
                </button>
              )}
            </div>

            {/* Attached Photo Evidence Preview */}
            {selectedTicket.attachment_url && (
              <div style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Image size={16} color="var(--accent)" />
                <span style={{ fontSize: '0.785rem', color: 'var(--text-main)', fontWeight: 600 }}>Attached Evidence:</span>
                <a
                  href={getAssetUrl(selectedTicket.attachment_url)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.785rem', color: 'var(--accent)', textDecoration: 'underline' }}
                >
                  View Evidence Photo ↗
                </a>
              </div>
            )}

            {/* Resolution Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Update Grievance Status:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Pending', 'In Progress', 'Resolved'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusVal(st)}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: statusVal === st ? (st === 'Resolved' ? '#10b981' : st === 'In Progress' ? '#3b82f6' : '#ef4444') : 'var(--bg-card-subtle)',
                        color: statusVal === st ? '#ffffff' : 'var(--text-muted)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Official Department Notes (Sent to Citizen via SMS/Email):
                </label>
                <textarea
                  rows={3}
                  value={notesVal}
                  onChange={(e) => setNotesVal(e.target.value)}
                  placeholder="e.g., Road crew completed asphalt patching. Water pressure restored after valve inspection."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Actioning Officer Name & ID:
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '0.825rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
              </div>

              {actionSuccess && (
                <div style={{
                  background: 'var(--success-bg)',
                  border: '1px solid var(--success)',
                  color: 'var(--success-text)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}>
                  {actionSuccess}
                </div>
              )}

              <button
                onClick={handleSubmitResolution}
                disabled={submitting}
                className="btn-test"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', marginTop: '6px', justifyContent: 'center' }}
              >
                <Send size={16} />
                <span>{submitting ? 'Updating & Dispatching Alert...' : 'Submit Resolution & Alert Citizen'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a grievance from the left to inspect and action.
          </div>
        )}
      </div>
    </div>
  );
}
