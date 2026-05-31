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
      <div className="loading-container">
        <div className="spinner"></div>
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
    <div className="clients-page animate-fade-in">
      <div className="clients-header-bar">
        <div>
          <h1>👥 Client Directory</h1>
          <p>Manage your clients, billing contacts, and site address books.</p>
        </div>
        <button onClick={handleOpenAdd} className="add-client-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Client
        </button>
      </div>

      {/* Search Input */}
      <div className="search-wrapper glass-panel">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input 
          type="text" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          placeholder="Search by client name, phone, or site address..." 
        />
      </div>

      {/* Editor Modal Overlay */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h2>{editingClient ? '✏️ Edit Client Details' : '👤 Add New Client'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="close-modal-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="client-name">Client Name / Business Name *</label>
                <input type="text" id="client-name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g. Urbanetek HVACV Eng Pvt. Ltd" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="client-phone">Phone Number</label>
                  <input type="text" id="client-phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="e.g. 9876543210" />
                </div>

                <div className="form-group">
                  <label htmlFor="client-email">Email Address</label>
                  <input type="email" id="client-email" name="email" value={formData.email} onChange={handleInputChange} placeholder="e.g. billing@client.com" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="client-taxId">GST No. / Client Tax ID</label>
                <input type="text" id="client-taxId" name="taxId" value={formData.taxId} onChange={handleInputChange} placeholder="e.g. GSTIN/VAT (optional)" />
              </div>

              <div className="form-group">
                <label htmlFor="client-address">Site / Billing Address (Multi-line)</label>
                <textarea id="client-address" name="address" rows={4} value={formData.address} onChange={handleInputChange} placeholder="Provide site location or full billing address"></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsFormOpen(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="submit-btn">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client List Grid */}
      <div className="clients-list">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <div key={client.id} className="client-card glass-panel animate-fade-in">
              <div className="client-card-header">
                <div>
                  <h3>{client.name}</h3>
                  {client.taxId && <span className="client-gst">GSTIN: {client.taxId}</span>}
                </div>
                <div className="client-actions">
                  <button onClick={() => handleOpenEdit(client)} className="action-icon-btn edit" title="Edit Client">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(client.id, client.name)} className="action-icon-btn delete" title="Delete Client">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>

              <div className="client-card-details">
                {client.phone && (
                  <p className="detail-item">
                    <strong>Phone:</strong> {client.phone}
                  </p>
                )}
                {client.email && (
                  <p className="detail-item">
                    <strong>Email:</strong> {client.email}
                  </p>
                )}
                {client.address && (
                  <div className="detail-item address">
                    <strong>Address:</strong>
                    <p>{client.address}</p>
                  </div>
                )}
              </div>

              <div className="client-card-footer">
                <Link href={`/create?clientId=${client.id}`} className="client-create-quote-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Create Document for Client
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="no-clients glass-panel">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <p>No clients found. Add some clients to start generating invoices easily.</p>
            <button onClick={handleOpenAdd} className="add-client-btn">Add First Client</button>
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

        .clients-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        .clients-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .clients-header-bar h1 {
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 0.25rem;
        }

        .clients-header-bar p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .add-client-btn {
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

        .add-client-btn:hover {
          background: var(--color-primary-hover);
        }

        .search-wrapper {
          padding: 0.75rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .search-wrapper input {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-main);
          font-size: 1rem;
        }

        .clients-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        @media (min-width: 768px) {
          .clients-list {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .client-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          justify-content: space-between;
        }

        .client-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .client-card-header h3 {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.2px;
          margin-bottom: 0.25rem;
        }

        .client-gst {
          display: inline-block;
          font-size: 0.75rem;
          color: var(--color-secondary);
          background: rgba(20, 184, 166, 0.1);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-weight: 600;
        }

        .client-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-icon-btn {
          width: 2rem;
          height: 2rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-muted);
        }

        .action-icon-btn:hover {
          color: var(--text-main);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .action-icon-btn.edit:hover {
          background: rgba(99, 102, 241, 0.15);
          color: var(--color-primary);
          border-color: rgba(99, 102, 241, 0.2);
        }

        .action-icon-btn.delete:hover {
          background: rgba(239, 68, 68, 0.15);
          color: var(--color-danger);
          border-color: rgba(239, 68, 68, 0.2);
        }

        .client-card-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .detail-item {
          display: flex;
          gap: 0.5rem;
        }

        .detail-item strong {
          color: var(--text-muted);
          min-width: 60px;
        }

        .detail-item.address {
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-item.address p {
          white-space: pre-wrap;
          line-height: 1.4;
          color: var(--text-muted);
          padding-left: 0.5rem;
          border-left: 2px solid var(--border-color);
        }

        .client-card-footer {
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
        }

        .client-create-quote-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-primary);
          font-weight: 600;
          font-size: 0.85rem;
        }

        .client-create-quote-link:hover {
          color: var(--color-primary-hover);
        }

        .no-clients {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 3rem;
          text-align: center;
          grid-column: span 2;
          color: var(--text-muted);
        }

        .no-clients p {
          max-width: 400px;
        }

        /* Modal Overlay & Form */
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

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .form-group input, 
        .form-group textarea {
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          color: var(--text-main);
          font-size: 0.95rem;
        }

        [data-theme="light"] .form-group input, 
        [data-theme="light"] .form-group textarea {
          background: rgba(15, 23, 42, 0.02);
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
