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
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-10 h-10 border-3 border-white/10 rounded-full border-t-primary animate-spin"></div>
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
    <div className="flex flex-col gap-8 w-full animate-fade-in">
      {/* Welcome Banner */}
      <section className="glass-panel p-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6 relative overflow-hidden bg-gradient-to-br from-primary/15 via-transparent to-secondary/5">
        <div className="flex-1">
          <div className="inline-block text-xs px-2.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary font-semibold mb-3 uppercase tracking-wider">
            {hasSetupProfile ? 'Active Profile' : 'Using Demo Profile'}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-text-main">
            {profile?.name || 'Welcome to QuoteBuilder'}
          </h1>
          <p className="text-text-muted text-base font-medium mb-4">
            {profile?.tagline || 'Sp. In Professional Services'}
          </p>
          <div className="flex flex-wrap gap-5 text-sm text-text-muted">
            {profile?.phone && (
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {profile.phone}
              </span>
            )}
            {profile?.taxId && (
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="4"/><line x1="8" y1="2" x2="8" y2="4"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                GSTIN: {profile.taxId}
              </span>
            )}
          </div>
        </div>
        {!hasSetupProfile && (
          <div className="p-5 bg-white/3 dark:bg-white/3 [data-theme=light]:bg-slate-900/3 border border-border-main rounded-xl max-w-xs flex flex-col gap-4">
            <p className="text-xs leading-relaxed text-text-muted">
              Setup your custom business profile to customize details on print outs.
            </p>
            <Link href="/settings" className="inline-block bg-primary hover:bg-primary-hover text-white text-center py-2 px-4 rounded-lg text-sm font-semibold transition-colors duration-200">
              Configure Business
            </Link>
          </div>
        )}
      </section>

      {/* Grid CTA Actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: New Quotation */}
        <Link href="/create" className="group glass-panel glass-panel-hover p-6 flex flex-col gap-6 h-40 justify-between relative bg-gradient-to-br from-primary/10 via-transparent to-primary/5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/15 text-primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div className="pr-8">
            <h2 className="font-bold text-lg text-text-main mb-1">New Document</h2>
            <p className="text-xs text-text-muted leading-snug">Create Quotation, Invoice or Running Bill</p>
          </div>
          <div className="absolute bottom-6 right-6 text-text-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-text-main">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        </Link>

        {/* Card 2: Saved Quotations */}
        <Link href="/saved" className="group glass-panel glass-panel-hover p-6 flex flex-col gap-6 h-40 justify-between relative">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-secondary/15 text-secondary relative">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-extrabold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center border-2 border-app-bg">
              {quotations.length}
            </span>
          </div>
          <div className="pr-8">
            <h2 className="font-bold text-lg text-text-main mb-1">Saved Documents</h2>
            <p className="text-xs text-text-muted leading-snug">{lastBillDate}</p>
          </div>
          <div className="absolute bottom-6 right-6 text-text-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-text-main">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        </Link>

        {/* Card 3: Clients */}
        <Link href="/clients" className="group glass-panel glass-panel-hover p-6 flex flex-col gap-6 h-40 justify-between relative">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/15 text-emerald-500 relative">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-extrabold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center border-2 border-app-bg">
              {clientCount}
            </span>
          </div>
          <div className="pr-8">
            <h2 className="font-bold text-lg text-text-main mb-1">Client Directory</h2>
            <p className="text-xs text-text-muted leading-snug">Manage clients and billing locations</p>
          </div>
          <div className="absolute bottom-6 right-6 text-text-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-text-main">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        </Link>

        {/* Card 4: Settings */}
        <Link href="/settings" className="group glass-panel glass-panel-hover p-6 flex flex-col gap-6 h-40 justify-between relative">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/15 text-purple-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82" />
            </svg>
          </div>
          <div className="pr-8">
            <h2 className="font-bold text-lg text-text-main mb-1">Preferences</h2>
            <p className="text-xs text-text-muted leading-snug">Customize default terms, default taxes, and units</p>
          </div>
          <div className="absolute bottom-6 right-6 text-text-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-text-main">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        </Link>
      </section>

      {/* Analytics Panel */}
      <section className="glass-panel p-6 sm:p-8 flex flex-col gap-8">
        <div>
          <h2 className="font-bold text-2xl text-text-main mb-1">📊 Analytics Summary</h2>
          <span className="text-sm text-text-muted">Performance of saved invoices & bills</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-xl flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Billed This Month</span>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-main">{formatCurrency(analytics?.totalBilledThisMonth || 0)}</span>
          </div>
          <div className="p-5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-xl flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Billed This Year</span>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-main">{formatCurrency(analytics?.totalBilledThisYear || 0)}</span>
          </div>
          <div className="p-5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-xl flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Quotes Sent (Accepted)</span>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-main">
              {analytics?.quotationCount || 0} <span className="text-sm text-text-muted font-semibold">({analytics?.acceptedCount || 0})</span>
            </span>
          </div>
          <div className="p-5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-xl flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Invoices / Running Bills</span>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-main">
              {analytics?.invoiceCount || 0} <span className="text-sm text-text-muted font-semibold">/ {analytics?.runningBillCount || 0}</span>
            </span>
          </div>
        </div>

        {/* Charts & Top Client breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          {/* Revenue chart */}
          <div className="flex flex-col gap-5">
            <h3 className="font-bold text-base text-text-main">Revenue Trend (Past 6 Months)</h3>
            <div className="flex h-[200px] items-end justify-between py-4 border-b border-border-main gap-4">
              {analytics?.monthlyRevenue && analytics.monthlyRevenue.length > 0 ? (
                analytics.monthlyRevenue.map((item, idx) => {
                  // Find max for scaling
                  const maxAmt = Math.max(...(analytics?.monthlyRevenue.map(m => m.amount) || [1]));
                  const heightPct = maxAmt > 0 ? (item.amount / maxAmt) * 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end gap-2">
                      <div className="text-[10px] font-bold text-text-main whitespace-nowrap mb-1">{formatCurrency(item.amount)}</div>
                      <div
                        className="w-full max-w-[48px] bg-gradient-to-t from-primary to-secondary rounded-t-md transition-all duration-300 hover:scale-x-105 hover:brightness-110"
                        style={{ height: `${Math.max(heightPct, 5)}%` }}
                      ></div>
                      <div className="text-xs text-text-muted font-medium">{item.month}</div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full min-h-[150px] flex items-center justify-center text-sm text-text-muted text-center p-8 border border-dashed border-border-main rounded-xl">
                  Create quotations or bills to generate analytics trend charts.
                </div>
              )}
            </div>
          </div>

          {/* Top client list */}
          <div className="flex flex-col gap-5">
            <h3 className="font-bold text-base text-text-main">Top Clients by Billing Volume</h3>
            {analytics?.topClients && analytics.topClients.length > 0 ? (
              <div className="flex flex-col gap-3">
                {analytics.topClients.map((client, idx) => (
                  <div key={idx} className="flex items-center p-3 px-4 bg-white/[0.01] dark:bg-white/[0.01] [data-theme=light]:bg-slate-900/[0.01] border border-border-main rounded-xl text-sm">
                    <span className="font-bold text-secondary mr-3 w-6">#{idx + 1}</span>
                    <span className="font-semibold flex-1 truncate">{client.name}</span>
                    <span className="text-text-muted text-xs mr-4">({client.count} bills)</span>
                    <span className="font-bold text-primary tabular-nums">{formatCurrency(client.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full min-h-[150px] flex items-center justify-center text-sm text-text-muted text-center p-8 border border-dashed border-border-main rounded-xl">
                No clients billed yet. Save bills to populate.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
