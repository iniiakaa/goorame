"use client";

import React, { useState } from "react";
import { useGoorame } from "@/lib/goorame-context";
import { formatRupiah, exportToCSV } from "@/lib/goorame-accounting";
import {
  ArrowUpRight,
  PlusCircle,
  Download,
  Search,
  Filter,
} from "lucide-react";
import { ModalPengeluaran } from "./modals";

export function PengeluaranView() {
  const { expenses } = useGoorame();
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const filteredExpenses = expenses.filter((e) => {
    const matchCat = categoryFilter === "ALL" || e.category === categoryFilter;
    const matchSearch =
      e.note.toLowerCase().includes(search.toLowerCase()) ||
      e.expenseNo.toLowerCase().includes(search.toLowerCase()) ||
      e.cashAccountName.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalExpense = expenses.reduce((sum, e) => sum + e.nominal, 0);

  // Category breakdowns
  const categoryTotals = {
    PAKAN: expenses.filter((e) => e.category === "PAKAN").reduce((s, e) => s + e.nominal, 0),
    GAJI: expenses.filter((e) => e.category === "GAJI").reduce((s, e) => s + e.nominal, 0),
    OBAT: expenses.filter((e) => e.category === "OBAT").reduce((s, e) => s + e.nominal, 0),
    OPERASIONAL: expenses.filter((e) => e.category === "OPERASIONAL").reduce((s, e) => s + e.nominal, 0),
  };

  const handleExportCSV = () => {
    const rows = [
      ["No Bukti", "Tanggal", "Kategori", "Nominal", "Sumber Dana", "Keterangan"],
      ...filteredExpenses.map((e) => [
        e.expenseNo,
        e.date,
        e.category,
        String(e.nominal),
        e.cashAccountName,
        e.note,
      ]),
    ];
    exportToCSV("laporan_pengeluaran_operasional.csv", rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--gw-ink)] flex items-center gap-2">
            <ArrowUpRight size={22} className="text-[var(--gw-ink)]" /> Pengeluaran (Beban Operasional)
          </h2>
          <p className="text-xs text-[var(--gw-muted)] mt-1">
            Mencatat biaya pakan pelet, upah pekerja kolam, obat/vitamin, dan biaya listrik/air aerasi.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--gw-button)] text-[var(--gw-button-ink)] hover:brightness-110 shadow-sm transition-all"
        >
          <PlusCircle size={15} /> Catat Pengeluaran Baru
        </button>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="gw-panel p-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--gw-muted)] font-medium">1. Pakan Gurame</span>
            <span className="font-bold text-[var(--gw-ink)]">
              {totalExpense > 0 ? Math.round((categoryTotals.PAKAN / totalExpense) * 100) : 0}%
            </span>
          </div>
          <strong className="text-base text-[var(--gw-ink)] block">
            {formatRupiah(categoryTotals.PAKAN)}
          </strong>
          <div className="h-1.5 w-full bg-[var(--gw-line)] rounded-full overflow-hidden">
            <div
              style={{ width: `${totalExpense > 0 ? (categoryTotals.PAKAN / totalExpense) * 100 : 0}%` }}
              className="h-full bg-[var(--gw-ink)] rounded-full opacity-80"
            />
          </div>
          <span className="text-[10px] text-[var(--gw-muted)] block">Akun 5001 (Pelet Starter/Grower)</span>
        </div>

        <div className="gw-panel p-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--gw-muted)] font-medium">2. Gaji & Upah Pekerja</span>
            <span className="font-bold text-[var(--gw-ink)]">
              {totalExpense > 0 ? Math.round((categoryTotals.GAJI / totalExpense) * 100) : 0}%
            </span>
          </div>
          <strong className="text-base text-[var(--gw-ink)] block">
            {formatRupiah(categoryTotals.GAJI)}
          </strong>
          <div className="h-1.5 w-full bg-[var(--gw-line)] rounded-full overflow-hidden">
            <div
              style={{ width: `${totalExpense > 0 ? (categoryTotals.GAJI / totalExpense) * 100 : 0}%` }}
              className="h-full bg-[var(--gw-ink)] rounded-full opacity-80"
            />
          </div>
          <span className="text-[10px] text-[var(--gw-muted)] block">Akun 5002 (Teknisi & Pakan)</span>
        </div>

        <div className="gw-panel p-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--gw-muted)] font-medium">3. Obat & Suplemen</span>
            <span className="font-bold text-[var(--gw-ink)]">
              {totalExpense > 0 ? Math.round((categoryTotals.OBAT / totalExpense) * 100) : 0}%
            </span>
          </div>
          <strong className="text-base text-[var(--gw-ink)] block">
            {formatRupiah(categoryTotals.OBAT)}
          </strong>
          <div className="h-1.5 w-full bg-[var(--gw-line)] rounded-full overflow-hidden">
            <div
              style={{ width: `${totalExpense > 0 ? (categoryTotals.OBAT / totalExpense) * 100 : 0}%` }}
              className="h-full bg-[var(--gw-ink)] rounded-full opacity-80"
            />
          </div>
          <span className="text-[10px] text-[var(--gw-muted)] block">Akun 5003 (Probiotik EM4, Garam)</span>
        </div>

        <div className="gw-panel p-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--gw-muted)] font-medium">4. Listrik & Ops Kolam</span>
            <span className="font-bold text-[var(--gw-ink)]">
              {totalExpense > 0 ? Math.round((categoryTotals.OPERASIONAL / totalExpense) * 100) : 0}%
            </span>
          </div>
          <strong className="text-base text-[var(--gw-ink)] block">
            {formatRupiah(categoryTotals.OPERASIONAL)}
          </strong>
          <div className="h-1.5 w-full bg-[var(--gw-line)] rounded-full overflow-hidden">
            <div
              style={{ width: `${totalExpense > 0 ? (categoryTotals.OPERASIONAL / totalExpense) * 100 : 0}%` }}
              className="h-full bg-[var(--gw-ink)] rounded-full opacity-80"
            />
          </div>
          <span className="text-[10px] text-[var(--gw-muted)] block">Akun 5004 (Aerasi, Pompa Air)</span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="gw-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--gw-muted)] flex items-center gap-1">
              <Filter size={13} /> Kategori:
            </span>
            {(["ALL", "PAKAN", "GAJI", "OBAT", "OPERASIONAL"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  categoryFilter === cat
                    ? "bg-[var(--gw-ink)] text-[var(--gw-button-ink)] shadow-sm font-semibold"
                    : "gw-subcard text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
                }`}
              >
                {cat === "ALL" ? "Semua" : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)]">
              <Search size={14} className="text-[var(--gw-muted)]" />
              <input
                type="text"
                placeholder="Cari pengeluaran..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-xs w-36 text-[var(--gw-ink)] placeholder-[var(--gw-muted)]"
              />
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--gw-line)] hover:bg-[var(--gw-hover)] font-medium text-[var(--gw-ink)]"
            >
              <Download size={13} /> Ekspor CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--gw-line)] text-[var(--gw-muted)] font-medium">
                <th className="pb-2.5">No Bukti</th>
                <th className="pb-2.5">Tanggal</th>
                <th className="pb-2.5">Kategori Beban</th>
                <th className="pb-2.5">Keterangan / Deskripsi</th>
                <th className="pb-2.5">Sumber Kas/Bank</th>
                <th className="pb-2.5 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gw-line)]">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-[var(--gw-surface)] transition-colors">
                  <td className="py-2.5 font-mono text-[11px] font-semibold text-[var(--gw-ink)]">{expense.expenseNo}</td>
                  <td className="py-2.5 whitespace-nowrap text-[var(--gw-muted)]">{expense.date}</td>
                  <td className="py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--gw-line)] text-[var(--gw-muted)] font-mono">
                      {expense.category}
                    </span>
                  </td>
                  <td className="py-2.5 text-[var(--gw-ink)] font-medium">{expense.note}</td>
                  <td className="py-2.5 text-[var(--gw-muted)]">{expense.cashAccountName}</td>
                  <td className="py-2.5 text-right font-bold text-[var(--gw-ink)]">
                    {formatRupiah(expense.nominal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModalPengeluaran isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
