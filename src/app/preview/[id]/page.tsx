'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getQuotationById } from '@/utils/db';
import { Quotation } from '@/types';

export default function PreviewQuotation() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [quotation, setQuotation] = useState<Quotation | null>(null);

  useEffect(() => {
    setMounted(true);
    if (id) {
      const doc = getQuotationById(id);
      if (doc) {
        setQuotation(doc);
      } else {
        alert('Document not found.');
        router.push('/saved');
      }
    }
  }, [id]);

  if (!mounted || !quotation) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  // Format Helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  // Custom rate/amount display to match contractor handbills (e.g. 715/-)
  const formatRate = (rate: number | null, isLumpSum: boolean) => {
    if (isLumpSum) return 'L.S';
    if (rate === null) return '-';
    return `${rate}/-`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: '2-digit',
      year: '2-digit'
    });
  };

  // Sharing text creation
  const getShareText = () => {
    const docTypeLabel = quotation.type === 'quotation' ? 'Quotation' : quotation.type === 'running_bill' ? 'Running Bill' : 'Invoice';
    return `${docTypeLabel} from ${quotation.company.name}\nRef No: ${quotation.refNo}\nDate: ${formatDate(quotation.date)}\nTotal Amount: ₹${formatCurrency(quotation.total)}\nClient: ${quotation.client.name}`;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`${quotation.type.toUpperCase()} - ${quotation.refNo} - ${quotation.company.name}`);
    const body = encodeURIComponent(`${getShareText()}\n\nPlease find the detailed copy in the print out attachment.`);
    window.open(`mailto:${quotation.client.email || ''}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="preview-page animate-fade-in">
      {/* Action bar (hidden in print) */}
      <div className="no-print actions-bar glass-panel">
        <div className="actions-left">
          <Link href="/saved" className="action-btn-back">
            ← Back to List
          </Link>
        </div>
        <div className="actions-right">
          <Link href={`/create?id=${quotation.id}`} className="action-btn edit-btn">
            ✏️ Edit Document
          </Link>
          <button onClick={handleShareWhatsApp} className="action-btn whatsapp-btn">
            💬 Share WhatsApp
          </button>
          <button onClick={handleShareEmail} className="action-btn email-btn">
            📧 Email Client
          </button>
          <button onClick={handlePrint} className="action-btn print-btn">
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      {/* A4 Paper Template Container */}
      <div className="print-page-wrapper a4-sheet glass-panel">
        
        {/* Company Header Info */}
        <div className="print-header">
          {quotation.company.logoUri && (
            <img src={quotation.company.logoUri} alt="Logo" className="company-logo-print" />
          )}
          <h1 className="print-company-name">{quotation.company.name}</h1>
          <p className="print-company-tagline">{quotation.company.tagline}</p>
          <p className="print-company-contact">
            {quotation.company.phone && `Phone: ${quotation.company.phone}`}
            {quotation.company.email && `  |  Email: ${quotation.company.email}`}
            {quotation.company.website && `  |  Web: ${quotation.company.website}`}
            {quotation.company.taxId && `  |  GSTIN: ${quotation.company.taxId}`}
            {quotation.company.address && <span className="hdr-addr"><br />Address: {quotation.company.address}</span>}
          </p>
        </div>

        {/* Meta Grid */}
        <div className="print-meta-grid">
          <div>Ref. No. <strong>{quotation.refNo}</strong></div>
          <div className="print-meta-right">Date: <strong>{formatDate(quotation.date)}</strong></div>
        </div>

        {/* Client details info */}
        <div className="print-to-section">
          <div className="print-to-label">To,</div>
          <div className="print-to-name">{quotation.client.name}</div>
          <pre className="print-to-address">{quotation.client.address}</pre>
          {quotation.client.taxId && <div className="client-tax-print">GSTIN: {quotation.client.taxId}</div>}
        </div>

        {/* Subject Header */}
        <div className="print-subject">
          Sub: {quotation.type === 'quotation' ? 'Quotation' : quotation.type === 'running_bill' ? 'Running Bill' : 'Invoice'}
          {quotation.subject ? ` — ${quotation.subject}` : ''}
        </div>

        {/* Ruled Rupee Table */}
        <table className="print-table">
          <thead>
            <tr>
              <th className="print-col-sr">Sr. No.</th>
              <th className="print-col-desc">Description</th>
              <th className="print-col-qty">Qty</th>
              <th className="print-col-rate">Rate</th>
              <th className="print-col-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item, index) => (
              <tr key={item.id}>
                <td className="print-col-sr">{index + 1}</td>
                <td className="print-col-desc">{item.description}</td>
                <td className="print-col-qty">
                  {item.isLumpSum ? '-' : `${item.qty} ${item.unit}`}
                </td>
                <td className="print-col-rate tabular-nums">
                  {formatRate(item.rate, item.isLumpSum)}
                </td>
                <td className="print-col-amount tabular-nums">
                  {formatCurrency(item.amount)}/-
                </td>
              </tr>
            ))}
            
            {/* Subtotal row */}
            <tr className="print-totals-row">
              <td colSpan={3} style={{ border: 'none' }}></td>
              <td className="print-totals-label">Subtotal</td>
              <td className="print-totals-val tabular-nums">
                {formatCurrency(quotation.subtotal)}/-
              </td>
            </tr>

            {/* Discount row if present */}
            {quotation.discountAmount > 0 && (
              <tr>
                <td colSpan={3} style={{ border: 'none' }}></td>
                <td className="print-totals-label">
                  Discount {quotation.discountType === 'percent' ? `(${quotation.discountValue}%)` : ''}
                </td>
                <td className="print-totals-val tabular-nums text-danger">
                  -{formatCurrency(quotation.discountAmount)}/-
                </td>
              </tr>
            )}

            {/* Tax row if present */}
            {quotation.taxAmount > 0 && (
              <tr>
                <td colSpan={3} style={{ border: 'none' }}></td>
                <td className="print-totals-label">
                  {quotation.taxLabel} ({quotation.taxRate}%)
                </td>
                <td className="print-totals-val tabular-nums">
                  {formatCurrency(quotation.taxAmount)}/-
                </td>
              </tr>
            )}

            {/* Grand Total row */}
            <tr>
              <td colSpan={3} style={{ border: 'none' }}></td>
              <td className="print-totals-label" style={{ fontSize: '10.5pt', borderTop: '1.5pt solid #000000' }}>TOTAL</td>
              <td className="print-totals-val tabular-nums" style={{ fontSize: '11.5pt', borderTop: '1.5pt solid #000000' }}>
                {formatCurrency(quotation.total)}/-
              </td>
            </tr>
          </tbody>
        </table>

        {/* Currency Amount in Words */}
        <div className="print-words-box">
          ({quotation.amountInWords})
        </div>

        {/* Terms and conditions info */}
        {quotation.termsAndConditions && (
          <div className="print-terms">
            <div className="print-terms-title">Terms & Conditions:</div>
            {quotation.termsAndConditions}
          </div>
        )}

        {/* Signatory Grid Footer */}
        <div className="print-sign-grid">
          <div className="print-sign-thankyou">
            THANKING YOU
          </div>
          <div className="print-sign-area">
            <div className="print-sign-company">{quotation.company.name}</div>
            
            {quotation.company.signatureUri && (
              <img src={quotation.company.signatureUri} alt="Signature Logo" className="print-sign-img" />
            )}
            
            <div className="print-sign-label">
              {quotation.company.proprietorName && `${quotation.company.proprietorName}`}<br />
              ({quotation.company.signatureLabel})
            </div>
          </div>
        </div>

        {/* A4 Sheet Footer (hidden on screen, visible on print pages) */}
        <div className="print-footer">
          Generated via QuoteBuilder Pro | {quotation.company.name}
        </div>
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

        .preview-page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          width: 100%;
          align-items: center;
          padding-bottom: 4rem;
        }

        /* Action Bar */
        .actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 800px;
          padding: 1rem 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .action-btn-back {
          font-weight: 600;
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .action-btn-back:hover {
          color: var(--text-main);
        }

        .actions-right {
          display: flex;
          gap: 0.50rem;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 0.6rem 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 700;
        }

        .edit-btn {
          border: 1px solid var(--border-color);
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.02);
        }

        .edit-btn:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .whatsapp-btn {
          background: #25d366;
          color: white;
        }

        .whatsapp-btn:hover {
          background: #20ba5a;
        }

        .email-btn {
          background: rgba(20, 184, 166, 0.15);
          color: var(--color-secondary);
          border: 1px solid rgba(20, 184, 166, 0.3);
        }

        .email-btn:hover {
          background: rgba(20, 184, 166, 0.25);
        }

        .print-btn {
          background: var(--color-primary);
          color: white;
        }

        .print-btn:hover {
          background: var(--color-primary-hover);
        }

        /* A4 Sheet on Screen CSS */
        .a4-sheet {
          background: #ffffff !important;
          color: #000000 !important;
          width: 100%;
          max-width: 800px; /* Mock A4 width */
          min-height: 1050px;
          padding: 3rem !important;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          font-family: Arial, Helvetica, sans-serif !important;
        }

        .company-logo-print {
          max-height: 60px;
          margin-bottom: 0.5rem;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }

        .print-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .print-company-name {
          font-size: 22pt;
          font-weight: bold;
          color: #d32f2f !important;
          margin-bottom: 0.25rem;
        }

        .print-company-tagline {
          font-size: 11pt;
          font-weight: bold;
          color: #374151;
          font-style: italic;
          margin-bottom: 0.5rem;
        }

        .print-company-contact {
          font-size: 9.5pt;
          color: #4b5563;
          border-bottom: 2px solid #111827;
          padding-bottom: 0.5rem;
        }

        .hdr-addr {
          font-size: 8.5pt;
          color: #6b7280;
        }

        .print-meta-grid {
          display: flex;
          justify-content: space-between;
          font-size: 10.5pt;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #111827;
          padding-bottom: 0.5rem;
        }

        .print-meta-right {
          text-align: right;
        }

        .print-to-section {
          font-size: 11pt;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .print-to-label {
          font-weight: bold;
          color: #374151;
        }

        .print-to-name {
          font-weight: bold;
          font-size: 11.5pt;
        }

        .print-to-address {
          font-family: inherit;
          white-space: pre-wrap;
          font-size: 10.5pt;
          color: #374151;
        }

        .client-tax-print {
          font-size: 9.5pt;
          font-weight: bold;
          color: #4b5563;
          margin-top: 0.25rem;
        }

        .print-subject {
          text-align: center;
          font-size: 12pt;
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 2rem;
        }

        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5rem;
        }

        .print-table th, 
        .print-table td {
          border: 1px solid #111827;
          padding: 0.6rem 0.75rem;
          font-size: 10pt;
          vertical-align: middle;
        }

        .print-table th {
          background-color: #f3f4f6;
          font-weight: bold;
          text-align: center;
        }

        .print-col-sr {
          width: 8%;
          text-align: center;
        }
        
        .print-col-desc {
          width: 50%;
          text-align: left;
        }

        .print-col-qty {
          width: 14%;
          text-align: right;
        }

        .print-col-rate {
          width: 14%;
          text-align: right;
        }

        .print-col-amount {
          width: 14%;
          text-align: right;
        }

        .print-totals-row td {
          border-top: 2px solid #111827;
        }

        .print-totals-label {
          font-weight: bold;
          text-align: right;
        }

        .print-totals-val {
          font-weight: bold;
          text-align: right;
        }

        .print-words-box {
          font-size: 10.5pt;
          font-weight: bold;
          margin-bottom: 2rem;
          font-style: italic;
        }

        .print-terms {
          font-size: 9.5pt;
          line-height: 1.5;
          margin-bottom: 2.5rem;
          white-space: pre-wrap;
          color: #374151;
        }

        .print-terms-title {
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 0.25rem;
          color: #111827;
        }

        .print-sign-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: auto;
          padding-top: 2rem;
        }

        .print-sign-thankyou {
          font-weight: bold;
          font-size: 11pt;
        }

        .print-sign-area {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          min-width: 200px;
        }

        .print-sign-company {
          font-weight: bold;
          font-size: 11pt;
          margin-bottom: 3.5rem;
          text-align: right;
        }

        .print-sign-img {
          max-height: 45px;
          margin-bottom: 0.5rem;
          filter: contrast(1.2) multiply;
        }

        .print-sign-label {
          font-size: 9.5pt;
          border-top: 1px dashed #9ca3af;
          padding-top: 0.25rem;
          text-align: right;
          width: 100%;
        }

        .print-footer {
          display: none;
        }

        /* Screen only adjustments for dark mode text inside A4 sheets */
        [data-theme="dark"] .a4-sheet {
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        @media print {
          .preview-page {
            padding: 0 !important;
            margin: 0 !important;
          }
          .a4-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .print-footer {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
