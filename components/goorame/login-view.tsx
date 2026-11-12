"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Fish,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useGoorame } from "@/lib/goorame-context";
import { UserRole } from "@/lib/goorame-types";

interface LoginViewProps {
  onOpenSettings?: () => void;
}

export function LoginView({ onOpenSettings }: LoginViewProps) {
  const { login } = useGoorame();
  const [selectedRole, setSelectedRole] = useState<UserRole>("PEMILIK");
  const [username, setUsername] = useState("pemilik");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === "PEMILIK") {
      setUsername("pemilik");
      setPassword("admin123");
    } else {
      setUsername("pekerja_kolam");
      setPassword("pekerja123");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage("Silakan masukkan username atau nama Anda.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      const res = login(username, password, selectedRole);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal masuk ke sistem.");
        setIsLoading(false);
      }
    }, 280);
  };

  const handleQuickLogin = (role: UserRole) => {
    setIsLoading(true);
    setTimeout(() => {
      login(role === "PEMILIK" ? "H. Slamet (Pemilik)" : "Pak Budi (Pekerja Kolam)", "demo", role);
    }, 200);
  };

  return (
    <div className="w-full min-h-[calc(100svh-140px)] flex flex-col items-center justify-center py-6 px-4">
      {/* Centered Glass Login Card */}
      <div className="gw-glass gw-panel w-full max-w-[460px] p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl transition-all animate-[gwModalPopIn_0.32s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        {/* Subtle decorative glow orb */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none"
        />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 border border-white/25 shadow-inner mb-3 text-white">
            <Fish size={28} className="animate-pulse" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold text-white/90 tracking-wide uppercase mb-2">
            <Sparkles size={12} /> Goorame Mini-ERP
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Masuk ke Sistem
          </h1>
          <p className="text-xs text-white/75 mt-1 max-w-sm mx-auto">
            Manajemen Budidaya Gurame & Pembukuan Akuntansi Terintegrasi
          </p>
        </div>

        {/* Role Segmented Selector */}
        <div className="mb-6">
          <label className="block text-[11px] font-semibold text-white/80 uppercase tracking-wider mb-2">
            Pilih Peran Akses (RBAC)
          </label>
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/20 border border-white/15">
            <button
              type="button"
              onClick={() => handleRoleSelect("PEMILIK")}
              className={`flex flex-col items-center py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                selectedRole === "PEMILIK"
                  ? "bg-white text-zinc-950 shadow-md font-bold"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={15} />
                <span>Pemilik Bisnis</span>
              </div>
              <span className={`text-[10px] mt-0.5 ${selectedRole === "PEMILIK" ? "text-zinc-600" : "text-white/60"}`}>
                Akses Penuh Finansial
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect("PEKERJA")}
              className={`flex flex-col items-center py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                selectedRole === "PEKERJA"
                  ? "bg-white text-zinc-950 shadow-md font-bold"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <User size={15} />
                <span>Pekerja Kolam</span>
              </div>
              <span className={`text-[10px] mt-0.5 ${selectedRole === "PEKERJA" ? "text-zinc-600" : "text-white/60"}`}>
                Akses Lapangan & Stok
              </span>
            </button>
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Username / ID Pengguna
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none">
                <User size={16} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={selectedRole === "PEMILIK" ? "Contoh: pemilik" : "Contoh: pekerja_kolam"}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs font-medium focus:outline-none focus:border-white focus:bg-white/15 focus:ring-2 focus:ring-white/25 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-white">
                Kata Sandi
              </label>
              <span className="text-[10px] text-white/65">
                Default: sembarang
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs font-medium focus:outline-none focus:border-white focus:bg-white/15 focus:ring-2 focus:ring-white/25 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-white/85">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-white/30 bg-white/10 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-[11px]">Ingat sesi login</span>
            </label>
            <span className="text-[11px] text-white/70 italic">
              Akses Lokal Terenkripsi
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] shadow-lg transition-all cursor-pointer mt-2 disabled:opacity-70"
          >
            {isLoading ? (
              <span className="inline-block animate-spin mr-2">⏳</span>
            ) : (
              <>
                <span>Masuk ke Workspace</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/15" />
          </div>
          <span className="relative px-3 bg-zinc-900/60 backdrop-blur-md rounded-full text-[10px] uppercase font-semibold text-white/60 tracking-wider">
            Atau Masuk Cepat (1-Klik Demo)
          </span>
        </div>

        {/* Quick 1-Click Demo Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleQuickLogin("PEMILIK")}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <ShieldCheck size={15} className="text-emerald-400" />
            <div className="text-left">
              <div className="font-semibold leading-tight">Pemilik</div>
              <div className="text-[9px] text-white/60">H. Slamet</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("PEKERJA")}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <User size={15} className="text-sky-400" />
            <div className="text-left">
              <div className="font-semibold leading-tight">Pekerja</div>
              <div className="text-[9px] text-white/60">Pak Budi</div>
            </div>
          </button>
        </div>

        {/* System Badges & Footer */}
        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-center gap-3 text-[10px] text-white/65">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-400" />
            Double-Entry Accounting
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-400" />
            Survival Rate Tracker
          </span>
        </div>
      </div>
    </div>
  );
}

