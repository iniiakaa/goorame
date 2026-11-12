export type UserRole = "PEMILIK" | "PEKERJA";

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  avatarLetter: string;
}

export type AccountCategory = "ASET" | "KEWAJIBAN" | "EKUITAS" | "PENDAPATAN" | "BEBAN";
export type NormalBalance = "DEBIT" | "KREDIT";

export interface ChartOfAccount {
  code: string;
  name: string;
  category: AccountCategory;
  normalBalance: NormalBalance;
  description?: string;
}

export interface CashAccount {
  id: string;
  code: string;
  name: string;
  type: "KAS" | "BANK";
  accountNumber?: string;
  balance: number;
}

export interface Pond {
  id: string;
  name: string;
  type: "PEMBESARAN" | "BIBIT" | "PANEN" | "KARANTINA";
  dimension: string; // misal "10m x 20m x 1.5m"
  capacityEkor: number;
  initialStock: number;
  currentEkor: number;
  currentKgEstimasi: number;
  totalTebar: number;
  totalMati: number;
  totalPanen: number;
  survivalRate: number; // percentage (0-100)
  status: "AKTIF" | "ISTIRAHAT" | "PERSIAPAN";
}

export interface StockMutation {
  id: string;
  date: string;
  pondId: string;
  pondName: string;
  type: "TEBAR" | "PANEN" | "KEMATIAN" | "MATI" | "TRANSFER";
  ekor: number;
  weightKg: number;
  note: string;
  referenceId?: string;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  date: string;
  buyerName: string;
  pondId?: string;
  pondName?: string;
  weightKg: number;
  quantityEkor: number;
  pricePerKg: number;
  totalAmount: number;
  paymentStatus: "LUNAS" | "TEMPO";
  cashAccountId?: string;
  cashAccountName?: string;
  dueDate?: string;
  paidDate?: string;
  note: string;
}

export type ExpenseCategory = "PAKAN" | "GAJI" | "OBAT" | "OPERASIONAL";

export interface Expense {
  id: string;
  expenseNo: string;
  date: string;
  category: ExpenseCategory;
  nominal: number;
  cashAccountId: string;
  cashAccountName: string;
  note: string;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  supplierName: string;
  itemCategory: "Pakan" | "Bibit" | "Obat / Suplemen" | "Operasional";
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: "BELUM_LUNAS" | "SEBAGIAN" | "LUNAS";
  note: string;
}

export interface SupplierPayment {
  id: string;
  invoiceId: string;
  supplierName: string;
  date: string;
  amount: number;
  cashAccountId: string;
  cashAccountName: string;
  note: string;
}

export interface CashTransfer {
  id: string;
  date: string;
  fromAccountId: string;
  toAccountId: string;
  fromAccountName: string;
  toAccountName: string;
  amount: number;
  note: string;
}

export interface JournalItem {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  refType: "PENJUALAN" | "PENGELUARAN" | "FAKTUR_UTANG" | "BAYAR_UTANG" | "MUTASI_KAS" | "MANUAL";
  refId?: string;
  items: JournalItem[];
}

export interface LedgerEntry {
  date: string;
  description: string;
  refNo: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface LedgerAccount {
  code: string;
  name: string;
  category: AccountCategory;
  normalBalance: NormalBalance;
  openingBalance: number;
  entries: LedgerEntry[];
  closingBalance: number;
}

export interface CashFlowPoint {
  date: string;
  label: string;
  income: number;
  expense: number;
}

