export interface LineItem {
  id: string;
  srNo: number;
  description: string;
  qty: number | null;                  // null for Lump Sum items
  unit: string;                        // 'Rmt' | 'Nos' | 'L.S' | 'Sqft' | etc.
  rate: number | null;                 // null for Lump Sum items
  isLumpSum: boolean;
  amount: number;                      // Qty × Rate OR manually entered if L.S
}

export interface CompanyProfile {
  id: string;
  name: string;                        // Business / firm name
  tagline: string;                     // e.g. "Licensed Electrical Contractor"
  taxId: string;                       // GST No., VAT No., etc.
  phone: string;
  email: string;
  address: string;
  website: string;
  proprietorName: string;             // Name shown at signature
  signatureLabel: string;             // "Proprietor" | "Director" | "Authorized Signatory"
  logoUri: string | null;             // Base64-encoded image data or URL
  signatureUri: string | null;        // Base64-encoded image data or URL
  currencySymbol: string;             // "₹", "$", "€", etc. Default: "₹"
  defaultTaxRate: number;
  defaultTaxLabel: string;
  defaultTerms: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;                       // Client's GST No. (optional)
  createdAt: string;
}

export interface ItemLibraryEntry {
  id: string;
  description: string;
  defaultUnit: string;
  defaultRate: number;
}

export interface Quotation {
  id: string;                          // UUID
  refNo: string;                       // e.g. "QT-2026-001"
  type: 'quotation' | 'running_bill' | 'invoice';
  subject: string;                     // Optional subject line
  date: string;                        // ISO date string (YYYY-MM-DD)
  status: 'draft' | 'sent' | 'accepted' | 'paid';
  company: CompanyProfile;             // Snapshot at time of creation
  client: Client;
  items: LineItem[];
  subtotal: number;
  taxLabel: string;                    // "GST", "VAT", "Tax", etc.
  taxRate: number;                     // 0, 5, 12, 18, 28 or custom
  taxAmount: number;
  discountValue: number;
  discountType: 'flat' | 'percent';
  discountAmount: number;              // Computed
  total: number;
  amountInWords: string;
  termsAndConditions: string;
  notes: string;
  pdfUri: string | null;               // Set when generated (or base64/blob URL)
  createdAt: string;
  updatedAt: string;
}
