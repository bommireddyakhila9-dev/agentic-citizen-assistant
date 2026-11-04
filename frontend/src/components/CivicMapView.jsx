import React, { useState, useEffect } from 'react';
import { MapPin, Search, RefreshCw, AlertTriangle, CheckCircle2, Clock, Image, ExternalLink, Navigation, Printer } from './Icons';
import { fetchMapPins, getAssetUrl } from '../services/api';

export default function CivicMapView({ onSelectTicket, onReportAtLocation, onOpenReceipt }) {
  const [pins, setPins] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [droppedPin, setDroppedPin] = useState(null);

  useEffect(() => {
    loadPins();
  }, []);

  const loadPins = async () => {
    setLoading(true);
    const res = await fetchMapPins();
    if (res.success && Array.isArray(res.data)) {
      setPins(res.data);
      if (res.data.length > 0) {
        setSelectedPin(res.data[0]);
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setDroppedPin(null);

    // Run fetch with minimum 500ms duration so the spin feedback is clearly visible
    const [res] = await Promise.all([
      fetchMapPins(),
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);

    if (res.success && Array.isArray(res.data)) {
      setPins(res.data);
      if (res.data.length > 0) {
        // Keep current selected pin if it still exists in the dataset
        const stillExists = res.data.find((p) => p.id === selectedPin?.id);
        setSelectedPin(stillExists || res.data[0]);
      }
      setJustSynced(true);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setTimeout(() => setJustSynced(false), 2000);
    }
    setRefreshing(false);
  };

  const filteredPins = pins.filter((p) => {
    const matchCat = categoryFilter === 'ALL' || p.category.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status.toLowerCase() === statusFilter.toLowerCase();
    return matchCat && matchStatus;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return '#10b981';
      case 'in progress':
        return '#f59e0b';
      default:
        return '#ef4444';
    }
  };

  // Maps lat/long to percentage coordinates on our municipal vector map grid
  // Reference bounding box around Delhi / Municipal District center
  const minLat = 28.6000;
  const maxLat = 28.6350;
  const minLng = 77.1900;
  const maxLng = 77.2300;

  const getCanvasCoords = (lat, lng, idx) => {
    if (!lat || !lng) {
      const positions = [
        { x: 30, y: 35 },
        { x: 65, y: 40 },
        { x: 45, y: 65 },
        { x: 75, y: 70 },
        { x: 25, y: 75 },
        { x: 50, y: 25 },
      ];
      return positions[idx % positions.length];
    }
    const x = Math.max(10, Math.min(90, ((lng - minLng) / (maxLng - minLng)) * 80 + 10));
    const y = Math.max(10, Math.min(90, ((maxLat - lat) / (maxLat - minLat)) * 80 + 10));
    return { x, y };
  };

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const calcLng = (minLng + (clickX / 100) * (maxLng - minLng)).toFixed(4);
    const calcLat = (maxLat - (clickY / 100) * (maxLat - minLat)).toFixed(4);

    setDroppedPin({
      x: clickX,
      y: clickY,
      lat: calcLat,
      lng: calcLng,
      label: `Pinned Location (${calcLat}, ${calcLng})`,
    });
  };

  return (
    <div className="health-card" style={{ maxWidth: '820px', padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        background: 'linear-gradient(135deg, #1e3a8a, #0369a1)',
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
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Navigation size={22} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'white' }}>
              Interactive Municipal GIS & Grievance Map
            </h3>
            <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>
              Live Geocoded Incidents across Wards 1 to 8 • Pin Drop Enabled
            </p>
          </div>
        </div>

        {/* Refresh Action with Instant Visual Feedback */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {lastSyncTime && (
            <span style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {lastSyncTime}
            </span>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh incident pins from database"
            style={{
              background: justSynced ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.15)',
              border: justSynced ? '1px solid #34d399' : '1px solid rgba(255, 255, 255, 0.25)',
              color: 'white',
              borderRadius: '8px',
              padding: '7px 14px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              boxShadow: justSynced ? '0 0 10px rgba(52, 211, 153, 0.4)' : 'none',
            }}
          >
            {justSynced ? (
              <>
                <CheckCircle2 size={14} color="#34d399" />
                <span style={{ color: '#34d399' }}>Synced ({pins.length})</span>
              </>
            ) : (
              <>
                <RefreshCw size={14} className={refreshing ? 'spin' : ''} color="white" />
                <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="no-scrollbar" style={{
        padding: '12px 20px',
        background: 'var(--bg-card-subtle)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
          Category:
        </span>
        {['ALL', 'Roads', 'Water', 'Sanitation', 'Electricity'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            style={{
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: '1px solid var(--border)',
              background: categoryFilter === cat ? 'var(--accent)' : 'var(--bg-card)',
              color: categoryFilter === cat ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {cat}
          </button>
        ))}

        <div style={{ width: '1px', height: '18px', background: 'var(--border)', margin: '0 4px', flexShrink: 0 }} />

        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
          Status:
        </span>
        {['ALL', 'Pending', 'In Progress', 'Resolved'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: '1px solid var(--border)',
              background: statusFilter === st ? 'var(--accent)' : 'var(--bg-card)',
              color: statusFilter === st ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Map View Canvas Area */}
      <div
        onClick={handleMapClick}
        style={{
          height: '380px',
          background: 'var(--bg-main)',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'crosshair',
          borderBottom: '1px solid var(--border)',
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.05) 0%, transparent 80%),
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 30px 30px, 30px 30px',
        }}
      >
        {/* District Zones & Landmarks */}
        <div style={{ position: 'absolute', top: '15%', left: '15%', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', opacity: 0.6 }}>
          🏛️ WARD 1: CENTRAL ADMINISTRATIVE ZONE
        </div>
        <div style={{ position: 'absolute', top: '25%', right: '15%', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', opacity: 0.6 }}>
          🌳 WARD 2: SECTOR 5 RESIDENTIAL
        </div>
        <div style={{ position: 'absolute', bottom: '25%', left: '20%', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', opacity: 0.6 }}>
          🏥 WARD 7: CIVIC HOSPITAL & METRO
        </div>
        <div style={{ position: 'absolute', bottom: '15%', right: '20%', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', opacity: 0.6 }}>
          🏢 WARD 8: EAST INDUSTRIAL & LAKEVIEW
        </div>

        {/* Major Avenue Arteries */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(56, 189, 248, 0.2)',
          borderTop: '1px dashed rgba(56, 189, 248, 0.4)',
          borderBottom: '1px dashed rgba(56, 189, 248, 0.4)',
        }} />
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '4px',
          background: 'rgba(56, 189, 248, 0.2)',
          borderLeft: '1px dashed rgba(56, 189, 248, 0.4)',
          borderRight: '1px dashed rgba(56, 189, 248, 0.4)',
        }} />

        {/* Compass Rose */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 800,
          color: 'var(--accent)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          N ↑
        </div>

        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '0.7rem',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span> Pending
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span> In Progress
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Resolved
          </span>
        </div>

        {/* Dropped Target Beacon (if citizen clicked) */}
        {droppedPin && (
          <div style={{
            position: 'absolute',
            left: `${droppedPin.x}%`,
            top: `${droppedPin.y}%`,
            transform: 'translate(-50%, -100%)',
            zIndex: 15,
            animation: 'bounce 0.4s ease infinite alternate',
          }}>
            <div style={{
              background: '#38bdf8',
              color: '#000000',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(56, 189, 248, 0.5)',
              whiteSpace: 'nowrap',
              marginBottom: '2px',
            }}>
              📍 New Target ({droppedPin.lat}, {droppedPin.lng})
            </div>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#38bdf8',
              margin: '0 auto',
              border: '2px solid white',
            }} />
          </div>
        )}

        {/* Grievance Pins */}
        {filteredPins.map((pin, idx) => {
          const { x, y } = getCanvasCoords(pin.latitude, pin.longitude, idx);
          const color = getStatusColor(pin.status);
          const isSelected = selectedPin?.id === pin.id;

          return (
            <div
              key={pin.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPin(pin);
              }}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 20 : 10,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Pulsing ring for pending/in-progress */}
              {pin.status.toLowerCase() !== 'resolved' && (
                <div style={{
                  position: 'absolute',
                  inset: '-6px',
                  borderRadius: '50%',
                  background: color,
                  opacity: 0.35,
                  animation: 'pulse 2s infinite',
                }} />
              )}

              {/* Pin marker button */}
              <div style={{
                background: isSelected ? color : 'var(--bg-card)',
                color: isSelected ? '#ffffff' : color,
                border: `2px solid ${color}`,
                borderRadius: '50%',
                width: isSelected ? '34px' : '28px',
                height: isSelected ? '34px' : '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSelected ? `0 0 16px ${color}` : 'var(--shadow-sm)',
                fontWeight: 800,
                fontSize: '0.7rem',
                transition: 'all 0.2s ease',
              }}>
                <MapPin size={isSelected ? 18 : 14} color={isSelected ? '#ffffff' : color} />
              </div>

              {/* Label above pin */}
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '2px 6px',
                fontSize: '0.675rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                marginBottom: '4px',
                boxShadow: 'var(--shadow-sm)',
                pointerEvents: 'none',
              }}>
                {pin.ticket_number}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Incident Drawer Details */}
      {selectedPin ? (
        <div style={{
          padding: '20px 24px',
          background: 'var(--bg-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 800,
                color: 'var(--accent)',
                fontSize: '1rem',
              }}>
                {selectedPin.ticket_number}
              </span>
              <span style={{
                fontSize: '0.725rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: selectedPin.status.toLowerCase() === 'resolved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: getStatusColor(selectedPin.status),
                border: `1px solid ${getStatusColor(selectedPin.status)}`,
              }}>
                {selectedPin.status}
              </span>
              <span style={{
                fontSize: '0.725rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                background: 'var(--bg-card-subtle)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
              }}>
                Priority: {selectedPin.priority}
              </span>
            </div>

            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: '4px 0 6px' }}>
              {selectedPin.title}
            </h4>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              📍 {selectedPin.location} • {selectedPin.ward_number}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
              Coordinates: {selectedPin.latitude?.toFixed(4)}, {selectedPin.longitude?.toFixed(4)}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            {selectedPin.attachment_url && (
              <a
                href={getAssetUrl(selectedPin.attachment_url)}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: 'var(--accent)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.785rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid var(--border)',
                }}
              >
                <Image size={14} /> View Attached Evidence
              </a>
            )}

            <button
              onClick={() => onSelectTicket && onSelectTicket(selectedPin.ticket_number)}
              className="btn-test"
              style={{ padding: '8px 18px', fontSize: '0.825rem', borderRadius: '8px' }}
            >
              <span>Ask AI About This Ticket</span>
            </button>

            {onOpenReceipt && (
              <button
                onClick={() => onOpenReceipt(selectedPin)}
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.785rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Printer size={14} color="var(--accent)" />
                <span>Print Official Slip</span>
              </button>
            )}

            {droppedPin && (
              <button
                onClick={() => {
                  onReportAtLocation && onReportAtLocation(droppedPin.lat, droppedPin.lng);
                  setDroppedPin(null);
                }}
                style={{
                  background: 'transparent',
                  border: '1px dashed var(--accent)',
                  color: 'var(--accent)',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Report Complaint at Pinned Spot ({droppedPin.lat}, {droppedPin.lng})
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Click any pin on the map to inspect incident details or drop a pin to report a complaint.
        </div>
      )}
    </div>
  );
}
