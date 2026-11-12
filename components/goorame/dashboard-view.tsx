"use client";

import React, { useState } from "react";
import { useGoorame } from "@/lib/goorame-context";
import { formatRupiah, formatNumber } from "@/lib/goorame-accounting";
import {
  Wallet,
  Fish,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  ShieldCheck,
  Scale,
  Sparkles,
  Calendar,
  Layers,
} from "lucide-react";
import {
  ModalPenjualan,
  ModalPengeluaran,
  ModalTebarBibit,
  ModalMortalitas,
  ModalBayarUtang,
} from "./modals";

export function DashboardView() {
  const {
    role,
    totalCashBalance,
    totalActiveFishCount,
    totalActiveFishWeight,
    totalPayableDue,
    totalReceivableDue,
    incomeStatement,
    ponds,
    sales,
    expenses,
    stockMutations,
    setActiveTab,
  } = useGoorame();

  const [modalSaleOpen, setModalSaleOpen] = useState(false);
  const [modalExpenseOpen, setModalExpenseOpen] = useState(false);
  const [modalTebarOpen, setModalTebarOpen] = useState(false);
  const [modalMortalitasOpen, setModalMortalitasOpen] = useState(false);
  const [modalBayarUtangOpen, setModalBayarUtangOpen] = useState(false);

  // Average survival rate across all ponds
  const avgSurvivalRate = ponds.length
    ? (ponds.reduce((sum, p) => sum + p.survivalRate, 0) / ponds.length).toFixed(1)
    : "100";

  // Trend data points for 30 days
  const trendPoints = [
    { label: "1 Nov", income: 11000000, expense: 7500000 },
    { label: "3 Nov", income: 0, expense: 12000000 },
    { label: "4 Nov", income: 0, expense: 3500000 },
    { label: "5 Nov", income: 10200000, expense: 0 },
    { label: "6 Nov", income: 0, expense: 850000 },
    { label: "7 Nov", income: 0, expense: 1650000 },
    { label: "8 Nov", income: 7200000, expense: 0 },
  ];

  const maxVal = Math.max(1, ...trendPoints.flatMap((p) => [p.income, p.expense]));

  return (
    <div className="space-y-6">
      {/* RBAC Worker Notice Banner */}
      {role === "PEKERJA" && (
        <div className="gw-panel p-4 flex items-center gap-3 text-xs">
          <ShieldCheck size={20} className="shrink-0 text-[var(--gw-muted)]" />
          <div>
            <strong className="text-[var(--gw-ink)]">Mode Akses Pekerja Kolam</strong>
            <p className="text-[11px] text-[var(--gw-muted)]">
              Akses terbatas untuk operasional tambak (input stok ikan, tebar bibit, dan pencatatan mortalitas). Data keuangan & jurnal akuntansi dilindungi.
            </p>
          </div>
        </div>
      )}

      {/* Quick Action Command Center */}
      <div className="gw-panel flex flex-wrap items-center gap-2.5 p-3">
        <span className="text-xs font-semibold text-[var(--gw-muted)] px-2 flex items-center gap-1.5">
          <Sparkles size={14} className="text-[var(--gw-ink)]" /> Aksi Cepat:
        </span>
        <button
          onClick={() => setModalTebarOpen(true)}
          className="gw-subcard flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--gw-ink)] hover:brightness-105 transition-all"
        >
          <PlusCircle size={14} className="text-[var(--gw-muted)]" /> Tebar Bibit
        </button>
        <button
          onClick={() => setModalMortalitasOpen(true)}
          className="gw-subcard flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--gw-ink)] hover:brightness-105 transition-all"
        >
          <AlertTriangle size={14} className="text-[var(--gw-muted)]" /> Catat Kematian
        </button>

        {role === "PEMILIK" && (
          <>
            <button
              onClick={() => setModalSaleOpen(true)}
              className="gw-subcard flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--gw-ink)] hover:brightness-105 transition-all"
            >
              <ArrowDownLeft size={14} className="text-[var(--gw-muted)]" /> Catat Penjualan (Pemasukan)
            </button>
            <button
              onClick={() => setModalExpenseOpen(true)}
              className="gw-subcard flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--gw-ink)] hover:brightness-105 transition-all"
            >
              <ArrowUpRight size={14} className="text-[var(--gw-muted)]" /> Catat Pengeluaran (Beban)
            </button>
            <button
              onClick={() => setModalBayarUtangOpen(true)}
              className="gw-subcard flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--gw-ink)] hover:brightness-105 transition-all"
            >
              <Wallet size={14} className="text-[var(--gw-muted)]" /> Bayar Utang Pemasok
            </button>
          </>
        )}
      </div>

      {/* Primary KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget 1: Kas & Bank (Owner only) */}
        {role === "PEMILIK" ? (
          <div
            onClick={() => setActiveTab("kas")}
            className="gw-panel p-5 cursor-pointer hover:border-[var(--gw-accent)] transition-all group"
          >
            <div className="flex justify-between items-center text-[var(--gw-muted)] text-xs mb-3">
              <span>Total Kas & Bank Aktif</span>
              <div className="gw-subcard p-2 text-[var(--gw-ink)] group-hover:scale-105 transition-transform">
                <Wallet size={17} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-[var(--gw-ink)]">
              {formatRupiah(totalCashBalance)}
            </p>
            <p className="text-[11px] text-[var(--gw-muted)] mt-1.5 flex items-center justify-between">
              <span>3 Dompet (Kas, BCA, BRI)</span>
              <span className="text-[var(--gw-ink)] flex items-center font-medium">
                Lihat Detail <ArrowUpRight size={12} />
              </span>
            </p>
          </div>
        ) : (
          <div className="gw-panel p-5">
            <div className="flex justify-between items-center text-[var(--gw-muted)] text-xs mb-3">
              <span>Tingkat Kelangsungan Hidup</span>
              <div className="gw-subcard p-2 text-[var(--gw-ink)]">
                <ShieldCheck size={17} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-[var(--gw-ink)]">
              {avgSurvivalRate}%
            </p>
            <p className="text-[11px] text-[var(--gw-muted)] mt-1.5">
              Rata-rata Survival Rate (SR) seluruh kolam
            </p>
          </div>
        )}

        {/* Widget 2: Operasional (Stok Gurame Ekor & Kg) */}
        <div
          onClick={() => setActiveTab("kolam")}
          className="gw-panel p-5 cursor-pointer hover:border-[var(--gw-accent)] transition-all group"
        >
          <div className="flex justify-between items-center text-[var(--gw-muted)] text-xs mb-3">
            <span>Stok Ikan Aktif di Kolam</span>
            <div className="gw-subcard p-2 text-[var(--gw-ink)] group-hover:scale-105 transition-transform">
              <Fish size={17} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-[var(--gw-ink)]">
            {formatNumber(totalActiveFishCount)}{" "}
            <span className="text-sm font-normal text-[var(--gw-muted)]">Ekor</span>
          </p>
          <p className="text-[11px] text-[var(--gw-muted)] mt-1.5 flex items-center justify-between">
            <span>Estimasi Bobot: ~{formatNumber(totalActiveFishWeight)} Kg</span>
            <span className="text-[var(--gw-ink)] font-medium">{ponds.length} Kolam</span>
          </p>
        </div>

        {/* Widget 3: Utang & Piutang (Owner only) */}
        {role === "PEMILIK" ? (
          <div
            onClick={() => setActiveTab("utang")}
            className="gw-panel p-5 cursor-pointer hover:border-[var(--gw-accent)] transition-all group"
          >
            <div className="flex justify-between items-center text-[var(--gw-muted)] text-xs mb-3">
              <span>Utang Pemasok & Piutang</span>
              <div className="gw-subcard p-2 text-[var(--gw-ink)] group-hover:scale-105 transition-transform">
                <Scale size={17} />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-[var(--gw-muted)] uppercase tracking-wider block">Utang:</span>
                <span className="text-lg font-bold text-[var(--gw-ink)]">
                  {formatRupiah(totalPayableDue)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[var(--gw-muted)] uppercase tracking-wider block">Piutang:</span>
                <span className="text-sm font-bold text-[var(--gw-ink)]">
                  {formatRupiah(totalReceivableDue)}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--gw-muted)] mt-2 flex items-center justify-between">
              <span>Kartu Utang Aktif</span>
              <span className="text-[var(--gw-ink)] flex items-center font-medium">
                Kelola <ArrowUpRight size={12} />
              </span>
            </p>
          </div>
        ) : (
          <div className="gw-panel p-5">
            <div className="flex justify-between items-center text-[var(--gw-muted)] text-xs mb-3">
              <span>Total Kolam Aktif</span>
              <div className="gw-subcard p-2 text-[var(--gw-ink)]">
                <Layers size={17} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-[var(--gw-ink)]">
              {ponds.length} Kolam
            </p>
            <p className="text-[11px] text-[var(--gw-muted)] mt-1.5">
              Bibit, Pembesaran, Panen & Karantina
            </p>
          </div>
        )}

        {/* Widget 4: Laba Bersih Bulan Berjalan (Owner only) */}
        {role === "PEMILIK" ? (
          <div
            onClick={() => setActiveTab("laporan")}
            className="gw-panel p-5 cursor-pointer hover:border-[var(--gw-accent)] transition-all group"
          >
            <div className="flex justify-between items-center text-[var(--gw-muted)] text-xs mb-3">
              <span>Laba Bersih Bulan Ini</span>
              <div className="gw-subcard p-2 text-[var(--gw-ink)] group-hover:scale-105 transition-transform">
                <TrendingUp size={17} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-[var(--gw-ink)]">
              {formatRupiah(incomeStatement.netProfit)}
            </p>
            <p className="text-[11px] text-[var(--gw-muted)] mt-1.5 flex items-center justify-between">
              <span>Laba Rugi Otomatis</span>
              <span className="text-[var(--gw-ink)] flex items-center font-medium">
                Buka Laporan <ArrowUpRight size={12} />
              </span>
            </p>
          </div>
        ) : (
          <div className="gw-panel p-5">
            <div className="flex justify-between items-center text-[var(--gw-muted)] text-xs mb-3">
              <span>Log Mutasi Stok</span>
              <div className="gw-subcard p-2 text-[var(--gw-ink)]">
                <Calendar size={17} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-[var(--gw-ink)]">
              {stockMutations.length} Aktivitas
            </p>
            <p className="text-[11px] text-[var(--gw-muted)] mt-1.5">
              Catatan Tebar, Panen & Kematian
            </p>
          </div>
        )}
      </div>

      {/* Middle Section: Chart & Operational Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (Pemasukan vs Pengeluaran) */}
        {role === "PEMILIK" ? (
          <div className="lg:col-span-2 gw-panel p-5">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-[var(--gw-ink)]">
                  Tren Keuangan: Penjualan vs Pengeluaran
                </h3>
                <p className="text-[11px] text-[var(--gw-muted)]">
                  Arus transaksi budidaya gurame selama November 2026
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-[var(--gw-ink)] font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--gw-ink)]" />
                  Penjualan
                </span>
                <span className="flex items-center gap-1.5 text-[var(--gw-muted)] font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--gw-muted)]" />
                  Pengeluaran
                </span>
              </div>
            </div>

            {/* Custom Bar Chart with monochrome bars */}
            <div className="h-52 w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-[var(--gw-line)]">
              {trendPoints.map((p, idx) => {
                const incomeH = maxVal > 0 ? (p.income / maxVal) * 140 : 0;
                const expenseH = maxVal > 0 ? (p.expense / maxVal) * 140 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-1 h-full group">
                    <div className="w-full flex items-end justify-center gap-1.5">
                      {p.income > 0 && (
                        <div
                          style={{ height: `${Math.max(8, incomeH)}px` }}
                          className="w-1/2 max-w-[18px] bg-[var(--gw-ink)] rounded-t-sm transition-all relative"
                          title={`Pemasukan: ${formatRupiah(p.income)}`}
                        />
                      )}
                      {p.expense > 0 && (
                        <div
                          style={{ height: `${Math.max(8, expenseH)}px` }}
                          className="w-1/2 max-w-[18px] bg-[var(--gw-muted)] opacity-55 rounded-t-sm transition-all group-hover:opacity-80 relative"
                          title={`Pengeluaran: ${formatRupiah(p.expense)}`}
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--gw-muted)] mt-2">{p.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-xs text-[var(--gw-muted)] pt-3 px-1">
              <span>Total Penjualan: <strong className="text-[var(--gw-ink)]">{formatRupiah(incomeStatement.totalRevenue)}</strong></span>
              <span>Total Beban: <strong className="text-[var(--gw-ink)]">{formatRupiah(incomeStatement.totalExpense)}</strong></span>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 gw-panel p-5">
            <h3 className="text-sm font-semibold tracking-tight text-[var(--gw-ink)] mb-1">
              Panduan Operasional Kolam Gurame
            </h3>
            <p className="text-[11px] text-[var(--gw-muted)] mb-4">
              Standar operasional pemberian pakan & monitoring kematian harian
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="gw-subcard p-3.5 space-y-1.5">
                <span className="font-semibold text-[var(--gw-ink)]">1. Jadwal Pakan</span>
                <p className="text-[11px] text-[var(--gw-muted)]">
                  Pemberian pakan 2x sehari (08.00 pagi dan 16.30 sore) dengan dosis 2-3% dari total biomasa ikan per kolam.
                </p>
              </div>
              <div className="gw-subcard p-3.5 space-y-1.5">
                <span className="font-semibold text-[var(--gw-ink)]">2. Sirkulasi & Aerasi</span>
                <p className="text-[11px] text-[var(--gw-muted)]">
                  Pastikan pompa aerator aktif saat malam hari (22.00 - 05.00) untuk menjaga kadar oksigen terlarut &gt; 4 mg/L.
                </p>
              </div>
              <div className="gw-subcard p-3.5 space-y-1.5">
                <span className="font-semibold text-[var(--gw-ink)]">3. Pencatatan Mortalitas</span>
                <p className="text-[11px] text-[var(--gw-muted)]">
                  Ikan mati wajib diangkat segera dan dicatat dalam tombol <strong>Catat Kematian</strong> untuk akurasi stok & Survival Rate.
                </p>
              </div>
              <div className="gw-subcard p-3.5 space-y-1.5">
                <span className="font-semibold text-[var(--gw-ink)]">4. Karantina Penyakit</span>
                <p className="text-[11px] text-[var(--gw-muted)]">
                  Pindahkan ikan bergejala jamur/bercak putih ke Kolam D Karantina dan berikan larutan garam krosok 1-2%.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pond Status Snapshot */}
        <div className="gw-panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold tracking-tight text-[var(--gw-ink)]">
                Status Kolam & Survival Rate
              </h3>
              <button
                onClick={() => setActiveTab("kolam")}
                className="text-xs text-[var(--gw-muted)] hover:text-[var(--gw-ink)] underline"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-3.5">
              {ponds.map((p) => (
                <div key={p.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[var(--gw-ink)]">{p.name}</span>
                    <span className="text-[var(--gw-muted)]">
                      {formatNumber(p.currentEkor)} ekor ({p.survivalRate}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--gw-line)] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (p.currentEkor / p.capacityEkor) * 100)}%` }}
                      className="h-full bg-[var(--gw-ink)] rounded-full opacity-80"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--gw-muted)]">
                    <span>Est: {formatNumber(p.currentKgEstimasi)} Kg</span>
                    <span>Kapasitas: {formatNumber(p.capacityEkor)} ekor</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[var(--gw-line)] flex justify-between items-center text-xs">
            <span className="text-[var(--gw-muted)]">Total Populasi:</span>
            <strong className="text-[var(--gw-ink)]">{formatNumber(totalActiveFishCount)} Ekor</strong>
          </div>
        </div>
      </div>

      {/* Recent Activity Ledger (Sales & Stock) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales (Owner) or Stock Mutations (Worker) */}
        {role === "PEMILIK" ? (
          <div className="gw-panel p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold tracking-tight text-[var(--gw-ink)]">
                Penjualan Ikan Terakhir
              </h3>
              <button
                onClick={() => setActiveTab("penjualan")}
                className="text-xs text-[var(--gw-muted)] hover:text-[var(--gw-ink)] underline"
              >
                Semua Penjualan
              </button>
            </div>
            <div className="space-y-2.5">
              {sales.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="gw-subcard p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--gw-line)] text-[var(--gw-ink)]">
                      <Fish size={15} />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--gw-ink)]">{s.buyerName}</p>
                      <p className="text-[11px] text-[var(--gw-muted)]">
                        {s.date} · {s.weightKg} Kg ({s.quantityEkor} ekor)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--gw-ink)]">
                      {formatRupiah(s.totalAmount)}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--gw-line)] text-[var(--gw-muted)]">
                      {s.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="gw-panel p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold tracking-tight text-[var(--gw-ink)]">
                Aktivitas Tebar Bibit Terkini
              </h3>
              <button
                onClick={() => setActiveTab("kolam")}
                className="text-xs text-[var(--gw-muted)] hover:text-[var(--gw-ink)] underline"
              >
                Kelola Kolam
              </button>
            </div>
            <div className="space-y-2.5">
              {stockMutations
                .filter((m) => m.type === "TEBAR")
                .slice(0, 4)
                .map((m) => (
                  <div
                    key={m.id}
                    className="gw-subcard p-3 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[var(--gw-ink)]">{m.pondName}</p>
                      <p className="text-[11px] text-[var(--gw-muted)]">
                        {m.date} · {m.note}
                      </p>
                    </div>
                    <span className="font-bold text-[var(--gw-ink)]">
                      +{formatNumber(m.ekor)} Ekor ({m.weightKg} Kg)
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent Stock Mutations */}
        <div className="gw-panel p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold tracking-tight text-[var(--gw-ink)]">
              Riwayat Mutasi Stok Kolam
            </h3>
            <button
              onClick={() => setActiveTab("kolam")}
              className="text-xs text-[var(--gw-muted)] hover:text-[var(--gw-ink)] underline"
            >
              Laporan Mutasi
            </button>
          </div>
          <div className="space-y-2.5">
            {stockMutations.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="gw-subcard p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--gw-line)] text-[var(--gw-muted)] font-mono">
                      {m.type}
                    </span>
                    <strong className="text-xs text-[var(--gw-ink)]">{m.pondName}</strong>
                  </div>
                  <p className="text-[11px] text-[var(--gw-muted)] mt-1">
                    {m.date} · {m.note}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-[var(--gw-ink)]">
                    {m.type === "TEBAR" ? "+" : "−"}
                    {formatNumber(m.ekor)} Ekor
                  </span>
                  <p className="text-[10px] text-[var(--gw-muted)]">{m.weightKg} Kg</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ModalPenjualan isOpen={modalSaleOpen} onClose={() => setModalSaleOpen(false)} />
      <ModalPengeluaran isOpen={modalExpenseOpen} onClose={() => setModalExpenseOpen(false)} />
      <ModalTebarBibit isOpen={modalTebarOpen} onClose={() => setModalTebarOpen(false)} />
      <ModalMortalitas isOpen={modalMortalitasOpen} onClose={() => setModalMortalitasOpen(false)} />
      <ModalBayarUtang isOpen={modalBayarUtangOpen} onClose={() => setModalBayarUtangOpen(false)} />
    </div>
  );
}
