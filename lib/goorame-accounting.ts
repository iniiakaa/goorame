import {
  ChartOfAccount,
  JournalEntry,
  LedgerAccount,
  LedgerEntry,
  JournalItem,
} from "./goorame-types";

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat("id-ID").format(val);
}

export function validateJournalItems(items: JournalItem[]): {
  isValid: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
} {
  const totalDebit = items.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
  const totalCredit = items.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  return {
    isValid: difference < 0.01 && items.length >= 2 && totalDebit > 0,
    totalDebit,
    totalCredit,
    difference,
  };
}

export function generateLedger(
  chartOfAccounts: ChartOfAccount[],
  journalEntries: JournalEntry[]
): LedgerAccount[] {
  // Sort journal entries chronologically
  const sortedEntries = [...journalEntries].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return chartOfAccounts.map((coa) => {
    let currentBalance = 0;
    const ledgerEntries: LedgerEntry[] = [];

    for (const journal of sortedEntries) {
      const matchedItems = journal.items.filter(
        (item) => item.accountCode === coa.code
      );

      for (const item of matchedItems) {
        const debit = Number(item.debit) || 0;
        const credit = Number(item.credit) || 0;

        if (coa.normalBalance === "DEBIT") {
          currentBalance += debit - credit;
        } else {
          currentBalance += credit - debit;
        }

        ledgerEntries.push({
          date: journal.date,
          description: journal.description,
          refNo: journal.entryNumber,
          debit,
          credit,
          balance: currentBalance,
        });
      }
    }

    return {
      code: coa.code,
      name: coa.name,
      category: coa.category,
      normalBalance: coa.normalBalance,
      openingBalance: 0,
      entries: ledgerEntries,
      closingBalance: currentBalance,
    };
  });
}

export interface IncomeStatement {
  revenues: Array<{ code: string; name: string; amount: number }>;
  totalRevenue: number;
  expenses: Array<{ code: string; name: string; amount: number }>;
  totalExpense: number;
  netProfit: number;
}

export function calculateIncomeStatement(ledger: LedgerAccount[]): IncomeStatement {
  const revenues = ledger
    .filter((acc) => acc.category === "PENDAPATAN")
    .map((acc) => ({
      code: acc.code,
      name: acc.name,
      amount: acc.closingBalance,
    }));

  const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0);

  const expenses = ledger
    .filter((acc) => acc.category === "BEBAN")
    .map((acc) => ({
      code: acc.code,
      name: acc.name,
      amount: acc.closingBalance,
    }));

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = totalRevenue - totalExpense;

  return {
    revenues,
    totalRevenue,
    expenses,
    totalExpense,
    netProfit,
  };
}

export interface BalanceSheet {
  assets: Array<{ code: string; name: string; amount: number }>;
  totalAssets: number;
  liabilities: Array<{ code: string; name: string; amount: number }>;
  totalLiabilities: number;
  equity: Array<{ code: string; name: string; amount: number }>;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  netProfitCurrentPeriod: number;
}

export function calculateBalanceSheet(
  ledger: LedgerAccount[],
  netProfitCurrentPeriod: number
): BalanceSheet {
  const assets = ledger
    .filter((acc) => acc.category === "ASET")
    .map((acc) => ({
      code: acc.code,
      name: acc.name,
      amount: acc.closingBalance,
    }));
  const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);

  const liabilities = ledger
    .filter((acc) => acc.category === "KEWAJIBAN")
    .map((acc) => ({
      code: acc.code,
      name: acc.name,
      amount: acc.closingBalance,
    }));
  const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);

  const rawEquity = ledger
    .filter((acc) => acc.category === "EKUITAS")
    .map((acc) => ({
      code: acc.code,
      name: acc.name,
      amount: acc.closingBalance,
    }));

  // Include current net profit into equity
  const equityWithNetProfit = [
    ...rawEquity,
    {
      code: "3999",
      name: "Laba Bersih Periode Berjalan",
      amount: netProfitCurrentPeriod,
    },
  ];

  const totalEquity = equityWithNetProfit.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1;

  return {
    assets,
    totalAssets,
    liabilities,
    totalLiabilities,
    equity: equityWithNetProfit,
    totalEquity,
    totalLiabilitiesAndEquity,
    isBalanced,
    netProfitCurrentPeriod,
  };
}

export interface CashFlowStatement {
  operatingInflows: Array<{ label: string; amount: number }>;
  operatingOutflows: Array<{ label: string; amount: number }>;
  netOperatingCash: number;
  investingInflows: Array<{ label: string; amount: number }>;
  investingOutflows: Array<{ label: string; amount: number }>;
  netInvestingCash: number;
  financingInflows: Array<{ label: string; amount: number }>;
  financingOutflows: Array<{ label: string; amount: number }>;
  netFinancingCash: number;
  netCashChange: number;
  beginningCash: number;
  endingCash: number;
}

export function calculateCashFlow(
  ledger: LedgerAccount[],
  totalCashBalance: number
): CashFlowStatement {
  // Cash accounts: 1001, 1002, 1003
  const revenueAcc = ledger.find((a) => a.code === "4001")?.closingBalance || 0;
  const pakanAcc = ledger.find((a) => a.code === "5001")?.closingBalance || 0;
  const gajiAcc = ledger.find((a) => a.code === "5002")?.closingBalance || 0;
  const obatAcc = ledger.find((a) => a.code === "5003")?.closingBalance || 0;
  const opsAcc = ledger.find((a) => a.code === "5004")?.closingBalance || 0;
  const modalAcc = ledger.find((a) => a.code === "3001")?.closingBalance || 0;

  const operatingInflows = [{ label: "Penerimaan dari Penjualan Gurame", amount: revenueAcc }];
  const operatingOutflows = [
    { label: "Pembayaran Pakan Ikan", amount: pakanAcc },
    { label: "Pembayaran Gaji / Upah Pekerja Kolam", amount: gajiAcc },
    { label: "Pembelian Obat & Suplemen Gurame", amount: obatAcc },
    { label: "Biaya Operasional Kolam & Listrik", amount: opsAcc },
  ];

  const totalOpIn = operatingInflows.reduce((s, i) => s + i.amount, 0);
  const totalOpOut = operatingOutflows.reduce((s, i) => s + i.amount, 0);
  const netOperatingCash = totalOpIn - totalOpOut;

  const investingInflows: Array<{ label: string; amount: number }> = [];
  const investingOutflows: Array<{ label: string; amount: number }> = [];
  const netInvestingCash = 0;

  const financingInflows = [{ label: "Penyertaan Modal Awal Pemilik", amount: modalAcc }];
  const financingOutflows: Array<{ label: string; amount: number }> = [];
  const netFinancingCash = modalAcc;

  const netCashChange = netOperatingCash + netInvestingCash;
  const beginningCash = modalAcc;
  const endingCash = totalCashBalance;

  return {
    operatingInflows,
    operatingOutflows,
    netOperatingCash,
    investingInflows,
    investingOutflows,
    netInvestingCash,
    financingInflows,
    financingOutflows,
    netFinancingCash,
    netCashChange,
    beginningCash,
    endingCash,
  };
}

export function exportToCSV(filename: string, rows: string[][]) {
  const csvContent =
    "data:text/csv;charset=utf-8," +
    rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

