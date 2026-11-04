import React, { useState } from 'react';
import { User, X, CheckCircle2, ShieldCheck, Zap, Mail, MessageCircle } from './Icons';
import { sendCitizenOtp, verifyCitizenOtp } from '../services/api';

const DEMO_CITIZENS = [
  {
    id: 1,
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul.sharma@example.com',
    address: 'House 42, Sector 5, Ward 2',
    ward: 'Ward 2',
  },
  {
    id: 2,
    name: 'Priya Patel',
    phone: '9876543211',
    email: 'priya.patel@example.com',
    address: 'Flat 102, Green Valley Apartments, Ward 4',
    ward: 'Ward 4',
  },
  {
    id: 3,
    name: 'Amit Verma',
    phone: '9876543212',
    email: 'amit.verma@example.com',
    address: 'B-12, Gandhi Nagar, Ward 1',
    ward: 'Ward 1',
  },
];

export default function CitizenAuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [cellularInfo, setCellularInfo] = useState({ cellularSent: false, provider: 'simulated' });

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    setAuthError('');
    const res = await sendCitizenOtp(phoneNumber, citizenName);
    if (res.success) {
      setCellularInfo({
        cellularSent: res.data?.cellular_sent || false,
        provider: res.data?.provider || 'simulated',
      });
      setOtpStep(true);
    } else {
      setAuthError(res.error || 'Failed to dispatch SMS OTP. Please try again.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setAuthError('Please enter the 4-digit code.');
      return;
    }
    setLoading(true);
    setAuthError('');
    const res = await verifyCitizenOtp(phoneNumber, otpCode);
    if (res.success && res.data.citizen) {
      onLoginSuccess(res.data.citizen);
      onClose();
    } else {
      setAuthError(res.error || 'Invalid OTP code. Check your SMS or use 1234.');
    }
    setLoading(false);
  };

  const handleQuickLogin = (citizen) => {
    onLoginSuccess(citizen);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '440px',
          padding: '28px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <User size={24} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-main)' }}>
            Citizen Portal Login
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
            Frictionless password-free access with mobile OTP verification
          </p>
        </div>

        {/* One-Touch Quick Citizen Sign-In */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Zap size={14} color="var(--accent)" />
            <span>One-Click Test Citizens</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DEMO_CITIZENS.map((c) => (
              <button
                key={c.id}
                onClick={() => handleQuickLogin(c)}
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '9px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>{c.name}</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    {c.phone} • {c.ward}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.725rem',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    background: 'rgba(56, 189, 248, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  Select ➔
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '16px 0', position: 'relative' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
          <span
            style={{
              position: 'absolute',
              top: '-9px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--bg-card)',
              padding: '0 10px',
              fontSize: '0.725rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            OR ENTER MOBILE
          </span>
        </div>

        {/* Mobile OTP Form */}
        {!otpStep ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>
                Mobile Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>
                Your Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
            {authError && (
              <div style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600 }}>
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-test"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                marginTop: '6px',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              {loading ? 'Dispatching SMS...' : 'Send SMS OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.8rem',
                color: 'var(--success)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} />
              <span>
                SMS OTP dispatched to registered mobile: <strong>+91 {phoneNumber}</strong>
              </span>
            </div>

            {cellularInfo.cellularSent ? (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '0.75rem',
                  color: 'var(--success)',
                  lineHeight: 1.45,
                }}
              >
                📱 <strong>Real SMS Sent!</strong> Live cellular SMS dispatched to your phone via {cellularInfo.provider.toUpperCase()}. Please check your physical phone's SMS inbox!
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '0.725rem',
                  color: 'var(--accent)',
                  lineHeight: 1.45,
                }}
              >
                💬 <strong>Live SMS Alert:</strong> Check the <strong>🔔 Notifications Drawer</strong> in the top navbar to inspect the delivered SMS message containing your 4-digit code (or use reviewer code <strong>1234</strong>).
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-muted)' }}>
                Enter Received 4-Digit Code
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="••••"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px',
                  textAlign: 'center',
                  letterSpacing: '10px',
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  outline: 'none',
                }}
              />
            </div>

            {authError && (
              <div style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600 }}>
                {authError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setOtpStep(false);
                  setAuthError('');
                }}
                style={{
                  flex: 1,
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border)',
                  padding: '10px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-test"
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: '10px',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
