import { Quotation, CompanyProfile, Client, ItemLibraryEntry } from '../types';

// Storage keys
const KEYS = {
  COMPANY_PROFILE: 'qb_company_profile',
  CLIENTS: 'qb_clients',
  QUOTATIONS: 'qb_quotations',
  ITEM_LIBRARY: 'qb_item_library'
};

// Seed initial data if nothing exists
const SEED_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Urbanetek HVACV Eng Pvt. Ltd',
    phone: '9876543210',
    email: 'info@urbanetek.com',
    address: 'Urbanetek HVACV Eng Private Limited\nThird, A 301, 302, Neelkant Business Park,\nVidyavihar Station Skywalk Vidya Vihar West,\nMumbai - 400086.',
    taxId: '27AAACU1204C1Z5',
    createdAt: new Date().toISOString()
  },
  {
    id: 'c2',
    name: 'Rohan Sharma (Flat 402)',
    phone: '9812345678',
    email: 'rohan.sharma@email.com',
    address: 'Flat 402, Building 5, Sea Breeze Society, Bandra West, Mumbai - 400050.',
    taxId: '',
    createdAt: new Date().toISOString()
  }
];

const SEED_ITEM_LIBRARY: ItemLibraryEntry[] = [
  { id: 'i1', description: 'G.I. Pipe C class 100 mm', defaultUnit: 'Rmt', defaultRate: 715 },
  { id: 'i2', description: 'G.I. Pipe C class 80 mm', defaultUnit: 'Rmt', defaultRate: 536.25 },
  { id: 'i3', description: 'G.I. Pipe C class 65 m', defaultUnit: 'Rmt', defaultRate: 464.75 },
  { id: 'i4', description: 'G.I. Pipe C class 50 mm', defaultUnit: 'Rmt', defaultRate: 328.90 },
  { id: 'i5', description: 'G.I. Pipe C class 40 mm', defaultUnit: 'Rmt', defaultRate: 286 },
  { id: 'i6', description: 'G.I. Pipe C class 32 mm', defaultUnit: 'Rmt', defaultRate: 228.80 },
  { id: 'i7', description: 'G.I. Pipe C class 25 mm', defaultUnit: 'Rmt', defaultRate: 178.75 },
  { id: 'i8', description: 'Cutting and Lifting', defaultUnit: 'L.S', defaultRate: 7800 },
  { id: 'i9', description: 'Shoulder rud', defaultUnit: 'L.S', defaultRate: 2000 }
];

const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  id: 'default',
  name: 'ARVIND KUMAR MANDAL',
  tagline: 'Sp. In ALL PLUMBING CONTRACTORS',
  taxId: '27ABCDE1234F1Z0',
  phone: '9820000000',
  email: 'arvind.mandal@email.com',
  address: 'Room No. 4, Chawl No. 2, Transit Camp, Dharavi, Mumbai - 400017.',
  website: 'www.arvindplumbing.com',
  proprietorName: 'ARVIND KUMAR MANDAL',
  signatureLabel: 'Proprietor',
  logoUri: null,
  signatureUri: null,
  currencySymbol: '₹',
  defaultTaxRate: 18,
  defaultTaxLabel: 'GST',
  defaultTerms: '1. Payment due within 30 days of invoice date.\n2. Work will begin after receipt of purchase order.\n3. Goods once sold will not be taken back.'
};

// Safe localStorage checks for Next.js SSR
const isClient = typeof window !== 'undefined';

function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isClient) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading key "${key}" from localStorage:`, error);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (!isClient) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing key "${key}" to localStorage:`, error);
  }
}

// -------------------------------------------------------------
// Company Profile API
// -------------------------------------------------------------
export function getCompanyProfile(): CompanyProfile {
  return getStorageItem<CompanyProfile>(KEYS.COMPANY_PROFILE, DEFAULT_COMPANY_PROFILE);
}

export function saveCompanyProfile(profile: CompanyProfile): void {
  setStorageItem<CompanyProfile>(KEYS.COMPANY_PROFILE, profile);
}

// -------------------------------------------------------------
// Clients API
// -------------------------------------------------------------
export function getClients(): Client[] {
  const clients = getStorageItem<Client[]>(KEYS.CLIENTS, []);
  if (clients.length === 0 && isClient) {
    // Seed and return
    setStorageItem<Client[]>(KEYS.CLIENTS, SEED_CLIENTS);
    return SEED_CLIENTS;
  }
  return clients;
}

export function saveClients(clients: Client[]): void {
  setStorageItem<Client[]>(KEYS.CLIENTS, clients);
}

