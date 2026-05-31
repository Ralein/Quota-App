'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getQuotations, deleteQuotation, saveQuotation, getNextRefNo } from '@/utils/db';
import { Quotation } from '@/types';
import {
  FolderOpen,
  Plus,
  Search,
  Eye,
  Pen,
  Copy,
  Trash2,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  FileText
} from 'lucide-react';

type FilterType = 'all' | 'quotation' | 'running_bill' | 'invoice' | 'draft' | 'sent' | 'accepted' | 'paid';
type TimeFilter = 'all' | 'week' | 'month';

export default function SavedPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const loadQuotations = () => {
    setQuotations(getQuotations());
  };

  useEffect(() => {
    setMounted(true);
    loadQuotations();
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary/20 rounded-full border-t-primary animate-spin"></div>
      </div>
    );
  }

  const handleDelete = (id: string, refNo: string) => {
    if (confirm(`Are you sure you want to delete invoice/quotation "${refNo}"?`)) {
      deleteQuotation(id);
      loadQuotations();
    }
  };

  const handleDuplicate = (quote: Quotation) => {
    const nextRef = getNextRefNo(quote.type);
    const newQuote: Quotation = {
      ...quote,
      id: `quote_${Date.now()}`,
      refNo: nextRef,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveQuotation(newQuote);
    alert(`Document duplicated successfully as Draft: ${nextRef}`);
    router.push(`/create?id=${newQuote.id}`);
  };

  const handleStatusChange = (id: string, nextStatus: Quotation['status']) => {
    const quotationsList = getQuotations();
    const index = quotationsList.findIndex(q => q.id === id);
    if (index !== -1) {
      quotationsList[index].status = nextStatus;
      saveQuotation(quotationsList[index]);
      loadQuotations();
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredQuotes = quotations.filter(q => {
    const matchesSearch = 
      q.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.total.toString().includes(searchQuery);

    let matchesTypeStatus = true;
    if (typeFilter !== 'all') {
      if (['quotation', 'running_bill', 'invoice'].includes(typeFilter)) {
        matchesTypeStatus = q.type === typeFilter;
      } else {
        matchesTypeStatus = q.status === typeFilter;
      }
    }

    let matchesTime = true;
    const now = new Date();
    const quoteDate = new Date(q.date);
    const diffTime = Math.abs(now.getTime() - quoteDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (timeFilter === 'week') {
      matchesTime = diffDays <= 7;
    } else if (timeFilter === 'month') {
      matchesTime = diffDays <= 30;
    }

    return matchesSearch && matchesTypeStatus && matchesTime;
  }).sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
            <FolderOpen size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-0.5 text-text-main">Saved Invoices & Bills</h1>
            <p className="text-text-muted text-sm">Search, filter, duplicate, and manage all your billing and quotation files.</p>
          </div>
        </div>
        <Link
          href="/create"
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-text-inverse px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200"
        >
          <Plus size={18} />
          New Document
        </Link>
      </div>

      {/* Filters Dashboard */}
      <div className="glass-panel p-6 flex flex-col gap-5">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-2.5 border border-border-main rounded-lg bg-white/[0.01]">
          <Search className="text-text-muted shrink-0" size={20} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ref number, client name, or total amount..." 
            className="flex-1 bg-transparent text-text-main placeholder:text-text-muted text-sm outline-none border-none focus:ring-0"
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-2 shrink-0">Type / Status:</span>
            {(['all', 'quotation', 'running_bill', 'invoice', 'draft', 'sent', 'accepted', 'paid'] as FilterType[]).map((type) => (
              <button 
                key={type} 
                onClick={() => setTypeFilter(type)} 
                className={`px-3.5 py-1.5 border rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer capitalize ${
                  typeFilter === type
                    ? 'bg-primary border-primary text-text-inverse'
                    : 'text-text-muted bg-white/[0.02] border-border-main hover:text-text-main hover:border-primary/30'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-2 shrink-0">Date Range:</span>
            {(['all', 'week', 'month'] as TimeFilter[]).map((time) => (
              <button 
                key={time} 
                onClick={() => setTimeFilter(time)} 
                className={`px-3.5 py-1.5 border rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  timeFilter === time
                    ? 'bg-primary border-primary text-text-inverse'
                    : 'text-text-muted bg-white/[0.02] border-border-main hover:text-text-main hover:border-primary/30'
                }`}
              >
                {time === 'all' ? 'All Time' : time === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-2 shrink-0">Sort:</span>
            <button
              onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-secondary rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer bg-secondary text-text-inverse"
            >
              {sortBy === 'newest' ? <ArrowDownWideNarrow size={14} /> : <ArrowUpWideNarrow size={14} />}
              {sortBy === 'newest' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 gap-5">
        {filteredQuotes.length > 0 ? (
          filteredQuotes.map((doc) => (
            <div key={doc.id} className="glass-panel p-6 flex flex-col gap-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-border-main pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-text-main tracking-tight">{doc.refNo}</span>
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border tracking-wider ${
                    doc.type === 'quotation'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : doc.type === 'running_bill'
                      ? 'bg-secondary/10 text-secondary border-secondary/20'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  }`}>
                    {doc.type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-xs text-text-muted font-medium">{formatDate(doc.date)}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr] gap-5">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Client</span>
                  <span className="font-bold text-base text-text-main">{doc.client.name}</span>
                </div>
                
                <div className="flex flex-col gap-1 items-start sm:items-end">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total Amount</span>
                  <span className="text-xl font-extrabold text-primary tabular-nums">{formatCurrency(doc.total)}</span>
                </div>
              </div>

              <div className="border-t border-border-main pt-4 flex flex-wrap justify-between items-center gap-4">
                {/* Status indicator */}
                <div className="relative flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border tracking-wider ${
                    doc.status === 'draft'
                      ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      : doc.status === 'sent'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : doc.status === 'accepted'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}>{doc.status}</span>
                  <select 
                    value={doc.status}
                    onChange={(e) => handleStatusChange(doc.id, e.target.value as Quotation['status'])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                {/* Document Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/preview/${doc.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border-main bg-white/[0.01] rounded-lg text-xs font-semibold text-text-muted transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                    title="Preview A4 Document"
                  >
                    <Eye size={15} />
                    Preview
                  </Link>

                  <Link
                    href={`/create?id=${doc.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border-main bg-white/[0.01] rounded-lg text-xs font-semibold text-text-muted transition-all duration-200 hover:bg-secondary/10 hover:text-secondary hover:border-secondary/20"
                    title="Edit Content"
                  >
                    <Pen size={15} />
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDuplicate(doc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border-main bg-white/[0.01] rounded-lg text-xs font-semibold text-text-muted transition-all duration-200 hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/20"
                    title="Duplicate Document"
                  >
                    <Copy size={15} />
                    Duplicate
                  </button>

                  <button
                    onClick={() => handleDelete(doc.id, doc.refNo)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border-main bg-white/[0.01] rounded-lg text-xs font-semibold text-text-muted transition-all duration-200 hover:bg-danger/10 hover:text-danger hover:border-danger/20"
                    title="Delete Permanent"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center gap-5 p-16 text-center text-text-muted glass-panel">
            <FileText size={48} strokeWidth={1.5} />
            <p className="max-w-xs text-sm">No invoices or quotations matched your selection. Create a new document to get started.</p>
            <Link
              href="/create"
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-text-inverse px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200"
            >
              <Plus size={18} />
              Create First Quotation
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
