/**
 * Goorame API Client
 * Connects Next.js Frontend with Python FastAPI Backend (http://127.0.0.1:8000/api)
 */

import {
  Pond,
  StockMutation,
  Sale,
  Expense,
  SupplierInvoice,
  CashAccount,
  ChartOfAccount,
  JournalEntry,
  AuthUser,
  UserRole,
} from "./goorame-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

// Helper for snake_case to camelCase mapping
export function mapPondFromApi(raw: any): Pond {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    dimension: raw.dimension,
    capacityEkor: raw.capacity_ekor ?? raw.capacityEkor ?? 0,
    initialStock: raw.initial_stock ?? raw.initialStock ?? 0,
    currentEkor: raw.current_ekor ?? raw.currentEkor ?? 0,
    currentKgEstimasi: raw.current_kg_estimasi ?? raw.currentKgEstimasi ?? 0,
    totalTebar: raw.total_tebar ?? raw.totalTebar ?? 0,
    totalMati: raw.total_mati ?? raw.totalMati ?? 0,
    totalPanen: raw.total_panen ?? raw.totalPanen ?? 0,
    survivalRate: raw.survival_rate ?? raw.survivalRate ?? 100,
    status: raw.status || "AKTIF",
  };
}

export function mapMutationFromApi(raw: any): StockMutation {
  return {
    id: raw.id,
    pondId: raw.pond_id ?? raw.pondId,
    pondName: raw.pond_name ?? raw.pondName ?? (raw.pond?.name || "Kolam Gurame"),
    date: raw.date,
    type: raw.type === "MATI" ? "KEMATIAN" : raw.type,
    ekor: raw.ekor,
    weightKg: raw.weight_kg ?? raw.weightKg ?? 0,
    note: raw.note,
    referenceId: raw.reference_id ?? raw.referenceId,
  };
}

export function mapSaleFromApi(raw: any): Sale {
  return {
    id: raw.id,
    invoiceNo: raw.invoice_no ?? raw.invoiceNo,
    date: raw.date,
    buyerName: raw.buyer_name ?? raw.buyerName,
    pondId: raw.pond_id ?? raw.pondId,
    quantityEkor: raw.quantity_ekor ?? raw.quantityEkor ?? 0,
    weightKg: raw.weight_kg ?? raw.weightKg ?? 0,
    pricePerKg: raw.price_per_kg ?? raw.pricePerKg ?? 0,
    totalAmount: raw.total_amount ?? raw.totalAmount ?? 0,
    paymentStatus: raw.payment_status ?? raw.paymentStatus ?? "LUNAS",
    dueDate: raw.due_date ?? raw.dueDate,
    paidDate: raw.paid_date ?? raw.paidDate,
    cashAccountId: raw.cash_account_id ?? raw.cashAccountId,
    cashAccountName: raw.cash_account_name ?? raw.cashAccountName,
    note: raw.note,
  };
}

export function mapExpenseFromApi(raw: any): Expense {
  return {
    id: raw.id,
    expenseNo: raw.expense_no ?? raw.expenseNo,
    date: raw.date,
    category: raw.category,
    nominal: raw.nominal ?? 0,
    cashAccountId: raw.cash_account_id ?? raw.cashAccountId,
    cashAccountName: raw.cash_account_name ?? raw.cashAccountName,
    note: raw.note,
  };
}

export function mapSupplierInvoiceFromApi(raw: any): SupplierInvoice {
  return {
    id: raw.id,
    invoiceNumber: raw.invoice_number ?? raw.invoiceNumber,
    date: raw.date,
    supplierName: raw.supplier_name ?? raw.supplierName,
    itemCategory: raw.item_category ?? raw.itemCategory,
    totalAmount: raw.total_amount ?? raw.totalAmount ?? 0,
    paidAmount: raw.paid_amount ?? raw.paidAmount ?? 0,
    dueDate: raw.due_date ?? raw.dueDate,
    status: raw.status || "BELUM_LUNAS",
    note: raw.note,
  };
}

export function mapCashAccountFromApi(raw: any): CashAccount {
  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    type: raw.type,
    accountNumber: raw.account_number ?? raw.accountNumber,
    balance: raw.balance ?? 0,
  };
}

