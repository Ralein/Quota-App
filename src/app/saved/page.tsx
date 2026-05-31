'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getQuotations, deleteQuotation, saveQuotation, getNextRefNo } from '@/utils/db';
import { Quotation } from '@/types';

type FilterType = 'all' | 'quotation' | 'running_bill' | 'invoice' | 'draft' | 'sent' | 'accepted' | 'paid';
type TimeFilter = 'all' | 'week' | 'month';

export default function SavedPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  
  // Filters & Search State
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
      <div className="loading-container">
        <div className="spinner"></div>
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

  // Helper formats
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

  // Filter & Sort Logic
  const filteredQuotes = quotations.filter(q => {
    // Search filter
    const matchesSearch = 
      q.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.total.toString().includes(searchQuery);

    // Type/Status filter
    let matchesTypeStatus = true;
    if (typeFilter !== 'all') {
      if (['quotation', 'running_bill', 'invoice'].includes(typeFilter)) {
        matchesTypeStatus = q.type === typeFilter;
      } else {
        matchesTypeStatus = q.status === typeFilter;
      }
    }

    // Time filter
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
    <div className="saved-page animate-fade-in">
      <div className="saved-header-bar">
        <div>
          <h1>🗂 Saved Invoices & Bills</h1>
          <p>Search, filter, duplicate, and manage all your billing and quotation files.</p>
        </div>
        <Link href="/create" className="new-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Quotation
        </Link>
      </div>

      {/* Filters Dashboard */}
      <div className="filters-container glass-panel">
        {/* Search */}
        <div className="search-bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ref number, client name, or total amount..." 
          />
        </div>

        {/* Filter chips */}
        <div className="filter-chips-row">
          <div className="chip-group">
            <span className="group-label">Type / Status:</span>
            {(['all', 'quotation', 'running_bill', 'invoice', 'draft', 'sent', 'accepted', 'paid'] as FilterType[]).map((type) => (
              <button 
                key={type} 
                onClick={() => setTypeFilter(type)} 
                className={`filter-chip ${typeFilter === type ? 'active' : ''}`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="chip-group">
            <span className="group-label">Date Range:</span>
            {(['all', 'week', 'month'] as TimeFilter[]).map((time) => (
              <button 
                key={time} 
                onClick={() => setTimeFilter(time)} 
                className={`filter-chip ${timeFilter === time ? 'active' : ''}`}
              >
                {time === 'all' ? 'All Time' : time === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          <div className="chip-group">
            <span className="group-label">Sort:</span>
            <button onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')} className="filter-chip active sort-chip">
              {sortBy === 'newest' ? 'Newest First ⬇' : 'Oldest First ⬆'}
            </button>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="documents-list">
        {filteredQuotes.length > 0 ? (
          filteredQuotes.map((doc) => (
            <div key={doc.id} className="doc-card glass-panel animate-fade-in">
              <div className="doc-card-header">
                <div>
                  <span className="doc-ref">{doc.refNo}</span>
                  <span className={`doc-type-badge ${doc.type}`}>
                    {doc.type.replace('_', ' ')}
                  </span>
                </div>
                <span className="doc-date">{formatDate(doc.date)}</span>
              </div>

              <div className="doc-card-body">
                <div className="doc-client">
                  <span className="label">Client</span>
                  <span className="val">{doc.client.name}</span>
                </div>
                
                <div className="doc-amount-section">
                  <span className="label">Total Amount</span>
                  <span className="val tabular-nums">{formatCurrency(doc.total)}</span>
                </div>
              </div>

              <div className="doc-card-footer">
                {/* Status indicator */}
                <div className="status-dropdown-wrapper">
                  <span className={`status-badge ${doc.status}`}>{doc.status}</span>
                  <select 
                    value={doc.status}
                    onChange={(e) => handleStatusChange(doc.id, e.target.value as Quotation['status'])}
                    className="status-selector"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                {/* Document Actions */}
                <div className="doc-actions">
                  <Link href={`/preview/${doc.id}`} className="doc-action-btn view" title="Preview A4 Document">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    Preview
                  </Link>

                  <Link href={`/create?id=${doc.id}`} className="doc-action-btn edit" title="Edit Content">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    Edit
                  </Link>

                  <button onClick={() => handleDuplicate(doc)} className="doc-action-btn duplicate" title="Duplicate Document">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Duplicate
                  </button>

                  <button onClick={() => handleDelete(doc.id, doc.refNo)} className="doc-action-btn delete" title="Delete Permanent">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-docs glass-panel">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p>No invoices or quotations matched your selection. Create a new document to get started.</p>
            <Link href="/create" className="new-btn">Create First Quotation</Link>
          </div>
        )}
      </div>

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

        .saved-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        .saved-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .saved-header-bar h1 {
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 0.25rem;
        }

        .saved-header-bar p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .new-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--color-primary);
          color: white;
          padding: 0.75rem 1.25rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 0.95rem;
        }

        .new-btn:hover {
          background: var(--color-primary-hover);
        }

        /* Filters container */
        .filters-container {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.01);
        }

        [data-theme="light"] .search-bar {
          background: rgba(15, 23, 42, 0.01);
        }

        .search-bar input {
          flex: 1;
          color: var(--text-main);
          font-size: 0.95rem;
        }

        .filter-chips-row {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .chip-group {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }

        .group-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-right: 0.5rem;
          text-transform: uppercase;
        }

        .filter-chip {
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          border: 1px solid var(--border-color);
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.02);
          text-transform: capitalize;
        }

        .filter-chip:hover {
          color: var(--text-main);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .filter-chip.active {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .sort-chip.active {
          background: var(--color-secondary);
          border-color: var(--color-secondary);
        }

        /* Documents Grid */
        .documents-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        .doc-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .doc-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
        }

        .doc-ref {
          font-weight: 700;
          font-size: 1.1rem;
          margin-right: 0.75rem;
          letter-spacing: -0.2px;
        }

        .doc-type-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }

        .doc-type-badge.quotation {
          background: rgba(99, 102, 241, 0.12);
          color: var(--color-primary);
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .doc-type-badge.running_bill {
          background: rgba(20, 184, 166, 0.12);
          color: var(--color-secondary);
          border: 1px solid rgba(20, 184, 166, 0.2);
        }

        .doc-type-badge.invoice {
          background: rgba(168, 85, 247, 0.12);
          color: #a855f7;
          border: 1px solid rgba(168, 85, 247, 0.2);
        }

        .doc-date {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .doc-card-body {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        @media (min-width: 600px) {
          .doc-card-body {
            grid-template-columns: 1.5fr 1fr;
          }
        }

        .doc-client, .doc-amount-section {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .doc-client .label, .doc-amount-section .label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .doc-client .val {
          font-weight: 600;
          font-size: 1.05rem;
        }

        .doc-amount-section {
          align-items: flex-start;
        }

        @media (min-width: 600px) {
          .doc-amount-section {
            align-items: flex-end;
          }
        }

        .doc-amount-section .val {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--color-secondary);
        }

        .doc-card-footer {
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        /* Status selector dropdown style */
        .status-dropdown-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-badge {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
          border: 1px solid transparent;
        }

        .status-badge.draft {
          background: rgba(148, 163, 184, 0.12);
          color: #94a3b8;
          border-color: rgba(148, 163, 184, 0.25);
        }

        .status-badge.sent {
          background: rgba(59, 130, 246, 0.12);
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.25);
        }

        .status-badge.accepted {
          background: rgba(16, 185, 129, 0.12);
          color: var(--color-success);
          border-color: rgba(16, 185, 129, 0.25);
        }

        .status-badge.paid {
          background: rgba(20, 184, 166, 0.12);
          color: var(--color-secondary);
          border-color: rgba(20, 184, 166, 0.25);
        }

        .status-selector {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .doc-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .doc-action-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 0.75rem;
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.01);
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .doc-action-btn:hover {
          color: var(--text-main);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .doc-action-btn.view:hover {
          background: rgba(99, 102, 241, 0.12);
          color: var(--color-primary);
          border-color: rgba(99, 102, 241, 0.2);
        }

        .doc-action-btn.edit:hover {
          background: rgba(20, 184, 166, 0.12);
          color: var(--color-secondary);
          border-color: rgba(20, 184, 166, 0.2);
        }

        .doc-action-btn.duplicate:hover {
          background: rgba(168, 85, 247, 0.12);
          color: #a855f7;
          border-color: rgba(168, 85, 247, 0.2);
        }

        .doc-action-btn.delete:hover {
          background: rgba(239, 68, 68, 0.12);
          color: var(--color-danger);
          border-color: rgba(239, 68, 68, 0.2);
        }

        .no-docs {
          padding: 4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          text-align: center;
          color: var(--text-muted);
        }

        .no-docs p {
          max-width: 400px;
        }
      `}</style>
    </div>
  );
}
