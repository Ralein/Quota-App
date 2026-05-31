'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getClients, addClient, updateClient, deleteClient } from '@/utils/db';
import { Client } from '@/types';

export default function ClientsPage() {
  const [mounted, setMounted] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    taxId: '',
    address: ''
  });

  const loadClients = () => {
    setClients(getClients());
  };

  useEffect(() => {
    setMounted(true);
    loadClients();
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-10 h-10 border-3 border-white/10 rounded-full border-t-primary animate-spin"></div>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({ name: '', phone: '', email: '', taxId: '', address: '' });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email,
      taxId: client.taxId,
      address: client.address
    });
    setIsFormOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Client Name is required.');
      return;
    }

    if (editingClient) {
      updateClient({
        ...editingClient,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        taxId: formData.taxId,
        address: formData.address
      });
    } else {
      addClient(formData);
    }

    setIsFormOpen(false);
    loadClients();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete client "${name}"?`)) {
      deleteClient(id);
      loadClients();
    }
  };

  // Filter list by search query
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-text-main">👥 Client Directory</h1>
          <p className="text-text-muted text-sm">Manage your clients, billing contacts, and site address books.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Client
        </button>
      </div>

      {/* Search Input */}
      <div className="glass-panel px-5 py-3.5 flex items-center gap-3 w-full">
        <svg className="text-text-muted" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input 
          type="text" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          placeholder="Search by client name, phone, or site address..." 
          className="flex-1 bg-transparent text-text-main placeholder:text-text-muted text-sm outline-none border-none focus:ring-0"
        />
      </div>

      {/* Editor Modal Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-main">{editingClient ? '✏️ Edit Client Details' : '👤 Add New Client'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-text-muted hover:text-text-main transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="client-name" className="text-xs font-semibold text-text-muted">Client Name / Business Name *</label>
                <input
                  type="text"
                  id="client-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Urbanetek HVACV Eng Pvt. Ltd"
                  className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="client-phone" className="text-xs font-semibold text-text-muted">Phone Number</label>
                  <input
                    type="text"
                    id="client-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. 9876543210"
                    className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="client-email" className="text-xs font-semibold text-text-muted">Email Address</label>
                  <input
                    type="email"
                    id="client-email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. billing@client.com"
                    className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="client-taxId" className="text-xs font-semibold text-text-muted">GST No. / Client Tax ID</label>
                <input
                  type="text"
                  id="client-taxId"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  placeholder="e.g. GSTIN/VAT (optional)"
                  className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="client-address" className="text-xs font-semibold text-text-muted">Site / Billing Address (Multi-line)</label>
                <textarea
                  id="client-address"
                  name="address"
                  rows={4}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Provide site location or full billing address"
                  className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none resize-y"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 border-t border-border-main pt-5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 border border-border-main rounded-lg text-sm font-semibold text-text-muted hover:text-text-main hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition-all"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <div key={client.id} className="glass-panel p-6 flex flex-col gap-5 justify-between animate-fade-in">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-lg text-text-main mb-1 truncate">{client.name}</h3>
                  {client.taxId && (
                    <span className="inline-block text-[10px] font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
                      GSTIN: {client.taxId}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(client)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-border-main bg-white/2 text-text-muted transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
                    title="Edit Client"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                  </button>
                  <button
                    onClick={() => handleDelete(client.id, client.name)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-border-main bg-white/2 text-text-muted transition-all duration-200 hover:bg-danger/10 hover:text-danger hover:border-danger/20"
                    title="Delete Client"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                {client.phone && (
                  <p className="flex gap-2">
                    <strong className="text-text-muted font-medium w-16 shrink-0">Phone:</strong>
                    <span className="text-text-main">{client.phone}</span>
                  </p>
                )}
                {client.email && (
                  <p className="flex gap-2">
                    <strong className="text-text-muted font-medium w-16 shrink-0">Email:</strong>
                    <span className="text-text-main">{client.email}</span>
                  </p>
                )}
                {client.address && (
                  <div className="flex flex-col gap-1 mt-1">
                    <strong className="text-text-muted font-medium w-16 shrink-0 text-sm">Address:</strong>
                    <p className="text-text-muted text-xs pl-3 border-l-2 border-border-main whitespace-pre-wrap leading-relaxed">
                      {client.address}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-border-main pt-4 mt-1">
                <Link
                  href={`/create?clientId=${client.id}`}
                  className="flex items-center gap-1.5 text-primary hover:text-primary-hover font-semibold text-xs transition-colors duration-200"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Create Document for Client
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center md:col-span-2 text-text-muted glass-panel">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <p className="max-w-xs text-sm">No clients found. Add some clients to start generating invoices easily.</p>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200"
            >
              Add First Client
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
