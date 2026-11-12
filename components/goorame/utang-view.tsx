"use client";

import React, { useState } from "react";
import { useGoorame } from "@/lib/goorame-context";
import { formatRupiah, exportToCSV } from "@/lib/goorame-accounting";
import {
  CreditCard,
  PlusCircle,
  Download,
  Search,
  Layers,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { ModalFakturUtang, ModalBayarUtang } from "./modals";

export function UtangView() {
  const { supplierInvoices, supplierPayments } = useGoorame();
  const [modalFakturOpen, setModalFakturOpen] = useState(false);
  const [modalBayarOpen, setModalBayarOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [selectedSupplierCard, setSelectedSupplierCard] = useState<string | null>(null);

  // Group invoices per supplier for "Kartu Utang"
  const suppliersMap = new Map<
    string,
    {
      supplierName: string;
      totalInvoiced: number;
      totalPaid: number;
      remainingBalance: number;
      invoices: typeof supplierInvoices;
      payments: typeof supplierPayments;
    }
  >();

  for (const inv of supplierInvoices) {
    if (!suppliersMap.has(inv.supplierName)) {
      suppliersMap.set(inv.supplierName, {
        supplierName: inv.supplierName,
        totalInvoiced: 0,
        totalPaid: 0,
        remainingBalance: 0,
        invoices: [],
        payments: [],
      });
    }
    const sup = suppliersMap.get(inv.supplierName)!;
    sup.totalInvoiced += inv.totalAmount;
    sup.totalPaid += inv.paidAmount;
    sup.remainingBalance += inv.totalAmount - inv.paidAmount;
    sup.invoices.push(inv);
  }

  for (const pay of supplierPayments) {
    if (suppliersMap.has(pay.supplierName)) {
      suppliersMap.get(pay.supplierName)!.payments.push(pay);
    }
  }

  const supplierCards = Array.from(suppliersMap.values());

  const filteredInvoices = supplierInvoices.filter(
    (inv) =>
      inv.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  const totalUtangSemua = supplierInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalUtangTerbayar = supplierInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalSisaUtang = totalUtangSemua - totalUtangTerbayar;

  const handleOpenBayar = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setModalBayarOpen(true);
  };

  const handleExportCSV = () => {
    const rows = [
      ["No Faktur", "Tanggal", "Nama Pemasok", "Kategori", "Total Faktur", "Sudah Dibayar", "Sisa Tagihan", "Jatuh Tempo", "Status"],
      ...supplierInvoices.map((inv) => [
        inv.invoiceNumber,
        inv.date,
        inv.supplierName,
        inv.itemCategory,
        String(inv.totalAmount),
        String(inv.paidAmount),
        String(inv.totalAmount - inv.paidAmount),
        inv.dueDate,
        inv.status,
      ]),
    ];
    exportToCSV("kartu_utang_pemasok.csv", rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--gw-ink)] flex items-center gap-2">
            <CreditCard size={22} className="text-[var(--gw-ink)]" /> Utang Pemasok (Accounts Payable)
          </h2>
          <p className="text-xs text-[var(--gw-muted)] mt-1">
            Pengelolaan faktur tempo pembelian pakan & bibit, pelunasan bertahap (cicilan), dan Kartu Utang per vendor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalFakturOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--gw-button)] text-[var(--gw-button-ink)] hover:brightness-110 shadow-sm transition-all"
          >
            <PlusCircle size={15} /> Faktur Pembelian Baru
          </button>
          <button
            onClick={() => {
              setSelectedInvoiceId(undefined);
              setModalBayarOpen(true);
            }}
            className="gw-subcard flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--gw-ink)] hover:brightness-105 shadow-sm transition-all"
          >
            <Wallet size={15} className="text-[var(--gw-muted)]" /> Bayar Cicilan Utang
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="gw-panel p-4">
          <span className="text-[11px] text-[var(--gw-muted)] block">Total Sisa Utang Aktif</span>
          <strong className="text-xl text-[var(--gw-ink)] font-bold block mt-1">
            {formatRupiah(totalSisaUtang)}
          </strong>
          <span className="text-[10px] text-[var(--gw-muted)]">Harus dilunasi sesuai tanggal tempo</span>
        </div>
        <div className="gw-panel p-4">
          <span className="text-[11px] text-[var(--gw-muted)] block">Total Pembayaran Terbayar</span>
          <strong className="text-xl text-[var(--gw-ink)] font-bold block mt-1">
            {formatRupiah(totalUtangTerbayar)}
          </strong>
          <span className="text-[10px] text-[var(--gw-muted)]">Dari seluruh faktur pembelian</span>
        </div>
        <div className="gw-panel p-4">
          <span className="text-[11px] text-[var(--gw-muted)] block">Total Pemasok Aktif</span>
          <strong className="text-xl text-[var(--gw-ink)] font-bold block mt-1">
            {supplierCards.length} Vendor Pakan & Bibit
          </strong>
          <span className="text-[10px] text-[var(--gw-muted)]">{supplierInvoices.length} Faktur tercatat</span>
        </div>
      </div>

      {/* Kartu Utang per Pemasok (Section 3.4 PRD) */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-[var(--gw-ink)] flex items-center gap-2">
          <Layers size={16} className="text-[var(--gw-muted)]" /> Kartu Utang Pemasok (Vendor Ledgers)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {supplierCards.map((card) => (
            <div
              key={card.supplierName}
              onClick={() => setSelectedSupplierCard(selectedSupplierCard === card.supplierName ? null : card.supplierName)}
              className={`gw-panel p-4 cursor-pointer transition-all ${
                selectedSupplierCard === card.supplierName
                  ? "border-[var(--gw-ink)] shadow-md"
                  : "hover:border-[var(--gw-ink)]/50"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-xs text-[var(--gw-ink)]">{card.supplierName}</h4>
                  <span className="text-[10px] text-[var(--gw-muted)]">{card.invoices.length} Faktur Tagihan</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[var(--gw-line)] text-[var(--gw-muted)]">
                  {card.remainingBalance === 0 ? "Lunas" : "Ada Utang"}
                </span>
              </div>

              <div className="space-y-1.5 my-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--gw-muted)]">Sisa Utang:</span>
                  <strong className="text-[var(--gw-ink)]">{formatRupiah(card.remainingBalance)}</strong>
                </div>
                <div className="flex justify-between text-[11px] text-[var(--gw-muted)]">
                  <span>Sudah Dibayar:</span>
                  <span className="text-[var(--gw-ink)]">{formatRupiah(card.totalPaid)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[var(--gw-muted)]">
                  <span>Total Faktur:</span>
                  <span className="text-[var(--gw-muted)]">{formatRupiah(card.totalInvoiced)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--gw-line)] flex items-center justify-between text-[11px] text-[var(--gw-muted)] font-medium">
                <span>{selectedSupplierCard === card.supplierName ? "Tutup Rincian" : "Buka Kartu Utang"}</span>
                <ChevronRight size={14} className={selectedSupplierCard === card.supplierName ? "rotate-90" : ""} />
              </div>

              {/* Collapsible Ledger Details */}
              {selectedSupplierCard === card.supplierName && (
                <div className="mt-3 pt-3 border-t border-[var(--gw-line)] text-xs space-y-2">
                  <strong className="text-[11px] text-[var(--gw-muted)] block">Riwayat Pembayaran Cicilan:</strong>
                  {card.payments.length ? (
                    card.payments.map((p) => (
                      <div key={p.id} className="gw-subcard p-2 flex justify-between text-[11px]">
                        <div>
                          <span className="text-[var(--gw-ink)]">{p.date}</span>
                          <p className="text-[10px] text-[var(--gw-muted)]">{p.note}</p>
                        </div>
                        <span className="font-semibold text-[var(--gw-ink)]">
                          {formatRupiah(p.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-[var(--gw-muted)]">Belum ada riwayat pembayaran.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Table Section */}
      <div className="gw-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <h3 className="font-semibold text-sm text-[var(--gw-ink)]">Daftar Seluruh Faktur Pembelian Tempo</h3>
            <p className="text-[11px] text-[var(--gw-muted)]">Jurnal Otomatis: Debet Beban/Persediaan, Kredit Utang Usaha (2001)</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)]">
              <Search size={14} className="text-[var(--gw-muted)]" />
              <input
                type="text"
                placeholder="Cari faktur / vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-xs w-40 text-[var(--gw-ink)] placeholder-[var(--gw-muted)]"
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

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--gw-line)] text-[var(--gw-muted)] font-medium">
                <th className="pb-2.5">No Faktur</th>
                <th className="pb-2.5">Tanggal</th>
                <th className="pb-2.5">Pemasok</th>
                <th className="pb-2.5">Kategori</th>
                <th className="pb-2.5 text-right">Total Faktur</th>
                <th className="pb-2.5 text-right">Sudah Dibayar</th>
                <th className="pb-2.5 text-right">Sisa Tagihan</th>
                <th className="pb-2.5">Jatuh Tempo</th>
                <th className="pb-2.5 text-center">Status</th>
                <th className="pb-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gw-line)]">
              {filteredInvoices.map((inv) => {
                const sisa = inv.totalAmount - inv.paidAmount;
                return (
                  <tr key={inv.id} className="hover:bg-[var(--gw-surface)] transition-colors">
                    <td className="py-2.5 font-mono text-[11px] font-semibold text-[var(--gw-ink)]">{inv.invoiceNumber}</td>
                    <td className="py-2.5 whitespace-nowrap text-[var(--gw-muted)]">{inv.date}</td>
                    <td className="py-2.5 font-semibold text-[var(--gw-ink)]">{inv.supplierName}</td>
                    <td className="py-2.5 text-[var(--gw-muted)]">{inv.itemCategory}</td>
                    <td className="py-2.5 text-right font-medium text-[var(--gw-ink)]">{formatRupiah(inv.totalAmount)}</td>
                    <td className="py-2.5 text-right text-[var(--gw-muted)] font-medium">
                      {formatRupiah(inv.paidAmount)}
                    </td>
                    <td className="py-2.5 text-right font-bold text-[var(--gw-ink)]">
                      {formatRupiah(sisa)}
                    </td>
                    <td className="py-2.5 whitespace-nowrap text-[var(--gw-muted)]">{inv.dueDate}</td>
                    <td className="py-2.5 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--gw-line)] text-[var(--gw-muted)] font-mono">
                        {inv.status === "LUNAS" ? "Lunas" : inv.status === "SEBAGIAN" ? "Sebagian" : "Belum Lunas"}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      {inv.status !== "LUNAS" && (
                        <button
                          onClick={() => handleOpenBayar(inv.id)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-[var(--gw-line)] text-[var(--gw-ink)] hover:bg-[var(--gw-hover)] transition-colors"
                        >
                          Bayar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ModalFakturUtang isOpen={modalFakturOpen} onClose={() => setModalFakturOpen(false)} />
      <ModalBayarUtang
        isOpen={modalBayarOpen}
        onClose={() => setModalBayarOpen(false)}
        initialInvoiceId={selectedInvoiceId}
      />
    </div>
  );
}
