"use client";

import React, { useState } from "react";
import { useGoorame } from "@/lib/goorame-context";
import { formatNumber, exportToCSV } from "@/lib/goorame-accounting";
import {
  Fish,
  PlusCircle,
  AlertTriangle,
  Download,
  Search,
  Activity,
  Layers,
} from "lucide-react";
import { ModalTebarBibit, ModalMortalitas } from "./modals";

export function KolamView() {
  const { ponds, stockMutations } = useGoorame();
  const [modalTebarOpen, setModalTebarOpen] = useState(false);
  const [modalMortalitasOpen, setModalMortalitasOpen] = useState(false);
  const [filterPond, setFilterPond] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMutations = stockMutations.filter((m) => {
    const matchPond = filterPond === "ALL" || m.pondId === filterPond;
    const matchSearch =
      m.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.pondName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchPond && matchSearch;
  });

  const handleExportCSV = () => {
    const rows = [
      ["Tanggal", "Nama Kolam", "Jenis Mutasi", "Jumlah Ekor", "Bobot (Kg)", "Keterangan", "Ref ID"],
      ...filteredMutations.map((m) => [
        m.date,
        m.pondName,
        m.type,
        String(m.ekor),
        String(m.weightKg),
        m.note,
        m.referenceId || "-",
      ]),
    ];
    exportToCSV("laporan_mutasi_stok_gurame.csv", rows);
  };

  const totalPopulasi = ponds.reduce((sum, p) => sum + p.currentEkor, 0);
  const totalBiomasa = ponds.reduce((sum, p) => sum + p.currentKgEstimasi, 0);
  const totalPanenAll = ponds.reduce((sum, p) => sum + p.totalPanen, 0);
  const totalMatiAll = ponds.reduce((sum, p) => sum + p.totalMati, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--gw-ink)] flex items-center gap-2">
            <Fish size={22} className="text-[var(--gw-ink)]" /> Manajemen Stok Gurame & Multi-Kolam
          </h2>
          <p className="text-xs text-[var(--gw-muted)] mt-1">
            Pantau populasi ikan per kolam, hitung Survival Rate (SR), dan catat mutasi tebar, panen, serta kematian.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalTebarOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--gw-button)] text-[var(--gw-button-ink)] hover:brightness-110 shadow-sm transition-all"
          >
            <PlusCircle size={15} /> Tebar Bibit (In)
          </button>
          <button
            onClick={() => setModalMortalitasOpen(true)}
            className="gw-subcard flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--gw-ink)] hover:brightness-105 shadow-sm transition-all"
          >
            <AlertTriangle size={15} className="text-[var(--gw-muted)]" /> Catat Kematian (Out)
          </button>
        </div>
      </div>

      {/* Aggregate Overview Bar */}
      <div className="gw-panel grid grid-cols-2 md:grid-cols-5 gap-3 p-4 text-xs">
        <div>
          <span className="text-[var(--gw-muted)] block text-[11px]">Total Kolam Aktif</span>
          <strong className="text-base text-[var(--gw-ink)]">{ponds.length} Kolam</strong>
        </div>
        <div>
          <span className="text-[var(--gw-muted)] block text-[11px]">Populasi Total (Ekor)</span>
          <strong className="text-base text-[var(--gw-ink)]">{formatNumber(totalPopulasi)} Ekor</strong>
        </div>
        <div>
          <span className="text-[var(--gw-muted)] block text-[11px]">Estimasi Biomasa</span>
          <strong className="text-base text-[var(--gw-ink)]">~{formatNumber(totalBiomasa)} Kg</strong>
        </div>
        <div>
          <span className="text-[var(--gw-muted)] block text-[11px]">Kumulatif Panen</span>
          <strong className="text-base text-[var(--gw-ink)]">
            {formatNumber(totalPanenAll)} Ekor
          </strong>
        </div>
        <div>
          <span className="text-[var(--gw-muted)] block text-[11px]">Total Mortalitas</span>
          <strong className="text-base text-[var(--gw-ink)]">{formatNumber(totalMatiAll)} Ekor</strong>
        </div>
      </div>

      {/* Pond Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ponds.map((pond) => (
          <div
            key={pond.id}
            className="gw-panel p-5 flex flex-col justify-between hover:border-[var(--gw-accent)] transition-all"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-sm text-[var(--gw-ink)]">{pond.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--gw-line)] text-[var(--gw-muted)] mt-1 inline-block">
                    {pond.type} · {pond.dimension}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg border border-[var(--gw-line)] text-[var(--gw-ink)]">
                    SR: {pond.survivalRate}%
                  </span>
                </div>
              </div>

              {/* Progress bar of current capacity */}
              <div className="space-y-1 my-3">
                <div className="flex justify-between text-[11px] text-[var(--gw-muted)]">
                  <span>Kepadatan Kolam:</span>
                  <span>{Math.round((pond.currentEkor / pond.capacityEkor) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--gw-line)] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (pond.currentEkor / pond.capacityEkor) * 100)}%` }}
                    className="h-full bg-[var(--gw-ink)] rounded-full opacity-80"
                  />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="gw-subcard p-2">
                  <span className="text-[10px] text-[var(--gw-muted)] block">Stok Aktif</span>
                  <strong className="text-[var(--gw-ink)]">{formatNumber(pond.currentEkor)} Ekor</strong>
                </div>
                <div className="gw-subcard p-2">
                  <span className="text-[10px] text-[var(--gw-muted)] block">Est. Berat</span>
                  <strong className="text-[var(--gw-ink)]">{formatNumber(pond.currentKgEstimasi)} Kg</strong>
                </div>
                <div className="gw-subcard p-2">
                  <span className="text-[10px] text-[var(--gw-muted)] block">Total Tebar</span>
                  <span className="text-[var(--gw-ink)] font-medium">+{formatNumber(pond.totalTebar)}</span>
                </div>
                <div className="gw-subcard p-2">
                  <span className="text-[10px] text-[var(--gw-muted)] block">Mortalitas</span>
                  <span className="text-[var(--gw-muted)] font-medium">−{formatNumber(pond.totalMati)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[var(--gw-line)] flex items-center justify-between text-[11px] text-[var(--gw-muted)]">
              <span>Status: <strong className="text-[var(--gw-ink)] font-semibold">{pond.status}</strong></span>
              <span>Panen: {formatNumber(pond.totalPanen)} Ekor</span>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Mutation Log Section (PRD Section 3.5) */}
      <div className="gw-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-[var(--gw-ink)] flex items-center gap-2">
              <Activity size={16} className="text-[var(--gw-muted)]" /> Laporan Mutasi Stok Ikan
            </h3>
            <p className="text-[11px] text-[var(--gw-muted)]">
              Formula: <code>Saldo Awal + Tebar (In) − Panen (Out) − Mortalitas = Saldo Akhir</code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filter Pond */}
            <select
              value={filterPond}
              onChange={(e) => setFilterPond(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            >
              <option value="ALL">Semua Kolam</option>
              {ponds.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Search */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)]">
              <Search size={14} className="text-[var(--gw-muted)]" />
              <input
                type="text"
                placeholder="Cari aktivitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Mutation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--gw-line)] text-[var(--gw-muted)] font-medium">
                <th className="pb-2.5">Tanggal</th>
                <th className="pb-2.5">Nama Kolam</th>
                <th className="pb-2.5">Tipe Mutasi</th>
                <th className="pb-2.5 text-right">Volume (Ekor)</th>
                <th className="pb-2.5 text-right">Bobot (Kg)</th>
                <th className="pb-2.5">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gw-line)]">
              {filteredMutations.map((m) => (
                <tr key={m.id} className="hover:bg-[var(--gw-surface)] transition-colors">
                  <td className="py-2.5 whitespace-nowrap text-[var(--gw-muted)]">{m.date}</td>
                  <td className="py-2.5 font-medium text-[var(--gw-ink)]">{m.pondName}</td>
                  <td className="py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--gw-line)] font-mono text-[var(--gw-muted)] font-bold">
                      {m.type}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-[var(--gw-ink)]">
                    {m.type === "TEBAR" ? "+" : "−"}
                    {formatNumber(m.ekor)} Ekor
                  </td>
                  <td className="py-2.5 text-right text-[var(--gw-muted)]">
                    {m.weightKg} Kg
                  </td>
                  <td className="py-2.5 text-[var(--gw-muted)] max-w-xs truncate">
                    {m.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModalTebarBibit isOpen={modalTebarOpen} onClose={() => setModalTebarOpen(false)} />
      <ModalMortalitas isOpen={modalMortalitasOpen} onClose={() => setModalMortalitasOpen(false)} />
    </div>
  );
}
