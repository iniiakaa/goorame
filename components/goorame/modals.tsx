"use client";

import React, { useState } from "react";
import { useGoorame } from "@/lib/goorame-context";
import { X, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatRupiah } from "@/lib/goorame-accounting";
import { JournalItem } from "@/lib/goorame-types";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function GlassModal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="gw-dialog relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-[var(--gw-surface)] text-[var(--gw-ink)] border border-[var(--gw-line)] shadow-2xl"
        style={{
          boxShadow: "0 25px 60px -15px rgba(0,0,0,0.6), 0 0 0 1px var(--gw-line)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--gw-line)]">
          <h2 className="text-base font-bold tracking-tight text-[var(--gw-ink)]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[var(--gw-hover)] transition-colors text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}

// 1. Modal Catat Penjualan (Pemasukan)
export function ModalPenjualan({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { ponds, cashAccounts, addSale } = useGoorame();
  const [buyerName, setBuyerName] = useState("");
  const [pondId, setPondId] = useState(ponds[2]?.id || ponds[0]?.id || "");
  const [weightKg, setWeightKg] = useState<number>(100);
  const [quantityEkor, setQuantityEkor] = useState<number>(140);
  const [pricePerKg, setPricePerKg] = useState<number>(44000);
  const [paymentStatus, setPaymentStatus] = useState<"LUNAS" | "TEMPO">("LUNAS");
  const [cashAccountId, setCashAccountId] = useState(cashAccounts[0]?.id || "");
  const [dueDate, setDueDate] = useState("2026-11-25");
  const [note, setNote] = useState("");

  const total = weightKg * pricePerKg;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName || weightKg <= 0 || pricePerKg <= 0) return;
    addSale({
      buyerName,
      pondId: pondId || undefined,
      weightKg,
      quantityEkor,
      pricePerKg,
      paymentStatus,
      cashAccountId: paymentStatus === "LUNAS" ? cashAccountId : undefined,
      dueDate: paymentStatus === "TEMPO" ? dueDate : undefined,
      note,
    });
    onClose();
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Catat Penjualan Gurame (Pemasukan)">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Nama Pembeli / Restoran</label>
            <input
              type="text"
              required
              placeholder="Contoh: RM Gurame Sedap"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Kolam Asal (Memotong Stok)</label>
            <select
              value={pondId}
              onChange={(e) => setPondId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            >
              <option value="">-- Tanpa Potong Stok Kolam --</option>
              {ponds.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stok: {p.currentEkor} ekor / {p.currentKgEstimasi} kg)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Berat Total (Kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              required
              value={weightKg}
              onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Estimasi Jumlah (Ekor)</label>
            <input
              type="number"
              min="1"
              required
              value={quantityEkor}
              onChange={(e) => setQuantityEkor(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Harga Jual per Kg (Rp)</label>
            <input
              type="number"
              min="1000"
              step="500"
              required
              value={pricePerKg}
              onChange={(e) => setPricePerKg(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            />
          </div>
        </div>

        <div className="gw-subcard p-3 flex justify-between items-center">
          <span className="font-medium text-[var(--gw-muted)]">Total Penjualan:</span>
          <span className="text-base font-bold text-[var(--gw-ink)]">
            {formatRupiah(total)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Status Pembayaran</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as "LUNAS" | "TEMPO")}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            >
              <option value="LUNAS">Lunas (Langsung Masuk Kas/Bank)</option>
              <option value="TEMPO">Tempo / Piutang Usaha</option>
            </select>
          </div>

          {paymentStatus === "LUNAS" ? (
            <div>
              <label className="block mb-1 font-medium text-[var(--gw-muted)]">Rekening Penerima</label>
              <select
                value={cashAccountId}
                onChange={(e) => setCashAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
              >
                {cashAccounts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({formatRupiah(c.balance)})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block mb-1 font-medium text-[var(--gw-muted)]">Tanggal Jatuh Tempo Piutang</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium text-[var(--gw-muted)]">Catatan Tambahan</label>
          <input
            type="text"
            placeholder="Ukuran rata-rata, keterangan panen..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--gw-line)] hover:bg-[var(--gw-hover)] text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[var(--gw-button)] text-[var(--gw-button-ink)] font-medium hover:brightness-110"
          >
            Simpan & Jurnal Otomatis
          </button>
        </div>
      </form>
    </GlassModal>
  );
}

// 2. Modal Catat Pengeluaran (Beban Operasional)
export function ModalPengeluaran({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { cashAccounts, addExpense } = useGoorame();
  const [category, setCategory] = useState<"PAKAN" | "GAJI" | "OBAT" | "OPERASIONAL">("PAKAN");
  const [nominal, setNominal] = useState<number>(1500000);
  const [cashAccountId, setCashAccountId] = useState(cashAccounts[0]?.id || "");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nominal <= 0 || !note) return;
    addExpense({
      category,
      nominal,
      cashAccountId,
      note,
    });
    onClose();
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Catat Pengeluaran Operasional">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block mb-1 font-medium text-[var(--gw-muted)]">Kategori Beban</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
          >
            <option value="PAKAN">Biaya Pakan Gurame (Akun 5001)</option>
            <option value="GAJI">Gaji / Upah Pekerja Kolam (Akun 5002)</option>
            <option value="OBAT">Obat, Suplemen & Vitamin (Akun 5003)</option>
            <option value="OPERASIONAL">Listrik Aerator, Air & Perawatan (Akun 5004)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Nominal (Rp)</label>
            <input
              type="number"
              min="1000"
              step="1000"
              required
              value={nominal}
              onChange={(e) => setNominal(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Sumber Dana (Kas / Bank)</label>
            <select
              value={cashAccountId}
              onChange={(e) => setCashAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            >
              {cashAccounts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatRupiah(c.balance)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium text-[var(--gw-muted)]">Keterangan Pengeluaran</label>
          <input
            type="text"
            required
            placeholder="Contoh: Beli 5 sak pelet apung 781-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--gw-line)] hover:bg-[var(--gw-hover)] text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[var(--gw-button)] text-[var(--gw-button-ink)] font-medium hover:brightness-110"
          >
            Simpan Pengeluaran & Jurnal
          </button>
        </div>
      </form>
    </GlassModal>
  );
}

// 3. Modal Tebar Bibit
export function ModalTebarBibit({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { ponds, addTebarBibit } = useGoorame();
  const [pondId, setPondId] = useState(ponds[0]?.id || "");
  const [ekor, setEkor] = useState<number>(2000);
  const [weightKg, setWeightKg] = useState<number>(40);
  const [note, setNote] = useState("Tebar bibit gurame ukuran silet dari Balai Benih");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pondId || ekor <= 0) return;
    addTebarBibit({
      pondId,
      ekor,
      weightKg,
      note,
    });
    onClose();
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Tebar Bibit Ikan Gurame">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block mb-1 font-medium text-[var(--gw-muted)]">Kolam Tujuan Tebar</label>
          <select
            value={pondId}
            onChange={(e) => setPondId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
          >
            {ponds.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Kapasitas: {p.capacityEkor} ekor | Saat ini: {p.currentEkor} ekor)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Jumlah Bibit (Ekor)</label>
            <input
              type="number"
              min="10"
              required
              value={ekor}
              onChange={(e) => setEkor(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Total Bobot Awal (Kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              required
              value={weightKg}
              onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium text-[var(--gw-muted)]">Keterangan Bibit</label>
          <input
            type="text"
            required
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--gw-line)] hover:bg-[var(--gw-hover)] text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[var(--gw-button)] text-[var(--gw-button-ink)] font-medium hover:brightness-110"
          >
            Tambah Bibit ke Kolam
          </button>
        </div>
      </form>
    </GlassModal>
  );
}

// 4. Modal Catat Kematian (Mortalitas)
export function ModalMortalitas({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { ponds, addMortalitas } = useGoorame();
  const [pondId, setPondId] = useState(ponds[0]?.id || "");
  const [ekor, setEkor] = useState<number>(25);
  const [weightKg, setWeightKg] = useState<number>(2.5);
  const [note, setNote] = useState("Kematian harian wajar saat cuaca hujan");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pondId || ekor <= 0) return;
    addMortalitas({
      pondId,
      ekor,
      weightKg,
      note,
    });
    onClose();
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Catat Kematian / Mortalitas Ikan">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block mb-1 font-medium text-[var(--gw-muted)]">Kolam Terjadinya Kematian</label>
          <select
            value={pondId}
            onChange={(e) => setPondId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
          >
            {ponds.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Populasi aktif: {p.currentEkor} ekor | SR: {p.survivalRate}%)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Jumlah Ikan Mati (Ekor)</label>
            <input
              type="number"
              min="1"
              required
              value={ekor}
              onChange={(e) => setEkor(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Estimasi Bobot Hilang (Kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              required
              value={weightKg}
              onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium text-[var(--gw-muted)]">Penyebab & Catatan Teknis</label>
          <input
            type="text"
            required
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
          />
        </div>

        <div className="gw-subcard p-3 text-[var(--gw-muted)]">
          Mencatat mortalitas akan otomatis mengurangi stok fisik kolam dan memperbarui tingkat kelangsungan hidup (Survival Rate).
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--gw-line)] hover:bg-[var(--gw-hover)] text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[var(--gw-button)] text-[var(--gw-button-ink)] font-medium hover:brightness-110"
          >
            Catat Mortalitas
          </button>
        </div>
      </form>
    </GlassModal>
  );
}

// 5. Modal Tambah Faktur Utang Pemasok
export function ModalFakturUtang({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addSupplierInvoice } = useGoorame();
  const [supplierName, setSupplierName] = useState("");
  const [itemCategory, setItemCategory] = useState<"Pakan" | "Bibit" | "Obat / Suplemen" | "Operasional">("Pakan");
  const [totalAmount, setTotalAmount] = useState<number>(5000000);
  const [dueDate, setDueDate] = useState("2026-11-30");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || totalAmount <= 0) return;
    addSupplierInvoice({
      supplierName,
      itemCategory,
      totalAmount,
      dueDate,
      note,
    });
    onClose();
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Catat Faktur Pembelian Tempo (Utang Pemasok)">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Nama Pemasok / Toko</label>
            <input
              type="text"
              required
              placeholder="Contoh: CV Pakan Mandiri"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Kategori Barang</label>
            <select
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            >
              <option value="Pakan">Pakan Pelet Gurame</option>
              <option value="Bibit">Bibit Gurame</option>
              <option value="Obat / Suplemen">Obat / Probiotik / Suplemen</option>
              <option value="Operasional">Peralatan / Operasional</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Total Nilai Faktur (Rp)</label>
            <input
              type="number"
              min="10000"
              step="10000"
              required
              value={totalAmount}
              onChange={(e) => setTotalAmount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Tanggal Jatuh Tempo</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium text-[var(--gw-muted)]">Catatan Barang / Faktur</label>
          <input
            type="text"
            placeholder="No nota fisik, jumlah sak, dsb..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--gw-line)] hover:bg-[var(--gw-hover)] text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[var(--gw-button)] text-[var(--gw-button-ink)] font-medium hover:brightness-110"
          >
            Simpan Faktur Utang & Jurnal
          </button>
        </div>
      </form>
    </GlassModal>
  );
}

// 6. Modal Bayar Utang Pemasok
export function ModalBayarUtang({
  isOpen,
  onClose,
  initialInvoiceId,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialInvoiceId?: string;
}) {
  const { supplierInvoices, cashAccounts, addSupplierPayment } = useGoorame();
  const unpaidInvoices = supplierInvoices.filter((i) => i.status !== "LUNAS");
  const [invoiceId, setInvoiceId] = useState(initialInvoiceId || unpaidInvoices[0]?.id || "");
  const [cashAccountId, setCashAccountId] = useState(cashAccounts[0]?.id || "");

  const selectedInvoice = supplierInvoices.find((i) => i.id === invoiceId);
  const remaining = selectedInvoice ? selectedInvoice.totalAmount - selectedInvoice.paidAmount : 0;
  const [amount, setAmount] = useState<number>(remaining || 1000000);
  const [note, setNote] = useState("Pembayaran cicilan utang pakan");

  React.useEffect(() => {
    if (selectedInvoice) {
      setAmount(selectedInvoice.totalAmount - selectedInvoice.paidAmount);
    }
  }, [invoiceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || amount <= 0) return;
    addSupplierPayment({
      invoiceId,
      amount,
      cashAccountId,
      note,
    });
    onClose();
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Bayar / Cicil Utang Pemasok">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block mb-1 font-medium text-[var(--gw-muted)]">Pilih Faktur Tagihan</label>
          <select
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
          >
            {unpaidInvoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.supplierName} ({inv.invoiceNumber}) - Sisa: {formatRupiah(inv.totalAmount - inv.paidAmount)}
              </option>
            ))}
          </select>
        </div>

        {selectedInvoice && (
          <div className="gw-subcard p-3 flex justify-between">
            <div>
              <p className="font-semibold text-[var(--gw-ink)]">{selectedInvoice.supplierName}</p>
              <p className="text-[10px] text-[var(--gw-muted)]">Jatuh Tempo: {selectedInvoice.dueDate}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[var(--gw-muted)]">Sisa Tagihan:</p>
              <p className="font-bold text-[var(--gw-ink)]">{formatRupiah(remaining)}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Jumlah Pembayaran (Rp)</label>
            <input
              type="number"
              min="1000"
              max={remaining}
              step="1000"
              required
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Rekening Pembayaran (Kas/Bank)</label>
            <select
              value={cashAccountId}
              onChange={(e) => setCashAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            >
              {cashAccounts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatRupiah(c.balance)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium text-[var(--gw-muted)]">Keterangan Transfer / Bayar</label>
          <input
            type="text"
            required
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--gw-line)] hover:bg-[var(--gw-hover)] text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[var(--gw-button)] text-[var(--gw-button-ink)] font-medium hover:brightness-110"
          >
            Konfirmasi Pembayaran
          </button>
        </div>
      </form>
    </GlassModal>
  );
}

// 7. Modal Transfer Antar Kas / Bank
export function ModalTransferKas({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { cashAccounts, addCashTransfer } = useGoorame();
  const [fromAccountId, setFromAccountId] = useState(cashAccounts[1]?.id || cashAccounts[0]?.id || "");
  const [toAccountId, setToAccountId] = useState(cashAccounts[0]?.id || "");
  const [amount, setAmount] = useState<number>(2000000);
  const [note, setNote] = useState("Tarik tunai operasional harian tambak");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccountId === toAccountId || amount <= 0) return;
    addCashTransfer({
      fromAccountId,
      toAccountId,
      amount,
      note,
    });
    onClose();
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Mutasi / Transfer Antar Kas & Bank">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Dari Rekening (Sumber)</label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            >
              {cashAccounts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatRupiah(c.balance)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Ke Rekening (Tujuan)</label>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            >
              {cashAccounts.map((c) => (
                <option key={c.id} value={c.id} disabled={c.id === fromAccountId}>
                  {c.name} ({formatRupiah(c.balance)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-1 font-medium text-[var(--gw-muted)]">Nominal Transfer (Rp)</label>
          <input
            type="number"
            min="10000"
            step="10000"
            required
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium text-[var(--gw-muted)]">Keterangan Mutasi</label>
          <input
            type="text"
            required
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
          />
        </div>

        <p className="text-[11px] text-[var(--gw-muted)]">
          * Transfer antar kas/bank tidak mempengaruhi Laporan Laba Rugi, hanya memindahkan likuiditas antar dompet usaha.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--gw-line)] hover:bg-[var(--gw-hover)] text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[var(--gw-button)] text-[var(--gw-button-ink)] font-medium hover:brightness-110"
          >
            Eksekusi Transfer & Jurnal
          </button>
        </div>
      </form>
    </GlassModal>
  );
}

// 8. Modal Jurnal Penyesuaian Manual (Strict Double-Entry Check)
export function ModalManualJournal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { chartOfAccounts, addManualJournal } = useGoorame();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [items, setItems] = useState<JournalItem[]>([
    {
      accountCode: "5004",
      accountName: "Beban Operasional Kolam (Listrik/Air)",
      debit: 500000,
      credit: 0,
    },
    {
      accountCode: "1001",
      accountName: "Kas di Tangan",
      debit: 0,
      credit: 500000,
    },
  ]);

  const totalDebit = items.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
  const totalCredit = items.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleItemChange = (index: number, field: keyof JournalItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      if (field === "accountCode") {
        const found = chartOfAccounts.find((a) => a.code === value);
        updated[index] = {
          ...updated[index],
          accountCode: value,
          accountName: found ? found.name : updated[index].accountName,
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        accountCode: chartOfAccounts[0].code,
        accountName: chartOfAccounts[0].name,
        debit: 0,
        credit: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 2) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = addManualJournal({
      date,
      description,
      items,
    });

    if (!res.success) {
      setErrorMessage(res.error || "Jurnal tidak seimbang.");
      return;
    }

    onClose();
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Entri Jurnal Penyesuaian Manual (Double-Entry)">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Tanggal Jurnal</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium text-[var(--gw-muted)]">Deskripsi / Keterangan Penyesuaian</label>
            <input
              type="text"
              required
              placeholder="Contoh: Penyesuaian persediaan pakan akhir bulan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)] outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-[var(--gw-ink)]">Baris Rekening Akuntansi</span>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-[11px] text-[var(--gw-muted)] hover:text-[var(--gw-ink)] font-medium underline"
            >
              <Plus size={14} /> Tambah Baris
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div key={idx} className="gw-subcard flex gap-2 items-center p-2">
                <div className="flex-1">
                  <select
                    value={item.accountCode}
                    onChange={(e) => handleItemChange(idx, "accountCode", e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded bg-[var(--gw-surface)] border border-[var(--gw-line)] text-[var(--gw-ink)]"
                  >
                    {chartOfAccounts.map((a) => (
                      <option key={a.code} value={a.code}>
                        {a.code} - {a.name} ({a.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    placeholder="Debit"
                    value={item.debit || ""}
                    onChange={(e) => handleItemChange(idx, "debit", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-xs rounded bg-[var(--gw-surface)] border border-[var(--gw-line)] text-right text-[var(--gw-ink)]"
                  />
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    placeholder="Kredit"
                    value={item.credit || ""}
                    onChange={(e) => handleItemChange(idx, "credit", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-xs rounded bg-[var(--gw-surface)] border border-[var(--gw-line)] text-right text-[var(--gw-ink)]"
                  />
                </div>
                {items.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1 text-[var(--gw-muted)] hover:text-[var(--gw-ink)] rounded"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Balance Validation Bar */}
        <div className="gw-subcard p-3 flex items-center justify-between text-xs font-medium text-[var(--gw-ink)]">
          <div className="flex items-center gap-2">
            {isBalanced ? <CheckCircle2 size={16} className="text-[var(--gw-muted)]" /> : <AlertCircle size={16} className="text-[var(--gw-muted)]" />}
            <span>
              {isBalanced
                ? "Jurnal Seimbang (Debet == Kredit)"
                : `Tidak Seimbang! Selisih: ${formatRupiah(Math.abs(totalDebit - totalCredit))}`}
            </span>
          </div>
          <div className="flex gap-4">
            <span>Debet: {formatRupiah(totalDebit)}</span>
            <span>Kredit: {formatRupiah(totalCredit)}</span>
          </div>
        </div>

        {errorMessage && (
          <div className="gw-subcard p-3 text-[var(--gw-ink)] text-xs border-dashed">
            {errorMessage}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--gw-line)] hover:bg-[var(--gw-hover)] text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!isBalanced}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isBalanced
                ? "bg-[var(--gw-button)] text-[var(--gw-button-ink)] hover:brightness-110"
                : "border border-[var(--gw-line)] text-[var(--gw-muted)] cursor-not-allowed opacity-50"
            }`}
          >
            Simpan Jurnal Penyesuaian
          </button>
        </div>
      </form>
    </GlassModal>
  );
}
