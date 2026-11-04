import React from 'react';
import { Landmark, Printer, X, CheckCircle2, ShieldCheck, MapPin, Calendar, Clock } from './Icons';

export default function GrievanceReceiptModal({ grievance, isOpen, onClose }) {
  if (!isOpen || !grievance) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = grievance.created_at
    ? new Date(grievance.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #cbd5e1',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Printable Receipt Paper Container */}
        <div id="printable-receipt" style={{ padding: '32px 36px', background: '#ffffff', position: 'relative' }}>
          {/* Official Municipal Watermark / Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #0f172a',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#1e3a8a',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Landmark size={26} color="white" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  MUNICIPAL CORPORATION
                </h2>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Department of Public Works & Grievance Redressal
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800,
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                OFFICIAL SLIP
              </span>
              <p style={{ fontSize: '0.675rem', color: '#64748b', marginTop: '4px', margin: '4px 0 0' }}>
                Ref: {grievance.id ? `REC-00${grievance.id}` : 'REC-LIVE'}
              </p>
            </div>
          </div>

          {/* Ticket ID & Status Highlight Box */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <div>
              <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                Grievance Tracking Number
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e3a8a', fontFamily: 'JetBrains Mono, monospace' }}>
                {grievance.ticket_number}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 800,
                background: grievance.status?.toLowerCase() === 'resolved' ? '#ecfdf5' : '#fffbeb',
                color: grievance.status?.toLowerCase() === 'resolved' ? '#047857' : '#b45309',
                border: `1px solid ${grievance.status?.toLowerCase() === 'resolved' ? '#a7f3d0' : '#fde68a'}`,
              }}>
                <CheckCircle2 size={14} /> {grievance.status || 'Pending'}
              </span>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                Priority: <strong>{grievance.priority || 'Medium'}</strong>
              </div>
            </div>
          </div>

          {/* Incident Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px', fontSize: '0.825rem' }}>
            <div>
              <span style={{ color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Department:</span>
              <strong style={{ color: '#0f172a' }}>{grievance.category}</strong>
            </div>

            <div>
              <span style={{ color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Incident Location:</span>
              <strong style={{ color: '#0f172a' }}>{grievance.location || 'Municipal District'}</strong>
            </div>

            <div>
              <span style={{ color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Filing Date:</span>
              <strong style={{ color: '#0f172a' }}>{formattedDate}</strong>
            </div>

            <div>
              <span style={{ color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Ward Sector:</span>
              <strong style={{ color: '#0f172a' }}>{grievance.ward_number || 'General Ward'}</strong>
            </div>
          </div>

          {/* Issue Summary */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.775rem', display: 'block', marginBottom: '4px' }}>
              Complaint Description:
            </span>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.85rem',
              color: '#334155',
              lineHeight: 1.5,
            }}>
              <strong>{grievance.title}</strong>
              <p style={{ margin: '4px 0 0', color: '#475569', fontSize: '0.8rem' }}>
                {grievance.description || 'Civic infrastructure report filed via digital assistant.'}
              </p>
            </div>
          </div>

          {/* Official Department Notes */}
          <div style={{ marginBottom: '24px' }}>
            <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.775rem', display: 'block', marginBottom: '4px' }}>
              Official Engineering Notes:
            </span>
            <div style={{
              borderLeft: '3px solid #3b82f6',
              background: '#eff6ff',
              padding: '8px 12px',
              fontSize: '0.785rem',
              color: '#1e40af',
              borderRadius: '0 8px 8px 0',
            }}>
              {grievance.department_notes || 'Ticket logged in municipal queue. Awaiting departmental assignment.'}
            </div>
          </div>

          {/* Official Verification Seal & Barcode Placeholder */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px dashed #cbd5e1',
            paddingTop: '16px',
            fontSize: '0.725rem',
            color: '#64748b',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#10b981" />
              <div>
                <strong style={{ color: '#0f172a', display: 'block' }}>Digitally Certified Record</strong>
                <span>CitizenConnect AI Governance Portal</span>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ letterSpacing: '3px', fontWeight: 800, color: '#0f172a' }}>||| | |||| | ||||| |</span>
              <div style={{ fontSize: '0.65rem', marginTop: '2px' }}>{grievance.ticket_number}</div>
            </div>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div style={{
          background: '#f1f5f9',
          padding: '16px 24px',
          borderTop: '1px solid #cbd5e1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.775rem', color: '#64748b' }}>
            Press Print to download as PDF or send to printer.
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#475569',
              }}
            >
              Close
            </button>

            <button
              onClick={handlePrint}
              style={{
                background: '#1e3a8a',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
              }}
            >
              <Printer size={16} />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
