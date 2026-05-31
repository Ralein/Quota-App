'use client';

import React, { useState, useEffect } from 'react';
import { getCompanyProfile, saveCompanyProfile } from '@/utils/db';
import { CompanyProfile } from '@/types';

export default function Settings() {
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProfile(getCompanyProfile());
  }, []);

  if (!mounted || !profile) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: name === 'defaultTaxRate' ? parseFloat(value) || 0 : value
      };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUri' | 'signatureUri') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => {
          if (!prev) return null;
          return {
            ...prev,
            [field]: reader.result as string
          };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (field: 'logoUri' | 'signatureUri') => {
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: null
      };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      alert('Company Name is required.');
      return;
    }
    saveCompanyProfile(profile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="settings-page animate-fade-in">
      <div className="settings-header">
        <h1>⚙️ Business Settings</h1>
        <p>Set up your company details, logo, signature, and default billing terms.</p>
      </div>

      {saveSuccess && (
        <div className="success-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Company Profile saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="settings-form">
        {/* Section 1: Business Branding */}
        <div className="form-section glass-panel">
          <h2>Business Branding</h2>
          
          <div className="image-uploads-row">
            {/* Logo Upload */}
            <div className="upload-box">
              <label className="upload-label">Company Logo</label>
              {profile.logoUri ? (
                <div className="image-preview-container">
                  <img src={profile.logoUri} alt="Company Logo Preview" className="logo-preview" />
                  <button type="button" onClick={() => removeImage('logoUri')} className="remove-img-btn" title="Remove Logo">
                    Remove
                  </button>
                </div>
              ) : (
                <label className="image-dropzone">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span>Upload Logo</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUri')} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {/* Signature Upload */}
            <div className="upload-box">
              <label className="upload-label">Handwritten Signature</label>
              {profile.signatureUri ? (
                <div className="image-preview-container">
                  <img src={profile.signatureUri} alt="Signature Preview" className="signature-preview" />
                  <button type="button" onClick={() => removeImage('signatureUri')} className="remove-img-btn" title="Remove Signature">
                    Remove
                  </button>
                </div>
              ) : (
                <label className="image-dropzone">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  <span>Upload Signature</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'signatureUri')} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="name">Company Name *</label>
              <input type="text" id="name" name="name" value={profile.name} onChange={handleInputChange} required placeholder="e.g. ARVIND KUMAR MANDAL" />
            </div>

            <div className="form-group full-width">
              <label htmlFor="tagline">Business Tagline / Specialty</label>
              <input type="text" id="tagline" name="tagline" value={profile.tagline} onChange={handleInputChange} placeholder="e.g. Sp. In ALL PLUMBING CONTRACTORS" />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Info */}
        <div className="form-section glass-panel">
          <h2>Contact & Tax Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input type="text" id="phone" name="phone" value={profile.phone} onChange={handleInputChange} placeholder="e.g. 9820000000" />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" name="email" value={profile.email} onChange={handleInputChange} placeholder="e.g. contact@business.com" />
            </div>

            <div className="form-group">
              <label htmlFor="taxId">GSTIN / Tax ID</label>
              <input type="text" id="taxId" name="taxId" value={profile.taxId} onChange={handleInputChange} placeholder="e.g. 27ABCDE1234F1Z0" />
            </div>

            <div className="form-group">
              <label htmlFor="website">Website URL</label>
              <input type="text" id="website" name="website" value={profile.website} onChange={handleInputChange} placeholder="e.g. www.business.com" />
            </div>

            <div className="form-group full-width">
              <label htmlFor="address">Billing Address</label>
              <textarea id="address" name="address" rows={3} value={profile.address} onChange={handleInputChange} placeholder="Enter full multi-line physical address"></textarea>
            </div>
          </div>
        </div>

        {/* Section 3: Document Defaults */}
        <div className="form-section glass-panel">
          <h2>Document & Signatory Defaults</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="proprietorName">Authorized Person Name</label>
              <input type="text" id="proprietorName" name="proprietorName" value={profile.proprietorName} onChange={handleInputChange} placeholder="e.g. ARVIND KUMAR MANDAL" />
            </div>

            <div className="form-group">
              <label htmlFor="signatureLabel">Signatory Designation</label>
              <input type="text" id="signatureLabel" name="signatureLabel" value={profile.signatureLabel} onChange={handleInputChange} placeholder="e.g. Proprietor / Director / Signatory" />
            </div>

            <div className="form-group">
              <label htmlFor="currencySymbol">Currency Symbol</label>
              <input type="text" id="currencySymbol" name="currencySymbol" value={profile.currencySymbol} onChange={handleInputChange} placeholder="e.g. ₹, $, €" maxLength={3} />
            </div>

            <div className="form-group">
              <label htmlFor="defaultTaxLabel">Tax Label</label>
              <input type="text" id="defaultTaxLabel" name="defaultTaxLabel" value={profile.defaultTaxLabel} onChange={handleInputChange} placeholder="e.g. GST, VAT, Tax" />
            </div>

            <div className="form-group">
              <label htmlFor="defaultTaxRate">Default Tax Rate (%)</label>
              <select id="defaultTaxRate" name="defaultTaxRate" value={profile.defaultTaxRate} onChange={handleInputChange}>
                <option value={0}>No Tax (0%)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="defaultTerms">Default Terms & Conditions</label>
              <textarea id="defaultTerms" name="defaultTerms" rows={4} value={profile.defaultTerms} onChange={handleInputChange} placeholder="Enter default terms to appear on every document"></textarea>
            </div>
          </div>
        </div>

        <div className="form-actions-sticky">
          <button type="submit" className="save-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save Profile Settings
          </button>
        </div>
      </form>

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

        .settings-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }

        .settings-header h1 {
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 0.25rem;
        }

        .settings-header p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .success-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--color-success);
          font-weight: 600;
          border-radius: var(--radius-md);
          font-size: 0.95rem;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding-bottom: 5rem;
        }

        .form-section {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-section h2 {
          font-size: 1.2rem;
          font-weight: 700;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
        }

        .image-uploads-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 600px) {
          .image-uploads-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .upload-box {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .upload-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .image-dropzone {
          height: 100px;
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          color: var(--text-muted);
          transition: all 0.2s ease;
        }

        .image-dropzone:hover {
          border-color: var(--color-primary);
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.01);
        }

        .image-preview-container {
          position: relative;
          height: 100px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.02);
          overflow: hidden;
        }

        .logo-preview {
          max-height: 80px;
          max-width: 150px;
          object-fit: contain;
        }

        .signature-preview {
          max-height: 60px;
          max-width: 200px;
          object-fit: contain;
          filter: contrast(1.2) multiply; /* Enhances hand signature */
        }

        [data-theme="dark"] .signature-preview {
          filter: invert(1) brightness(2); /* Keeps white signature visible in dark mode screen preview */
        }

        .remove-img-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: var(--color-danger);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        @media (min-width: 600px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .full-width {
            grid-column: span 2;
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
        .form-group textarea, 
        .form-group select {
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          color: var(--text-main);
          font-size: 0.95rem;
        }

        [data-theme="light"] .form-group input, 
        [data-theme="light"] .form-group textarea, 
        [data-theme="light"] .form-group select {
          background: rgba(15, 23, 42, 0.02);
        }

        .form-group select {
          cursor: pointer;
        }

        .form-actions-sticky {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 90;
          width: calc(100% - 3rem);
          max-width: 800px;
          display: flex;
          justify-content: flex-end;
          padding: 1rem;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
        }

        [data-theme="light"] .form-actions-sticky {
          background: rgba(241, 245, 249, 0.6);
        }

        .save-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--color-primary);
          color: white;
          padding: 0.85rem 1.75rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .save-btn:hover {
          background: var(--color-primary-hover);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
