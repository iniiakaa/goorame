"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Home,
  Fish,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Wallet,
  BookOpen,
  FileText,
  Settings2,
  Sun,
  Moon,
  Bell,
  Layers,
  X,
  Check,
  ShieldCheck,
  User,
  LogOut,
  Database,
} from "lucide-react";
import { GoorameProvider, useGoorame } from "@/lib/goorame-context";
import { LoginView } from "@/components/goorame/login-view";
import { DashboardView } from "@/components/goorame/dashboard-view";
import { KolamView } from "@/components/goorame/kolam-view";
import { PenjualanView } from "@/components/goorame/penjualan-view";
import { PengeluaranView } from "@/components/goorame/pengeluaran-view";
import { UtangView } from "@/components/goorame/utang-view";
import { KasView } from "@/components/goorame/kas-view";
import { AkuntansiView } from "@/components/goorame/akuntansi-view";
import { LaporanView } from "@/components/goorame/laporan-view";

gsap.registerPlugin(useGSAP);

export type GlassSettings = {
  blur: number;
  opacity: number;
  saturation: number;
  tint: string;
  edge: number;
};

const defaultGlass: GlassSettings = {
  blur: 8,
  opacity: 0.10,
  saturation: 1.10,
  tint: "#ffffff",
  edge: 0.45,
};

const bounded = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

const normalize = (v: Partial<GlassSettings>): GlassSettings => ({
  blur: bounded(v.blur ?? defaultGlass.blur, 0, 40, defaultGlass.blur),
  opacity: bounded(v.opacity ?? defaultGlass.opacity, 0.08, 1.0, defaultGlass.opacity),
  saturation: bounded(
    v.saturation ?? defaultGlass.saturation,
    0.5,
    2,
    defaultGlass.saturation
  ),
  edge: bounded(v.edge ?? defaultGlass.edge, 0, 1, defaultGlass.edge),
  tint: /^#[0-9a-f]{6}$/i.test(v.tint ?? "") ? v.tint! : defaultGlass.tint,
});

// All Navigation Tabs based on PRD modules
const allTabs = [
  { id: "dashboard", label: "Dashboard", icon: Home, ownerOnly: false },
  { id: "kolam", label: "Stok Kolam", icon: Fish, ownerOnly: false },
  { id: "penjualan", label: "Penjualan", icon: ArrowDownLeft, ownerOnly: true },
  { id: "pengeluaran", label: "Pengeluaran", icon: ArrowUpRight, ownerOnly: true },
  { id: "utang", label: "Utang Pemasok", icon: CreditCard, ownerOnly: true },
  { id: "kas", label: "Kas & Bank", icon: Wallet, ownerOnly: true },
  { id: "akuntansi", label: "Akuntansi", icon: BookOpen, ownerOnly: true },
  { id: "laporan", label: "Laporan", icon: FileText, ownerOnly: true },
] as const;

