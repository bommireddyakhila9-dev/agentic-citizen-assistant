import React from 'react';
import { Database, MapPin, Zap, Bell } from './Icons';

export default function CivicKpiStrip({ onSelectTab, onOpenNotifications, grievanceCount = 6, notificationCount = 3 }) {
  const kpis = [
    {
      title: 'Active Complaints',
      value: `${grievanceCount} Tickets`,
      subtitle: 'Managed across departments',
      icon: Database,
      color: '#f59e0b',
      action: () => onSelectTab && onSelectTab('database'),
      badge: 'Live Database',
    },
    {
      title: 'Civic GIS Map',
      value: 'Wards 1–8 Active',
      subtitle: 'Geocoded pins & incident alerts',
      icon: MapPin,
      color: '#10b981',
      action: () => onSelectTab && onSelectTab('map'),
      badge: 'Pin Drop Ready',
    },
    {
      title: 'Autonomous AI Engine',
      value: 'LangGraph v1.2',
      subtitle: 'Photo vision & tool calling',
      icon: Zap,
      color: '#38bdf8',
      action: () => onSelectTab && onSelectTab('chat'),
      badge: 'Gemini Flash',
    },
    {
      title: 'SMS & Email Alerts',
      value: `${notificationCount} Dispatched`,
      subtitle: 'Real-time citizen dispatch trail',
      icon: Bell,
      color: '#818cf8',
      action: () => onOpenNotifications && onOpenNotifications(),
      badge: 'Delivered',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px',
      maxWidth: '820px',
      margin: '0 auto 28px',
      width: '100%',
    }}>
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            onClick={kpi.action}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '16px 18px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = kpi.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--bg-card-subtle)',
                color: kpi.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border)',
              }}>
                <Icon size={16} color={kpi.color} />
              </div>
              <span style={{
                fontSize: '0.675rem',
                fontWeight: 700,
                color: kpi.color,
                background: 'var(--bg-card-subtle)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
              }}>
                {kpi.badge}
              </span>
            </div>

            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '2px' }}>
              {kpi.value}
            </div>

            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {kpi.title}
            </div>

            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              {kpi.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
