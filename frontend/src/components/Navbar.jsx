import React from 'react';
import { Landmark, Sun, Moon, Bell } from './Icons';

export default function Navbar({
  connectionStatus,
  theme,
  onToggleTheme,
  onOpenNotifications,
  unreadCount = 0,
}) {
  const getStatusLabel = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Backend Connected';
      case 'connecting':
        return 'Checking Server...';
      case 'disconnected':
      default:
        return 'Backend Disconnected';
    }
  };

  return (
    <header className="navbar">
      <div className="container nav-content">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <Landmark size={24} color="white" />
          </div>
          <div>
            <h1 className="brand-title">CitizenConnect AI</h1>
            <p className="brand-subtitle">Smart Municipal & Civic Services</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* SMS/Email Notification Bell Button */}
          <button
            onClick={onOpenNotifications}
            className="btn-theme-toggle"
            title="View Dispatched SMS & Email Alerts"
            style={{ position: 'relative' }}
          >
            <Bell size={18} color="var(--accent)" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.675rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dark / Light Mode Switcher */}
          <button
            onClick={onToggleTheme}
            className="btn-theme-toggle"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} color="#facc15" /> : <Moon size={18} color="#1e3a8a" />}
          </button>

          {/* Connection Status Badge */}
          <div className={`status-pill ${connectionStatus}`}>
            <span className={`status-dot ${connectionStatus === 'connected' ? 'pulse' : ''}`}></span>
            <span>{getStatusLabel()}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
