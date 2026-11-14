"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import {
  UserRole,
  AuthUser,
  ChartOfAccount,
  CashAccount,
  Pond,
  StockMutation,
  Sale,
  Expense,
  SupplierInvoice,
  SupplierPayment,
  CashTransfer,
  JournalEntry,
  JournalItem,
  LedgerAccount,
} from "./goorame-types";

import {
  generateLedger,
  calculateIncomeStatement,
  calculateBalanceSheet,
  calculateCashFlow,
  validateJournalItems,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
} from "./goorame-accounting";
import { api } from "./api-client";

interface GoorameContextType {
  currentUser: AuthUser | null;
  login: (username: string, password?: string, roleOverride?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notification: string | null;
  setNotification: (msg: string | null) => void;
  isDatabaseConnected: boolean;
  refreshDatabase: () => Promise<void>;

  // Data
  chartOfAccounts: ChartOfAccount[];
  cashAccounts: CashAccount[];
  ponds: Pond[];
  stockMutations: StockMutation[];
  sales: Sale[];
  expenses: Expense[];
  supplierInvoices: SupplierInvoice[];
  supplierPayments: SupplierPayment[];
  transfers: CashTransfer[];
  journalEntries: JournalEntry[];

  // Computed Metrics
  totalCashBalance: number;
  totalActiveFishCount: number;
  totalActiveFishWeight: number;
  totalPayableDue: number;
  totalReceivableDue: number;
  ledger: LedgerAccount[];
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlowStatement: CashFlowStatement;

  // Actions
  addSale: (data: {
    buyerName: string;
    pondId?: string;
    weightKg: number;
    quantityEkor: number;
    pricePerKg: number;
    paymentStatus: "LUNAS" | "TEMPO";
    cashAccountId?: string;
    dueDate?: string;
    note: string;
  }) => boolean;

  addExpense: (data: {
    category: "PAKAN" | "GAJI" | "OBAT" | "OPERASIONAL";
    nominal: number;
    cashAccountId: string;
    note: string;
  }) => boolean;

  addTebarBibit: (data: {
    pondId: string;
    ekor: number;
    weightKg: number;
    note: string;
  }) => boolean;

  addMortalitas: (data: {
    pondId: string;
    ekor: number;
    weightKg: number;
    note: string;
  }) => boolean;

  addSupplierInvoice: (data: {
    supplierName: string;
    itemCategory: "Pakan" | "Bibit" | "Obat / Suplemen" | "Operasional";
    totalAmount: number;
    dueDate: string;
    note: string;
  }) => boolean;

  addSupplierPayment: (data: {
    invoiceId: string;
    amount: number;
    cashAccountId: string;
    note: string;
  }) => boolean;

  addCashTransfer: (data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    note: string;
  }) => boolean;

  addManualJournal: (data: {
    date: string;
    description: string;
    items: JournalItem[];
  }) => { success: boolean; error?: string };

  payCustomerReceivable: (saleId: string, cashAccountId: string) => boolean;

  addPond: (data: {
    name: string;
    type: "PEMBESARAN" | "BIBIT" | "PANEN" | "KARANTINA";
    dimension: string;
    capacityEkor: number;
    initialStock: number;
    initialKg: number;
  }) => boolean;

  addCashAccount: (data: {
    name: string;
    type: "KAS" | "BANK";
    accountNumber?: string;
    initialBalance: number;
  }) => boolean;