function GoorameInnerWorkspace({
  brand = "Goorame",
  backgroundImage = "/bg.jpg",
  glass = defaultGlass,
  theme = "system",
  useHostTheme = true,
  className = "",
  style,
}: {
  brand?: string;
  backgroundImage?: string;
  glass?: Partial<GlassSettings>;
  theme?: "system" | "light" | "dark";
  useHostTheme?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const {
    currentUser,
    logout,
    role,
    setRole,
    activeTab,
    setActiveTab,
    notification,
    setNotification,
    isDatabaseConnected,
  } = useGoorame();

  const root = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const settingsTrigger = useRef<HTMLButtonElement>(null);
  const id = useId().replace(/:/g, "");

  const [mounted, setMounted] = useState(false);
  const [material, setMaterial] = useState<GlassSettings>(() => normalize(defaultGlass));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [localTheme, setLocalTheme] = useState(theme);
  const [alerts, setAlerts] = useState(false);
  const [backgroundFailed, setBackgroundFailed] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("goorame-glass-v5");
      if (saved) {
        setMaterial(normalize(JSON.parse(saved)));
      }
    } catch (e) {}
  }, []);

  // GSAP Tab Reveal & Smooth Slide-in Animation
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const panels = content.current?.querySelectorAll(".gw-panel, .gw-reveal");
        if (!panels?.length) return;
        gsap.fromTo(
          panels,
          {
            y: 22,
            opacity: 0,
            scale: 0.985,
            filter: "blur(5px)",
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.48,
            stagger: 0.04,
            ease: "power3.out",
            clearProps: "transform,opacity,filter",
          }
        );
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [activeTab, role, currentUser], revertOnUpdate: true }
  );

  function updateGlass(patch: Partial<GlassSettings>) {
    const next = normalize({ ...material, ...patch });
    setMaterial(next);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("goorame-glass-v5", JSON.stringify(next));
      } catch (e) {}
    }
  }

  function resetGlass() {
    const next = normalize(defaultGlass);
    setMaterial(next);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("goorame-glass-v5");
      } catch (e) {}
    }
  }

  function closeSettings() {
    setSettingsOpen(false);
    settingsTrigger.current?.focus();
  }

  function toggleTheme() {
    const scheme = root.current
      ? getComputedStyle(root.current).colorScheme
      : "normal";
    const isDark =
      scheme === "dark" ||
      (scheme !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setLocalTheme(isDark ? "light" : "dark");
  }

  // Filter tabs visible for current role (RBAC)
  const visibleTabs = allTabs.filter((tab) => (role === "PEMILIK" ? true : !tab.ownerOnly));

  // Navigation Component (Rail & Dock)
  const renderNav = (compact = false) => (
    <nav
      className={compact ? "gw-rail gw-glass" : "gw-dock gw-glass"}
      aria-label={compact ? "Navigasi Cepat" : "Navigasi Goorame"}
    >
      {visibleTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            aria-label={tab.label}
            title={tab.label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => setActiveTab(tab.id)}
            className={isActive ? "active" : ""}
          >
            <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <div
      ref={root}
      className={`gw-root ${className}`}
      data-theme={useHostTheme ? "system" : localTheme}
      data-host-theme={useHostTheme}
      style={
        {
          "--gw-blur": `${material.blur}px`,
          "--gw-opacity": material.opacity,
          "--gw-saturation": material.saturation,
          "--gw-tint": material.tint || "#ffffff",
          "--gw-edge": material.edge,
          ...style,
        } as CSSProperties
      }
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          if (settingsOpen) closeSettings();
          setAlerts(false);
        }
      }}
    >
      <style>{styles}</style>

      {/* Background Image / Room Shade */}
      {backgroundImage && !backgroundFailed && (
        <img
          className="gw-room"
          src={backgroundImage}
          alt=""
          onError={() => setBackgroundFailed(true)}
        />
      )}
      <div className="gw-room-shade" aria-hidden="true" />

      <div className="gw-workspace">
        {/* Topbar Header */}
        <header className="gw-topbar gw-glass">
          <div className="flex items-center gap-3">
            <a
              className="gw-brand"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("dashboard");
              }}
            >
              <span className="gw-brand-icon">
                <Fish size={18} strokeWidth={2} aria-hidden="true" />
              </span>
              <div>
                <strong className="text-sm font-bold tracking-tight">{brand}</strong>
                <span className="hidden sm:inline-block text-[11px] text-[var(--gw-muted)] ml-2">
                  Mini-ERP Budidaya & Akuntansi
                </span>
              </div>
            </a>

            {/* Database Status Badge */}
            <div
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                isDatabaseConnected
                  ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300 shadow-sm"
                  : "bg-amber-500/15 border-amber-400/30 text-amber-300"
              }`}
              title={
                isDatabaseConnected
                  ? "Terhubung ke Database SQLite (FastAPI Backend :8000)"
                  : "Mode Offline / Menghubungkan..."
              }
            >
              <Database size={11} className={isDatabaseConnected ? "text-emerald-400" : "text-amber-400"} />
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDatabaseConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span>{isDatabaseConnected ? "SQLite Database Aktif" : "Menghubungkan..."}</span>
            </div>
          </div>

          <div className="gw-toolbar">
            {currentUser ? (
              <>
                {/* RBAC Role Switcher Pill */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--gw-surface)] border border-[var(--gw-line)] text-xs">
                  <span className="text-[10px] uppercase font-bold text-[var(--gw-muted)] px-1.5 flex items-center gap-1">
                    <ShieldCheck size={12} className="text-[var(--gw-accent)]" /> Role:
                  </span>
                  <button
                    type="button"
                    onClick={() => setRole("PEMILIK")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      role === "PEMILIK"
                        ? "bg-[var(--gw-ink)] text-[var(--gw-button-ink)] shadow-sm"
                        : "text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
                    }`}
                  >
                    Pemilik
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("PEKERJA")}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      role === "PEKERJA"
                        ? "bg-[var(--gw-ink)] text-[var(--gw-button-ink)] shadow-sm"
                        : "text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
                    }`}
                  >
                    Pekerja
                  </button>
                </div>

                {/* Adjust Glass Button */}
                <button
                  type="button"
                  className="gw-adjust"
                  ref={settingsTrigger}
                  onClick={() => {
                    setSettingsOpen(!settingsOpen);
                    setAlerts(false);
                  }}
                  aria-expanded={settingsOpen}
                  aria-controls={`${id}-material`}
                  title="Atur Efek Glassmorphism"
                >
                  <Settings2 size={16} aria-hidden="true" />
                  <span className="hidden md:inline">Tampilan Glass</span>
                </button>

                {/* Theme Toggle */}
                {!useHostTheme && (
                  <button
                    type="button"
                    className="gw-icon-button"
                    aria-label="Toggle tema gelap/terang"
                    onClick={toggleTheme}
                  >
                    <Sun className="gw-sun" size={17} aria-hidden="true" />
                    <Moon className="gw-moon" size={17} aria-hidden="true" />
                  </button>
                )}

                {/* Notifications Bell */}
                <button
                  type="button"
                  className="gw-icon-button gw-bell"
                  aria-label="Notifikasi"
                  aria-expanded={alerts}
                  onClick={() => {
                    setAlerts(!alerts);
                    setSettingsOpen(false);
                  }}
                >
                  <Bell size={17} aria-hidden="true" />
                  <i />
                </button>

                {/* User Info & Logout Button */}
                <div className="flex items-center gap-2 pl-2 border-l border-[var(--gw-line)]">
                  <span className="gw-avatar" title={`Login sebagai: ${currentUser.name} (${role})`}>
                    {currentUser.avatarLetter}
                  </span>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-bold leading-tight text-[var(--gw-ink)]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-[var(--gw-muted)]">
                      {currentUser.role === "PEMILIK" ? "Akses Finansial & Operasional" : "Akses Petugas Lapangan"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="gw-icon-button hover:bg-rose-500/20 hover:border-rose-400/40 hover:text-rose-200 transition-colors ml-1"
                    title="Keluar / Logout Akun"
                    aria-label="Logout"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </>
            ) : (
              /* When not logged in: only show Glass Adjuster */
              <button
                type="button"
                className="gw-adjust"
                ref={settingsTrigger}
                onClick={() => {
                  setSettingsOpen(!settingsOpen);
                  setAlerts(false);
                }}
                aria-expanded={settingsOpen}
                aria-controls={`${id}-material`}
                title="Atur Efek Glassmorphism"
              >
                <Settings2 size={16} aria-hidden="true" />
                <span>Tampilan Glass</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Workspace Stage */}
        {!currentUser ? (
          <LoginView onOpenSettings={() => setSettingsOpen(true)} />
        ) : (
          <div className="gw-stage">
            {/* Desktop Left Rail Navigation */}
            {renderNav(true)}

            {/* Main Content Area */}
            <main className="gw-main gw-glass">
              {/* Mobile Navigation Dock */}
              <div className="gw-mobile-nav mb-4">{renderNav()}</div>

              {/* Dynamic View Rendering */}
              <div ref={content} key={`${activeTab}-${role}`} className="gw-view">
                <div className="gw-reveal">
                  {activeTab === "dashboard" && <DashboardView />}
                  {activeTab === "kolam" && <KolamView />}
                  {activeTab === "penjualan" && <PenjualanView />}
                  {activeTab === "pengeluaran" && <PengeluaranView />}
                  {activeTab === "utang" && <UtangView />}
                  {activeTab === "kas" && <KasView />}
                  {activeTab === "akuntansi" && <AkuntansiView />}
                  {activeTab === "laporan" && <LaporanView />}
                </div>
              </div>
            </main>
          </div>
        )}

        {/* Notifications Popover */}
        {alerts && (
          <aside className="gw-notifications gw-glass" aria-label="Notifikasi">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--gw-line)]">
              <h3 className="text-sm font-semibold">Notifikasi & Status Sistem</h3>
              <button
                type="button"
                aria-label="Tutup notifikasi"
                onClick={() => setAlerts(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="p-2.5 rounded-xl gw-subcard">
                <span className="font-semibold block text-[var(--gw-ink)]">
                  Sistem Akuntansi Aktif
                </span>
                <p className="text-[11px] text-[var(--gw-muted)] mt-0.5">
                  Jurnal umum berimbang (Double-Entry) berjalan otomatis untuk seluruh modul.
                </p>
              </div>
              <div className="p-2.5 rounded-xl gw-subcard">
                <span className="font-semibold block text-[var(--gw-ink)]">
                  Jatuh Tempo Utang
                </span>
                <p className="text-[11px] text-[var(--gw-muted)] mt-0.5">
                  Faktur pakan CV Pakan Sentosa jatuh tempo pada 25 November 2026.
                </p>
              </div>
            </div>
          </aside>
        )}

        {/* Glass Customization Sidebar */}
        {settingsOpen && (
          <aside
            className="gw-material gw-glass"
            id={`${id}-material`}
            aria-label="Pengaturan Glass"
          >
            <div className="gw-material-title">
              <div>
                <span className="gw-material-icon">
                  <Settings2 size={18} aria-hidden="true" />
                </span>
                <h2>Efek Glassmorphism</h2>
              </div>
              <button
                type="button"
                className="gw-icon-button"
                aria-label="Tutup pengaturan glass"
                onClick={closeSettings}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <p>Sesuaikan intensitas blur, transparansi, dan saturasi.</p>

            <div className="gw-presets" aria-label="Preset Glass">
              {[
                {
                  name: "Kaca Lembut",
                  value: { blur: 14, opacity: 0.30, saturation: 1.25, edge: 0.70 },
                },
                { name: "Frosted (Rekomendasi)", value: defaultGlass },
                {
                  name: "Solid Tajam",
                  value: { blur: 28, opacity: 0.88, saturation: 1.0, edge: 0.35 },
                },
              ].map((p) => {
                const isActive =
                  Math.abs(material.blur - p.value.blur) <= 1 &&
                  Math.abs(material.opacity - p.value.opacity) <= 0.03;
                return (
                  <button
                    key={p.name}
                    type="button"
                    className={isActive ? "active" : ""}
                    onClick={() => updateGlass(p.value)}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            {[
              {
                key: "blur",
                label: "Blur",
                min: 0,
                max: 40,
                step: 1,
                value: `${Math.round(material.blur)} px`,
              },
              {
                key: "opacity",
                label: "Opasitas",
                min: 0.08,
                max: 1.0,
                step: 0.01,
                value: `${Math.round(material.opacity * 100)}%`,
              },
              {
                key: "saturation",
                label: "Saturasi",
                min: 0.5,
                max: 2,
                step: 0.05,
                value: `${Math.round(material.saturation * 100)}%`,
              },
              {
                key: "edge",
                label: "Kilau Tepi (Edge)",
                min: 0,
                max: 1,
                step: 0.05,
                value: `${Math.round(material.edge * 100)}%`,
              },
            ].map((c) => (
              <label className="gw-range" key={c.key}>
                <span>
                  {c.label}
                  <output>{c.value}</output>
                </span>
                <input
                  type="range"
                  aria-label={c.label}
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={material[c.key as keyof GlassSettings]}
                  onChange={(e) =>
                    updateGlass({ [c.key]: Number(e.target.value) })
                  }
                />
              </label>
            ))}

            <label className="gw-tint">
              Tint Kaca{" "}
              <input
                type="color"
                value={material.tint}
                onChange={(e) => updateGlass({ tint: e.target.value })}
              />
            </label>

            <button
              className="gw-reset"
              type="button"
              onClick={resetGlass}
            >
              Reset ke Default
            </button>
          </aside>
        )}
      </div>

      {/* Global Notification Toast */}
      {notification && (
        <div className="gw-toast" role="status">
          <Check size={16} aria-hidden="true" />
          {notification}
        </div>
      )}
    </div>
  );
}

// Export default component wrapped in GoorameProvider
export default function GlassWorkspace(props: any) {
  return (
    <GoorameProvider>
      <GoorameInnerWorkspace {...props} />
    </GoorameProvider>
  );
}

const styles = `
.gw-root {
  /* High-contrast pure white typography on glass */
  --gw-ink: #ffffff;                    /* Crisp pure white for headings, figures, icons */
  --gw-muted: rgba(255, 255, 255, 0.78); /* High-contrast silver-white for secondary text */
  --gw-accent: #ffffff;
  --gw-line: rgba(255, 255, 255, 0.22);
  --gw-background: #09090b;
  /* Ambient vignette: provides comfortable contrast so white text is 100% sharp against bg.jpg */
  --gw-shade: radial-gradient(ellipse at 50% 20%, rgba(0, 0, 0, 0.28) 0%, rgba(0, 0, 0, 0.58) 100%);
  --gw-surface: rgba(255, 255, 255, 0.12);
  --gw-panel: rgba(255, 255, 255, 0.10);
  --gw-brand: #ffffff;
  --gw-brand-ink: #09090b;
  --gw-avatar: rgba(255, 255, 255, 0.20);
  --gw-rail-active: #ffffff;
  --gw-button: #ffffff;
  --gw-button-ink: #09090b;
  --gw-search: rgba(255, 255, 255, 0.15);
  --gw-dock: rgba(255, 255, 255, 0.14);
  --gw-dock-active: #ffffff;
  --gw-dock-ink: #09090b;
  --gw-popover: rgba(20, 20, 24, 0.95);
  --gw-notification: rgba(20, 20, 24, 0.95);
  --gw-shadow: rgba(0, 0, 0, 0.45);
  --gw-panel-shadow: rgba(0, 0, 0, 0.35);
  --gw-toast: #ffffff;
  --gw-toast-ink: #09090b;
  --gw-hover: rgba(255, 255, 255, 0.14);
  --gw-highlight: rgba(255, 255, 255, 0.65);

  position: relative;
  isolation: isolate;
  min-height: 100svh;
  overflow-x: hidden;
  padding: 16px 16px 80px;
  background: var(--gw-background);
  color: var(--gw-ink);
  font: 14px/1.5 "Segoe UI", system-ui, -apple-system, sans-serif;
  letter-spacing: -0.012em;
  box-sizing: border-box;
}

