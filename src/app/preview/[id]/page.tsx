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
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-10 h-10 border-3 border-white/10 rounded-full border-t-primary animate-spin"></div>
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
    <div className="flex flex-col gap-8 w-full items-center pb-16 animate-fade-in">
      {/* Action bar (hidden in print) */}
      <div className="no-print glass-panel w-full max-w-3xl p-4 px-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <Link href="/saved" className="text-sm font-semibold text-text-muted hover:text-text-main transition-colors duration-200">
            ← Back to List
          </Link>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/create?id=${quotation.id}`}
            className="px-4 py-2 rounded-lg text-xs font-bold border border-border-main text-text-main bg-white/2 hover:bg-white/5 transition-all duration-200"
          >
            ✏️ Edit Document
          </Link>
          <button
            onClick={handleShareWhatsApp}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#25d366] hover:bg-[#20ba5a] text-white cursor-pointer transition-all duration-200"
          >
            💬 Share WhatsApp
          </button>
          <button
            onClick={handleShareEmail}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 cursor-pointer transition-all duration-200"
          >
            📧 Email Client
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-primary hover:bg-primary-hover text-white cursor-pointer transition-all duration-200"
          >
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      {/* A4 Paper Template Container */}
      <div className="print-page-wrapper a4-sheet bg-white text-slate-900 w-full max-w-[800px] min-h-[1050px] p-12 rounded-xl shadow-xl flex flex-col font-sans border border-transparent dark:border-white/10 [data-theme=light]:border-slate-900/10 print:box-shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-full">
        
        {/* Company Header Info */}
        <div className="print-header">
          {quotation.company.logoUri && (
            <img src={quotation.company.logoUri} alt="Logo" className="max-h-16 mx-auto mb-2 block object-contain" />
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
        <div className="print-to-section text-slate-800">
          <div className="print-to-label">To,</div>
          <div className="print-to-name">{quotation.client.name}</div>
          <pre className="print-to-address">{quotation.client.address}</pre>
          {quotation.client.taxId && <div className="client-tax-print">GSTIN: {quotation.client.taxId}</div>}
        </div>

        {/* Subject Header */}
        <div className="print-subject text-slate-900">
          Sub: {quotation.type === 'quotation' ? 'Quotation' : quotation.type === 'running_bill' ? 'Running Bill' : 'Invoice'}
          {quotation.subject ? ` — ${quotation.subject}` : ''}
        </div>

        {/* Ruled Rupee Table */}
        <table className="print-table text-slate-800">
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
              <td colSpan={3} className="border-none!"></td>
              <td className="print-totals-label">Subtotal</td>
              <td className="print-totals-val tabular-nums">
                {formatCurrency(quotation.subtotal)}/-
              </td>
            </tr>

            {/* Discount row if present */}
            {quotation.discountAmount > 0 && (
              <tr>
                <td colSpan={3} className="border-none!"></td>
                <td className="print-totals-label">
                  Discount {quotation.discountType === 'percent' ? `(${quotation.discountValue}%)` : ''}
                </td>
                <td className="print-totals-val tabular-nums text-red-600">
                  -{formatCurrency(quotation.discountAmount)}/-
                </td>
              </tr>
            )}

            {/* Tax row if present */}
            {quotation.taxAmount > 0 && (
              <tr>
                <td colSpan={3} className="border-none!"></td>
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
              <td colSpan={3} className="border-none!"></td>
              <td className="print-totals-label font-bold text-slate-900 border-t border-slate-900" style={{ fontSize: '10.5pt' }}>TOTAL</td>
              <td className="print-totals-val tabular-nums font-bold text-slate-900 border-t border-slate-900" style={{ fontSize: '11.5pt' }}>
                {formatCurrency(quotation.total)}/-
              </td>
            </tr>
          </tbody>
        </table>

        {/* Currency Amount in Words */}
        <div className="print-words-box text-slate-800">
          ({quotation.amountInWords})
        </div>

        {/* Terms and conditions info */}
        {quotation.termsAndConditions && (
          <div className="print-terms text-slate-700">
            <div className="print-terms-title">Terms & Conditions:</div>
            {quotation.termsAndConditions}
          </div>
        )}

        {/* Signatory Grid Footer */}
        <div className="print-sign-grid text-slate-800">
          <div className="print-sign-thankyou">
            THANKING YOU
          </div>
          <div className="print-sign-area">
            <div className="print-sign-company">{quotation.company.name}</div>
            
            {quotation.company.signatureUri && (
              <img src={quotation.company.signatureUri} alt="Signature" className="max-h-11 mb-2 mix-blend-multiply contrast-125 object-contain" />
            )}
            
            <div className="print-sign-label text-slate-600">
              {quotation.company.proprietorName && `${quotation.company.proprietorName}`}<br />
              ({quotation.company.signatureLabel})
            </div>
          </div>
        </div>

        {/* A4 Sheet Footer (hidden on screen, visible on print pages) */}
        <div className="print-footer text-slate-500">
          Generated via QuoteBuilder Pro | {quotation.company.name}
        </div>
      </div>
    </div>
  );
}
