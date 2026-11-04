import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageCircle, RefreshCw, X, CheckCircle2 } from './Icons';
import { fetchNotifications } from '../services/api';

export default function NotificationDrawer({ isOpen, onClose, onSelectTicket, onNotificationsViewed }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'SMS' | 'EMAIL'
  const [loading, setLoading] = useState(false);
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('citizen_viewed_notification_ids') || '[]');
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen]);

  const loadAlerts = async () => {
    setLoading(true);
    const res = await fetchNotifications(50);
    if (res.success && Array.isArray(res.data)) {
      setNotifications(res.data);
      // Mark all loaded alerts as viewed so the red bell badge disappears
      const allIds = res.data.map((n) => n.id);
      const stored = (() => {
        try {
          return JSON.parse(localStorage.getItem('citizen_viewed_notification_ids') || '[]');
        } catch (e) {
          return [];
        }
      })();
      const updated = Array.from(new Set([...stored, ...allIds]));
      setViewedIds(updated);
      localStorage.setItem('citizen_viewed_notification_ids', JSON.stringify(updated));
      if (onNotificationsViewed) {
        onNotificationsViewed(allIds);
      }
    }
    setLoading(false);
  };

  const handleMarkAllViewed = () => {
    const allIds = notifications.map((n) => n.id);
    setViewedIds(allIds);
    localStorage.setItem('citizen_viewed_notification_ids', JSON.stringify(allIds));
    if (onNotificationsViewed) {
      onNotificationsViewed(allIds);
    }
  };

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (filter === 'SMS') return n.channel === 'SMS';
    if (filter === 'EMAIL') return n.channel === 'EMAIL';
    return true;
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(6px)',
      zIndex: 100,
      display: 'flex',
      justifyContent: 'flex-end',
      animation: 'fadeIn 0.2s ease',
    }} onClick={onClose}>
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bell size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Civic Dispatch Center
              </h3>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: 0 }}>
                Live SMS & Email Citizen Notifications
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleMarkAllViewed}
              title="Mark all notifications as viewed"
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '0.725rem',
                fontWeight: 700,
                color: 'var(--success)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <CheckCircle2 size={13} />
              <span>Mark All Viewed</span>
            </button>
            <button
              onClick={loadAlerts}
              title="Refresh alerts"
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
            <button
              onClick={onClose}
              title="Close drawer"
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: '8px',
          background: 'var(--bg-card)',
        }}>
          {['ALL', 'SMS', 'EMAIL'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid var(--border)',
                background: filter === t ? 'var(--accent)' : 'var(--bg-card-subtle)',
                color: filter === t ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t === 'ALL' ? 'All Alerts' : t === 'SMS' ? '📱 SMS' : '✉️ Email'}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
            {filtered.length} Dispatched
          </span>
        </div>

        {/* Notification List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {loading && filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Fetching latest dispatch history...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No notifications dispatched yet. File a complaint to trigger live alerts!
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  position: 'relative',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: item.channel === 'SMS' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(129, 140, 248, 0.15)',
                      color: item.channel === 'SMS' ? '#38bdf8' : '#818cf8',
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}>
                      {item.channel === 'SMS' ? <MessageCircle size={12} /> : <Mail size={12} />}
                      {item.channel}
                    </span>

                    {item.ticket_number && (
                      <button
                        onClick={() => {
                          onSelectTicket && onSelectTicket(item.ticket_number);
                          onClose();
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--accent)',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {item.ticket_number} ↗
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: 'var(--success)',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}>
                      <CheckCircle2 size={10} /> Viewed
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      color: '#34d399',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                    }}>
                      {item.status}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {item.subject}
                </div>

                <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                  {item.message}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '0.675rem',
                  color: 'var(--text-muted)',
                }}>
                  <span>To: {item.recipient}</span>
                  <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