[data-theme="dark"] .gw-root {
  --gw-ink: #ffffff;
  --gw-muted: rgba(255, 255, 255, 0.78);
  --gw-accent: #ffffff;
  --gw-line: rgba(255, 255, 255, 0.22);
  --gw-surface: rgba(255, 255, 255, 0.12);
  --gw-panel: rgba(255, 255, 255, 0.10);
  --gw-brand: #ffffff;
  --gw-brand-ink: #09090b;
  --gw-button: #ffffff;
  --gw-button-ink: #09090b;
  --gw-dock: rgba(255, 255, 255, 0.14);
  --gw-dock-active: #ffffff;
  --gw-dock-ink: #09090b;
  --gw-popover: rgba(20, 20, 24, 0.95);
  --gw-toast: #ffffff;
  --gw-toast-ink: #09090b;
  --gw-hover: rgba(255, 255, 255, 0.14);
  --gw-highlight: rgba(255, 255, 255, 0.65);
  --gw-shade: radial-gradient(ellipse at 50% 20%, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.70) 100%);
  --gw-shadow: rgba(0, 0, 0, 0.55);
  --gw-panel-shadow: rgba(0, 0, 0, 0.45);
}

.gw-glass {
  background: color-mix(
    in srgb,
    color-mix(in srgb, rgba(255, 255, 255, 0.15) 85%, var(--gw-tint)) calc(var(--gw-opacity) * 100%),
    transparent
  ) !important;
  backdrop-filter: blur(var(--gw-blur)) saturate(var(--gw-saturation));
  -webkit-backdrop-filter: blur(var(--gw-blur)) saturate(var(--gw-saturation));
  border: 1px solid var(--gw-line);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--gw-highlight) calc(var(--gw-edge) * 100%), transparent),
    inset 0 0 0 1px color-mix(in srgb, var(--gw-highlight) calc(var(--gw-edge) * 20%), transparent),
    0 12px 36px -12px var(--gw-shadow);
  position: relative;
  transition: backdrop-filter 0.1s ease-out, -webkit-backdrop-filter 0.1s ease-out, background 0.1s ease-out, box-shadow 0.1s ease-out;
}

