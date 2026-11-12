"use client";

import React, { useState } from "react";
import { useGoorame } from "@/lib/goorame-context";
import { formatRupiah, exportToCSV } from "@/lib/goorame-accounting";
import {
  Wallet,
  ArrowRightLeft,
  Download,
  Building,
} from "lucide-react";
import { ModalTransferKas } from "./modals";

export function KasView() {
  const { cashAccounts, journalEntries } = useGoorame();
  const [modalTransferOpen, setModalTransferOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(cashAccounts[0]?.id || "");

  const selectedAccount = cashAccounts.find((c) => c.id === selectedAccountId) || cashAccounts[0];

  // Filter journal lines affecting this specific cash account (Buku Kas Kronologis)
  const accountJournalLines = journalEntries
    .filter((j) => j.items.some((item) => item.accountCode === selectedAccount?.code))
    .map((j) => {
      const match = j.items.find((item) => item.accountCode === selectedAccount?.code);
      return {
        date: j.date,
        entryNumber: j.entryNumber,
        description: j.description,
        debit: match?.debit || 0,
        credit: match?.credit || 0,
        refType: j.refType,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Compute running balance for Buku Kas
  let running = 0;
  const cashBookRows = accountJournalLines.map((row) => {
    running += row.debit - row.credit;
    return { ...row, balance: running };
  });

  const handleExportCSV = () => {
    const rows = [
      ["Tanggal", "No Bukti", "Keterangan", "Pemasukan (Debet)", "Pengeluaran (Kredit)", "Saldo Berjalan"],
      ...cashBookRows.map((r) => [
        r.date,
        r.entryNumber,
        r.description,
        String(r.debit),
        String(r.credit),
        String(r.balance),
      ]),
    ];
    exportToCSV(`buku_kas_${selectedAccount?.name.replace(/\s+/g, "_")}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--gw-ink)] flex items-center gap-2">
            <Wallet size={22} className="text-[var(--gw-ink)]" /> Kas & Bank (Treasury & Mutasi)
          </h2>
          <p className="text-xs text-[var(--gw-muted)] mt-1">
            Mengelola likuiditas seluruh dompet usaha (Kas Tunai, Rekening BCA, Rekening BRI) dan mutasi antar kas.
          </p>
        </div>
        <button
          onClick={() => setModalTransferOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--gw-button)] text-[var(--gw-button-ink)] hover:brightness-110 shadow-sm transition-all"
        >
          <ArrowRightLeft size={15} /> Transfer Antar Kas / Bank
        </button>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cashAccounts.map((account) => {
          const isSelected = account.id === selectedAccountId;
          return (
            <div
              key={account.id}
              onClick={() => setSelectedAccountId(account.id)}
              className={`gw-panel p-5 cursor-pointer transition-all ${
                isSelected
                  ? "border-[var(--gw-ink)] ring-1 ring-[var(--gw-ink)]/20 shadow-md"
                  : "hover:border-[var(--gw-ink)]/50"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="gw-subcard p-2.5 text-[var(--gw-ink)]">
                  {account.type === "BANK" ? <Building size={18} /> : <Wallet size={18} />}
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[var(--gw-line)] text-[var(--gw-muted)]">
                  Akun {account.code}
                </span>
              </div>
              <h3 className="font-bold text-sm text-[var(--gw-ink)]">{account.name}</h3>
              {account.accountNumber && (
                <p className="text-[11px] text-[var(--gw-muted)] font-mono">{account.accountNumber}</p>
              )}
              <div className="mt-4 pt-3 border-t border-[var(--gw-line)] flex justify-between items-baseline">
                <span className="text-[10px] text-[var(--gw-muted)]">Saldo Tersedia:</span>
                <strong className="text-lg text-[var(--gw-ink)]">
                  {formatRupiah(account.balance)}
                </strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Buku Kas Kronologis (Chronological Cash Book) */}
      <div className="gw-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <h3 className="font-semibold text-sm text-[var(--gw-ink)] flex items-center gap-2">
              Buku Kas: {selectedAccount?.name}
            </h3>
            <p className="text-[11px] text-[var(--gw-muted)]">
              Riwayat kronologis uang masuk (Debet) dan uang keluar (Kredit) untuk rekening ini.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--gw-muted)]">
              Saldo Akhir: <strong className="text-[var(--gw-ink)]">{formatRupiah(selectedAccount?.balance || 0)}</strong>
            </span>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--gw-line)] hover:bg-[var(--gw-hover)] font-medium text-[var(--gw-ink)]"
            >
              <Download size={13} /> Ekspor Buku Kas
            </button>
          </div>
        </div>

        {/* Cash Book Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--gw-line)] text-[var(--gw-muted)] font-medium">
                <th className="pb-2.5">Tanggal</th>
                <th className="pb-2.5">No Referensi</th>
                <th className="pb-2.5">Tipe Transaksi</th>
                <th className="pb-2.5">Keterangan</th>
                <th className="pb-2.5 text-right">Uang Masuk (Debet)</th>
                <th className="pb-2.5 text-right">Uang Keluar (Kredit)</th>
                <th className="pb-2.5 text-right">Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gw-line)]">
              {cashBookRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--gw-surface)] transition-colors">
                  <td className="py-2.5 whitespace-nowrap text-[var(--gw-muted)]">{row.date}</td>
                  <td className="py-2.5 font-mono text-[11px] text-[var(--gw-ink)]">{row.entryNumber}</td>
                  <td className="py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--gw-line)] text-[var(--gw-muted)] font-mono">
                      {row.refType}
                    </span>
                  </td>
                  <td className="py-2.5 text-[var(--gw-ink)] font-medium">{row.description}</td>
                  <td className="py-2.5 text-right font-semibold text-[var(--gw-ink)]">
                    {row.debit > 0 ? `+${formatRupiah(row.debit)}` : "—"}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-[var(--gw-muted)]">
                    {row.credit > 0 ? `−${formatRupiah(row.credit)}` : "—"}
                  </td>
                  <td className="py-2.5 text-right font-bold text-[var(--gw-ink)]">
                    {formatRupiah(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModalTransferKas isOpen={modalTransferOpen} onClose={() => setModalTransferOpen(false)} />
    </div>
  );
}
