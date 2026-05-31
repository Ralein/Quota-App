'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getClients, addClient, updateClient, deleteClient } from '@/utils/db';
import { Client } from '@/types';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Phone,
  Mail,
  MapPin,
  Building2,
  CreditCard,
  UserPlus,
  FilePlus
} from 'lucide-react';

export default function ClientsPage() {
  const [mounted, setMounted] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
        <div className="w-10 h-10 border-3 border-primary/20 rounded-full border-t-primary animate-spin"></div>
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

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-0.5 text-text-main">Client Directory</h1>
            <p className="text-text-muted text-sm">Manage your clients, billing contacts, and site address books.</p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-text-inverse px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200"
        >
          <UserPlus size={18} />
          Add Client
        </button>
      </div>

      {/* Search Input */}
      <div className="glass-panel px-5 py-3.5 flex items-center gap-3 w-full">
        <Search className="text-text-muted" size={20} />
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
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {editingClient ? <Edit size={20} className="text-primary" /> : <UserPlus size={20} className="text-primary" />}
                <h2 className="text-lg font-bold text-text-main">{editingClient ? 'Edit Client Details' : 'Add New Client'}</h2>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-text-muted hover:text-text-main transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="client-name" className="text-xs font-semibold text-text-muted flex items-center gap-1.5"><Building2 size={12} />Client Name / Business Name *</label>
                <input type="text" id="client-name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Urbanetek HVACV Eng Pvt. Ltd" className="px-4 py-2.5 bg-white/[0.02] border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="client-phone" className="text-xs font-semibold text-text-muted flex items-center gap-1.5"><Phone size={12} />Phone Number</label>
                  <input type="text" id="client-phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="e.g. 9876543210" className="px-4 py-2.5 bg-white/[0.02] border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="client-email" className="text-xs font-semibold text-text-muted flex items-center gap-1.5"><Mail size={12} />Email Address</label>
                  <input type="email" id="client-email" name="email" value={formData.email} onChange={handleInputChange} placeholder="e.g. billing@client.com" className="px-4 py-2.5 bg-white/[0.02] border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="client-taxId" className="text-xs font-semibold text-text-muted flex items-center gap-1.5"><CreditCard size={12} />GST No. / Client Tax ID</label>
                <input type="text" id="client-taxId" name="taxId" value={formData.taxId} onChange={handleInputChange} placeholder="e.g. GSTIN/VAT (optional)" className="px-4 py-2.5 bg-white/[0.02] border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="client-address" className="text-xs font-semibold text-text-muted flex items-center gap-1.5"><MapPin size={12} />Site / Billing Address (Multi-line)</label>
                <textarea id="client-address" name="address" rows={4} value={formData.address} onChange={handleInputChange} placeholder="Provide site location or full billing address" className="px-4 py-2.5 bg-white/[0.02] border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none resize-y"></textarea>
              </div>

              <div className="flex justify-end gap-3 border-t border-border-main pt-5 mt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 border border-border-main rounded-lg text-sm font-semibold text-text-muted hover:text-text-main hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-text-inverse rounded-lg text-sm font-semibold transition-all">
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
            <div key={client.id} className="glass-panel p-6 flex flex-col gap-5 justify-between animate-fade-in border-l-2 border-l-primary/20 hover:border-l-primary transition-colors duration-300">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-lg text-text-main mb-1 truncate">{client.name}</h3>
                  {client.taxId && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
                      <CreditCard size={10} />
                      GSTIN: {client.taxId}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleOpenEdit(client)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-border-main bg-white/[0.02] text-text-muted transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:border-primary/20" title="Edit Client">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(client.id, client.name)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-border-main bg-white/[0.02] text-text-muted transition-all duration-200 hover:bg-danger/10 hover:text-danger hover:border-danger/20" title="Delete Client">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                {client.phone && (
                  <p className="flex items-center gap-2">
                    <Phone size={13} className="text-text-muted shrink-0" />
                    <span className="text-text-main">{client.phone}</span>
                  </p>
                )}
                {client.email && (
                  <p className="flex items-center gap-2">
                    <Mail size={13} className="text-text-muted shrink-0" />
                    <span className="text-text-main">{client.email}</span>
                  </p>
                )}
                {client.address && (
                  <div className="flex gap-2 mt-1">
                    <MapPin size={13} className="text-text-muted shrink-0 mt-0.5" />
                    <p className="text-text-muted text-xs whitespace-pre-wrap leading-relaxed">
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
                  <FilePlus size={14} />
                  Create Document for Client
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center md:col-span-2 text-text-muted glass-panel">
            <Users size={48} strokeWidth={1.5} />
            <p className="max-w-xs text-sm">No clients found. Add some clients to start generating invoices easily.</p>
            <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-text-inverse px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200">
              <UserPlus size={18} />
              Add First Client
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