.gw-panel, .gw-card {
  background: color-mix(
    in srgb,
    color-mix(in srgb, rgba(255, 255, 255, 0.14) 85%, var(--gw-tint)) calc((0.08 + var(--gw-opacity) * 0.92) * 100%),
    transparent
  ) !important;
  backdrop-filter: blur(var(--gw-blur)) saturate(var(--gw-saturation));
  -webkit-backdrop-filter: blur(var(--gw-blur)) saturate(var(--gw-saturation));
  border: 1px solid var(--gw-line);
  border-radius: 18px;
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--gw-highlight) calc(var(--gw-edge) * 85%), transparent),
    0 8px 30px -4px var(--gw-panel-shadow);
  position: relative;
  transition: backdrop-filter 0.1s ease-out, -webkit-backdrop-filter 0.1s ease-out, background 0.1s ease-out, box-shadow 0.1s ease-out;
}

.gw-subcard, .gw-surface {
  background: color-mix(
    in srgb,
    rgba(255, 255, 255, 0.12) calc((0.06 + var(--gw-opacity) * 0.85) * 100%),
    transparent
  ) !important;
  backdrop-filter: blur(calc(var(--gw-blur) * 0.75)) saturate(var(--gw-saturation));
  -webkit-backdrop-filter: blur(calc(var(--gw-blur) * 0.75)) saturate(var(--gw-saturation));
  border: 1px solid var(--gw-line);
  border-radius: 12px;
  transition: backdrop-filter 0.1s ease-out, -webkit-backdrop-filter 0.1s ease-out, background 0.1s ease-out;
}

