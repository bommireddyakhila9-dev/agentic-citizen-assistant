import React from 'react';
import { Bot, FileText, Search, ShieldCheck } from './Icons';

const features = [
  {
    icon: Bot,
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.12)',
    title: 'Autonomous Grievance Agent',
    description: 'Understands plain language citizen complaints, automatically extracts incident details, categorizes the department, and files official tickets.',
  },
  {
    icon: Search,
    color: '#34d399',
    bgColor: 'rgba(52, 211, 153, 0.12)',
    title: 'Real-Time Status Tracking',
    description: 'Citizens can track their civic requests and municipal grievances instantly by providing an ID or verified contact number.',
  },
  {
    icon: FileText,
    color: '#818cf8',
    bgColor: 'rgba(129, 140, 248, 0.12)',
    title: 'Citizen Scheme Navigator',
    description: 'LangGraph agent matches citizen eligibility criteria against government welfare programs, water subsidy schemes, and civic services.',
  },
  {
    icon: ShieldCheck,
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.12)',
    title: 'Human-in-the-Loop Safeguards',
    description: 'Requests citizen confirmation before finalizing records, guaranteeing transparency and preventing erroneous submissions.',
  },
];

export default function FeaturesGrid() {
  return (
    <section style={{ margin: '48px 0' }}>
      <div className="section-heading">
        <h2 className="section-title">Core Agentic Capabilities</h2>
        <p className="section-subtitle">Powered by Google Gemini, LangChain, LangGraph, and SQLite/MySQL</p>
      </div>

      <div className="features-grid">
        {features.map((feat, index) => {
          const Icon = feat.icon;
          return (
            <div key={index} className="feature-card">
              <div 
                className="feature-icon-wrapper" 
                style={{ backgroundColor: feat.bgColor, color: feat.color, borderColor: 'var(--border)' }}
              >
                <Icon size={24} />
              </div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
