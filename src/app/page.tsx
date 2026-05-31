'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCompanyProfile, getQuotations, getClients, getAnalytics, AnalyticsSummary } from '@/utils/db';
import { CompanyProfile, Quotation } from '@/types';
import {
  Plus,
  FileText,
  Users,
  Settings,
  Phone,
  CreditCard,
  ArrowRight,
  BarChart3,
  TrendingUp,
  Zap,
  Crown
} from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [lastBillDate, setLastBillDate] = useState<string>('No bills created yet');

  useEffect(() => {
    setMounted(true);
    const activeProfile = getCompanyProfile();
    const activeQuotes = getQuotations();
    const activeClients = getClients();
    const stats = getAnalytics();
    
    setProfile(activeProfile);
    setQuotations(activeQuotes);
    setClientCount(activeClients.length);
    setAnalytics(stats);

    if (activeQuotes.length > 0) {
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
        <div className="w-10 h-10 border-3 border-primary/20 rounded-full border-t-primary animate-spin"></div>
      </div>
    );
  }

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
      <section className="glass-panel p-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6 relative overflow-hidden bg-gradient-to-br from-primary/10 via-transparent to-secondary/5">
        {/* Subtle shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.03] to-transparent animate-[shimmer_8s_ease-in-out_infinite] bg-[length:200%_100%] pointer-events-none"></div>
        <div className="flex-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold mb-3 uppercase tracking-wider">
            <Crown size={12} />
            {hasSetupProfile ? 'Active Profile' : 'Using Demo Profile'}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-text-main">
            {profile?.name || 'Welcome to NexaQuote'}
          </h1>
          <p className="text-text-muted text-base font-medium mb-4">
            {profile?.tagline || 'Sp. In Professional Services'}
          </p>
          <div className="flex flex-wrap gap-5 text-sm text-text-muted">
            {profile?.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={14} className="text-primary/60" />
                {profile.phone}
              </span>
            )}
            {profile?.taxId && (
              <span className="flex items-center gap-1.5">
                <CreditCard size={14} className="text-primary/60" />
                GSTIN: {profile.taxId}
              </span>
            )}
          </div>
        </div>
        {!hasSetupProfile && (
          <div className="relative z-10 p-5 bg-white/[0.03] border border-border-main rounded-xl max-w-xs flex flex-col gap-4">
            <p className="text-xs leading-relaxed text-text-muted">
              Setup your custom business profile to customize details on print outs.
            </p>
            <Link href="/settings" className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-text-inverse text-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 animate-glow-pulse">
              <Settings size={15} />
              Configure Business
            </Link>
          </div>
        )}
      </section>

      {/* Grid CTA Actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: New Quotation */}
        <Link href="/create" className="group glass-panel glass-panel-hover p-6 flex flex-col gap-6 h-40 justify-between relative bg-gradient-to-br from-primary/8 via-transparent to-primary/3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/15 text-primary">
            <Plus size={24} strokeWidth={2.5} />
          </div>
          <div className="pr-8">
            <h2 className="font-bold text-lg text-text-main mb-1">New Document</h2>
            <p className="text-xs text-text-muted leading-snug">Create Quotation, Invoice or Running Bill</p>
          </div>
          <div className="absolute bottom-6 right-6 text-text-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary">
            <ArrowRight size={20} />
          </div>
        </Link>

        {/* Card 2: Saved Quotations */}
        <Link href="/saved" className="group glass-panel glass-panel-hover p-6 flex flex-col gap-6 h-40 justify-between relative">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-secondary/15 text-secondary relative">
            <FileText size={24} />
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-text-inverse text-[10px] font-extrabold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center border-2 border-app-bg">
              {quotations.length}
            </span>
          </div>
          <div className="pr-8">
            <h2 className="font-bold text-lg text-text-main mb-1">Saved Documents</h2>
            <p className="text-xs text-text-muted leading-snug">{lastBillDate}</p>
          </div>
          <div className="absolute bottom-6 right-6 text-text-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary">
            <ArrowRight size={20} />
          </div>
        </Link>

        {/* Card 3: Clients */}
        <Link href="/clients" className="group glass-panel glass-panel-hover p-6 flex flex-col gap-6 h-40 justify-between relative">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/15 text-emerald-400 relative">
            <Users size={24} />
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-text-inverse text-[10px] font-extrabold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center border-2 border-app-bg">
              {clientCount}
            </span>
          </div>
          <div className="pr-8">
            <h2 className="font-bold text-lg text-text-main mb-1">Client Directory</h2>
            <p className="text-xs text-text-muted leading-snug">Manage clients and billing locations</p>
          </div>
          <div className="absolute bottom-6 right-6 text-text-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary">
            <ArrowRight size={20} />
          </div>
        </Link>

        {/* Card 4: Settings */}
        <Link href="/settings" className="group glass-panel glass-panel-hover p-6 flex flex-col gap-6 h-40 justify-between relative">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/15 text-purple-400">
            <Settings size={24} />
          </div>
          <div className="pr-8">
            <h2 className="font-bold text-lg text-text-main mb-1">Preferences</h2>
            <p className="text-xs text-text-muted leading-snug">Customize default terms, default taxes, and units</p>
          </div>
          <div className="absolute bottom-6 right-6 text-text-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary">
            <ArrowRight size={20} />
          </div>
        </Link>
      </section>

      {/* Analytics Panel */}
      <section className="glass-panel gold-accent-top p-6 sm:p-8 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 className="font-bold text-2xl text-text-main">Analytics Summary</h2>
            <span className="text-sm text-text-muted">Performance of saved invoices & bills</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white/[0.02] border border-border-main rounded-xl flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Billed This Month</span>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-main">{formatCurrency(analytics?.totalBilledThisMonth || 0)}</span>
          </div>
          <div className="p-5 bg-white/[0.02] border border-border-main rounded-xl flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Billed This Year</span>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-main">{formatCurrency(analytics?.totalBilledThisYear || 0)}</span>
          </div>
          <div className="p-5 bg-white/[0.02] border border-border-main rounded-xl flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Quotes Sent (Accepted)</span>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-main">
              {analytics?.quotationCount || 0} <span className="text-sm text-text-muted font-semibold">({analytics?.acceptedCount || 0})</span>
            </span>
          </div>
          <div className="p-5 bg-white/[0.02] border border-border-main rounded-xl flex flex-col gap-2">
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
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <h3 className="font-bold text-base text-text-main">Revenue Trend (Past 6 Months)</h3>
            </div>
            <div className="flex h-[200px] items-end justify-between py-4 border-b border-border-main gap-4">
              {analytics?.monthlyRevenue && analytics.monthlyRevenue.length > 0 ? (
                analytics.monthlyRevenue.map((item, idx) => {
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
                  <div key={idx} className="flex items-center p-3 px-4 bg-white/[0.01] border border-border-main rounded-xl text-sm">
                    <span className="font-bold text-primary mr-3 w-6">#{idx + 1}</span>
                    <span className="font-semibold flex-1 truncate">{client.name}</span>
                    <span className="text-text-muted text-xs mr-4">({client.count} bills)</span>
                    <span className="font-bold text-secondary tabular-nums">{formatCurrency(client.amount)}</span>
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