.gw-root * {
  box-sizing: border-box;
}

.gw-room {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 50%;
  z-index: -3;
  pointer-events: none;
}

.gw-room-shade {
  position: absolute;
  inset: 0;
  background: var(--gw-shade);
  z-index: -2;
  pointer-events: none;
}

.gw-workspace {
  position: relative;
  width: min(1440px, 100%);
  margin: auto;
}

.gw-topbar {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-radius: 20px;
  margin-bottom: 20px;
  padding: 0 20px;
}

.gw-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.gw-brand-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  background: var(--gw-brand);
  color: var(--gw-brand-ink);
  border-radius: 10px;
}

.gw-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gw-adjust {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 12px;
  border: 1px solid var(--gw-line);
  background: var(--gw-surface);
  cursor: pointer;
  transition: all 0.2s;
}

.gw-adjust:hover {
  background: var(--gw-hover);
}

.gw-icon-button {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid var(--gw-line);
  background: var(--gw-surface);
  cursor: pointer;
  position: relative;
}

.gw-icon-button:hover {
  background: var(--gw-hover);
}

.gw-bell i {
  position: absolute;
  right: 7px;
  top: 7px;
  background: var(--gw-accent);
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.gw-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gw-accent);
  color: white;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 12px;
}

.gw-stage {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

.gw-rail {
  border-radius: 24px;
  width: 56px;
  padding: 10px 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  flex: none;
}

.gw-rail button {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  border: 0;
  background: none;
  cursor: pointer;
  color: var(--gw-ink);
  opacity: 0.7;
  transition: all 0.2s;
}

.gw-rail button:hover {
  opacity: 1;
  color: var(--gw-ink);
  background: var(--gw-hover);
}

.gw-rail button span {
  display: none;
}

.gw-rail button.active,
.gw-rail button[aria-current] {
  background: var(--gw-ink) !important;
  color: var(--gw-button-ink) !important;
  opacity: 1;
  box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.35);
}