export function addClient(client: Omit<Client, 'id' | 'createdAt'>): Client {
  const clients = getClients();
  const newClient: Client = {
    ...client,
    id: `client_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  clients.push(newClient);
  saveClients(clients);
  return newClient;
}

export function updateClient(updatedClient: Client): void {
  const clients = getClients();
  const index = clients.findIndex(c => c.id === updatedClient.id);
  if (index !== -1) {
    clients[index] = updatedClient;
    saveClients(clients);
  }
}

export function deleteClient(id: string): void {
  const clients = getClients();
  const filtered = clients.filter(c => c.id !== id);
  saveClients(filtered);
}

// -------------------------------------------------------------
// Item Library API
// -------------------------------------------------------------
export function getItemLibrary(): ItemLibraryEntry[] {
  const library = getStorageItem<ItemLibraryEntry[]>(KEYS.ITEM_LIBRARY, []);
  if (library.length === 0 && isClient) {
    setStorageItem<ItemLibraryEntry[]>(KEYS.ITEM_LIBRARY, SEED_ITEM_LIBRARY);
    return SEED_ITEM_LIBRARY;
  }
  return library;
}

export function saveItemLibrary(library: ItemLibraryEntry[]): void {
  setStorageItem<ItemLibraryEntry[]>(KEYS.ITEM_LIBRARY, library);
}

export function addItemLibraryEntry(entry: Omit<ItemLibraryEntry, 'id'>): ItemLibraryEntry {
  const library = getItemLibrary();
  const newEntry: ItemLibraryEntry = {
    ...entry,
    id: `item_${Date.now()}`
  };
  library.push(newEntry);
  saveItemLibrary(library);
  return newEntry;
}

export function removeItemLibraryEntry(id: string): void {
  const library = getItemLibrary();
  const filtered = library.filter(e => e.id !== id);
  saveItemLibrary(filtered);
}

// -------------------------------------------------------------
// Quotations API
// -------------------------------------------------------------
export function getQuotations(): Quotation[] {
  return getStorageItem<Quotation[]>(KEYS.QUOTATIONS, []);
}

export function getQuotationById(id: string): Quotation | undefined {
  const quotations = getQuotations();
  return quotations.find(q => q.id === id);
}

export function saveQuotation(quotation: Quotation): void {
  const quotations = getQuotations();
  const index = quotations.findIndex(q => q.id === quotation.id);
  
  const updatedQuotation = {
    ...quotation,
    updatedAt: new Date().toISOString()
  };

  if (index !== -1) {
    quotations[index] = updatedQuotation;
  } else {
    quotations.push(updatedQuotation);
  }
  
  setStorageItem<Quotation[]>(KEYS.QUOTATIONS, quotations);
}

export function deleteQuotation(id: string): void {
  const quotations = getQuotations();
  const filtered = quotations.filter(q => q.id !== id);
  setStorageItem<Quotation[]>(KEYS.QUOTATIONS, filtered);
}

export function getNextRefNo(type: 'quotation' | 'running_bill' | 'invoice'): string {
  const quotations = getQuotations();
  const currentYear = new Date().getFullYear();
  
  // Filter for matching type
  const matchingQuotes = quotations.filter(q => q.type === type);
  
  let maxNum = 0;
  const prefix = type === 'quotation' ? 'QT' : type === 'running_bill' ? 'RB' : 'INV';
  
  matchingQuotes.forEach(q => {
    // Expecting format like PREFIX-YYYY-NNN (e.g. QT-2026-001)
    const parts = q.refNo.split('-');
    if (parts.length === 3 && parts[1] === String(currentYear)) {
      const num = parseInt(parts[2], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  const nextNumStr = String(maxNum + 1).padStart(3, '0');
  return `${prefix}-${currentYear}-${nextNumStr}`;
}

// -------------------------------------------------------------
// Dashboard / Analytics API
// -------------------------------------------------------------
export interface AnalyticsSummary {
  totalBilledThisMonth: number;
  totalBilledThisYear: number;
  quotationCount: number;
  acceptedCount: number;
  runningBillCount: number;
  invoiceCount: number;
  topClients: { name: string; amount: number; count: number }[];
  monthlyRevenue: { month: string; amount: number }[];
}

export function getAnalytics(): AnalyticsSummary {
  const quotations = getQuotations().filter(q => q.status !== 'draft');
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();

  let totalBilledThisMonth = 0;
  let totalBilledThisYear = 0;
  let quotationCount = 0;
  let acceptedCount = 0;
  let runningBillCount = 0;
  let invoiceCount = 0;

  const clientTotals: Record<string, { name: string; amount: number; count: number }> = {};
  const monthlyTotals: Record<string, number> = {};

  // Initialize past 6 months including current month
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthlyTotals[label] = 0;
  }

  quotations.forEach(q => {
    const qDate = new Date(q.date);
    const qMonth = qDate.getMonth();
    const qYear = qDate.getFullYear();
    const qAmount = q.total;

    // Counts
    if (q.type === 'quotation') {
      quotationCount++;
      if (q.status === 'accepted' || q.status === 'paid') {
        acceptedCount++;
      }
    } else if (q.type === 'running_bill') {
      runningBillCount++;
    } else if (q.type === 'invoice') {
      invoiceCount++;
    }

    // Monthly & Annual Billed
    if (qYear === currentYear) {
      totalBilledThisYear += qAmount;
      if (qMonth === currentMonth) {
        totalBilledThisMonth += qAmount;
      }
    }

    // Client aggregations
    const clientName = q.client.name;
    if (!clientTotals[clientName]) {
      clientTotals[clientName] = { name: clientName, amount: 0, count: 0 };
    }
    clientTotals[clientName].amount += qAmount;
    clientTotals[clientName].count += 1;

    // Monthly revenue trend (past 6 months)
    const label = qDate.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (label in monthlyTotals) {
      monthlyTotals[label] += qAmount;
    }
  });

  // Convert client totals to sorted list
  const topClients = Object.values(clientTotals)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Convert monthly totals to list
  const monthlyRevenue = Object.entries(monthlyTotals).map(([month, amount]) => ({
    month,
    amount
  }));

  return {
    totalBilledThisMonth,
    totalBilledThisYear,
    quotationCount,
    acceptedCount,
    runningBillCount,
    invoiceCount,
    topClients,
    monthlyRevenue
  };
}
