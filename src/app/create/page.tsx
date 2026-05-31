'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  getCompanyProfile, 
  getClients, 
  getQuotationById, 
  saveQuotation, 
  getNextRefNo, 
  getItemLibrary, 
  addItemLibraryEntry,
  addClient
} from '@/utils/db';
import { convertNumberToWords } from '@/utils/numberToWords';
import { Quotation, LineItem, Client, CompanyProfile } from '@/types';

const UNITS = ['Rmt', 'Nos', 'Sqft', 'Kg', 'Hr', 'Day', 'L.S', 'Set', 'Job', 'Box', 'Ltr'];

function CreateQuotationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const queryClientId = searchParams.get('clientId');

  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [itemLibrary, setItemLibrary] = useState<any[]>([]);

  // Document Fields State
  const [docId, setDocId] = useState('');
  const [refNo, setRefNo] = useState('');
  const [docType, setDocType] = useState<Quotation['type']>('quotation');
  const [subject, setSubject] = useState('');
  const [docDate, setDocDate] = useState('');
  const [status, setStatus] = useState<Quotation['status']>('draft');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  
  // Calculations
  const [taxLabel, setTaxLabel] = useState('GST');
  const [taxRate, setTaxRate] = useState(18);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');

  // Autocomplete Suggestions focus state
  const [activeSuggestionRow, setActiveSuggestionRow] = useState<number | null>(null);

  // Modals & Prompts
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientTaxId, setNewClientTaxId] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  // Auto-save interval ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef({ lineItems, selectedClient, refNo, docType, docDate, subject, taxLabel, taxRate, taxEnabled, discountValue, discountType, terms, notes, docId, status });

  // Update state ref on every state change to keep auto-saver accurate
  useEffect(() => {
    stateRef.current = { lineItems, selectedClient, refNo, docType, docDate, subject, taxLabel, taxRate, taxEnabled, discountValue, discountType, terms, notes, docId, status };
  }, [lineItems, selectedClient, refNo, docType, docDate, subject, taxLabel, taxRate, taxEnabled, discountValue, discountType, terms, notes, docId, status]);

  // Load baseline configs
  useEffect(() => {
    setMounted(true);
    const compProfile = getCompanyProfile();
    const clientsList = getClients();
    const library = getItemLibrary();
    
    setProfile(compProfile);
    setClients(clientsList);
    setItemLibrary(library);

    // Initial setup if editing
    if (editId) {
      const existing = getQuotationById(editId);
      if (existing) {
        setDocId(existing.id);
        setRefNo(existing.refNo);
        setDocType(existing.type);
        setSubject(existing.subject || '');
        setDocDate(existing.date);
        setStatus(existing.status);
        setSelectedClient(existing.client);
        setLineItems(existing.items);
        setTaxLabel(existing.taxLabel);
        setTaxRate(existing.taxRate);
        setTaxEnabled(existing.taxRate > 0);
        setDiscountValue(existing.discountValue);
        setDiscountType(existing.discountType);
        setTerms(existing.termsAndConditions);
        setNotes(existing.notes || '');
      } else {
        alert('Document not found. Creating new instead.');
        setupNewDocument(compProfile, clientsList);
      }
    } else {
      setupNewDocument(compProfile, clientsList);
    }

    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [editId]);

  // Setup fresh document defaults
  const setupNewDocument = (compProfile: CompanyProfile, clientsList: Client[]) => {
    const today = new Date().toISOString().split('T')[0];
    setDocId(`quote_${Date.now()}`);
    setDocDate(today);
    setDocType('quotation');
    setRefNo(getNextRefNo('quotation'));
    setTaxLabel(compProfile.defaultTaxLabel);
    setTaxRate(compProfile.defaultTaxRate);
    setTaxEnabled(compProfile.defaultTaxRate > 0);
    setTerms(compProfile.defaultTerms);
    setLineItems([{
      id: `item_${Date.now()}`,
      srNo: 1,
      description: '',
      qty: 1,
      unit: 'Nos',
      rate: 0,
      isLumpSum: false,
      amount: 0
    }]);

    if (queryClientId) {
      const client = clientsList.find(c => c.id === queryClientId);
      if (client) setSelectedClient(client);
    }
  };

  // Auto-save logic (runs every 30 seconds if we have a valid client)
  useEffect(() => {
    if (mounted) {
      autoSaveTimerRef.current = setInterval(() => {
        triggerAutoSave();
      }, 30000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [mounted]);

  // Trigger Doc Type reference change
  const handleTypeChange = (type: Quotation['type']) => {
    setDocType(type);
    if (!editId) {
      // Auto increment only when creating a new quotation
      setRefNo(getNextRefNo(type));
    }
  };

  // Line item manipulation
  const addRow = () => {
    const newItems = [...lineItems];
    newItems.push({
      id: `item_${Date.now()}_${newItems.length}`,
      srNo: newItems.length + 1,
      description: '',
      qty: 1,
      unit: 'Rmt',
      rate: 0,
      isLumpSum: false,
      amount: 0
    });
    setLineItems(newItems);
  };

  const deleteRow = (index: number) => {
    if (lineItems.length === 1) {
      alert('Must contain at least 1 line item.');
      return;
    }
    const filtered = lineItems.filter((_, idx) => idx !== index).map((item, idx) => ({
      ...item,
      srNo: idx + 1
    }));
    setLineItems(filtered);
  };

  const updateRow = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    const row = { ...updated[index], [field]: value };
    
    // Auto calculate amount
    if (row.isLumpSum) {
      row.qty = null;
      row.rate = null;
      if (field === 'amount') {
        row.amount = parseFloat(value) || 0;
      }
    } else {
      if (field === 'qty' || field === 'rate') {
        const qty = field === 'qty' ? (value === '' ? '' : parseFloat(value)) : (row.qty ?? 0);
        const rate = field === 'rate' ? (value === '' ? '' : parseFloat(value)) : (row.rate ?? 0);
        
        row.qty = qty === '' ? null : qty;
        row.rate = rate === '' ? null : rate;
        
        if (row.qty !== null && row.rate !== null) {
          row.amount = Math.round(row.qty * row.rate * 100) / 100;
        } else {
          row.amount = 0;
        }
      }
    }
    
    updated[index] = row;
    setLineItems(updated);
  };

  const toggleLumpSum = (index: number) => {
    const updated = [...lineItems];
    const row = updated[index];
    row.isLumpSum = !row.isLumpSum;
    
    if (row.isLumpSum) {
      row.qty = null;
      row.rate = null;
      row.unit = 'L.S';
      row.amount = 0;
    } else {
      row.qty = 1;
      row.rate = 0;
      row.unit = 'Nos';
      row.amount = 0;
    }
    updated[index] = row;
    setLineItems(updated);
  };

  // Reorder buttons (Move Up / Down)
  const moveRow = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === lineItems.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...lineItems];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Recalculate Sr. Nos
    const mapped = reordered.map((item, idx) => ({
      ...item,
      srNo: idx + 1
    }));
    setLineItems(mapped);
  };

  // Autocomplete Item selection helper
  const handleItemSelect = (index: number, entry: any) => {
    const updated = [...lineItems];
    updated[index].description = entry.description;
    updated[index].unit = entry.defaultUnit;
    updated[index].isLumpSum = entry.defaultUnit === 'L.S';
    
    if (updated[index].isLumpSum) {
      updated[index].qty = null;
      updated[index].rate = null;
      updated[index].amount = entry.defaultRate;
    } else {
      updated[index].qty = 1;
      updated[index].rate = entry.defaultRate;
      updated[index].amount = entry.defaultRate;
    }
    
    setLineItems(updated);
    setActiveSuggestionRow(null);
  };

  // Save new client inline
  const handleAddClientInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newC = addClient({
      name: newClientName,
      phone: newClientPhone,
      email: newClientEmail,
      address: newClientAddress,
      taxId: newClientTaxId
    });

    // Refresh lists and select
    const updatedClients = getClients();
    setClients(updatedClients);
    setSelectedClient(newC);
    setIsClientModalOpen(false);

    // Reset forms
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setNewClientTaxId('');
    setNewClientAddress('');
  };

  // Calculations Panel
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  
  const discountAmount = discountType === 'percent' 
    ? Math.round(subtotal * (discountValue / 100) * 100) / 100 
    : discountValue;
    
  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const taxAmount = taxEnabled ? Math.round(taxableAmount * (taxRate / 100) * 100) / 100 : 0;
  const total = Math.round((taxableAmount + taxAmount) * 100) / 100;
  
  const amountInWords = convertNumberToWords(total, profile?.currencySymbol);

  // Active Save Function
  const handleSaveDocument = (e?: React.FormEvent, customStatus?: Quotation['status']) => {
    if (e) e.preventDefault();
    
    const curr = stateRef.current;
    
    if (!curr.selectedClient) {
      alert('Please select a Client for this document.');
      return false;
    }
    
    if (!profile) {
      alert('Company Profile is missing.');
      return false;
    }

    if (curr.lineItems.length === 0 || curr.lineItems[0].description.trim() === '') {
      alert('Please add at least 1 valid line item.');
      return false;
    }

    const docStatus = customStatus || curr.status;

    const quoteToSave: Quotation = {
      id: curr.docId,
      refNo: curr.refNo,
      type: curr.docType,
      subject: curr.subject,
      date: curr.docDate,
      status: docStatus,
      company: profile, // Take profile snapshot
      client: curr.selectedClient,
      items: curr.lineItems,
      subtotal,
      taxLabel: curr.taxLabel,
      taxRate: taxEnabled ? curr.taxRate : 0,
      taxAmount,
      discountValue: curr.discountValue,
      discountType: curr.discountType,
      discountAmount,
      total,
      amountInWords,
      termsAndConditions: curr.terms,
      notes: curr.notes,
      pdfUri: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveQuotation(quoteToSave);

    // Save newly typed items to library automatically if they are new
    curr.lineItems.forEach(item => {
      const match = itemLibrary.find(e => e.description.toLowerCase() === item.description.toLowerCase());
      if (!match && item.description.trim() !== '') {
        addItemLibraryEntry({
          description: item.description,
          defaultUnit: item.unit,
          defaultRate: item.rate || item.amount
        });
      }
    });

    return true;
  };

  const triggerAutoSave = () => {
    const curr = stateRef.current;
    if (curr.selectedClient && curr.lineItems.length > 0 && curr.lineItems[0].description.trim() !== '') {
      const success = handleSaveDocument(undefined, 'draft');
      if (success) {
        console.log('Draft auto-saved successfully at', new Date().toLocaleTimeString());
      }
    }
  };

  const saveAndExit = (e: React.FormEvent) => {
    const success = handleSaveDocument(e);
    if (success) {
      router.push('/saved');
    }
  };

  const saveAndPreview = (e: React.FormEvent) => {
    const success = handleSaveDocument(e);
    if (success) {
      router.push(`/preview/${docId}`);
    }
  };

  const handleCancelEdit = () => {
    if (confirm('Discard changes and return? Any unsaved data will be lost.')) {
      router.back();
    }
  };

  return (
    <div className="create-page animate-fade-in">
      <div className="create-header">
        <h1>{editId ? '✏️ Edit Document' : '➕ Create Quotation / Bill'}</h1>
        <p>Draft quotations, invoices, or running bills with live computations.</p>
      </div>

      <div className="create-editor-grid">
        {/* Left Column: Form Details */}
        <div className="editor-left-pane">
          
          {/* Section 1: Meta Details */}
          <div className="editor-section glass-panel">
            <h2>Document Settings</h2>
            <div className="meta-inputs-row">
              <div className="input-group">
                <label>Document Type</label>
                <div className="type-toggle-bar">
                  {(['quotation', 'running_bill', 'invoice'] as const).map(type => (
                    <button 
                      key={type}
                      type="button" 
                      onClick={() => handleTypeChange(type)}
                      className={`type-toggle-btn ${docType === type ? 'active' : ''}`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="refNo">Reference No. *</label>
                  <input type="text" id="refNo" value={refNo} onChange={(e) => setRefNo(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label htmlFor="docDate">Document Date *</label>
                  <input type="date" id="docDate" value={docDate} onChange={(e) => setDocDate(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject Line</label>
                <input type="text" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Plumbing Installation Work or Quotation for Electrical Wiring" />
              </div>
            </div>
          </div>

          {/* Section 2: Client Selector */}
          <div className="editor-section glass-panel">
            <div className="section-header-row">
              <h2>Billing Client</h2>
              <button type="button" onClick={() => setIsClientModalOpen(true)} className="text-action-btn">
                + Add Client
              </button>
            </div>
            
            <div className="client-selector-container">
              <div className="form-group">
                <label htmlFor="clientSelect">Select Customer *</label>
                <select 
                  id="clientSelect" 
                  value={selectedClient?.id || ''} 
                  onChange={(e) => {
                    const client = clients.find(c => c.id === e.target.value);
                    setSelectedClient(client || null);
                  }}
                  required
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {selectedClient && (
                <div className="selected-client-preview animate-fade-in">
                  <div className="preview-label">Selected Billing Address:</div>
                  <div className="preview-name">{selectedClient.name}</div>
                  {selectedClient.phone && <div className="preview-phone">Phone: {selectedClient.phone}</div>}
                  {selectedClient.taxId && <div className="preview-tax">GSTIN: {selectedClient.taxId}</div>}
                  <pre className="preview-address">{selectedClient.address}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Item Table */}
          <div className="editor-section glass-panel items-section">
            <h2>Add Items & Services</h2>

            <div className="items-table-scroll">
              <table className="items-entry-table">
                <thead>
                  <tr>
                    <th>Sr.</th>
                    <th>Product/Service Description</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={item.id} className="item-row-entry">
                      <td className="sr-num">{item.srNo}</td>
                      <td className="desc-cell">
                        <input 
                          type="text" 
                          value={item.description}
                          onChange={(e) => updateRow(idx, 'description', e.target.value)}
                          onFocus={() => setActiveSuggestionRow(idx)}
                          placeholder="Search or enter service description..."
                        />
                        {/* Auto-suggest dropdown */}
                        {activeSuggestionRow === idx && item.description.trim() !== '' && (
                          <div className="suggestion-dropdown">
                            {itemLibrary
                              .filter(entry => entry.description.toLowerCase().includes(item.description.toLowerCase()))
                              .slice(0, 5)
                              .map(entry => (
                                <div key={entry.id} onClick={() => handleItemSelect(idx, entry)} className="suggestion-item">
                                  <span>{entry.description}</span>
                                  <span className="suggestion-details">{entry.defaultUnit} - ₹{entry.defaultRate}</span>
                                </div>
                              ))}
                            <div className="suggestion-close" onClick={() => setActiveSuggestionRow(null)}>Close Suggestions</div>
                          </div>
                        )}
                      </td>
                      <td className="qty-cell">
                        <input 
                          type="number" 
                          step="any"
                          value={item.qty ?? ''}
                          disabled={item.isLumpSum}
                          onChange={(e) => updateRow(idx, 'qty', e.target.value)}
                          placeholder="-"
                        />
                      </td>
                      <td className="unit-cell">
                        <select 
                          value={item.unit}
                          disabled={item.isLumpSum}
                          onChange={(e) => updateRow(idx, 'unit', e.target.value)}
                        >
                          {UNITS.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </td>
                      <td className="rate-cell">
                        <input 
                          type="number" 
                          step="any"
                          value={item.rate ?? ''}
                          disabled={item.isLumpSum}
                          onChange={(e) => updateRow(idx, 'rate', e.target.value)}
                          placeholder="L.S"
                        />
                      </td>
                      <td className="amt-cell tabular-nums">
                        {item.isLumpSum ? (
                          <input 
                            type="number"
                            value={item.amount}
                            onChange={(e) => updateRow(idx, 'amount', e.target.value)}
                            className="ls-amt-input"
                          />
                        ) : (
                          <span>₹{item.amount.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="actions-cell">
                        <div className="row-actions">
                          <button type="button" onClick={() => toggleLumpSum(idx)} className={`row-btn ls-toggle-btn ${item.isLumpSum ? 'active' : ''}`} title="Toggle Lump Sum">
                            L.S
                          </button>
                          <button type="button" onClick={() => moveRow(idx, 'up')} className="row-btn" disabled={idx === 0} title="Move Row Up">
                            ▲
                          </button>
                          <button type="button" onClick={() => moveRow(idx, 'down')} className="row-btn" disabled={idx === lineItems.length - 1} title="Move Row Down">
                            ▼
                          </button>
                          <button type="button" onClick={() => deleteRow(idx)} className="row-btn delete-row-btn" title="Delete Row">
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button type="button" onClick={addRow} className="add-row-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Item Row
            </button>
          </div>

          {/* Section 4: Terms & Notes */}
          <div className="editor-section glass-panel">
            <h2>Terms & Remarks</h2>
            <div className="meta-inputs-row">
              <div className="form-group">
                <label htmlFor="terms">Terms & Conditions</label>
                <textarea id="terms" rows={4} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Terms and conditions shown below words total"></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes / Private Remarks</label>
                <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional text/bank details notes to client"></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Summary Pane */}
        <div className="editor-right-pane">
          <div className="summary-pane glass-panel">
            <h2>Calculations Summary</h2>
            
            <div className="subtotals-list">
              <div className="subtotal-item">
                <span>Subtotal</span>
                <span className="val tabular-nums">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Discount panel */}
              <div className="subtotal-item edit-sub-row">
                <span className="label">Discount</span>
                <div className="discount-input-group">
                  <input 
                    type="number" 
                    value={discountValue || ''} 
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    placeholder="0" 
                  />
                  <select 
                    value={discountType} 
                    onChange={(e) => setDiscountType(e.target.value as 'flat' | 'percent')}
                  >
                    <option value="flat">₹</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>

              {/* Tax panel */}
              <div className="subtotal-item edit-sub-row">
                <label className="tax-toggle-label">
                  <input type="checkbox" checked={taxEnabled} onChange={(e) => setTaxEnabled(e.target.checked)} />
                  <span>Apply Tax</span>
                </label>

                {taxEnabled && (
                  <div className="tax-input-group animate-fade-in">
                    <input 
                      type="text" 
                      value={taxLabel} 
                      onChange={(e) => setTaxLabel(e.target.value)} 
                      placeholder="Label" 
                      className="tax-lbl"
                    />
                    <select 
                      value={taxRate} 
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="tax-pct"
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                )}
              </div>

              {taxEnabled && (
                <div className="subtotal-item tax-display-item">
                  <span>{taxLabel} ({taxRate}%)</span>
                  <span className="val tabular-nums">₹{taxAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="divider"></div>

              <div className="subtotal-item total-item">
                <span>GRAND TOTAL</span>
                <span className="val tabular-nums">₹{total.toFixed(2)}</span>
              </div>

              <div className="words-total-preview">
                <strong>Amount in Words:</strong>
                <p>({amountInWords})</p>
              </div>
            </div>

            <div className="editor-panel-actions">
              <button type="button" onClick={saveAndPreview} className="preview-action-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Save & Preview
              </button>

              <button type="button" onClick={saveAndExit} className="save-action-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
                Save Document
              </button>

              <button type="button" onClick={handleCancelEdit} className="cancel-action-btn">
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Client creation modal */}
      {isClientModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h2>👤 Add Client to Address Book</h2>
              <button type="button" onClick={() => setIsClientModalOpen(false)} className="close-modal-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddClientInline} className="modal-form">
              <div className="form-group">
                <label>Client / Business Name *</label>
                <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} required placeholder="e.g. Urbanetek HVACV Eng Pvt. Ltd" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} placeholder="e.g. 9876543210" />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} placeholder="e.g. billing@client.com" />
                </div>
              </div>

              <div className="form-group">
                <label>GST No. / Client Tax ID</label>
                <input type="text" value={newClientTaxId} onChange={(e) => setNewClientTaxId(e.target.value)} placeholder="GSTIN (optional)" />
              </div>

              <div className="form-group">
                <label>Billing & Site Address (Multi-line)</label>
                <textarea rows={3} value={newClientAddress} onChange={(e) => setNewClientAddress(e.target.value)} placeholder="Full physical billing location"></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="submit-btn">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

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

        .create-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        .create-header h1 {
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 0.25rem;
        }

        .create-header p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .create-editor-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          align-items: start;
        }

        @media (min-width: 1024px) {
          .create-editor-grid {
            grid-template-columns: 1.3fr 0.7fr;
          }
        }

        .editor-left-pane {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .editor-section {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .text-action-btn {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-primary);
        }

        .text-action-btn:hover {
          color: var(--color-primary-hover);
        }

        .editor-section h2 {
          font-size: 1.15rem;
          font-weight: 700;
        }

        .type-toggle-bar {
          display: flex;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.02);
          width: 100%;
        }

        .type-toggle-btn {
          flex: 1;
          padding: 0.6rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-right: 1px solid var(--border-color);
        }

        .type-toggle-btn:last-child {
          border-right: none;
        }

        .type-toggle-btn:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.05);
        }

        .type-toggle-btn.active {
          background: var(--color-primary);
          color: white;
        }

        .meta-inputs-row {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .form-group input, 
        .form-group select, 
        .form-group textarea {
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          color: var(--text-main);
          font-size: 0.95rem;
        }

        [data-theme="light"] input, 
        [data-theme="light"] select, 
        [data-theme="light"] textarea {
          background: rgba(15, 23, 42, 0.02);
        }

        .selected-client-preview {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .preview-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .preview-name {
          font-weight: 700;
          font-size: 1rem;
        }

        .preview-phone, .preview-tax {
          color: var(--text-muted);
        }

        .preview-address {
          margin-top: 0.5rem;
          font-family: inherit;
          white-space: pre-wrap;
          font-size: 0.85rem;
          color: var(--text-muted);
          border-top: 1px solid var(--border-color);
          padding-top: 0.5rem;
        }

        /* Items Table */
        .items-section {
          padding: 1.5rem 1rem;
        }

        .items-table-scroll {
          overflow-x: auto;
          width: 100%;
        }

        .items-entry-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 750px;
        }

        .items-entry-table th {
          text-align: left;
          padding: 0.75rem 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          border-bottom: 1px solid var(--border-color);
        }

        .items-entry-table td {
          padding: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .sr-num {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          width: 25px;
        }

        .desc-cell {
          width: 40%;
          position: relative;
        }

        .desc-cell input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
        }

        .suggestion-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          z-index: 10;
          box-shadow: var(--shadow-lg);
          margin-top: 2px;
        }

        .suggestion-item {
          display: flex;
          justify-content: space-between;
          padding: 0.6rem 0.85rem;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .suggestion-item:hover {
          background: var(--color-primary);
          color: white;
        }

        .suggestion-details {
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .suggestion-item:hover .suggestion-details {
          color: white;
        }

        .suggestion-close {
          text-align: center;
          padding: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          cursor: pointer;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid var(--border-color);
        }

        .qty-cell input, 
        .rate-cell input, 
        .ls-amt-input {
          width: 80px;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          text-align: right;
        }

        .ls-amt-input {
          width: 100px;
          background: rgba(20, 184, 166, 0.08) !important;
          color: var(--color-secondary) !important;
          font-weight: bold;
        }

        .unit-cell select {
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          width: 75px;
        }

        .amt-cell {
          font-weight: 600;
          font-size: 0.9rem;
          text-align: right;
          width: 110px;
        }

        .actions-cell {
          width: 140px;
        }

        .row-actions {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .row-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          font-size: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          color: var(--text-muted);
        }

        .row-btn:hover:not(:disabled) {
          color: var(--text-main);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .ls-toggle-btn.active {
          background: var(--color-secondary);
          color: white;
          border-color: var(--color-secondary);
        }

        .delete-row-btn:hover {
          background: var(--color-danger);
          color: white !important;
          border-color: var(--color-danger);
        }

        .add-row-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-top: 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-primary);
          padding: 0.5rem;
        }

        .add-row-btn:hover {
          color: var(--color-primary-hover);
        }

        /* Sticky Summary Pane */
        .summary-pane {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: sticky;
          top: 6rem;
        }

        .subtotals-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .subtotal-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.95rem;
        }

        .subtotal-item.edit-sub-row {
          justify-content: space-between;
          gap: 1rem;
        }

        .subtotal-item.edit-sub-row label {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .tax-toggle-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .discount-input-group {
          display: flex;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.01);
        }

        .discount-input-group input {
          width: 70px;
          padding: 0.35rem 0.5rem;
          text-align: right;
          font-size: 0.85rem;
        }

        .discount-input-group select {
          padding: 0.35rem;
          background: rgba(255, 255, 255, 0.05);
          border-left: 1px solid var(--border-color);
          font-size: 0.85rem;
          cursor: pointer;
        }

        .tax-input-group {
          display: flex;
          gap: 0.35rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .tax-input-group input.tax-lbl {
          width: 50px;
          padding: 0.35rem;
          font-size: 0.85rem;
          text-align: center;
        }

        .tax-input-group select.tax-pct {
          padding: 0.35rem;
          background: rgba(255, 255, 255, 0.05);
          border-left: 1px solid var(--border-color);
          font-size: 0.85rem;
        }

        .tax-display-item {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .divider {
          height: 1px;
          background: var(--border-color);
          margin: 0.5rem 0;
        }

        .total-item {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--color-secondary);
        }

        .words-total-preview {
          font-size: 0.8rem;
          color: var(--text-muted);
          line-height: 1.4;
          background: rgba(255, 255, 255, 0.02);
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }

        .words-total-preview p {
          font-style: italic;
          color: var(--text-main);
          margin-top: 0.25rem;
          font-weight: 500;
        }

        .editor-panel-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .preview-action-btn, 
        .save-action-btn, 
        .cancel-action-btn {
          width: 100%;
          padding: 0.85rem;
          border-radius: var(--radius-sm);
          font-weight: 700;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .preview-action-btn {
          background: var(--color-primary);
          color: white;
        }

        .preview-action-btn:hover {
          background: var(--color-primary-hover);
        }

        .save-action-btn {
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-main);
        }

        .save-action-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .cancel-action-btn {
          color: var(--color-danger);
          font-weight: 600;
          font-size: 0.85rem;
        }

        .cancel-action-btn:hover {
          text-decoration: underline;
        }

        /* Modal styling */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 200;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: var(--glass-blur);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .modal-content {
          width: 100%;
          max-width: 600px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          background: var(--bg-card);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .close-modal-btn {
          color: var(--text-muted);
        }

        .close-modal-btn:hover {
          color: var(--text-main);
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 600px) {
          .form-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          border-top: 1px solid var(--border-color);
          padding-top: 1.25rem;
          margin-top: 0.5rem;
        }

        .cancel-btn {
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 0.95rem;
          border: 1px solid var(--border-color);
          color: var(--text-muted);
        }

        .cancel-btn:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.05);
        }

        .submit-btn {
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 0.95rem;
          background: var(--color-primary);
          color: white;
        }

        .submit-btn:hover {
          background: var(--color-primary-hover);
        }
      `}</style>
    </div>
  );
}

import { Suspense } from 'react';

export default function CreateQuotation() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '3px solid rgba(255, 255, 255, 0.1)', borderRadius: '50%', borderTopColor: 'var(--color-primary)', animation: 'spin 1s ease-in-out infinite' }}></div>
      </div>
    }>
      <CreateQuotationForm />
    </Suspense>
  );
}