.gw-main {
  border-radius: 28px;
  padding: 28px 28px 85px;
  flex: 1;
  min-width: 0;
  background: color-mix(in srgb, var(--gw-surface) calc((0.90 + var(--gw-opacity) * 0.08) * 100%), transparent);
  border: 1px solid var(--gw-line);
}

.gw-desktop-dock {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 40;
}

.gw-dock {
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 28px;
  padding: 6px;
  background: var(--gw-dock);
  backdrop-filter: blur(24px);
  border: 1px solid var(--gw-line);
  box-shadow: 0 12px 36px -10px var(--gw-shadow);
}

.gw-dock button {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 20px;
  padding: 8px 15px;
  font-size: 11px;
  font-weight: 600;
  border: 0;
  background: none;
  color: var(--gw-ink);
  opacity: 0.75;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.gw-dock button:hover {
  opacity: 1;
  background: var(--gw-hover);
  color: var(--gw-ink);
}

.gw-dock button.active,
.gw-dock button[aria-current] {
  background: var(--gw-dock-active) !important;
  color: var(--gw-dock-ink) !important;
  opacity: 1;
  font-weight: 700;
  box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.3);
}

.gw-mobile-nav {
  display: none;
}

@keyframes gwPopSlideIn {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.96);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0px);
  }
}

