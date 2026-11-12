"use client";

import React, { useState } from "react";
import { useGoorame } from "@/lib/goorame-context";
import { formatRupiah, exportToCSV } from "@/lib/goorame-accounting";
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Scale,
  Activity,
  Calendar,
} from "lucide-react";

export function LaporanView() {
  const { incomeStatement, balanceSheet, cashFlowStatement } = useGoorame();
  const [reportType, setReportType] = useState<"LABA_RUGI" | "NERACA" | "ARUS_KAS">("LABA_RUGI");
  const [period, setPeriod] = useState<string>("Bulan Ini (November 2026)");

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (reportType === "LABA_RUGI") {
      const rows = [
        ["LAPORAN LABA RUGI - GOORAME"],
        ["Periode:", period],
        [""],
        ["PENDAPATAN USAHA"],
        ...incomeStatement.revenues.map((r) => [r.code, r.name, String(r.amount)]),
        ["Total Pendapatan", "", String(incomeStatement.totalRevenue)],
        [""],
        ["BEBAN OPERASIONAL"],
        ...incomeStatement.expenses.map((e) => [e.code, e.name, String(e.amount)]),
        ["Total Beban Operasional", "", String(incomeStatement.totalExpense)],
        [""],
        ["LABA (RUGI) BERSIH", "", String(incomeStatement.netProfit)],
      ];
      exportToCSV("laporan_laba_rugi.csv", rows);
    } else if (reportType === "NERACA") {
      const rows = [
        ["LAPORAN NERACA (BALANCE SHEET) - GOORAME"],
        ["Per Tanggal:", "30 November 2026"],
        [""],
        ["ASET"],
        ...balanceSheet.assets.map((a) => [a.code, a.name, String(a.amount)]),
        ["Total Aset", "", String(balanceSheet.totalAssets)],
        [""],
        ["KEWAJIBAN (UTANG)"],
        ...balanceSheet.liabilities.map((l) => [l.code, l.name, String(l.amount)]),
        ["Total Kewajiban", "", String(balanceSheet.totalLiabilities)],
        [""],
        ["EKUITAS (MODAL)"],
        ...balanceSheet.equity.map((eq) => [eq.code, eq.name, String(eq.amount)]),
        ["Total Ekuitas", "", String(balanceSheet.totalEquity)],
        [""],
        ["TOTAL KEWAJIBAN + EKUITAS", "", String(balanceSheet.totalLiabilitiesAndEquity)],
        ["STATUS KESEIMBANGAN", balanceSheet.isBalanced ? "SEIMBANG (BALANCE)" : "TIDAK SEIMBANG"],
      ];
      exportToCSV("laporan_neraca.csv", rows);
    } else {
      const rows = [
        ["LAPORAN ARUS KAS (CASH FLOW) - GOORAME"],
        ["Periode:", period],
        [""],
        ["ARUS KAS DARI AKTIVITAS OPERASIONAL"],
        ...cashFlowStatement.operatingInflows.map((i) => [i.label, String(i.amount)]),
        ...cashFlowStatement.operatingOutflows.map((o) => [o.label, `-${o.amount}`]),
        ["Arus Kas Bersih dari Operasional", String(cashFlowStatement.netOperatingCash)],
        [""],
        ["ARUS KAS DARI AKTIVITAS PENDANAAN"],
        ...cashFlowStatement.financingInflows.map((f) => [f.label, String(f.amount)]),
        ["Arus Kas Bersih dari Pendanaan", String(cashFlowStatement.netFinancingCash)],
        [""],
        ["KENAIKAN (PENURUNAN) BERSIH KAS", String(cashFlowStatement.netCashChange)],
        ["SALDO AKHIR KAS & BANK", String(cashFlowStatement.endingCash)],
      ];
      exportToCSV("laporan_arus_kas.csv", rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--gw-ink)] flex items-center gap-2">
            <FileText size={22} className="text-[var(--gw-ink)]" /> Laporan Keuangan (Financial Statements)
          </h2>
          <p className="text-xs text-[var(--gw-muted)] mt-1">
            Laporan akuntansi terstandar: Laba Rugi, Neraca Seimbang, dan Arus Kas dihasilkan secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--gw-surface)] border border-[var(--gw-line)] text-xs text-[var(--gw-ink)]">
            <Calendar size={13} className="text-[var(--gw-muted)]" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent outline-none font-medium text-xs cursor-pointer text-[var(--gw-ink)]"
            >
              <option value="Bulan Ini (November 2026)">Bulan Ini (November 2026)</option>
              <option value="Kuartal IV 2026">Kuartal IV 2026</option>
              <option value="Tahun Berjalan 2026">Tahun Berjalan 2026</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--gw-line)] hover:bg-[var(--gw-hover)] text-[var(--gw-ink)] transition-all"
          >
            <Download size={14} /> Ekspor Excel/CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--gw-button)] text-[var(--gw-button-ink)] hover:brightness-110 shadow-sm transition-all"
          >
            <Printer size={14} /> Cetak / PDF
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="gw-panel p-1 flex gap-2 text-xs font-semibold">
        <button
          onClick={() => setReportType("LABA_RUGI")}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
            reportType === "LABA_RUGI"
              ? "bg-[var(--gw-ink)] text-[var(--gw-button-ink)] shadow-sm"
              : "text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
          }`}
        >
          <TrendingUp size={15} /> 1. Laporan Laba Rugi (Income Statement)
        </button>
        <button
          onClick={() => setReportType("NERACA")}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
            reportType === "NERACA"
              ? "bg-[var(--gw-ink)] text-[var(--gw-button-ink)] shadow-sm"
              : "text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
          }`}
        >
          <Scale size={15} /> 2. Laporan Neraca (Balance Sheet)
        </button>
        <button
          onClick={() => setReportType("ARUS_KAS")}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
            reportType === "ARUS_KAS"
              ? "bg-[var(--gw-ink)] text-[var(--gw-button-ink)] shadow-sm"
              : "text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
          }`}
        >
          <Activity size={15} /> 3. Laporan Arus Kas (Cash Flow)
        </button>
      </div>

      {/* REPORT 1: LABA RUGI */}
      {reportType === "LABA_RUGI" && (
        <div className="gw-panel p-6 max-w-3xl mx-auto space-y-6 text-xs">
          <div className="text-center pb-4 border-b border-[var(--gw-line)]">
            <h3 className="text-lg font-bold text-[var(--gw-ink)]">GOORAME AQUACULTURE</h3>
            <h4 className="text-sm font-semibold text-[var(--gw-muted)]">LAPORAN LABA RUGI</h4>
            <p className="text-[11px] text-[var(--gw-muted)]">Periode: {period}</p>
          </div>

          {/* Pendapatan */}
          <div className="space-y-2">
            <h5 className="font-bold text-[11px] uppercase tracking-wider text-[var(--gw-muted)]">
              PENDAPATAN USAHA (REVENUE)
            </h5>
            <div className="space-y-1.5 pl-2">
              {incomeStatement.revenues.map((r) => (
                <div key={r.code} className="flex justify-between py-1 border-b border-[var(--gw-line)]/50">
                  <span className="text-[var(--gw-ink)]">
                    <strong className="font-mono text-[var(--gw-muted)] mr-2">{r.code}</strong>
                    {r.name}
                  </span>
                  <span className="font-semibold text-[var(--gw-ink)]">
                    {formatRupiah(r.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-1.5 font-bold border-b border-[var(--gw-line)] text-[var(--gw-ink)]">
                <span>TOTAL PENDAPATAN</span>
                <span>{formatRupiah(incomeStatement.totalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Beban */}
          <div className="space-y-2">
            <h5 className="font-bold text-[11px] uppercase tracking-wider text-[var(--gw-muted)]">
              BEBAN OPERASIONAL (EXPENSES)
            </h5>
            <div className="space-y-1.5 pl-2">
              {incomeStatement.expenses.map((e) => (
                <div key={e.code} className="flex justify-between py-1 border-b border-[var(--gw-line)]/50">
                  <span className="text-[var(--gw-ink)]">
                    <strong className="font-mono text-[var(--gw-muted)] mr-2">{e.code}</strong>
                    {e.name}
                  </span>
                  <span className="font-semibold text-[var(--gw-ink)]">
                    {formatRupiah(e.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-1.5 font-bold border-b border-[var(--gw-line)] text-[var(--gw-ink)]">
                <span>TOTAL BEBAN OPERASIONAL</span>
                <span>({formatRupiah(incomeStatement.totalExpense)})</span>
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className="gw-subcard p-4 flex justify-between items-center text-sm font-bold">
            <span className="text-[var(--gw-ink)]">LABA BERSIH PERIODE BERJALAN:</span>
            <span className="text-lg text-[var(--gw-ink)]">
              {formatRupiah(incomeStatement.netProfit)}
            </span>
          </div>
        </div>
      )}

      {/* REPORT 2: NERACA (BALANCE SHEET) */}
      {reportType === "NERACA" && (
        <div className="gw-panel p-6 max-w-4xl mx-auto space-y-6 text-xs">
          <div className="text-center pb-4 border-b border-[var(--gw-line)]">
            <h3 className="text-lg font-bold text-[var(--gw-ink)]">GOORAME AQUACULTURE</h3>
            <h4 className="text-sm font-semibold text-[var(--gw-muted)]">LAPORAN NERACA (BALANCE SHEET)</h4>
            <p className="text-[11px] text-[var(--gw-muted)]">Per 30 November 2026</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sisi Kiri: ASET */}
            <div className="space-y-4">
              <h5 className="font-bold text-xs uppercase tracking-wider text-[var(--gw-muted)] pb-1 border-b border-[var(--gw-line)]">
                ASET (AKTIVA)
              </h5>
              <div className="space-y-2">
                {balanceSheet.assets.map((a) => (
                  <div key={a.code} className="flex justify-between py-1 border-b border-[var(--gw-line)]/50 text-[var(--gw-ink)]">
                    <span>
                      <strong className="font-mono text-[var(--gw-muted)] mr-1">{a.code}</strong> {a.name}
                    </span>
                    <span className="font-semibold">{formatRupiah(a.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-bold text-sm border-t border-[var(--gw-line)] text-[var(--gw-ink)]">
                  <span>TOTAL ASET</span>
                  <span>{formatRupiah(balanceSheet.totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* Sisi Kanan: KEWAJIBAN & EKUITAS */}
            <div className="space-y-4">
              {/* Kewajiban */}
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-[var(--gw-muted)] pb-1 border-b border-[var(--gw-line)]">
                  KEWAJIBAN (UTANG)
                </h5>
                <div className="space-y-2 pt-2">
                  {balanceSheet.liabilities.map((l) => (
                    <div key={l.code} className="flex justify-between py-1 border-b border-[var(--gw-line)]/50 text-[var(--gw-ink)]">
                      <span>
                        <strong className="font-mono text-[var(--gw-muted)] mr-1">{l.code}</strong> {l.name}
                      </span>
                      <span className="font-semibold">
                        {formatRupiah(l.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 font-bold text-[var(--gw-ink)]">
                    <span>Total Kewajiban</span>
                    <span>{formatRupiah(balanceSheet.totalLiabilities)}</span>
                  </div>
                </div>
              </div>

              {/* Ekuitas */}
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-[var(--gw-muted)] pb-1 border-b border-[var(--gw-line)]">
                  EKUITAS (MODAL)
                </h5>
                <div className="space-y-2 pt-2">
                  {balanceSheet.equity.map((eq) => (
                    <div key={eq.code} className="flex justify-between py-1 border-b border-[var(--gw-line)]/50 text-[var(--gw-ink)]">
                      <span>
                        <strong className="font-mono text-[var(--gw-muted)] mr-1">{eq.code}</strong> {eq.name}
                      </span>
                      <span className="font-semibold">{formatRupiah(eq.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 font-bold text-[var(--gw-ink)]">
                    <span>Total Ekuitas</span>
                    <span>{formatRupiah(balanceSheet.totalEquity)}</span>
                  </div>
                </div>
              </div>

              {/* Total Liabilities + Equity */}
              <div className="flex justify-between py-2 font-bold text-sm border-t border-[var(--gw-line)] text-[var(--gw-ink)]">
                <span>TOTAL KEWAJIBAN & EKUITAS</span>
                <span>{formatRupiah(balanceSheet.totalLiabilitiesAndEquity)}</span>
              </div>
            </div>
          </div>

          {/* Balance Verification Box */}
          <div className="gw-subcard p-3.5 flex items-center justify-between text-xs font-semibold text-[var(--gw-ink)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[var(--gw-muted)]" />
              <span>
                {balanceSheet.isBalanced
                  ? "Status Neraca: SEIMBANG / BALANCE (Aset == Kewajiban + Ekuitas)"
                  : "Status Neraca: TIDAK SEIMBANG"}
              </span>
            </div>
            <span className="text-[var(--gw-muted)]">
              Selisih: {formatRupiah(Math.abs(balanceSheet.totalAssets - balanceSheet.totalLiabilitiesAndEquity))}
            </span>
          </div>
        </div>
      )}

      {/* REPORT 3: ARUS KAS (CASH FLOW) */}
      {reportType === "ARUS_KAS" && (
        <div className="gw-panel p-6 max-w-3xl mx-auto space-y-6 text-xs">
          <div className="text-center pb-4 border-b border-[var(--gw-line)]">
            <h3 className="text-lg font-bold text-[var(--gw-ink)]">GOORAME AQUACULTURE</h3>
            <h4 className="text-sm font-semibold text-[var(--gw-muted)]">LAPORAN ARUS KAS (CASH FLOW STATEMENT)</h4>
            <p className="text-[11px] text-[var(--gw-muted)]">Periode: {period}</p>
          </div>

          {/* Operasional */}
          <div className="space-y-2">
            <h5 className="font-bold text-[11px] uppercase tracking-wider text-[var(--gw-muted)]">
              1. ARUS KAS DARI AKTIVITAS OPERASIONAL
            </h5>
            <div className="space-y-1.5 pl-2 text-[var(--gw-ink)]">
              {cashFlowStatement.operatingInflows.map((i, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-[var(--gw-line)]/50">
                  <span>{i.label}</span>
                  <span className="font-semibold">
                    +{formatRupiah(i.amount)}
                  </span>
                </div>
              ))}
              {cashFlowStatement.operatingOutflows.map((o, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-[var(--gw-line)]/50">
                  <span>{o.label}</span>
                  <span className="font-semibold">
                    −{formatRupiah(o.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-1.5 font-bold border-b border-[var(--gw-line)]">
                <span>Arus Kas Bersih dari Aktivitas Operasional</span>
                <span>{formatRupiah(cashFlowStatement.netOperatingCash)}</span>
              </div>
            </div>
          </div>

          {/* Investasi */}
          <div className="space-y-2">
            <h5 className="font-bold text-[11px] uppercase tracking-wider text-[var(--gw-muted)]">
              2. ARUS KAS DARI AKTIVITAS INVESTASI
            </h5>
            <div className="space-y-1.5 pl-2 text-[var(--gw-ink)]">
              <div className="flex justify-between py-1 text-[var(--gw-muted)]">
                <span>Pembelian Peralatan Kolam / Pompa Tambak</span>
                <span>Rp 0</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold border-b border-[var(--gw-line)]">
                <span>Arus Kas Bersih dari Aktivitas Investasi</span>
                <span>Rp 0</span>
              </div>
            </div>
          </div>

          {/* Pendanaan */}
          <div className="space-y-2">
            <h5 className="font-bold text-[11px] uppercase tracking-wider text-[var(--gw-muted)]">
              3. ARUS KAS DARI AKTIVITAS PENDANAAN
            </h5>
            <div className="space-y-1.5 pl-2 text-[var(--gw-ink)]">
              {cashFlowStatement.financingInflows.map((f, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-[var(--gw-line)]/50">
                  <span>{f.label}</span>
                  <span className="font-semibold">
                    +{formatRupiah(f.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-1.5 font-bold border-b border-[var(--gw-line)]">
                <span>Arus Kas Bersih dari Aktivitas Pendanaan</span>
                <span>{formatRupiah(cashFlowStatement.netFinancingCash)}</span>
              </div>
            </div>
          </div>

          {/* Net Change and Ending Cash */}
          <div className="pt-3 border-t border-[var(--gw-line)] space-y-2 text-[var(--gw-ink)]">
            <div className="flex justify-between font-bold text-xs">
              <span>KENAIKAN (PENURUNAN) BERSIH KAS & BANK:</span>
              <span>+{formatRupiah(cashFlowStatement.netCashChange)}</span>
            </div>
            <div className="gw-subcard p-3.5 flex justify-between items-center text-sm font-bold">
              <span>SALDO AKHIR KAS & BANK PERIODE INI:</span>
              <span>{formatRupiah(cashFlowStatement.endingCash)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
