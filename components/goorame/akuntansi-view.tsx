"use client";

import React, { useState } from "react";
import { useGoorame } from "@/lib/goorame-context";
import { formatRupiah, exportToCSV } from "@/lib/goorame-accounting";
import {
  BookOpen,
  PlusCircle,
  Download,
  Search,
  Layers,
} from "lucide-react";
import { ModalManualJournal } from "./modals";

export function AkuntansiView() {
  const { journalEntries, ledger } = useGoorame();
  const [subTab, setSubTab] = useState<"JURNAL" | "BUKU_BESAR">("JURNAL");
  const [modalManualOpen, setModalManualOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLedgerCode, setSelectedLedgerCode] = useState<string>("5001"); // default drilldown: Beban Pakan

  const selectedLedger = ledger.find((l) => l.code === selectedLedgerCode) || ledger[0];

  const filteredJournals = journalEntries.filter(
    (j) =>
      j.description.toLowerCase().includes(search.toLowerCase()) ||
      j.entryNumber.toLowerCase().includes(search.toLowerCase()) ||
      j.items.some((item) => item.accountName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleExportJournalCSV = () => {
    const rows = [
      ["No Jurnal", "Tanggal", "Deskripsi", "Tipe Ref", "Kode Akun", "Nama Akun", "Debet", "Kredit"],
      ...journalEntries.flatMap((j) =>
        j.items.map((item) => [
          j.entryNumber,
          j.date,
          j.description,
          j.refType,
          item.accountCode,
          item.accountName,
          String(item.debit),
          String(item.credit),
        ])
      ),
    ];
    exportToCSV("jurnal_umum_goorame.csv", rows);
  };

  const handleExportLedgerCSV = () => {
    if (!selectedLedger) return;
    const rows = [
      ["Tanggal", "No Ref", "Keterangan", "Debet", "Kredit", "Saldo Berjalan"],
      ...selectedLedger.entries.map((e) => [
        e.date,
        e.refNo,
        e.description,
        String(e.debit),
        String(e.credit),
        String(e.balance),
      ]),
    ];
    exportToCSV(`buku_besar_${selectedLedger.code}_${selectedLedger.name.replace(/\s+/g, "_")}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--gw-ink)] flex items-center gap-2">
            <BookOpen size={22} className="text-[var(--gw-ink)]" /> Jurnal Umum & Buku Besar (Double-Entry)
          </h2>
          <p className="text-xs text-[var(--gw-muted)] mt-1">
            Mesin akuntansi standar: auto-journaling dari modul operasional, validasi balance ketat, dan drill-down general ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtab Toggle */}
          <div className="p-1 rounded-xl bg-[var(--gw-surface)] border border-[var(--gw-line)] flex gap-1 text-xs font-medium">
            <button
              onClick={() => setSubTab("JURNAL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                subTab === "JURNAL"
                  ? "bg-[var(--gw-ink)] text-[var(--gw-button-ink)] shadow-sm font-semibold"
                  : "text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
              }`}
            >
              Jurnal Umum
            </button>
            <button
              onClick={() => setSubTab("BUKU_BESAR")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                subTab === "BUKU_BESAR"
                  ? "bg-[var(--gw-ink)] text-[var(--gw-button-ink)] shadow-sm font-semibold"
                  : "text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
              }`}
            >
              Buku Besar (Ledger)
            </button>
          </div>

          {subTab === "JURNAL" && (
            <button
              onClick={() => setModalManualOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--gw-button)] text-[var(--gw-button-ink)] hover:brightness-110 shadow-sm transition-all"
            >
              <PlusCircle size={15} /> Entri Manual Penyesuaian
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: JURNAL UMUM */}
      {subTab === "JURNAL" && (
        <div className="gw-panel p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-semibold text-sm text-[var(--gw-ink)]">
                Buku Jurnal Umum (General Journal)
              </h3>
              <p className="text-[11px] text-[var(--gw-muted)]">
                Menampilkan seluruh ayat jurnal berpasangan (Debit & Kredit) dengan balance sempurna.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)]">
                <Search size={14} className="text-[var(--gw-muted)]" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent outline-none text-xs w-36 text-[var(--gw-ink)] placeholder-[var(--gw-muted)]"
                />
              </div>
              <button
                onClick={handleExportJournalCSV}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--gw-line)] hover:bg-[var(--gw-hover)] font-medium text-[var(--gw-ink)]"
              >
                <Download size={13} /> Ekspor CSV
              </button>
            </div>
          </div>

          {/* Journals Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--gw-line)] text-[var(--gw-muted)] font-medium">
                  <th className="pb-2.5">Tanggal</th>
                  <th className="pb-2.5">No Jurnal</th>
                  <th className="pb-2.5">Deskripsi / Keterangan</th>
                  <th className="pb-2.5">Akun Akuntansi</th>
                  <th className="pb-2.5 text-right">Debet (Rp)</th>
                  <th className="pb-2.5 text-right">Kredit (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gw-line)]">
                {filteredJournals.map((journal) => (
                  <React.Fragment key={journal.id}>
                    {journal.items.map((item, itemIdx) => (
                      <tr
                        key={`${journal.id}-${itemIdx}`}
                        className={`hover:bg-[var(--gw-surface)] transition-colors ${
                          itemIdx === 0 ? "border-t border-[var(--gw-line)]" : ""
                        }`}
                      >
                        <td className="py-2 whitespace-nowrap text-[var(--gw-muted)]">
                          {itemIdx === 0 ? journal.date : ""}
                        </td>
                        <td className="py-2 font-mono text-[11px] text-[var(--gw-ink)]">
                          {itemIdx === 0 ? journal.entryNumber : ""}
                        </td>
                        <td className="py-2 font-medium text-[var(--gw-ink)] max-w-xs truncate">
                          {itemIdx === 0 ? (
                            <div>
                              <span>{journal.description}</span>
                              <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded border border-[var(--gw-line)] text-[var(--gw-muted)] font-mono">
                                {journal.refType}
                              </span>
                            </div>
                          ) : (
                            ""
                          )}
                        </td>
                        <td className={`py-2 text-[var(--gw-ink)] ${item.credit > 0 ? "pl-6 text-[var(--gw-muted)]" : "font-medium"}`}>
                          <span className="font-mono text-[11px] text-[var(--gw-muted)] mr-1">
                            {item.accountCode}
                          </span>{" "}
                          {item.accountName}
                        </td>
                        <td className="py-2 text-right font-medium text-[var(--gw-ink)]">
                          {item.debit > 0 ? formatRupiah(item.debit) : "—"}
                        </td>
                        <td className="py-2 text-right font-medium text-[var(--gw-muted)]">
                          {item.credit > 0 ? formatRupiah(item.credit) : "—"}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: BUKU BESAR (GENERAL LEDGER) */}
      {subTab === "BUKU_BESAR" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart of Accounts Drilldown List (Left Column) */}
          <div className="gw-panel p-5 space-y-3">
            <h3 className="font-semibold text-sm text-[var(--gw-ink)] flex items-center gap-2">
              <Layers size={16} className="text-[var(--gw-muted)]" /> Bagan Akun (Chart of Accounts)
            </h3>
            <p className="text-[11px] text-[var(--gw-muted)]">
              Klik akun di bawah untuk melihat rincian mutasi buku besar dan saldo akhir.
            </p>

            <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1">
              {(["ASET", "KEWAJIBAN", "EKUITAS", "PENDAPATAN", "BEBAN"] as const).map((cat) => {
                const accountsInCat = ledger.filter((a) => a.category === cat);
                if (!accountsInCat.length) return null;

                return (
                  <div key={cat} className="space-y-1 pt-2 first:pt-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gw-muted)] px-2">
                      {cat} ({cat === "ASET" ? "1000" : cat === "KEWAJIBAN" ? "2000" : cat === "EKUITAS" ? "3000" : cat === "PENDAPATAN" ? "4000" : "5000"})
                    </span>
                    {accountsInCat.map((acc) => {
                      const isSelected = acc.code === selectedLedgerCode;
                      return (
                        <div
                          key={acc.code}
                          onClick={() => setSelectedLedgerCode(acc.code)}
                          className={`gw-subcard p-2.5 cursor-pointer transition-all flex items-center justify-between text-xs ${
                            isSelected
                              ? "border-[var(--gw-ink)] bg-[var(--gw-ink)] text-[var(--gw-button-ink)] font-semibold shadow-sm"
                              : "text-[var(--gw-ink)] hover:border-[var(--gw-ink)]/50"
                          }`}
                        >
                          <div>
                            <span className="font-mono text-[11px] text-[var(--gw-muted)] mr-1.5">{acc.code}</span>
                            <span>{acc.name}</span>
                          </div>
                          <span className="text-[11px]">
                            {formatRupiah(acc.closingBalance)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drilldown Details (Right Column) */}
          <div className="lg:col-span-2 gw-panel p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[var(--gw-line)] pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--gw-muted)]">
                  Buku Besar Akun {selectedLedger?.code} ({selectedLedger?.category})
                </span>
                <h3 className="text-lg font-bold text-[var(--gw-ink)] mt-0.5">{selectedLedger?.name}</h3>
                <p className="text-[11px] text-[var(--gw-muted)]">
                  Saldo Normal: <strong className="text-[var(--gw-ink)]">{selectedLedger?.normalBalance}</strong>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-[var(--gw-muted)] block">Saldo Akhir Akun:</span>
                <strong className="text-xl font-bold text-[var(--gw-ink)]">
                  {formatRupiah(selectedLedger?.closingBalance || 0)}
                </strong>
                <button
                  onClick={handleExportLedgerCSV}
                  className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[var(--gw-muted)] hover:text-[var(--gw-ink)] underline ml-auto"
                >
                  <Download size={12} /> Unduh CSV Akun Ini
                </button>
              </div>
            </div>

            {/* Drilldown Entries Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--gw-line)] text-[var(--gw-muted)] font-medium">
                    <th className="pb-2.5">Tanggal</th>
                    <th className="pb-2.5">No Ref</th>
                    <th className="pb-2.5">Deskripsi / Uraian</th>
                    <th className="pb-2.5 text-right">Debet</th>
                    <th className="pb-2.5 text-right">Kredit</th>
                    <th className="pb-2.5 text-right">Saldo Berjalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--gw-line)]">
                  {selectedLedger?.entries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-[var(--gw-surface)] transition-colors">
                      <td className="py-2.5 whitespace-nowrap text-[var(--gw-muted)]">{entry.date}</td>
                      <td className="py-2.5 font-mono text-[11px] text-[var(--gw-ink)]">{entry.refNo}</td>
                      <td className="py-2.5 font-medium text-[var(--gw-ink)] max-w-xs truncate">
                        {entry.description}
                      </td>
                      <td className="py-2.5 text-right text-[var(--gw-ink)] font-semibold">
                        {entry.debit > 0 ? formatRupiah(entry.debit) : "—"}
                      </td>
                      <td className="py-2.5 text-right text-[var(--gw-muted)] font-semibold">
                        {entry.credit > 0 ? formatRupiah(entry.credit) : "—"}
                      </td>
                      <td className="py-2.5 text-right font-bold text-[var(--gw-ink)]">
                        {formatRupiah(entry.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ModalManualJournal isOpen={modalManualOpen} onClose={() => setModalManualOpen(false)} />
    </div>
  );
}