.gw-material {
  position: absolute;
  z-index: 50;
  max-height: calc(100svh - 120px);
  overflow-y: auto;
  right: 10px;
  top: 75px;
  width: 310px;
  border-radius: 22px;
  padding: 22px;
  background: var(--gw-popover);
  color: var(--gw-ink);
  border: 1px solid var(--gw-line);
  box-shadow: inset 0 1px 0 var(--gw-highlight), 0 24px 80px var(--gw-shadow);
  animation: gwPopSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transform-origin: top right;
}

.gw-material-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.gw-material-title > div {
  display: flex;
  gap: 10px;
  align-items: center;
}

.gw-material h2 {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--gw-ink);
}

.gw-material > p {
  font-size: 11px;
  color: var(--gw-muted);
  margin: 6px 0 16px;
}

.gw-presets {
  display: flex;
  gap: 6px;
  margin-bottom: 18px;
}

.gw-presets button {
  flex: 1;
  border: 1px solid var(--gw-line);
  border-radius: 8px;
  padding: 6px 0;
  font-size: 11px;
  cursor: pointer;
  background: var(--gw-surface);
  color: var(--gw-ink);
  transition: all 0.15s ease-in-out;
}

.gw-presets button:hover {
  background: var(--gw-hover);
}

.gw-presets button.active {
  background: var(--gw-ink) !important;
  color: var(--gw-button-ink) !important;
  border-color: var(--gw-ink) !important;
  font-weight: 600;
  box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.25);
}

.gw-range {
  display: block;
  margin: 14px 0;
}

.gw-range > span {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 500;
  color: var(--gw-ink);
}

.gw-range output {
  font-size: 11px;
  font-family: monospace;
  font-weight: 600;
  color: var(--gw-ink);
}

.gw-range input[type="range"] {
  width: 100%;
  accent-color: var(--gw-ink);
  height: 6px;
  margin-top: 8px;
  cursor: pointer;
}

.gw-tint {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  margin-top: 18px;
  color: var(--gw-ink);
}

.gw-tint input {
  height: 26px;
  width: 40px;
  padding: 2px;
  border: 1px solid var(--gw-line);
  border-radius: 6px;
  cursor: pointer;
}

.gw-reset {
  width: 100%;
  border: 1px solid var(--gw-line);
  border-radius: 8px;
  padding: 8px;
  margin-top: 20px;
  font-size: 11px;
  cursor: pointer;
  background: var(--gw-surface);
  color: var(--gw-ink);
  transition: all 0.15s ease-in-out;
}

.gw-reset:hover {
  background: var(--gw-hover);
}

