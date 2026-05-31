'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCompanyProfile, getQuotations, getClients, getAnalytics, AnalyticsSummary } from '@/utils/db';
import { CompanyProfile, Quotation } from '@/types';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [lastBillDate, setLastBillDate] = useState<string>('No bills created yet');

  useEffect(() => {
    setMounted(true);
    // Load local storage details
    const activeProfile = getCompanyProfile();
    const activeQuotes = getQuotations();
    const activeClients = getClients();
    const stats = getAnalytics();
    
    setProfile(activeProfile);
    setQuotations(activeQuotes);
    setClientCount(activeClients.length);
    setAnalytics(stats);

    if (activeQuotes.length > 0) {
      // Sort by date/updated descending to find the latest
      const sorted = [...activeQuotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latestDate = new Date(sorted[0].createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      setLastBillDate(`Last created: ${latestDate}`);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const hasSetupProfile = profile && profile.name !== 'ARVIND KUMAR MANDAL';

  return (
    <div className="home-dashboard animate-fade-in">
      {/* Welcome Banner */}
      <section className="hero-banner glass-panel">
        <div className="hero-content">
          <div className="badge-profile-state">
            {hasSetupProfile ? 'Active Profile' : 'Using Demo Profile'}
          </div>
          <h1>{profile?.name || 'Welcome to QuoteBuilder'}</h1>
          <p className="tagline">{profile?.tagline || 'Sp. In Professional Services'}</p>
          <div className="profile-details-strip">
            {profile?.phone && (
              <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {profile.phone}
              </span>
            )}
            {profile?.taxId && (
              <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="4"/><line x1="8" y1="2" x2="8" y2="4"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                GSTIN: {profile.taxId}
              </span>
            )}
          </div>
        </div>
        {!hasSetupProfile && (
          <div className="setup-prompt-card">
            <p>Setup your custom business profile to customize details on print outs.</p>
            <Link href="/settings" className="setup-btn">Configure Business</Link>
          </div>
        )}
      </section>

      {/* Grid CTA Actions */}
      <section className="dashboard-grid">
        {/* Card 1: New Quotation */}
        <Link href="/create" className="grid-card cta-card glass-panel glass-panel-hover">
          <div className="card-icon-wrapper accent-indigo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div className="card-info">
            <h2>New Document</h2>
            <p>Create Quotation, Invoice or Running Bill</p>
          </div>
          <div className="arrow-go">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        </Link>

        {/* Card 2: Saved Quotations */}
        <Link href="/saved" className="grid-card glass-panel glass-panel-hover">
          <div className="card-icon-wrapper accent-teal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="badge-count">{quotations.length}</span>
          </div>
          <div className="card-info">
            <h2>Saved Documents</h2>
            <p>{lastBillDate}</p>
          </div>
          <div className="arrow-go">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        </Link>

        {/* Card 3: Clients */}
        <Link href="/clients" className="grid-card glass-panel glass-panel-hover">
          <div className="card-icon-wrapper accent-emerald">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            <span className="badge-count">{clientCount}</span>
          </div>
          <div className="card-info">
            <h2>Client Directory</h2>
            <p>Manage clients and billing locations</p>
          </div>
          <div className="arrow-go">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        </Link>

        {/* Card 4: Settings */}
        <Link href="/settings" className="grid-card glass-panel glass-panel-hover">
          <div className="card-icon-wrapper accent-purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82" />
            </svg>
          </div>
          <div className="card-info">
            <h2>Preferences</h2>
            <p>Customize terms, taxes, logo, and units</p>
          </div>
          <div className="arrow-go">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        </Link>
      </section>

      {/* Analytics Panel */}
      <section className="analytics-section glass-panel">
        <div className="analytics-header">
          <h2>📊 Analytics Summary</h2>
          <span className="subtitle">Performance of saved invoices & bills</span>
        </div>

        <div className="stats-row">
          <div className="stat-box">
            <span className="stat-label">Billed This Month</span>
            <span className="stat-val">{formatCurrency(analytics?.totalBilledThisMonth || 0)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Billed This Year</span>
            <span className="stat-val">{formatCurrency(analytics?.totalBilledThisYear || 0)}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Quotes Sent (Accepted)</span>
            <span className="stat-val">
              {analytics?.quotationCount || 0} <span className="stat-sub">({analytics?.acceptedCount || 0})</span>
            </span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Invoices / Running Bills</span>
            <span className="stat-val">
              {analytics?.invoiceCount || 0} <span className="stat-sub">/ {analytics?.runningBillCount || 0}</span>
            </span>
          </div>
        </div>

        {/* Charts & Top Client breakdown */}
        <div className="analytics-details">
          {/* Revenue chart */}
          <div className="chart-wrapper">
            <h3>Revenue Trend (Past 6 Months)</h3>
            <div className="chart-bar-container">
              {analytics?.monthlyRevenue && analytics.monthlyRevenue.length > 0 ? (
                analytics.monthlyRevenue.map((item, idx) => {
                  // Find max for scaling
                  const maxAmt = Math.max(...(analytics?.monthlyRevenue.map(m => m.amount) || [1]));
                  const heightPct = maxAmt > 0 ? (item.amount / maxAmt) * 100 : 0;
                  return (
                    <div key={idx} className="chart-bar-column">
                      <div className="chart-bar-value">{formatCurrency(item.amount)}</div>
                      <div className="chart-bar" style={{ height: `${Math.max(heightPct, 5)}%` }}></div>
                      <div className="chart-bar-label">{item.month}</div>
                    </div>
                  );
                })
              ) : (
                <div className="no-chart-data">Create quotations or bills to generate analytics trend charts.</div>
              )}
            </div>
          </div>

          {/* Top client list */}
          <div className="top-clients-wrapper">
            <h3>Top Clients by Billing Volume</h3>
            {analytics?.topClients && analytics.topClients.length > 0 ? (
              <div className="client-stats-list">
                {analytics.topClients.map((client, idx) => (
                  <div key={idx} className="client-stat-row">
                    <span className="client-rank">#{idx + 1}</span>
                    <span className="client-stat-name">{client.name}</span>
                    <span className="client-stat-count">({client.count} bills)</span>
                    <span className="client-stat-amt tabular-nums">{formatCurrency(client.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-chart-data">No clients billed yet. Save bills to populate.</div>
            )}
          </div>
        </div>
      </section>

      <style jsx>{`
        .loading-container {
          display: flex;
          height: 50vh;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 2.5rem;
          height: 2.5rem;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: var(--color-primary);
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .home-dashboard {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          width: 100%;
        }

        /* Hero Banner */
        .hero-banner {
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(20, 184, 166, 0.05) 100%), var(--bg-card);
        }

        @media (min-width: 768px) {
          .hero-banner {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }

        .hero-content h1 {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 0.25rem;
        }

        .tagline {
          color: var(--text-muted);
          font-size: 1.1rem;
          font-weight: 500;
          margin-bottom: 1.25rem;
        }

        .badge-profile-state {
          display: inline-block;
          font-size: 0.75rem;
          padding: 0.2rem 0.5rem;
          border-radius: 9999px;
          background: rgba(20, 184, 166, 0.1);
          border: 1px solid rgba(20, 184, 166, 0.2);
          color: var(--color-secondary);
          font-weight: 600;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }

        .profile-details-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .profile-details-strip span {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .setup-prompt-card {
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          max-width: 320px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        [data-theme="light"] .setup-prompt-card {
          background: rgba(15, 23, 42, 0.03);
        }

        .setup-prompt-card p {
          font-size: 0.85rem;
          line-height: 1.4;
          color: var(--text-muted);
        }

        .setup-btn {
          display: inline-block;
          background: var(--color-primary);
          color: white;
          text-align: center;
          padding: 0.6rem;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          font-weight: 600;
          transition: background 0.2s ease;
        }

        .setup-btn:hover {
          background: var(--color-primary-hover);
        }

        /* Dashboard Grid CTA */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        @media (min-width: 640px) {
          .dashboard-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .grid-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: 160px;
          justify-content: space-between;
          position: relative;
        }

        .card-icon-wrapper {
          width: 3rem;
          height: 3rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .accent-indigo {
          background: rgba(99, 102, 241, 0.15);
          color: var(--color-primary);
        }

        .accent-teal {
          background: rgba(20, 184, 166, 0.15);
          color: var(--color-secondary);
        }

        .accent-emerald {
          background: rgba(16, 185, 129, 0.15);
          color: var(--color-success);
        }

        .accent-purple {
          background: rgba(168, 85, 247, 0.15);
          color: #a855f7;
        }

        .badge-count {
          position: absolute;
          top: -6px;
          right: -6px;
          background: var(--color-primary);
          color: white;
          font-size: 0.75rem;
          font-weight: 800;
          height: 20px;
          min-width: 20px;
          padding: 0 4px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bg-app);
        }

        .card-info h2 {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .card-info p {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.3;
        }

        .cta-card {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%), var(--bg-card);
        }

        .arrow-go {
          position: absolute;
          bottom: 1.5rem;
          right: 1.5rem;
          color: var(--text-muted);
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .grid-card:hover .arrow-go {
          transform: translateX(4px);
          color: var(--text-main);
        }

        /* Analytics Section */
        .analytics-section {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .analytics-header h2 {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .analytics-header .subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (min-width: 1024px) {
          .stats-row {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-box {
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        [data-theme="light"] .stat-box {
          background: rgba(15, 23, 42, 0.02);
        }

        .stat-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-val {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .stat-sub {
          font-size: 0.9rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .analytics-details {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 1024px) {
          .analytics-details {
            grid-template-columns: 1.2fr 0.8fr;
          }
        }

        .chart-wrapper, .top-clients-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .chart-wrapper h3, .top-clients-wrapper h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-main);
        }

        /* CSS Bar Chart */
        .chart-bar-container {
          display: flex;
          height: 200px;
          align-items: flex-end;
          justify-content: space-between;
          padding: 1rem 0;
          border-bottom: 1px solid var(--border-color);
          gap: 1rem;
        }

        .chart-bar-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        .chart-bar {
          width: 100%;
          max-width: 48px;
          background: linear-gradient(to top, var(--color-primary), var(--color-secondary));
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          transition: transform 0.3s ease;
          position: relative;
        }

        .chart-bar:hover {
          transform: scaleX(1.05);
          filter: brightness(1.1);
        }

        .chart-bar-value {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
        }

        .chart-bar-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .no-chart-data {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          color: var(--text-muted);
          text-align: center;
          padding: 2rem;
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-md);
        }

        /* Client Stats list */
        .client-stats-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .client-stat-row {
          display: flex;
          align-items: center;
          padding: 0.85rem 1rem;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 0.9rem;
        }

        [data-theme="light"] .client-stat-row {
          background: rgba(15, 23, 42, 0.01);
        }

        .client-rank {
          font-weight: bold;
          color: var(--color-secondary);
          margin-right: 0.75rem;
          width: 24px;
        }

        .client-stat-name {
          font-weight: 600;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .client-stat-count {
          color: var(--text-muted);
          font-size: 0.8rem;
          margin-right: 1rem;
        }

        .client-stat-amt {
          font-weight: 700;
          color: var(--color-primary);
        }
      `}</style>
    </div>
  );
}
