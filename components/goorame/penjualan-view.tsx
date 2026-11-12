"use client";

import React, { useState } from "react";
import { useGoorame } from "@/lib/goorame-context";
import { formatRupiah, formatNumber, exportToCSV } from "@/lib/goorame-accounting";
import {
  ArrowDownLeft,
  PlusCircle,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";
import { ModalPenjualan } from "./modals";

export function PenjualanView() {
  const { sales, cashAccounts, payCustomerReceivable } = useGoorame();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "LUNAS" | "TEMPO">("ALL");
  const [selectedPaySaleId, setSelectedPaySaleId] = useState<string | null>(null);
  const [payCashAccountId, setPayCashAccountId] = useState(cashAccounts[0]?.id || "");

  const filteredSales = sales.filter((s) => {
    const matchStatus = statusFilter === "ALL" || s.paymentStatus === statusFilter;
    const matchSearch =
      s.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      s.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      (s.pondName && s.pondName.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const totalPenjualan = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalLunas = sales
    .filter((s) => s.paymentStatus === "LUNAS")
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const totalTempo = sales
    .filter((s) => s.paymentStatus === "TEMPO")
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const totalKg = sales.reduce((sum, s) => sum + s.weightKg, 0);

  const handleExportCSV = () => {
    const rows = [
      ["No Faktur", "Tanggal", "Nama Pembeli", "Kolam", "Berat (Kg)", "Jumlah (Ekor)", "Harga/Kg", "Total Penjualan", "Status", "Akun Penerima", "Catatan"],
      ...filteredSales.map((s) => [
        s.invoiceNo,
        s.date,
        s.buyerName,
        s.pondName || "-",
        String(s.weightKg),
        String(s.quantityEkor),
        String(s.pricePerKg),
        String(s.totalAmount),
        s.paymentStatus,
        s.cashAccountName || "-",
        s.note,
      ]),
    ];
    exportToCSV("laporan_penjualan_gurame.csv", rows);
  };

  const handleConfirmPay = (saleId: string) => {
    if (!payCashAccountId) return;
    payCustomerReceivable(saleId, payCashAccountId);
    setSelectedPaySaleId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--gw-ink)] flex items-center gap-2">
            <ArrowDownLeft size={22} className="text-[var(--gw-ink)]" /> Pemasukan (Manajemen Penjualan)
          </h2>
          <p className="text-xs text-[var(--gw-muted)] mt-1">
            Mencatat hasil panen ikan gurame, otomatisasi jurnal pendapatan, dan pelacakan piutang tempo.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--gw-button)] text-[var(--gw-button-ink)] hover:brightness-110 shadow-sm transition-all"
        >
          <PlusCircle size={15} /> Catat Penjualan Baru
        </button>
      </div>

      {/* Sales Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="gw-panel p-4">
          <span className="text-[11px] text-[var(--gw-muted)] block">Total Omzet Penjualan</span>
          <strong className="text-lg text-[var(--gw-ink)]">{formatRupiah(totalPenjualan)}</strong>
        </div>
        <div className="gw-panel p-4">
          <span className="text-[11px] text-[var(--gw-muted)] block">Penjualan Lunas (Kas Masuk)</span>
          <strong className="text-lg text-[var(--gw-ink)]">{formatRupiah(totalLunas)}</strong>
        </div>
        <div className="gw-panel p-4">
          <span className="text-[11px] text-[var(--gw-muted)] block">Piutang Pelanggan (Tempo)</span>
          <strong className="text-lg text-[var(--gw-ink)]">{formatRupiah(totalTempo)}</strong>
        </div>
        <div className="gw-panel p-4">
          <span className="text-[11px] text-[var(--gw-muted)] block">Total Ikan Terjual</span>
          <strong className="text-lg text-[var(--gw-ink)]">{formatNumber(totalKg)} Kg</strong>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="gw-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--gw-muted)] flex items-center gap-1">
              <Filter size={13} /> Status:
            </span>
            {(["ALL", "LUNAS", "TEMPO"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === status
                    ? "bg-[var(--gw-ink)] text-[var(--gw-button-ink)] shadow-sm font-semibold"
                    : "gw-subcard text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
                }`}
              >
                {status === "ALL" ? "Semua" : status === "LUNAS" ? "Lunas" : "Tempo"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)]">
              <Search size={14} className="text-[var(--gw-muted)]" />
              <input
                type="text"
                placeholder="Cari pembeli / faktur..."
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--gw-line)] text-[var(--gw-muted)] font-medium">
                <th className="pb-2.5">No Faktur</th>
                <th className="pb-2.5">Tanggal</th>
                <th className="pb-2.5">Pembeli / Restoran</th>
                <th className="pb-2.5">Kolam Asal</th>
                <th className="pb-2.5 text-right">Volume</th>
                <th className="pb-2.5 text-right">Harga/Kg</th>
                <th className="pb-2.5 text-right">Total Nilai</th>
                <th className="pb-2.5 text-center">Status</th>
                <th className="pb-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gw-line)]">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-[var(--gw-surface)] transition-colors">
                  <td className="py-2.5 font-mono text-[11px] font-semibold text-[var(--gw-ink)]">{sale.invoiceNo}</td>
                  <td className="py-2.5 whitespace-nowrap text-[var(--gw-muted)]">{sale.date}</td>
                  <td className="py-2.5 font-semibold text-[var(--gw-ink)]">{sale.buyerName}</td>
                  <td className="py-2.5 text-[var(--gw-muted)]">{sale.pondName || "—"}</td>
                  <td className="py-2.5 text-right text-[var(--gw-ink)]">
                    <strong>{sale.weightKg} Kg</strong>{" "}
                    <span className="text-[10px] text-[var(--gw-muted)]">({sale.quantityEkor} ekor)</span>
                  </td>
                  <td className="py-2.5 text-right text-[var(--gw-muted)]">
                    {formatRupiah(sale.pricePerKg)}
                  </td>
                  <td className="py-2.5 text-right font-bold text-[var(--gw-ink)]">
                    {formatRupiah(sale.totalAmount)}
                  </td>
                  <td className="py-2.5 text-center">
                    <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--gw-line)] text-[var(--gw-ink)] inline-flex items-center gap-1">
                      {sale.paymentStatus === "LUNAS" ? (
                        <>
                          <CheckCircle2 size={11} className="text-[var(--gw-muted)]" /> Lunas
                        </>
                      ) : (
                        <>
                          <Clock size={11} className="text-[var(--gw-muted)]" /> Tempo
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    {sale.paymentStatus === "TEMPO" ? (
                      selectedPaySaleId === sale.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <select
                            value={payCashAccountId}
                            onChange={(e) => setPayCashAccountId(e.target.value)}
                            className="text-[10px] px-1.5 py-1 rounded bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)]"
                          >
                            {cashAccounts.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name.split(" ")[0]}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleConfirmPay(sale.id)}
                            className="px-2 py-1 text-[10px] rounded bg-[var(--gw-button)] text-[var(--gw-button-ink)] font-medium hover:brightness-110"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => setSelectedPaySaleId(null)}
                            className="px-1.5 py-1 text-[10px] rounded border border-[var(--gw-line)] text-[var(--gw-muted)]"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedPaySaleId(sale.id)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-[var(--gw-line)] text-[var(--gw-ink)] hover:bg-[var(--gw-hover)]"
                        >
                          Pelunasan
                        </button>
                      )
                    ) : (
                      <span className="text-[11px] text-[var(--gw-muted)]">{sale.cashAccountName?.split(" ")[0] || "Kas"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModalPenjualan isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