export function mapJournalFromApi(raw: any): JournalEntry {
  return {
    id: raw.id,
    entryNumber: raw.entry_number ?? raw.entryNumber,
    date: raw.date,
    description: raw.description,
    refType: raw.ref_type ?? raw.refType,
    refId: raw.ref_id ?? raw.refId,
    items: (raw.items || []).map((i: any) => ({
      accountCode: i.account_code ?? i.accountCode,
      accountName: i.account_name ?? i.accountName,
      debit: i.debit ?? 0,
      credit: i.credit ?? 0,
    })),
  };
}

// Network Request Helper with timeout
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Request failed with status ${res.status}`);
    }

    return (await res.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// API Methods
export const api = {
  // Ponds
  getPonds: async (): Promise<Pond[]> => {
    const data = await request<any[]>("/ponds");
    return data.map(mapPondFromApi);
  },

  createPond: async (body: {
    name: string;
    type: string;
    dimension: string;
    capacityEkor: number;
    initialStock: number;
    initialKg: number;
  }): Promise<Pond> => {
    const raw = await request<any>("/ponds", {
      method: "POST",
      body: JSON.stringify({
        name: body.name,
        type: body.type,
        dimension: body.dimension,
        capacity_ekor: body.capacityEkor,
        initial_stock: body.initialStock,
        initial_kg: body.initialKg,
      }),
    });
    return mapPondFromApi(raw);
  },

  tebarBibit: async (body: {
    pondId: string;
    ekor: number;
    weightKg: number;
    note: string;
  }): Promise<StockMutation> => {
    const raw = await request<any>("/ponds/tebar", {
      method: "POST",
      body: JSON.stringify({
        pond_id: body.pondId,
        ekor: body.ekor,
        weight_kg: body.weightKg,
        note: body.note,
      }),
    });
    return mapMutationFromApi(raw);
  },

  catatMortalitas: async (body: {
    pondId: string;
    ekor: number;
    weightKg: number;
    note: string;
  }): Promise<StockMutation> => {
    const raw = await request<any>("/ponds/mortalitas", {
      method: "POST",
      body: JSON.stringify({
        pond_id: body.pondId,
        ekor: body.ekor,
        weight_kg: body.weightKg,
        note: body.note,
      }),
    });
    return mapMutationFromApi(raw);
  },

  getMutations: async (): Promise<StockMutation[]> => {
    const data = await request<any[]>("/ponds/mutations");
    return data.map(mapMutationFromApi);
  },

  // Sales
  getSales: async (): Promise<Sale[]> => {
    const data = await request<any[]>("/sales");
    return data.map(mapSaleFromApi);
  },

  createSale: async (body: {
    buyerName: string;
    pondId?: string;
    quantityEkor: number;
    weightKg: number;
    pricePerKg: number;
    paymentStatus: string;
    dueDate?: string;
    cashAccountId?: string;
    note?: string;
  }): Promise<Sale> => {
    const raw = await request<any>("/sales", {
      method: "POST",
      body: JSON.stringify({
        buyer_name: body.buyerName,
        pond_id: body.pondId,
        quantity_ekor: body.quantityEkor,
        weight_kg: body.weightKg,
        price_per_kg: body.pricePerKg,
        payment_status: body.paymentStatus,
        due_date: body.dueDate,
        cash_account_id: body.cashAccountId,
        note: body.note,
      }),
    });
    return mapSaleFromApi(raw);
  },

  payReceivable: async (saleId: string, cashAccountId: string): Promise<Sale> => {
    const raw = await request<any>(`/sales/${saleId}/pay`, {
      method: "POST",
      body: JSON.stringify({ cash_account_id: cashAccountId }),
    });
    return mapSaleFromApi(raw);
  },

  // Expenses & Supplier Invoices
  getExpenses: async (): Promise<Expense[]> => {
    const data = await request<any[]>("/expenses");
    return data.map(mapExpenseFromApi);
  },

  createExpense: async (body: {
    category: string;
    nominal: number;
    cashAccountId: string;
    note?: string;
  }): Promise<Expense> => {
    const raw = await request<any>("/expenses", {
      method: "POST",
      body: JSON.stringify({
        category: body.category,
        nominal: body.nominal,
        cash_account_id: body.cashAccountId,
        note: body.note,
      }),
    });
    return mapExpenseFromApi(raw);
  },

  getSupplierInvoices: async (): Promise<SupplierInvoice[]> => {
    const data = await request<any[]>("/expenses/supplier-invoices");
    return data.map(mapSupplierInvoiceFromApi);
  },

  createSupplierInvoice: async (body: {
    supplierName: string;
    itemCategory: string;
    totalAmount: number;
    dueDate: string;
    note?: string;
  }): Promise<SupplierInvoice> => {
    const raw = await request<any>("/expenses/supplier-invoices", {
      method: "POST",
      body: JSON.stringify({
        supplier_name: body.supplierName,
        item_category: body.itemCategory,
        total_amount: body.totalAmount,
        due_date: body.dueDate,
        note: body.note,
      }),
    });
    return mapSupplierInvoiceFromApi(raw);
  },

  paySupplierInvoice: async (body: {
    invoiceId: string;
    amount: number;
    cashAccountId: string;
    note?: string;
  }): Promise<any> => {
    return await request<any>("/expenses/supplier-payments", {
      method: "POST",
      body: JSON.stringify({
        invoice_id: body.invoiceId,
        amount: body.amount,
        cash_account_id: body.cashAccountId,
        note: body.note,
      }),
    });
  },

  // Cash Accounts
  getCashAccounts: async (): Promise<CashAccount[]> => {
    const data = await request<any[]>("/cash-accounts");
    return data.map(mapCashAccountFromApi);
  },

  createCashAccount: async (body: {
    name: string;
    type: string;
    accountNumber?: string;
    initialBalance: number;
  }): Promise<CashAccount> => {
    const raw = await request<any>("/cash-accounts", {
      method: "POST",
      body: JSON.stringify({
        name: body.name,
        type: body.type,
        account_number: body.accountNumber,
        initial_balance: body.initialBalance,
      }),
    });
    return mapCashAccountFromApi(raw);
  },

  transferCash: async (body: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    note?: string;
  }): Promise<any> => {
    return await request<any>("/cash-accounts/transfer", {
      method: "POST",
      body: JSON.stringify({
        from_account_id: body.fromAccountId,
        to_account_id: body.toAccountId,
        amount: body.amount,
        note: body.note,
      }),
    });
  },

  // Accounting
  getChartOfAccounts: async (): Promise<ChartOfAccount[]> => {
    return await request<ChartOfAccount[]>("/accounting/coa");
  },

  createChartOfAccount: async (body: {
    code: string;
    name: string;
    category: string;
    normalBalance: string;
    description?: string;
  }): Promise<ChartOfAccount> => {
    return await request<ChartOfAccount>("/accounting/coa", {
      method: "POST",
      body: JSON.stringify({
        code: body.code,
        name: body.name,
        category: body.category,
        normal_balance: body.normalBalance,
        description: body.description,
      }),
    });
  },

  updateChartOfAccount: async (
    code: string,
    body: { name?: string; category?: string; normalBalance?: string; description?: string }
  ): Promise<ChartOfAccount> => {
    return await request<ChartOfAccount>(`/accounting/coa/${code}`, {
      method: "PUT",
      body: JSON.stringify({
        name: body.name,
        category: body.category,
        normal_balance: body.normalBalance,
        description: body.description,
      }),
    });
  },

  getJournals: async (): Promise<JournalEntry[]> => {
    const data = await request<any[]>("/accounting/journals");
    return data.map(mapJournalFromApi);
  },

  createManualJournal: async (body: {
    date: string;
    description: string;
    items: { accountCode: string; debit: number; credit: number }[];
  }): Promise<JournalEntry> => {
    const raw = await request<any>("/accounting/journals", {
      method: "POST",
      body: JSON.stringify({
        date: body.date,
        description: body.description,
        items: body.items.map((i) => ({
          account_code: i.accountCode,
          debit: i.debit,
          credit: i.credit,
        })),
      }),
    });
    return mapJournalFromApi(raw);
  },

  // Auth
  login: async (username: string, password?: string, role?: UserRole): Promise<{ user: AuthUser; token: string }> => {
    const raw = await request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password: password || "password",
        role: role || "PEMILIK",
      }),
    });
    return {
      token: raw.access_token,
      user: {
        id: raw.user.id,
        username: raw.user.username,
        name: raw.user.full_name,
        role: raw.user.role as UserRole,
        avatarLetter: raw.user.role === "PEMILIK" ? "P" : "K",
      },
    };
  },
};

