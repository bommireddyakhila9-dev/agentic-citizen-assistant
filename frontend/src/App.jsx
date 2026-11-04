import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ChatWindow from './components/ChatWindow';
import CivicMapView from './components/CivicMapView';
import DatabaseViewerCard from './components/DatabaseViewerCard';
import HealthStatusCard from './components/HealthStatusCard';
import OfficerPortalCard from './components/OfficerPortalCard';
import NotificationDrawer from './components/NotificationDrawer';
import GrievanceReceiptModal from './components/GrievanceReceiptModal';
import FeaturesGrid from './components/FeaturesGrid';
import CivicKpiStrip from './components/CivicKpiStrip';
import { checkHealth, fetchGrievances, fetchNotifications } from './services/api';
import { Sparkles, MessageSquare, Database, Server, Map, Briefcase } from './components/Icons';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [initialHealth, setInitialHealth] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'map' | 'officer' | 'database' | 'health'
  const [grievanceCount, setGrievanceCount] = useState(6);
  const [notificationCount, setNotificationCount] = useState(3);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');

  // Receipt Modal State
  const [receiptGrievance, setReceiptGrievance] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Default to dark mode as requested by user, with localStorage persistence
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('citizen_assistant_theme') || 'dark';
  });

  useEffect(() => {
    // Apply data-theme attribute on document root
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('citizen_assistant_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const calculateUnreadCount = (notificationList) => {
    try {
      const viewed = JSON.parse(localStorage.getItem('citizen_viewed_notification_ids') || '[]');
      const unread = notificationList.filter((n) => !viewed.includes(n.id));
      return unread.length;
    } catch (e) {
      return 0;
    }
  };

  const handleOpenNotifications = () => {
    setIsNotificationsOpen(true);
    // As soon as the user opens the notification drawer, mark badge as cleared
    setUnreadNotificationsCount(0);
  };

  const handleNotificationsViewed = (viewedIdsList) => {
    try {
      const stored = JSON.parse(localStorage.getItem('citizen_viewed_notification_ids') || '[]');
      const merged = Array.from(new Set([...stored, ...viewedIdsList]));
      localStorage.setItem('citizen_viewed_notification_ids', JSON.stringify(merged));
    } catch (e) {
      // ignore
    }
    setUnreadNotificationsCount(0);
  };

  useEffect(() => {
    const initApp = async () => {
      const res = await checkHealth();
      setInitialHealth(res);
      setConnectionStatus(res.success ? 'connected' : 'disconnected');

      const [grvRes, notifRes] = await Promise.all([fetchGrievances(), fetchNotifications(30)]);
      if (grvRes.success && Array.isArray(grvRes.data)) {
        setGrievanceCount(grvRes.data.length);
      }
      if (notifRes.success && Array.isArray(notifRes.data)) {
        setNotificationCount(notifRes.data.length);
        setUnreadNotificationsCount(calculateUnreadCount(notifRes.data));
      }
    };

    initApp();

    // Periodically poll for new incoming notifications (e.g. from officer updates)
    const interval = setInterval(async () => {
      const notifRes = await fetchNotifications(30);
      if (notifRes.success && Array.isArray(notifRes.data)) {
        setNotificationCount(notifRes.data.length);
        if (!isNotificationsOpen) {
          setUnreadNotificationsCount(calculateUnreadCount(notifRes.data));
        }
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [isNotificationsOpen]);

  const handleSelectTicket = (ticketNumber) => {
    setChatPrompt(`Can you check the current status and official notes for ticket ${ticketNumber}?`);
    setActiveTab('chat');
  };

  const handleReportAtLocation = (lat, lng) => {
    setChatPrompt(`I want to report an incident at coordinates ${lat}, ${lng}. Can you help me file the complaint?`);
    setActiveTab('chat');
  };

  const handleOpenReceipt = (grievance) => {
    setReceiptGrievance(grievance);
    setIsReceiptOpen(true);
  };

  return (
    <div className="app-container">
      <Navbar
        connectionStatus={connectionStatus}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenNotifications={handleOpenNotifications}
        unreadCount={unreadNotificationsCount}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectTicket={handleSelectTicket}
        onNotificationsViewed={handleNotificationsViewed}
      />

      {/* Official Printable Municipal Slip Modal */}
      <GrievanceReceiptModal
        grievance={receiptGrievance}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      <main className="container">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Voice Dictation • Multilingual • Gemini Vision • Printable Slips • Officer Console</span>
          </div>
          <h1 className="hero-title">
            Intelligent Public Governance with <br />
            <span className="hero-highlight">Agentic AI Citizen Assistant</span>
          </h1>
          <p className="hero-description">
            Your conversational civic companion: file municipal grievances in multiple languages,
            dictate voice complaints, verify damage photos with AI vision, track issues on GIS maps,
            and manage official resolutions.
          </p>

          {/* Civic KPI Strip */}
          <CivicKpiStrip
            onSelectTab={(tab) => setActiveTab(tab)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            grievanceCount={grievanceCount}
            notificationCount={notificationCount}
          />

          {/* Navigation Pill Tabs */}
          <div style={{
            display: 'inline-flex',
            background: 'var(--bg-card)',
            padding: '6px',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border)',
            gap: '6px',
            marginBottom: '32px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'chat' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'chat' ? '#ffffff' : 'var(--text-muted)',
                boxShadow: activeTab === 'chat' ? '0 4px 12px var(--accent-glow)' : 'none',
              }}
            >
              <MessageSquare size={16} />
              <span>Autonomous Assistant</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'map' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'map' ? '#ffffff' : 'var(--text-muted)',
                boxShadow: activeTab === 'map' ? '0 4px 12px var(--accent-glow)' : 'none',
              }}
            >
              <Map size={16} />
              <span>Civic GIS Map</span>
            </button>

            <button
              onClick={() => setActiveTab('officer')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'officer' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'officer' ? '#ffffff' : 'var(--text-muted)',
                boxShadow: activeTab === 'officer' ? '0 4px 12px var(--accent-glow)' : 'none',
              }}
            >
              <Briefcase size={16} />
              <span>Officer Redressal Console</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'database' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'database' ? '#ffffff' : 'var(--text-muted)',
                boxShadow: activeTab === 'database' ? '0 4px 12px var(--accent-glow)' : 'none',
              }}
            >
              <Database size={16} />
              <span>Municipal Records & Schemes</span>
            </button>

            <button
              onClick={() => setActiveTab('health')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: activeTab === 'health' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'health' ? '#ffffff' : 'var(--text-muted)',
                boxShadow: activeTab === 'health' ? '0 4px 12px var(--accent-glow)' : 'none',
              }}
            >
              <Server size={16} />
              <span>System Monitor</span>
            </button>
          </div>

          {/* Active View */}
          <div style={{ margin: '0 auto', maxWidth: '820px' }}>
            {activeTab === 'chat' && (
              <ChatWindow
                initialPrompt={chatPrompt}
                onOpenReceipt={handleOpenReceipt}
              />
            )}
            {activeTab === 'map' && (
              <CivicMapView
                onSelectTicket={handleSelectTicket}
                onReportAtLocation={handleReportAtLocation}
                onOpenReceipt={handleOpenReceipt}
              />
            )}
            {activeTab === 'officer' && (
              <OfficerPortalCard
                onSelectTicketForPrint={handleOpenReceipt}
              />
            )}
            {activeTab === 'database' && (
              <DatabaseViewerCard
                onOpenReceipt={handleOpenReceipt}
              />
            )}
            {activeTab === 'health' && (
              <HealthStatusCard
                initialHealth={initialHealth}
                onRefreshParent={(status) => setConnectionStatus(status)}
              />
            )}
          </div>
        </section>

        {/* Feature Highlights */}
        <FeaturesGrid />

        {/* Development Roadmap Banner */}
        <section className="roadmap-banner">
          <div className="roadmap-info">
            <h3>Enterprise-Grade Agentic Civic Architecture</h3>
            <p>
              Integrated with LangGraph multi-step loops, Google Gemini Flash, SQLite/MySQL ORM,
              geolocated GIS maps, photo evidence uploads, and automated SMS dispatch.
            </p>
          </div>
          <div className="roadmap-steps">
            <span className="phase-pill active">Voice Dictation</span>
            <span className="phase-pill active">Multilingual AI</span>
            <span className="phase-pill active">Gemini Vision</span>
            <span className="phase-pill active">Printable Slips</span>
            <span className="phase-pill active">Officer Console</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© {new Date().getFullYear()} CitizenConnect AI • Municipal Digital Governance Initiative</p>
          <p style={{ marginTop: '4px', fontSize: '0.75rem', opacity: 0.8 }}>
            Powered by React, Vite, Python FastAPI, SQLAlchemy, LangGraph & Google Gemini.
          </p>
        </div>
      </footer>
    </div>
  );
}