  addChartOfAccount: (data: {
    code: string;
    name: string;
    category: "ASET" | "KEWAJIBAN" | "EKUITAS" | "PENDAPATAN" | "BEBAN";
    normalBalance: "DEBIT" | "KREDIT";
    description?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const GoorameContext = createContext<GoorameContextType | null>(null);

export function GoorameProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("goorame-auth-session");
        if (saved) {
          const user = JSON.parse(saved);
          // Normalisasi otomatis jika masih tersimpan nama lama "H. Slamet" atau "Pak Budi"
          if (user && (user.name?.includes("Slamet") || user.name?.includes("Budi"))) {
            user.name = user.role === "PEMILIK" ? "Pemilik" : "Pekerja";
            localStorage.setItem("goorame-auth-session", JSON.stringify(user));
          }
          return user;
        }
      } catch (e) {}
    }
    return null;
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("goorame-auth-session");
        if (saved) {
          const user = JSON.parse(saved);
          return user.role || "PEMILIK";
        }
      } catch (e) {}
    }
    return "PEMILIK";
  });

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [notification, setNotification] = useState<string | null>(null);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (currentUser) {
      const updatedUser: AuthUser = {
        ...currentUser,
        role: newRole,
        name: newRole === "PEMILIK" ? "Pemilik" : "Pekerja",
        avatarLetter: newRole === "PEMILIK" ? "P" : "K",
      };
      setCurrentUser(updatedUser);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("goorame-auth-session", JSON.stringify(updatedUser));
        } catch (e) {}
      }
    }
  };

  const [loginLoading, setLoginLoading] = useState(false);

  const login = async (
    username: string,
    password?: string,
    roleOverride?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      return { success: false, error: "Mohon masukkan username Anda." };
    }
    if (!password) {
      return { success: false, error: "Kata sandi harus diisi." };
    }

    setLoginLoading(true);

    try {
      // 1. Coba verifikasi ke API backend FastAPI
      const { user } = await api.login(trimmed, password, roleOverride);
      setCurrentUser(user);
      setRoleState(user.role);
      setActiveTab("dashboard");
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("goorame-auth-session", JSON.stringify(user));
        } catch (e) {}
      }
      setNotification(`Selamat datang kembali, ${user.name}!`);
      loadDataFromDatabase();
      return { success: true };
    } catch (apiError: any) {
      // 2. Jika backend offline, periksa akun lokal yang valid secara ketat
      // Akun valid: pemilik (admin123) dan pekerja (pekerja123)
      const validAccounts: Record<string, { pass: string; name: string; role: UserRole; avatar: string }> = {
        pemilik: { pass: "admin123", name: "Pemilik", role: "PEMILIK", avatar: "P" },
        pekerja: { pass: "pekerja123", name: "Pekerja", role: "PEKERJA", avatar: "K" },
      };

      const account = validAccounts[trimmed];
      if (account && password === account.pass) {
        const user: AuthUser = {
          id: `user-${trimmed}`,
          username: trimmed,
          name: account.name,
          role: account.role,
          avatarLetter: account.avatar,
        };
        setCurrentUser(user);
        setRoleState(account.role);
        setActiveTab("dashboard");
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("goorame-auth-session", JSON.stringify(user));
          } catch (e) {}
        }
        setNotification(`Selamat datang, ${account.name}!`);
        return { success: true };
      }

      // Password atau username tidak valid
      const errMsg = apiError?.message || "Username atau kata sandi tidak sesuai!";
      return { success: false, error: errMsg };
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("goorame-auth-session");
      } catch (e) {}
    }
    setNotification("Anda telah keluar dari sesi kerja.");
  };

  // States
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [stockMutations, setStockMutations] = useState<StockMutation[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [transfers, setTransfers] = useState<CashTransfer[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  // Database Connection State (FastAPI + SQLite)
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);

  const loadDataFromDatabase = async () => {
    try {
      const [
        dbPonds,
        dbCashAccounts,
        dbSales,
        dbExpenses,
        dbInvoices,
        dbMutations,
        dbJournals,
        dbCoa,
      ] = await Promise.all([
        api.getPonds().catch(() => null),
        api.getCashAccounts().catch(() => null),
        api.getSales().catch(() => null),
        api.getExpenses().catch(() => null),
        api.getSupplierInvoices().catch(() => null),
        api.getMutations().catch(() => null),
        api.getJournals().catch(() => null),
        api.getChartOfAccounts().catch(() => null),
      ]);

      // If ANY call succeeded (non-null), mark as connected
      const connected = [dbPonds, dbCashAccounts, dbSales, dbExpenses, dbInvoices, dbMutations, dbJournals, dbCoa]
        .some((r) => r !== null);

      if (connected) {
        if (dbPonds !== null) setPonds(dbPonds);
        if (dbCashAccounts !== null) setCashAccounts(dbCashAccounts);
        if (dbSales !== null) setSales(dbSales);
        if (dbExpenses !== null) setExpenses(dbExpenses);
        if (dbInvoices !== null) setSupplierInvoices(dbInvoices);
        if (dbMutations !== null) setStockMutations(dbMutations);
        if (dbJournals !== null) setJournalEntries(dbJournals);
        if (dbCoa !== null) setChartOfAccounts(dbCoa);
        setIsDatabaseConnected(true);
      } else {
        setIsDatabaseConnected(false);
      }
    } catch (e) {
      console.warn("Backend FastAPI offline:", e);
      setIsDatabaseConnected(false);
    }
  };

  useEffect(() => {
    loadDataFromDatabase();
  }, []);

  // Auto dismiss toast
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 3500);
    return () => clearTimeout(timer);
  }, [notification]);

  // Adjust activeTab when switching to PEKERJA (RBAC)
  useEffect(() => {
    if (role === "PEKERJA" && activeTab !== "dashboard" && activeTab !== "kolam") {
      setActiveTab("dashboard");
    }
  }, [role, activeTab]);

  // Computed Financials
  const totalCashBalance = useMemo(
    () => cashAccounts.reduce((sum, acc) => sum + acc.balance, 0),
    [cashAccounts]
  );

  const totalActiveFishCount = useMemo(
    () => ponds.reduce((sum, p) => sum + p.currentEkor, 0),
    [ponds]
  );

  const totalActiveFishWeight = useMemo(
    () => ponds.reduce((sum, p) => sum + p.currentKgEstimasi, 0),
    [ponds]
  );

  const totalPayableDue = useMemo(
    () =>
      supplierInvoices
        .filter((inv) => inv.status !== "LUNAS")
        .reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0),
    [supplierInvoices]
  );

  const totalReceivableDue = useMemo(
    () =>
      sales
        .filter((s) => s.paymentStatus === "TEMPO")
        .reduce((sum, s) => sum + s.totalAmount, 0),
    [sales]
  );

  const ledger = useMemo(
    () => generateLedger(chartOfAccounts, journalEntries),
    [chartOfAccounts, journalEntries]
  );

  const incomeStatement = useMemo(
    () => calculateIncomeStatement(ledger),
    [ledger]
  );

  const balanceSheet = useMemo(
    () => calculateBalanceSheet(ledger, incomeStatement.netProfit),
    [ledger, incomeStatement.netProfit]
  );

  const cashFlowStatement = useMemo(
    () => calculateCashFlow(ledger, totalCashBalance),
    [ledger, totalCashBalance]
  );

  // Helper date
  const todayStr = () => new Date().toISOString().split("T")[0];

  // ACTION 1: Add Sale (Penjualan)
  const addSale: GoorameContextType["addSale"] = ({
    buyerName,
    pondId,
    weightKg,
    quantityEkor,
    pricePerKg,
    paymentStatus,
    cashAccountId,
    dueDate,
    note,
  }) => {
    const totalAmount = weightKg * pricePerKg;
    const date = todayStr();
    const invoiceNo = `PJ-${date.replace(/-/g, "").slice(0, 6)}-${String(sales.length + 1).padStart(3, "0")}`;

    const pond = ponds.find((p) => p.id === pondId);
    const cashAcc = cashAccounts.find((c) => c.id === cashAccountId);

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNo,
      date,
      buyerName,
      pondId,
      pondName: pond?.name,
      weightKg,
      quantityEkor,
      pricePerKg,
      totalAmount,
      paymentStatus,
      cashAccountId: paymentStatus === "LUNAS" ? cashAccountId : undefined,
      cashAccountName: paymentStatus === "LUNAS" ? cashAcc?.name : undefined,
      dueDate: paymentStatus === "TEMPO" ? dueDate : undefined,
      paidDate: paymentStatus === "LUNAS" ? date : undefined,
      note,
    };

    setSales((prev) => [newSale, ...prev]);

    // Update Cash Balance if Lunas
    if (paymentStatus === "LUNAS" && cashAccountId) {
      setCashAccounts((prev) =>
        prev.map((acc) =>
          acc.id === cashAccountId ? { ...acc, balance: acc.balance + totalAmount } : acc
        )
      );
    }

    // Auto Journal Entry (Double-entry)
    const journalId = `JU-${date.replace(/-/g, "").slice(0, 6)}-${String(journalEntries.length + 1).padStart(3, "0")}`;
    const debitAccountCode = paymentStatus === "LUNAS" ? (cashAcc?.code || "1110") : "1140";
    const debitAccountName = paymentStatus === "LUNAS" ? (cashAcc?.name || "Kas di Bank (BCA)") : "Piutang Usaha";

    const newJournal: JournalEntry = {
      id: `j-${Date.now()}`,
      entryNumber: journalId,
      date,
      description: `Penjualan ${weightKg} kg Gurame ke ${buyerName} (${paymentStatus === "LUNAS" ? "Lunas" : "Tempo"})`,
      refType: "PENJUALAN",
      refId: newSale.id,
      items: [
        {
          accountCode: debitAccountCode,
          accountName: debitAccountName,
          debit: totalAmount,
          credit: 0,
        },
        {
          accountCode: "4110",
          accountName: "Penjualan Ikan Gurame Konsumsi",
          debit: 0,
          credit: totalAmount,
        },
      ],
    };

    setJournalEntries((prev) => [...prev, newJournal]);

    // Stock deduction & mutation if pond specified
    if (pondId && pond) {
      const mutation: StockMutation = {
        id: `mut-${Date.now()}`,
        date,
        pondId,
        pondName: pond.name,
        type: "PANEN",
        ekor: quantityEkor,
        weightKg,
        note: `Panen penjualan ke ${buyerName} (Inv: ${invoiceNo})`,
        referenceId: newSale.id,
      };

      setStockMutations((prev) => [mutation, ...prev]);

      setPonds((prev) =>
        prev.map((p) => {
          if (p.id !== pondId) return p;
          const nextEkor = Math.max(0, p.currentEkor - quantityEkor);
          const nextKg = Math.max(0, p.currentKgEstimasi - weightKg);
          const nextPanen = p.totalPanen + quantityEkor;
          return {
            ...p,
            currentEkor: nextEkor,
            currentKgEstimasi: nextKg,
            totalPanen: nextPanen,
          };
        })
      );
    }

    // Sync to SQLite database via FastAPI
    api.createSale({
      buyerName,
      pondId,
      quantityEkor,
      weightKg,
      pricePerKg,
      paymentStatus,
      dueDate,
      cashAccountId,
      note,
    }).then(() => loadDataFromDatabase()).catch((err) => console.warn("Backend sync error:", err));

    setNotification(`Penjualan ${invoiceNo} berhasil dicatat & tersimpan di database.`);
    return true;
  };

  // ACTION 2: Add Expense (Pengeluaran Operasional)
  const addExpense: GoorameContextType["addExpense"] = ({
    category,
    nominal,
    cashAccountId,
    note,
  }) => {
    const date = todayStr();
    const expenseNo = `BBN-${date.replace(/-/g, "").slice(0, 6)}-${String(expenses.length + 1).padStart(2, "0")}`;
    const cashAcc = cashAccounts.find((c) => c.id === cashAccountId);

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      expenseNo,
      date,
      category,
      nominal,
      cashAccountId,
      cashAccountName: cashAcc?.name || "Kas di Tangan",
      note,
    };

    setExpenses((prev) => [newExpense, ...prev]);

    // Deduct Cash Account
    setCashAccounts((prev) =>
      prev.map((acc) =>
        acc.id === cashAccountId ? { ...acc, balance: acc.balance - nominal } : acc
      )
    );

    // Sync to SQLite database via FastAPI
    api.createExpense({
      category,
      nominal,
      cashAccountId,
      note,
    }).then(() => loadDataFromDatabase()).catch((err) => console.warn("Backend sync error:", err));

    // Map Category to COA
    let expenseCode = "6120";
    let expenseName = "Beban Listrik, Aerator & Pompa Air";
    if (category === "PAKAN") {
      expenseCode = "1160";
      expenseName = "Persediaan Pakan Ikan";
    } else if (category === "GAJI") {
      expenseCode = "6110";
      expenseName = "Beban Gaji & Upah Tenaga Kerja";
    } else if (category === "OBAT") {
      expenseCode = "1170";
      expenseName = "Persediaan Obat, Vitamin & Garam";
    }

    // Auto Journal Entry
    const journalId = `JU-${date.replace(/-/g, "").slice(0, 6)}-${String(journalEntries.length + 1).padStart(3, "0")}`;
    const newJournal: JournalEntry = {
      id: `j-${Date.now()}`,
      entryNumber: journalId,
      date,
      description: `Pengeluaran ${category}: ${note}`,
      refType: "PENGELUARAN",
      refId: newExpense.id,
      items: [
        {
          accountCode: expenseCode,
          accountName: expenseName,
          debit: nominal,
          credit: 0,
        },
        {
          accountCode: cashAcc?.code || "1110",
          accountName: cashAcc?.name || "Kas di Bank (BCA)",
          debit: 0,
          credit: nominal,
        },
      ],
    };

    setJournalEntries((prev) => [...prev, newJournal]);
    setNotification(`Pengeluaran ${expenseNo} (${category}) Rp ${nominal.toLocaleString("id-ID")} berhasil dicatat.`);
    return true;
  };

  // ACTION 3: Tebar Bibit
  const addTebarBibit: GoorameContextType["addTebarBibit"] = ({
    pondId,
    ekor,
    weightKg,
    note,
  }) => {
    const date = todayStr();
    const pond = ponds.find((p) => p.id === pondId);
    if (!pond) return false;

    const mutation: StockMutation = {
      id: `mut-${Date.now()}`,
      date,
      pondId,
      pondName: pond.name,
      type: "TEBAR",
      ekor,
      weightKg,
      note,
    };

    setStockMutations((prev) => [mutation, ...prev]);

    setPonds((prev) =>
      prev.map((p) => {
        if (p.id !== pondId) return p;
        const nextTotalTebar = p.totalTebar + ekor;
        const nextEkor = p.currentEkor + ekor;
        const nextKg = p.currentKgEstimasi + weightKg;
        const sr = nextTotalTebar > 0 ? ((nextTotalTebar - p.totalMati) / nextTotalTebar) * 100 : 100;
        return {
          ...p,
          totalTebar: nextTotalTebar,
          currentEkor: nextEkor,
          currentKgEstimasi: nextKg,
          survivalRate: Number(sr.toFixed(1)),
        };
      })
    );

    // Sync to SQLite database via FastAPI
    api.tebarBibit({ pondId, ekor, weightKg, note })
      .then(() => loadDataFromDatabase())
      .catch((err) => console.warn("Backend sync error:", err));

    setNotification(`Tebar ${ekor.toLocaleString("id-ID")} ekor bibit di ${pond.name} berhasil dicatat.`);
    return true;
  };

  // ACTION 4: Catat Kematian / Mortalitas
  const addMortalitas: GoorameContextType["addMortalitas"] = ({
    pondId,
    ekor,
    weightKg,
    note,
  }) => {
    const date = todayStr();
    const pond = ponds.find((p) => p.id === pondId);
    if (!pond) return false;

    const mutation: StockMutation = {
      id: `mut-${Date.now()}`,
      date,
      pondId,
      pondName: pond.name,
      type: "KEMATIAN",
      ekor,
      weightKg,
      note,
    };

    setStockMutations((prev) => [mutation, ...prev]);

    setPonds((prev) =>
      prev.map((p) => {
        if (p.id !== pondId) return p;
        const nextMati = p.totalMati + ekor;
        const nextEkor = Math.max(0, p.currentEkor - ekor);
        const nextKg = Math.max(0, p.currentKgEstimasi - weightKg);
        const sr = p.totalTebar > 0 ? ((p.totalTebar - nextMati) / p.totalTebar) * 100 : 0;
        return {
          ...p,
          totalMati: nextMati,
          currentEkor: nextEkor,
          currentKgEstimasi: nextKg,
          survivalRate: Number(Math.max(0, sr).toFixed(1)),
        };
      })
    );

    // Sync to SQLite database via FastAPI
    api.catatMortalitas({ pondId, ekor, weightKg, note })
      .then(() => loadDataFromDatabase())
      .catch((err) => console.warn("Backend sync error:", err));

    setNotification(`Kematian ${ekor} ekor di ${pond.name} tercatat. Survival Rate terupdate.`);
    return true;
  };

  // ACTION 5: Add Supplier Invoice (Utang Tempo)
  const addSupplierInvoice: GoorameContextType["addSupplierInvoice"] = ({
    supplierName,
    itemCategory,
    totalAmount,
    dueDate,
    note,
  }) => {
    const date = todayStr();
    const invoiceNumber = `INV-${supplierName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const newInvoice: SupplierInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      date,
      supplierName,
      itemCategory,
      totalAmount,
      paidAmount: 0,
      dueDate,
      status: "BELUM_LUNAS",
      note,
    };

    setSupplierInvoices((prev) => [newInvoice, ...prev]);

    // Map Category to Debit Account
    let debitAccountCode = "6190";
    let debitAccountName = "Beban Operasional Lain-lain";
    if (itemCategory === "Pakan") {
      debitAccountCode = "1160";
      debitAccountName = "Persediaan Pakan Ikan";
    } else if (itemCategory === "Bibit") {
      debitAccountCode = "1150";
      debitAccountName = "Persediaan Benih Gurame";
    } else if (itemCategory === "Obat / Suplemen") {
      debitAccountCode = "1170";
      debitAccountName = "Persediaan Obat, Vitamin & Garam";
    }

    // Auto Journal Entry
    const journalId = `JU-${date.replace(/-/g, "").slice(0, 6)}-${String(journalEntries.length + 1).padStart(3, "0")}`;
    const newJournal: JournalEntry = {
      id: `j-${Date.now()}`,
      entryNumber: journalId,
      date,
      description: `Faktur Pembelian ${itemCategory} Tempo dari ${supplierName}`,
      refType: "FAKTUR_UTANG",
      refId: newInvoice.id,
      items: [
        {
          accountCode: debitAccountCode,
          accountName: debitAccountName,
          debit: totalAmount,
          credit: 0,
        },
        {
          accountCode: "2110",
          accountName: "Utang Usaha Pemasok",
          debit: 0,
          credit: totalAmount,
        },
      ],
    };

    // Sync to SQLite database via FastAPI
    api.createSupplierInvoice({ supplierName, itemCategory, totalAmount, dueDate, note })
      .then(() => loadDataFromDatabase())
      .catch((err) => console.warn("Backend sync error:", err));

    setJournalEntries((prev) => [...prev, newJournal]);
    setNotification(`Faktur utang pemasok ${invoiceNumber} Rp ${totalAmount.toLocaleString("id-ID")} berhasil dicatat.`);
    return true;
  };

  // ACTION 6: Add Supplier Payment (Cicil / Lunasi Utang)
  const addSupplierPayment: GoorameContextType["addSupplierPayment"] = ({
    invoiceId,
    amount,
    cashAccountId,
    note,
  }) => {
    const invoice = supplierInvoices.find((i) => i.id === invoiceId);
    const cashAcc = cashAccounts.find((c) => c.id === cashAccountId);
    if (!invoice || !cashAcc) return false;

    const date = todayStr();
    const newPayment: SupplierPayment = {
      id: `pay-${Date.now()}`,
      invoiceId,
      supplierName: invoice.supplierName,
      date,
      amount,
      cashAccountId,
      cashAccountName: cashAcc.name,
      note,
    };

    setSupplierPayments((prev) => [newPayment, ...prev]);

    // Update Invoice status
    setSupplierInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        const newPaid = inv.paidAmount + amount;
        const newStatus = newPaid >= inv.totalAmount ? "LUNAS" : "SEBAGIAN";
        return {
          ...inv,
          paidAmount: newPaid,
          status: newStatus,
        };
      })
    );

    // Deduct Cash Account
    setCashAccounts((prev) =>
      prev.map((acc) =>
        acc.id === cashAccountId ? { ...acc, balance: acc.balance - amount } : acc
      )
    );

    // Auto Journal Entry
    const journalId = `JU-${date.replace(/-/g, "").slice(0, 6)}-${String(journalEntries.length + 1).padStart(3, "0")}`;
    const newJournal: JournalEntry = {
      id: `j-${Date.now()}`,
      entryNumber: journalId,
      date,
      description: `Pembayaran Utang ke ${invoice.supplierName} (Faktur ${invoice.invoiceNumber})`,
      refType: "BAYAR_UTANG",
      refId: newPayment.id,
      items: [
        {
          accountCode: "2110",
          accountName: "Utang Usaha Pemasok",
          debit: amount,
          credit: 0,
        },
        {
          accountCode: cashAcc.code,
          accountName: cashAcc.name,
          debit: 0,
          credit: amount,
        },
      ],
    };

    // Sync to SQLite database via FastAPI
    api.paySupplierInvoice({ invoiceId, amount, cashAccountId, note })
      .then(() => loadDataFromDatabase())
      .catch((err) => console.warn("Backend sync error:", err));

    setJournalEntries((prev) => [...prev, newJournal]);
    setNotification(`Pembayaran utang Rp ${amount.toLocaleString("id-ID")} ke ${invoice.supplierName} berhasil dicatat.`);
    return true;
  };

  // ACTION 7: Cash Transfer (Mutasi Antar Kas / Bank)
  const addCashTransfer: GoorameContextType["addCashTransfer"] = ({
    fromAccountId,
    toAccountId,
    amount,
    note,
  }) => {
    if (fromAccountId === toAccountId) return false;
    const fromAcc = cashAccounts.find((c) => c.id === fromAccountId);
    const toAcc = cashAccounts.find((c) => c.id === toAccountId);
    if (!fromAcc || !toAcc) return false;

    const date = todayStr();
    const newTransfer: CashTransfer = {
      id: `trf-${Date.now()}`,
      date,
      fromAccountId,
      toAccountId,
      fromAccountName: fromAcc.name,
      toAccountName: toAcc.name,
      amount,
      note,
    };

    setTransfers((prev) => [newTransfer, ...prev]);

    // Update balances
    setCashAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amount };
        if (acc.id === toAccountId) return { ...acc, balance: acc.balance + amount };
        return acc;
      })
    );

    // Auto Journal Entry
    const journalId = `JU-${date.replace(/-/g, "").slice(0, 6)}-${String(journalEntries.length + 1).padStart(3, "0")}`;
    const newJournal: JournalEntry = {
      id: `j-${Date.now()}`,
      entryNumber: journalId,
      date,
      description: `Mutasi Kas: Transfer dari ${fromAcc.name} ke ${toAcc.name} (${note})`,
      refType: "MUTASI_KAS",
      refId: newTransfer.id,
      items: [
        {
          accountCode: toAcc.code,
          accountName: toAcc.name,
          debit: amount,
          credit: 0,
        },
        {
          accountCode: fromAcc.code,
          accountName: fromAcc.name,
          debit: 0,
          credit: amount,
        },
      ],
    };

    // Sync to SQLite database via FastAPI
    api.transferCash({ fromAccountId, toAccountId, amount, note })
      .then(() => loadDataFromDatabase())
      .catch((err) => console.warn("Backend sync error:", err));

    setJournalEntries((prev) => [...prev, newJournal]);
    setNotification(`Transfer Rp ${amount.toLocaleString("id-ID")} dari ${fromAcc.name} ke ${toAcc.name} berhasil.`);
    return true;
  };

  // ACTION 8: Manual Journal Entry (Strict Double-Entry Balance Check)
  const addManualJournal: GoorameContextType["addManualJournal"] = ({
    date,
    description,
    items,
  }) => {
    const validation = validateJournalItems(items);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Jurnal tidak seimbang! Total Debit: Rp ${validation.totalDebit.toLocaleString("id-ID")}, Total Kredit: Rp ${validation.totalCredit.toLocaleString("id-ID")}. Selisih: Rp ${validation.difference.toLocaleString("id-ID")}. Transaksi ditolak sesuai aturan akuntansi.`,
      };
    }

    const entryNumber = `JU-${date.replace(/-/g, "").slice(0, 6)}-MANUAL-${String(journalEntries.length + 1).padStart(2, "0")}`;
    const newJournal: JournalEntry = {
      id: `j-${Date.now()}`,
      entryNumber,
      date,
      description,
      refType: "MANUAL",
      items,
    };

    // Sync to SQLite database via FastAPI
    api.createManualJournal({ date, description, items })
      .then(() => loadDataFromDatabase())
      .catch((err) => console.warn("Backend sync error:", err));

    setJournalEntries((prev) => [...prev, newJournal]);
    setNotification(`Jurnal manual ${entryNumber} berhasil disimpan dengan total seimbang Rp ${validation.totalDebit.toLocaleString("id-ID")}.`);
    return { success: true };
  };

  // ACTION 9: Pay Customer Receivable (Pelunasan Piutang)
  const payCustomerReceivable: GoorameContextType["payCustomerReceivable"] = (
    saleId,
    cashAccountId
  ) => {
    const sale = sales.find((s) => s.id === saleId);
    const cashAcc = cashAccounts.find((c) => c.id === cashAccountId);
    if (!sale || !cashAcc) return false;

    const date = todayStr();

    setSales((prev) =>
      prev.map((s) =>
        s.id === saleId
          ? {
              ...s,
              paymentStatus: "LUNAS",
              cashAccountId,
              cashAccountName: cashAcc.name,
              paidDate: date,
            }
          : s
      )
    );

    // Increase Cash Account Balance
    setCashAccounts((prev) =>
      prev.map((c) =>
        c.id === cashAccountId ? { ...c, balance: c.balance + sale.totalAmount } : c
      )
    );

    // Auto Journal Entry: Debit Kas, Credit Piutang Usaha
    const journalId = `JU-${date.replace(/-/g, "").slice(0, 6)}-${String(journalEntries.length + 1).padStart(3, "0")}`;
    const newJournal: JournalEntry = {
      id: `j-${Date.now()}`,
      entryNumber: journalId,
      date,
      description: `Pelunasan Piutang Penjualan ${sale.invoiceNo} dari ${sale.buyerName}`,
      refType: "PENJUALAN",
      refId: sale.id,
      items: [
        {
          accountCode: cashAcc.code,
          accountName: cashAcc.name,
          debit: sale.totalAmount,
          credit: 0,
        },
        {
          accountCode: "1140",
          accountName: "Piutang Usaha",
          debit: 0,
          credit: sale.totalAmount,
        },
      ],
    };

    // Sync to SQLite database via FastAPI
    api.payReceivable(saleId, cashAccountId)
      .then(() => loadDataFromDatabase())
      .catch((err) => console.warn("Backend sync error:", err));

    setJournalEntries((prev) => [...prev, newJournal]);
    setNotification(`Pelunasan piutang ${sale.invoiceNo} Rp ${sale.totalAmount.toLocaleString("id-ID")} berhasil.`);
    return true;
  };

  // ACTION 10: Add Pond (Entitas Kolam Baru)
  const addPond: GoorameContextType["addPond"] = ({
    name,
    type,
    dimension,
    capacityEkor,
    initialStock,
    initialKg,
  }) => {
    const newPond: Pond = {
      id: `pond-${Date.now()}`,
      name,
      type,
      dimension,
      capacityEkor,
      initialStock,
      currentEkor: initialStock,
      currentKgEstimasi: initialKg,
      totalTebar: initialStock,
      totalMati: 0,
      totalPanen: 0,
      survivalRate: 100,
      status: "AKTIF",
    };
    setPonds((prev) => [...prev, newPond]);

    // Sync to SQLite database via FastAPI
    api.createPond({ name, type, dimension, capacityEkor, initialStock, initialKg })
      .then(() => loadDataFromDatabase())
      .catch((err) => console.warn("Backend sync error:", err));

    setNotification(`Kolam baru ${name} berhasil ditambahkan.`);
    return true;
  };

  // ACTION 11: Add Cash Account (Dompet Kas/Bank Baru)
  const addCashAccount: GoorameContextType["addCashAccount"] = ({
    name,
    type,
    accountNumber,
    initialBalance,
  }) => {
    const nextCode = String(1001 + cashAccounts.length);
    const newAccount: CashAccount = {
      id: `cash-${Date.now()}`,
      code: nextCode,
      name,
      type,
      accountNumber,
      balance: initialBalance,
    };
    setCashAccounts((prev) => [...prev, newAccount]);

    // Sync to SQLite database via FastAPI
    api.createCashAccount({ name, type, accountNumber, initialBalance })
      .then(() => loadDataFromDatabase())
      .catch((err) => console.warn("Backend sync error:", err));

    setNotification(`Dompet ${name} berhasil ditambahkan.`);
    return true;
  };

  // ACTION 12: Add Chart of Account (COA Baru)
  const addChartOfAccount: GoorameContextType["addChartOfAccount"] = async ({
    code,
    name,
    category,
    normalBalance,
    description,
  }) => {
    try {
      const created = await api.createChartOfAccount({
        code,
        name,
        category,
        normalBalance,
        description,
      });
      setChartOfAccounts((prev) => [...prev, created].sort((a, b) => a.code.localeCompare(b.code)));
      setNotification(`Akun ${code} - ${name} berhasil ditambahkan ke COA.`);
      return { success: true };
    } catch (e: any) {
      // Local optimistic fallback
      const exists = chartOfAccounts.some((c) => c.code === code);
      if (exists) {
        return { success: false, error: `Kode akun ${code} sudah ada.` };
      }
      const newCoa: ChartOfAccount = { code, name, category, normalBalance, description };
      setChartOfAccounts((prev) => [...prev, newCoa].sort((a, b) => a.code.localeCompare(b.code)));
      setNotification(`Akun ${code} ditambahkan (lokal).`);
      return { success: true };
    }
  };

  return (
    <GoorameContext.Provider
      value={{
        currentUser,
        login,
        logout,
        role,
        setRole,
        activeTab,
        setActiveTab,
        notification,
        setNotification,
        isDatabaseConnected,
        refreshDatabase: loadDataFromDatabase,

        chartOfAccounts,
        cashAccounts,
        ponds,
        stockMutations,
        sales,
        expenses,
        supplierInvoices,
        supplierPayments,
        transfers,
        journalEntries,

        totalCashBalance,
        totalActiveFishCount,
        totalActiveFishWeight,
        totalPayableDue,
        totalReceivableDue,
        ledger,
        incomeStatement,
        balanceSheet,
        cashFlowStatement,

        addSale,
        addExpense,
        addTebarBibit,
        addMortalitas,
        addSupplierInvoice,
        addSupplierPayment,
        addCashTransfer,
        addManualJournal,
        payCustomerReceivable,
        addPond,
        addCashAccount,
        addChartOfAccount,
      }}
    >
      {children}
    </GoorameContext.Provider>
  );
}

export function useGoorame() {
  const context = useContext(GoorameContext);
  if (!context) {
    throw new Error("useGoorame must be used within a GoorameProvider");
  }
  return context;
}