.gw-notifications {
  position: absolute;
  right: 20px;
  top: 75px;
  z-index: 50;
  width: 290px;
  border-radius: 18px;
  padding: 18px;
  background: var(--gw-notification);
  color: var(--gw-ink);
  border: 1px solid var(--gw-line);
  box-shadow: inset 0 1px 0 var(--gw-highlight), 0 24px 80px var(--gw-shadow);
  animation: gwPopSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation: gwPopSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transform-origin: top right;
}

.gw-toast {
  position: fixed;
  left: 50%;
  bottom: 25px;
  transform: translateX(-50%);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 12px;
  background: var(--gw-toast);
  color: var(--gw-toast-ink);
  box-shadow: 0 10px 30px var(--gw-shadow);
  font-size: 12px;
  white-space: nowrap;
}

.gw-sun {
  display: none;
}
[data-theme="dark"] .gw-sun {
  display: block;
}
[data-theme="dark"] .gw-moon {
  display: none;
}

@keyframes gwModalPopIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
    filter: blur(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0px);
  }
}

.gw-dialog {
  background: rgba(18, 22, 30, 0.96) !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.20) !important;
  border-radius: 20px !important;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.15) !important;
  animation: gwModalPopIn 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transform-origin: center center;
}

.gw-dialog h2 {
  color: #ffffff !important;
  font-weight: 700 !important;
  font-size: 16px !important;
  letter-spacing: -0.015em !important;
}

.gw-dialog label {
  color: #ffffff !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  letter-spacing: -0.01em;
  margin-bottom: 6px !important;
  display: block !important;
}

.gw-dialog input,
.gw-dialog select,
.gw-dialog textarea {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.20) !important;
  color: #ffffff !important;
  border-radius: 10px !important;
  padding: 10px 14px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  outline: none !important;
  width: 100% !important;
  transition: all 0.15s ease-in-out !important;
}

.gw-dialog select option {
  background: #18181b !important;
  color: #ffffff !important;
}

.gw-dialog input:focus,
.gw-dialog select:focus,
.gw-dialog textarea:focus {
  border-color: #ffffff !important;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25) !important;
  background: rgba(255, 255, 255, 0.14) !important;
}

.gw-dialog .gw-subcard {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.16) !important;
  color: rgba(255, 255, 255, 0.85) !important;
  border-radius: 12px !important;
  padding: 12px 14px !important;
  font-size: 12px !important;
  line-height: 1.5 !important;
}

.gw-dialog button[type="submit"] {
  background: #ffffff !important;
  color: #09090b !important;
  font-weight: 700 !important;
  border-radius: 10px !important;
  padding: 10px 20px !important;
  font-size: 12px !important;
  border: none !important;
  cursor: pointer !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.15s ease-in-out !important;
}

.gw-dialog button[type="submit"]:hover {
  opacity: 0.92 !important;
  transform: translateY(-1px);
}

.gw-dialog button[type="button"]:not(.p-1) {
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  color: rgba(255, 255, 255, 0.85) !important;
  background: transparent !important;
  font-weight: 600 !important;
  border-radius: 10px !important;
  padding: 10px 18px !important;
  font-size: 12px !important;
  cursor: pointer !important;
  transition: all 0.15s ease-in-out !important;
}

.gw-dialog button[type="button"]:not(.p-1):hover {
  background: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
}

@media (max-width: 1024px) {
  .gw-rail {
    display: none;
  }
  .gw-mobile-nav {
    display: block;
  }
  .gw-mobile-nav .gw-dock {
    width: 100%;
    overflow-x: auto;
    justify-content: flex-start;
  }
  .gw-desktop-dock {
    display: none;
  }
}

@media print {
  .gw-room, .gw-room-shade, .gw-topbar, .gw-rail, .gw-dock, .gw-mobile-nav, .gw-desktop-dock, .gw-material, .gw-notifications, .gw-toast {
    display: none !important;
  }
  .gw-root {
    padding: 0 !important;
    background: #ffffff !important;
    color: #000000 !important;
  }
  .gw-main {
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  .gw-panel, .gw-card, .gw-subcard {
    background: transparent !important;
    border: 1px solid #cbd5e1 !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    page-break-inside: avoid;
  }
}
`;
