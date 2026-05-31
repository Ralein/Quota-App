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
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-text-main">
          {editId ? '✏️ Edit Document' : '➕ Create Quotation / Bill'}
        </h1>
        <p className="text-text-muted text-sm">Draft quotations, invoices, or running bills with live computations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8 items-start">
        {/* Left Column: Form Details */}
        <div className="flex flex-col gap-6">
          
          {/* Section 1: Meta Details */}
          <div className="glass-panel p-6 sm:p-8 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-text-main">Document Settings</h2>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted">Document Type</label>
                <div className="flex border border-border-main rounded-lg overflow-hidden bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 w-full">
                  {(['quotation', 'running_bill', 'invoice'] as const).map(type => (
                    <button 
                      key={type}
                      type="button" 
                      onClick={() => handleTypeChange(type)}
                      className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border-r border-border-main last:border-r-0 hover:text-text-main hover:bg-white/5 transition-all duration-200 cursor-pointer ${
                        docType === type
                          ? 'bg-primary text-white hover:bg-primary'
                          : 'text-text-muted'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="refNo" className="text-xs font-semibold text-text-muted">Reference No. *</label>
                  <input
                    type="text"
                    id="refNo"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    required
                    className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="docDate" className="text-xs font-semibold text-text-muted">Document Date *</label>
                  <input
                    type="date"
                    id="docDate"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    required
                    className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="subject" className="text-xs font-semibold text-text-muted">Subject Line</label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Plumbing Installation Work or Quotation for Electrical Wiring"
                  className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Client Selector */}
          <div className="glass-panel p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-main">Billing Client</h2>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
              >
                + Add Client
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="clientSelect" className="text-xs font-semibold text-text-muted">Select Customer *</label>
                <select 
                  id="clientSelect" 
                  value={selectedClient?.id || ''} 
                  onChange={(e) => {
                    const client = clients.find(c => c.id === e.target.value);
                    setSelectedClient(client || null);
                  }}
                  required
                  className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none cursor-pointer"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {selectedClient && (
                <div className="p-4 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-xl text-sm flex flex-col gap-1 animate-fade-in">
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Selected Billing Address:</div>
                  <div className="font-bold text-text-main text-base">{selectedClient.name}</div>
                  {selectedClient.phone && <div className="text-text-muted text-xs">Phone: {selectedClient.phone}</div>}
                  {selectedClient.taxId && <div className="text-text-muted text-xs">GSTIN: {selectedClient.taxId}</div>}
                  <pre className="mt-2 font-sans whitespace-pre-wrap text-xs text-text-muted border-t border-border-main pt-2">{selectedClient.address}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Item Table */}
          <div className="glass-panel p-4 sm:p-6 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-text-main">Add Items & Services</h2>

            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse min-w-[750px]">
                <thead>
                  <tr>
                    <th className="text-center px-2 py-3 text-xs font-semibold text-text-muted uppercase border-b border-border-main w-10">Sr.</th>
                    <th className="text-left px-2 py-3 text-xs font-semibold text-text-muted uppercase border-b border-border-main w-[45%]">Product/Service Description</th>
                    <th className="text-right px-2 py-3 text-xs font-semibold text-text-muted uppercase border-b border-border-main w-20">Qty</th>
                    <th className="text-left px-2 py-3 text-xs font-semibold text-text-muted uppercase border-b border-border-main w-20">Unit</th>
                    <th className="text-right px-2 py-3 text-xs font-semibold text-text-muted uppercase border-b border-border-main w-24">Rate</th>
                    <th className="text-right px-2 py-3 text-xs font-semibold text-text-muted uppercase border-b border-border-main w-28">Amount</th>
                    <th className="text-center px-2 py-3 text-xs font-semibold text-text-muted uppercase border-b border-border-main w-36">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={item.id} className="group">
                      <td className="text-center p-2 border-b border-border-main text-xs font-bold text-text-muted">{item.srNo}</td>
                      <td className="p-2 border-b border-border-main relative">
                        <input 
                          type="text" 
                          value={item.description}
                          onChange={(e) => updateRow(idx, 'description', e.target.value)}
                          onFocus={() => setActiveSuggestionRow(idx)}
                          placeholder="Search or enter service description..."
                          className="w-full px-3 py-2 border border-border-main rounded-lg text-sm bg-white/1 dark:bg-white/1 [data-theme=light]:bg-slate-900/1 text-text-main placeholder:text-text-muted focus:border-border-focus outline-none"
                        />
                        {/* Auto-suggest dropdown */}
                        {activeSuggestionRow === idx && item.description.trim() !== '' && (
                          <div className="absolute top-full left-2 right-2 bg-app-bg border border-border-main rounded-xl z-20 shadow-xl mt-1 overflow-hidden">
                            {itemLibrary
                              .filter(entry => entry.description.toLowerCase().includes(item.description.toLowerCase()))
                              .slice(0, 5)
                              .map(entry => (
                                <div
                                  key={entry.id}
                                  onClick={() => handleItemSelect(idx, entry)}
                                  className="flex justify-between items-center px-4 py-2.5 text-xs text-text-main cursor-pointer hover:bg-primary hover:text-white transition-colors"
                                >
                                  <span>{entry.description}</span>
                                  <span className="text-[10px] text-text-muted">{entry.defaultUnit} - ₹{entry.defaultRate}</span>
                                </div>
                              ))}
                            <div
                              className="text-center py-2 text-[10px] text-text-muted cursor-pointer bg-white/2 border-t border-border-main hover:text-text-main"
                              onClick={() => setActiveSuggestionRow(null)}
                            >
                              Close Suggestions
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-2 border-b border-border-main">
                        <input 
                          type="number" 
                          step="any"
                          value={item.qty ?? ''}
                          disabled={item.isLumpSum}
                          onChange={(e) => updateRow(idx, 'qty', e.target.value)}
                          placeholder="-"
                          className="w-20 px-3 py-2 border border-border-main rounded-lg text-sm bg-white/1 dark:bg-white/1 [data-theme=light]:bg-slate-900/1 text-text-main text-right disabled:opacity-30 disabled:cursor-not-allowed outline-none focus:border-border-focus"
                        />
                      </td>
                      <td className="p-2 border-b border-border-main">
                        <select 
                          value={item.unit}
                          disabled={item.isLumpSum}
                          onChange={(e) => updateRow(idx, 'unit', e.target.value)}
                          className="w-20 px-2 py-2 border border-border-main rounded-lg text-sm bg-white/1 dark:bg-white/1 [data-theme=light]:bg-slate-900/1 text-text-main disabled:opacity-30 disabled:cursor-not-allowed outline-none focus:border-border-focus"
                        >
                          {UNITS.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 border-b border-border-main">
                        <input 
                          type="number" 
                          step="any"
                          value={item.rate ?? ''}
                          disabled={item.isLumpSum}
                          onChange={(e) => updateRow(idx, 'rate', e.target.value)}
                          placeholder="L.S"
                          className="w-24 px-3 py-2 border border-border-main rounded-lg text-sm bg-white/1 dark:bg-white/1 [data-theme=light]:bg-slate-900/1 text-text-main text-right disabled:opacity-30 disabled:cursor-not-allowed outline-none focus:border-border-focus"
                        />
                      </td>
                      <td className="p-2 border-b border-border-main text-right">
                        {item.isLumpSum ? (
                          <input 
                            type="number"
                            value={item.amount}
                            onChange={(e) => updateRow(idx, 'amount', e.target.value)}
                            className="w-28 px-3 py-2 border border-secondary/20 rounded-lg text-sm bg-secondary/10 text-secondary font-bold text-right outline-none focus:border-secondary"
                          />
                        ) : (
                          <span className="font-bold text-sm text-text-main tabular-nums pr-2">₹{item.amount.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="p-2 border-b border-border-main">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleLumpSum(idx)}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-extrabold border transition-all duration-200 cursor-pointer ${
                              item.isLumpSum
                                ? 'bg-secondary border-secondary text-white'
                                : 'bg-white/2 border-border-main text-text-muted hover:text-text-main hover:border-white/15'
                            }`}
                            title="Toggle Lump Sum"
                          >
                            L.S
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRow(idx, 'up')}
                            disabled={idx === 0}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs bg-white/2 border border-border-main text-text-muted transition-all duration-200 hover:text-text-main hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Row Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRow(idx, 'down')}
                            disabled={idx === lineItems.length - 1}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs bg-white/2 border border-border-main text-text-muted transition-all duration-200 hover:text-text-main hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Row Down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRow(idx)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-xs bg-white/2 border border-border-main text-text-muted transition-all duration-200 hover:bg-danger hover:border-danger hover:text-white cursor-pointer"
                            title="Delete Row"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary hover:text-primary-hover p-1 transition-colors cursor-pointer w-fit"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Item Row
            </button>
          </div>

          {/* Section 4: Terms & Notes */}
          <div className="glass-panel p-6 sm:p-8 flex flex-col gap-5">
            <h2 className="text-lg font-bold text-text-main">Terms & Remarks</h2>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="terms" className="text-xs font-semibold text-text-muted">Terms & Conditions</label>
                <textarea
                  id="terms"
                  rows={4}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Terms and conditions shown below words total"
                  className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none resize-y"
                ></textarea>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="notes" className="text-xs font-semibold text-text-muted">Notes / Private Remarks</label>
                <textarea
                  id="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional text/bank details notes to client"
                  className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none resize-y"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Summary Pane */}
        <div className="flex flex-col gap-6 sticky top-24">
          <div className="glass-panel p-6 sm:p-8 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-text-main">Calculations Summary</h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center text-sm text-text-main">
                <span className="text-text-muted font-medium">Subtotal</span>
                <span className="font-bold tabular-nums">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Discount panel */}
              <div className="flex justify-between items-center gap-4 text-sm">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Discount</span>
                <div className="flex border border-border-main rounded-lg overflow-hidden bg-white/1 dark:bg-white/1">
                  <input 
                    type="number" 
                    value={discountValue || ''} 
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    placeholder="0" 
                    className="w-16 px-2.5 py-1.5 text-right text-xs bg-transparent text-text-main outline-none focus:ring-0 border-none"
                  />
                  <select 
                    value={discountType} 
                    onChange={(e) => setDiscountType(e.target.value as 'flat' | 'percent')}
                    className="px-2 py-1.5 bg-white/5 border-l border-border-main text-xs text-text-muted cursor-pointer outline-none border-none focus:ring-0"
                  >
                    <option value="flat">₹</option>
                    <option value="percent">%</option>
                  </select>
                </div>
              </div>

              {/* Tax panel */}
              <div className="flex justify-between items-center gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={taxEnabled}
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                    className="rounded bg-white/5 border-border-main text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span>Apply Tax</span>
                </label>

                {taxEnabled && (
                  <div className="flex gap-1 border border-border-main rounded-lg overflow-hidden animate-fade-in">
                    <input 
                      type="text" 
                      value={taxLabel} 
                      onChange={(e) => setTaxLabel(e.target.value)} 
                      placeholder="Label" 
                      className="w-14 px-2 py-1.5 text-center text-xs bg-transparent text-text-main outline-none focus:ring-0 border-none"
                    />
                    <select 
                      value={taxRate} 
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="px-2 py-1.5 bg-white/5 border-l border-border-main text-xs text-text-muted cursor-pointer outline-none border-none focus:ring-0"
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
                <div className="flex justify-between items-center text-xs text-text-muted">
                  <span>{taxLabel} ({taxRate}%)</span>
                  <span className="font-semibold tabular-nums">₹{taxAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="h-[1px] bg-border-main my-2"></div>

              <div className="flex justify-between items-center text-xl font-extrabold text-secondary">
                <span>GRAND TOTAL</span>
                <span className="tabular-nums">₹{total.toFixed(2)}</span>
              </div>

              <div className="text-xs text-text-muted leading-relaxed bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 p-3.5 border border-border-main rounded-lg">
                <strong className="font-semibold text-[10px] uppercase tracking-wider text-text-muted">Amount in Words:</strong>
                <p className="italic text-text-main mt-1 font-semibold">({amountInWords})</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <button
                type="button"
                onClick={saveAndPreview}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Save & Preview
              </button>

              <button
                type="button"
                onClick={saveAndExit}
                className="w-full flex items-center justify-center gap-2 border border-border-main bg-white/3 hover:bg-white/7 text-text-main py-3 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
                Save Document
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full text-center text-danger hover:text-red-400 py-2 rounded-lg font-bold text-xs transition-colors hover:underline cursor-pointer"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Client creation modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 flex flex-col gap-6 animate-fade-in bg-card-bg">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-text-main">👤 Add Client to Address Book</h2>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(false)}
                className="text-text-muted hover:text-text-main transition-colors cursor-pointer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddClientInline} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted">Client / Business Name *</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  required
                  placeholder="e.g. Urbanetek HVACV Eng Pvt. Ltd"
                  className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-muted">Phone Number</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-muted">Email Address</label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="e.g. billing@client.com"
                    className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted">GST No. / Client Tax ID</label>
                <input
                  type="text"
                  value={newClientTaxId}
                  onChange={(e) => setNewClientTaxId(e.target.value)}
                  placeholder="GSTIN (optional)"
                  className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted">Billing & Site Address (Multi-line)</label>
                <textarea
                  rows={3}
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  placeholder="Full physical billing location"
                  className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none resize-y"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 border-t border-border-main pt-5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-5 py-2.5 border border-border-main rounded-lg text-sm font-semibold text-text-muted hover:text-text-main hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { Suspense } from 'react';

export default function CreateQuotation() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-10 h-10 border-3 border-white/10 rounded-full border-t-primary animate-spin"></div>
      </div>
    }>
      <CreateQuotationForm />
    </Suspense>
  );
}
