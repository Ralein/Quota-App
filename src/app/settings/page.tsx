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
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-10 h-10 border-3 border-white/10 rounded-full border-t-primary animate-spin"></div>
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
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 animate-fade-in pb-20">
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-text-main">⚙️ Business Settings</h1>
        <p className="text-text-muted text-sm">Set up your company details, logo, signature, and default billing terms.</p>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/15 border border-emerald-500/30 text-success font-semibold rounded-xl text-sm transition-all duration-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Company Profile saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-8">
        {/* Section 1: Business Branding */}
        <div className="glass-panel p-6 sm:p-8 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-text-main border-b border-border-main pb-3">Business Branding</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-muted">Company Logo</label>
              {profile.logoUri ? (
                <div className="relative h-28 border border-border-main rounded-xl flex items-center justify-center bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 overflow-hidden">
                  <img src={profile.logoUri} alt="Company Logo Preview" className="max-h-20 max-w-[150px] object-contain" />
                  <button type="button" onClick={() => removeImage('logoUri')} className="absolute top-2 right-2 bg-danger hover:bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded transition-colors duration-200" title="Remove Logo">
                    Remove
                  </button>
                </div>
              ) : (
                <label className="h-28 border-2 border-dashed border-border-main rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer text-text-muted transition-all duration-200 hover:border-primary hover:text-text-main hover:bg-white/[0.01]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span className="text-xs font-medium">Upload Logo</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUri')} className="hidden" />
                </label>
              )}
            </div>

            {/* Signature Upload */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-muted">Handwritten Signature</label>
              {profile.signatureUri ? (
                <div className="relative h-28 border border-border-main rounded-xl flex items-center justify-center bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 overflow-hidden">
                  <img
                    src={profile.signatureUri}
                    alt="Signature Preview"
                    className="max-h-16 max-w-[200px] object-contain contrast-125 dark:invert dark:brightness-200"
                  />
                  <button type="button" onClick={() => removeImage('signatureUri')} className="absolute top-2 right-2 bg-danger hover:bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded transition-colors duration-200" title="Remove Signature">
                    Remove
                  </button>
                </div>
              ) : (
                <label className="h-28 border-2 border-dashed border-border-main rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer text-text-muted transition-all duration-200 hover:border-primary hover:text-text-main hover:bg-white/[0.01]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  <span className="text-xs font-medium">Upload Signature</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'signatureUri')} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="name" className="text-xs font-semibold text-text-muted">Company Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                required
                placeholder="e.g. ARVIND KUMAR MANDAL"
                className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="tagline" className="text-xs font-semibold text-text-muted">Business Tagline / Specialty</label>
              <input
                type="text"
                id="tagline"
                name="tagline"
                value={profile.tagline}
                onChange={handleInputChange}
                placeholder="e.g. Sp. In ALL PLUMBING CONTRACTORS"
                className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Info */}
        <div className="glass-panel p-6 sm:p-8 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-text-main border-b border-border-main pb-3">Contact & Tax Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-semibold text-text-muted">Phone Number</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                placeholder="e.g. 9820000000"
                className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-text-muted">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profile.email}
                onChange={handleInputChange}
                placeholder="e.g. contact@business.com"
                className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="taxId" className="text-xs font-semibold text-text-muted">GSTIN / Tax ID</label>
              <input
                type="text"
                id="taxId"
                name="taxId"
                value={profile.taxId}
                onChange={handleInputChange}
                placeholder="e.g. 27ABCDE1234F1Z0"
                className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="website" className="text-xs font-semibold text-text-muted">Website URL</label>
              <input
                type="text"
                id="website"
                name="website"
                value={profile.website}
                onChange={handleInputChange}
                placeholder="e.g. www.business.com"
                className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="address" className="text-xs font-semibold text-text-muted">Billing Address</label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={profile.address}
                onChange={handleInputChange}
                placeholder="Enter full multi-line physical address"
                className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none resize-y"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Section 3: Document Defaults */}
        <div className="glass-panel p-6 sm:p-8 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-text-main border-b border-border-main pb-3">Document & Signatory Defaults</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="proprietorName" className="text-xs font-semibold text-text-muted">Authorized Person Name</label>
              <input
                type="text"
                id="proprietorName"
                name="proprietorName"
                value={profile.proprietorName}
                onChange={handleInputChange}
                placeholder="e.g. ARVIND KUMAR MANDAL"
                className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="signatureLabel" className="text-xs font-semibold text-text-muted">Signatory Designation</label>
              <input
                type="text"
                id="signatureLabel"
                name="signatureLabel"
                value={profile.signatureLabel}
                onChange={handleInputChange}
                placeholder="e.g. Proprietor / Director / Signatory"
                className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="currencySymbol" className="text-xs font-semibold text-text-muted">Currency Symbol</label>
              <input
                type="text"
                id="currencySymbol"
                name="currencySymbol"
                value={profile.currencySymbol}
                onChange={handleInputChange}
                placeholder="e.g. ₹, $, €"
                maxLength={3}
                className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="defaultTaxLabel" className="text-xs font-semibold text-text-muted">Tax Label</label>
              <input
                type="text"
                id="defaultTaxLabel"
                name="defaultTaxLabel"
                value={profile.defaultTaxLabel}
                onChange={handleInputChange}
                placeholder="e.g. GST, VAT, Tax"
                className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="defaultTaxRate" className="text-xs font-semibold text-text-muted">Default Tax Rate (%)</label>
              <select
                id="defaultTaxRate"
                name="defaultTaxRate"
                value={profile.defaultTaxRate}
                onChange={handleInputChange}
                className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none cursor-pointer"
              >
                <option value={0}>No Tax (0%)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="defaultTerms" className="text-xs font-semibold text-text-muted">Default Terms & Conditions</label>
              <textarea
                id="defaultTerms"
                name="defaultTerms"
                rows={4}
                value={profile.defaultTerms}
                onChange={handleInputChange}
                placeholder="Enter default terms to appear on every document"
                className="px-4 py-2.5 bg-white/2 dark:bg-white/2 [data-theme=light]:bg-slate-900/2 border border-border-main rounded-lg text-text-main text-sm transition-all duration-200 focus:border-border-focus focus:ring-3 focus:ring-primary/15 outline-none resize-y"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Sticky footer actions bar */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-3rem)] max-w-3xl flex justify-end p-4 bg-card-bg/60 backdrop-blur-md border border-border-main rounded-xl shadow-lg">
          <button
            type="submit"
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-7 py-3 rounded-lg font-semibold text-sm border border-white/10 shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save Profile Settings
          </button>
        </div>
      </form>
    </div>
  );
}
