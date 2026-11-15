import os
import sys
import threading
import tkinter as tk
from tkinter import ttk, messagebox

# Default API URL (Railway Backend or Localhost)
DEFAULT_API_URL = os.environ.get(
    "GOORAME_API_URL", 
    "https://vivacious-cat-production-1b1669c9.up.railway.app/api"
)

try:
    import requests
except ImportError:
    requests = None


class GoorameApiClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.token = None
        self.user = None

    def set_base_url(self, url: str):
        self.base_url = url.rstrip("/")

    def login(self, username, password, role="PEMILIK"):
        if not requests:
            raise RuntimeError("Pustaka 'requests' belum terpasang.")
        res = requests.post(
            f"{self.base_url}/auth/login",
            json={"username": username, "password": password, "role": role},
            timeout=10,
        )
        if res.status_code == 200:
            data = res.json()
            self.token = data.get("access_token")
            self.user = data.get("user")
            return self.user
        else:
            try:
                err = res.json().get("detail", "Gagal login")
            except Exception:
                err = res.text
            raise ValueError(err)

    def get_ponds(self):
        res = requests.get(f"{self.base_url}/ponds", timeout=10)
        res.raise_for_status()
        return res.json()

    def get_sales(self):
        res = requests.get(f"{self.base_url}/sales", timeout=10)
        res.raise_for_status()
        return res.json()

    def get_expenses(self):
        res = requests.get(f"{self.base_url}/expenses", timeout=10)
        res.raise_for_status()
        return res.json()

    def get_cash_accounts(self):
        res = requests.get(f"{self.base_url}/cash-accounts", timeout=10)
        res.raise_for_status()
        return res.json()

    def get_coa(self):
        res = requests.get(f"{self.base_url}/accounting/coa", timeout=10)
        res.raise_for_status()
        return res.json()

    def tebar_bibit(self, pond_id, ekor, weight_kg, note):
        res = requests.post(
            f"{self.base_url}/ponds/tebar",
            json={"pond_id": pond_id, "ekor": ekor, "weight_kg": weight_kg, "note": note},
            timeout=10,
        )
        res.raise_for_status()
        return res.json()

    def catat_mortalitas(self, pond_id, ekor, weight_kg, note):
        res = requests.post(
            f"{self.base_url}/ponds/mortalitas",
            json={"pond_id": pond_id, "ekor": ekor, "weight_kg": weight_kg, "note": note},
            timeout=10,
        )
        res.raise_for_status()
        return res.json()

    def add_sale(self, buyer_name, pond_id, quantity_ekor, weight_kg, price_per_kg, payment_status, cash_account_id=None, note=""):
        res = requests.post(
            f"{self.base_url}/sales",
            json={
                "buyer_name": buyer_name,
                "pond_id": pond_id,
                "quantity_ekor": quantity_ekor,
                "weight_kg": weight_kg,
                "price_per_kg": price_per_kg,
                "payment_status": payment_status,
                "cash_account_id": cash_account_id,
                "note": note,
            },
            timeout=10,
        )
        res.raise_for_status()
        return res.json()


class GoorameDesktopApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Goorame Desktop ERP (Windows)")
        self.geometry("1024x680")
        self.minsize(800, 500)

        # Theme Colors (Modern Emerald Dark Slate)
        self.colors = {
            "bg": "#0f172a",         # Slate 900
            "panel": "#1e293b",      # Slate 800
            "card": "#334155",       # Slate 700
            "primary": "#10b981",    # Emerald 500
            "primary_hover": "#059669",
            "text": "#f8fafc",       # Slate 50
            "muted": "#94a3b8",      # Slate 400
            "border": "#475569",
            "danger": "#ef4444",
        }

        self.configure(bg=self.colors["bg"])
        self.api = GoorameApiClient(DEFAULT_API_URL)

        self.style = ttk.Style(self)
        self.style.theme_use("clam")
        self._setup_styles()

        self.container = tk.Frame(self, bg=self.colors["bg"])
        self.container.pack(fill="both", expand=True)

        self.show_login_screen()

    def _setup_styles(self):
        self.style.configure(".", background=self.colors["bg"], foreground=self.colors["text"])
        self.style.configure("TLabel", background=self.colors["bg"], foreground=self.colors["text"], font=("Segoe UI", 10))
        self.style.configure("Title.TLabel", font=("Segoe UI", 16, "bold"), foreground=self.colors["text"])
        self.style.configure("Muted.TLabel", foreground=self.colors["muted"], font=("Segoe UI", 9))
        self.style.configure("Treeview", 
                             background=self.colors["panel"], 
                             foreground=self.colors["text"],
                             fieldbackground=self.colors["panel"],
                             font=("Segoe UI", 9))
        self.style.map("Treeview", background=[("selected", self.colors["primary"])], foreground=[("selected", "#ffffff")])
        self.style.configure("Treeview.Heading", background=self.colors["card"], foreground=self.colors["text"], font=("Segoe UI", 9, "bold"))

    def clear_container(self):
        for widget in self.container.winfo_children():
            widget.destroy()

    # ========================== LOGIN SCREEN ==========================
    def show_login_screen(self):
        self.clear_container()

        center_frame = tk.Frame(self.container, bg=self.colors["panel"], padx=36, pady=32, highlightbackground=self.colors["border"], highlightthickness=1)
        center_frame.place(relx=0.5, rely=0.5, anchor="center", width=420)

        # Title
        tk.Label(center_frame, text="🐟 Goorame Desktop", font=("Segoe UI", 18, "bold"), bg=self.colors["panel"], fg=self.colors["text"]).pack(pady=(0, 4))
        tk.Label(center_frame, text="Mini-ERP Budidaya & Akuntansi Gurame", font=("Segoe UI", 9), bg=self.colors["panel"], fg=self.colors["muted"]).pack(pady=(0, 20))

        # API Server URL field
        tk.Label(center_frame, text="Server API URL (Railway / Localhost):", font=("Segoe UI", 8, "bold"), bg=self.colors["panel"], fg=self.colors["muted"]).pack(anchor="w")
        api_entry = tk.Entry(center_frame, font=("Segoe UI", 9), bg=self.colors["card"], fg=self.colors["text"], insertbackground="white", bd=0, relief="flat")
        api_entry.insert(0, self.api.base_url)
        api_entry.pack(fill="x", ipady=6, pady=(3, 14))

        # Username
        tk.Label(center_frame, text="Username:", font=("Segoe UI", 9, "bold"), bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w")
        user_entry = tk.Entry(center_frame, font=("Segoe UI", 10), bg=self.colors["card"], fg=self.colors["text"], insertbackground="white", bd=0, relief="flat")
        user_entry.insert(0, "pemilik")
        user_entry.pack(fill="x", ipady=6, pady=(3, 12))

        # Password
        tk.Label(center_frame, text="Password:", font=("Segoe UI", 9, "bold"), bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w")
        pass_entry = tk.Entry(center_frame, show="•", font=("Segoe UI", 10), bg=self.colors["card"], fg=self.colors["text"], insertbackground="white", bd=0, relief="flat")
        pass_entry.insert(0, "admin123")
        pass_entry.pack(fill="x", ipady=6, pady=(3, 16))

        # Status Message
        status_label = tk.Label(center_frame, text="", font=("Segoe UI", 9), bg=self.colors["panel"], fg=self.colors["danger"])
        status_label.pack(pady=(0, 8))

        def do_login():
            url = api_entry.get().strip()
            u = user_entry.get().strip()
            p = pass_entry.get().strip()

            if not u or not p:
                status_label.config(text="Username dan kata sandi wajib diisi!")
                return

            self.api.set_base_url(url)
            status_label.config(text="Menghubungkan ke server...", fg=self.colors["primary"])
            center_frame.update()

            def async_login():
                try:
                    user = self.api.login(u, p)
                    self.after(0, lambda: self.show_main_app(user))
                except Exception as ex:
                    self.after(0, lambda: status_label.config(text=str(ex), fg=self.colors["danger"]))

            threading.Thread(target=async_login, daemon=True).start()

        # Login Button
        btn_login = tk.Button(center_frame, text="Masuk ke Sistem", font=("Segoe UI", 10, "bold"), bg=self.colors["primary"], fg="#ffffff", activebackground=self.colors["primary_hover"], activeforeground="#ffffff", relief="flat", bd=0, cursor="hand2", command=do_login)
        btn_login.pack(fill="x", ipady=8, pady=(4, 12))

        # Quick Demo Buttons
        demo_frame = tk.Frame(center_frame, bg=self.colors["panel"])
        demo_frame.pack(fill="x", pady=(8, 0))

        def fill_demo(role_name, username, password):
            user_entry.delete(0, tk.END)
            user_entry.insert(0, username)
            pass_entry.delete(0, tk.END)
            pass_entry.insert(0, password)
            status_label.config(text=f"Siap login sebagai {role_name}", fg=self.colors["muted"])

        btn_pemilik = tk.Button(demo_frame, text="Demo Pemilik", font=("Segoe UI", 8), bg=self.colors["card"], fg=self.colors["text"], relief="flat", cursor="hand2", command=lambda: fill_demo("Pemilik", "pemilik", "admin123"))
        btn_pemilik.pack(side="left", expand=True, fill="x", padx=(0, 4), ipady=4)

        btn_pekerja = tk.Button(demo_frame, text="Demo Pekerja", font=("Segoe UI", 8), bg=self.colors["card"], fg=self.colors["text"], relief="flat", cursor="hand2", command=lambda: fill_demo("Pekerja", "pekerja", "pekerja123"))
        btn_pekerja.pack(side="right", expand=True, fill="x", padx=(4, 0), ipady=4)

    # ========================== MAIN DASHBOARD ==========================
    def show_main_app(self, user):
        self.clear_container()

        # Top Navigation Bar
        topbar = tk.Frame(self.container, bg=self.colors["panel"], height=54, padx=16)
        topbar.pack(side="top", fill="x")

        # Brand
        tk.Label(topbar, text="🐟 Goorame Desktop", font=("Segoe UI", 12, "bold"), bg=self.colors["panel"], fg=self.colors["text"]).pack(side="left", pady=12)
        
        # Server Indicator
        tk.Label(topbar, text=f"• {self.api.base_url}", font=("Segoe UI", 8), bg=self.colors["panel"], fg=self.colors["muted"]).pack(side="left", padx=10, pady=12)

        # Right User Info & Logout
        btn_logout = tk.Button(topbar, text="Keluar", font=("Segoe UI", 8, "bold"), bg=self.colors["card"], fg=self.colors["danger"], relief="flat", cursor="hand2", command=self.show_login_screen)
        btn_logout.pack(side="right", padx=(8, 0), pady=12, ipady=3, ipadx=8)

        role_display = "Pemilik" if user.get("role") == "PEMILIK" else "Pekerja"
        user_role_tag = f"[{user.get('role', 'PEMILIK')}] {role_display}"
        tk.Label(topbar, text=user_role_tag, font=("Segoe UI", 9, "bold"), bg=self.colors["panel"], fg=self.colors["primary"]).pack(side="right", pady=12)

        # Main Body: Notebook Tabs
        notebook = ttk.Notebook(self.container)
        notebook.pack(fill="both", expand=True, padx=16, pady=16)

        # Tab 1: Kolam & Stok
        tab_kolam = tk.Frame(notebook, bg=self.colors["bg"], padx=12, pady=12)
        notebook.add(tab_kolam, text="  Stok Kolam  ")
        self._build_kolam_view(tab_kolam)

        # If Pemilik: show Penjualan & Keuangan tabs
        if user.get("role") == "PEMILIK":
            tab_penjualan = tk.Frame(notebook, bg=self.colors["bg"], padx=12, pady=12)
            notebook.add(tab_penjualan, text="  Penjualan  ")
            self._build_sales_view(tab_penjualan)

            tab_keuangan = tk.Frame(notebook, bg=self.colors["bg"], padx=12, pady=12)
            notebook.add(tab_keuangan, text="  Kas & Bagan Akun (COA)  ")
            self._build_accounting_view(tab_keuangan)

    # ---------------- VIEW: KOLAM & STOK ----------------
    def _build_kolam_view(self, parent):
        header_frame = tk.Frame(parent, bg=self.colors["bg"])
        header_frame.pack(fill="x", pady=(0, 10))

        tk.Label(header_frame, text="Monitoring Populasi & Kondisi Kolam", font=("Segoe UI", 12, "bold"), bg=self.colors["bg"], fg=self.colors["text"]).pack(side="left")

        # Table Kolam
        columns = ("name", "type", "dimension", "ekor", "kg", "sr", "status")
        tree = ttk.Treeview(parent, columns=columns, show="headings", height=8)
        tree.heading("name", text="Nama Kolam")
        tree.heading("type", text="Tipe")
        tree.heading("dimension", text="Dimensi")
        tree.heading("ekor", text="Stok (Ekor)")
        tree.heading("kg", text="Estimasi (Kg)")
        tree.heading("sr", text="Survival Rate")
        tree.heading("status", text="Status")

        tree.column("name", width=220)
        tree.column("type", width=120)
        tree.column("dimension", width=120)
        tree.column("ekor", width=100, anchor="e")
        tree.column("kg", width=100, anchor="e")
        tree.column("sr", width=90, anchor="center")
        tree.column("status", width=80, anchor="center")

        tree.pack(fill="both", expand=True, pady=(0, 12))

        def refresh_ponds():
            for row in tree.get_children():
                tree.delete(row)
            try:
                ponds = self.api.get_ponds()
                for p in ponds:
                    tree.insert("", "end", values=(
                        p.get("name"),
                        p.get("type"),
                        p.get("dimension"),
                        f"{p.get('current_ekor', 0):,}",
                        f"{p.get('current_kg_estimasi', 0):.1f} kg",
                        f"{p.get('survival_rate', 0)}%",
                        p.get("status"),
                    ))
            except Exception as e:
                messagebox.showerror("Gagal Mengambil Data", str(e))

        # Bottom Actions (Tebar Bibit & Catat Kematian)
        btn_frame = tk.Frame(parent, bg=self.colors["bg"])
        btn_frame.pack(fill="x")

        tk.Button(btn_frame, text="🔄 Refresh Data", bg=self.colors["card"], fg=self.colors["text"], relief="flat", cursor="hand2", command=refresh_ponds).pack(side="left", padx=(0, 8), ipady=4, ipadx=8)

        def open_tebar_modal():
            self._modal_tebar_bibit(refresh_ponds)

        def open_mortalitas_modal():
            self._modal_catat_mortalitas(refresh_ponds)

        tk.Button(btn_frame, text="➕ Tebar Bibit", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", cursor="hand2", command=open_tebar_modal).pack(side="left", padx=4, ipady=4, ipadx=8)
        tk.Button(btn_frame, text="⚠️ Catat Kematian", bg=self.colors["danger"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", cursor="hand2", command=open_mortalitas_modal).pack(side="left", padx=4, ipady=4, ipadx=8)

        # Initial Load
        refresh_ponds()

    # ---------------- VIEW: PENJUALAN ----------------
    def _build_sales_view(self, parent):
        header = tk.Frame(parent, bg=self.colors["bg"])
        header.pack(fill="x", pady=(0, 10))
        tk.Label(header, text="Catatan Penjualan & Piutang Panen", font=("Segoe UI", 12, "bold"), bg=self.colors["bg"], fg=self.colors["text"]).pack(side="left")

        columns = ("inv", "date", "buyer", "ekor", "kg", "total", "status")
        tree = ttk.Treeview(parent, columns=columns, show="headings", height=10)
        tree.heading("inv", text="No Faktur")
        tree.heading("date", text="Tanggal")
        tree.heading("buyer", text="Pembeli")
        tree.heading("ekor", text="Jumlah Ekor")
        tree.heading("kg", text="Berat (Kg)")
        tree.heading("total", text="Total Nilai (Rp)")
        tree.heading("status", text="Status Pembayaran")

        tree.column("inv", width=140)
        tree.column("date", width=90)
        tree.column("buyer", width=220)
        tree.column("ekor", width=90, anchor="e")
        tree.column("kg", width=90, anchor="e")
        tree.column("total", width=140, anchor="e")
        tree.column("status", width=110, anchor="center")
        tree.pack(fill="both", expand=True, pady=(0, 12))

        def refresh_sales():
            for row in tree.get_children():
                tree.delete(row)
            try:
                sales = self.api.get_sales()
                for s in sales:
                    total_fmt = f"Rp {s.get('total_amount', 0):,.0f}".replace(",", ".")
                    tree.insert("", "end", values=(
                        s.get("invoice_no"),
                        s.get("date"),
                        s.get("buyer_name"),
                        f"{s.get('quantity_ekor', 0):,}",
                        f"{s.get('weight_kg', 0):.1f}",
                        total_fmt,
                        s.get("payment_status"),
                    ))
            except Exception as e:
                messagebox.showerror("Gagal Mengambil Data Penjualan", str(e))

        btn_frame = tk.Frame(parent, bg=self.colors["bg"])
        btn_frame.pack(fill="x")
        tk.Button(btn_frame, text="🔄 Refresh Penjualan", bg=self.colors["card"], fg=self.colors["text"], relief="flat", cursor="hand2", command=refresh_sales).pack(side="left", padx=(0, 8), ipady=4, ipadx=8)

        refresh_sales()

    # ---------------- VIEW: KAS & COA ----------------
    def _build_accounting_view(self, parent):
        tk.Label(parent, text="Daftar Bagan Akun (Chart of Accounts / COA)", font=("Segoe UI", 12, "bold"), bg=self.colors["bg"], fg=self.colors["text"]).pack(anchor="w", pady=(0, 10))

        columns = ("code", "name", "category", "normal", "desc")
        tree = ttk.Treeview(parent, columns=columns, show="headings", height=12)
        tree.heading("code", text="Kode")
        tree.heading("name", text="Nama Akun")
        tree.heading("category", text="Kategori")
        tree.heading("normal", text="Saldo Normal")
        tree.heading("desc", text="Deskripsi")

        tree.column("code", width=80, anchor="center")
        tree.column("name", width=220)
        tree.column("category", width=120)
        tree.column("normal", width=90, anchor="center")
        tree.column("desc", width=300)
        tree.pack(fill="both", expand=True, pady=(0, 12))

        def refresh_coa():
            for row in tree.get_children():
                tree.delete(row)
            try:
                coas = self.api.get_coa()
                for c in coas:
                    tree.insert("", "end", values=(
                        c.get("code"),
                        c.get("name"),
                        c.get("category"),
                        c.get("normal_balance"),
                        c.get("description", ""),
                    ))
            except Exception as e:
                messagebox.showerror("Gagal Mengambil COA", str(e))

        tk.Button(parent, text="🔄 Refresh Bagan Akun", bg=self.colors["card"], fg=self.colors["text"], relief="flat", cursor="hand2", command=refresh_coa).pack(anchor="w", ipady=4, ipadx=8)
        refresh_coa()

    # ---------------- MODAL: TEBAR BIBIT ----------------
    def _modal_tebar_bibit(self, on_success):
        win = tk.Toplevel(self)
        win.title("Tebar Bibit Baru")
        win.geometry("380x360")
        win.configure(bg=self.colors["panel"])
        win.grab_set()

        try:
            ponds = self.api.get_ponds()
        except Exception as e:
            messagebox.showerror("Error", f"Gagal mengambil daftar kolam: {e}")
            win.destroy()
            return

        tk.Label(win, text="Kolam Tujuan:", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(16, 2))
        pond_names = [f"{p['id']}: {p['name']}" for p in ponds]
        pond_cb = ttk.Combobox(win, values=pond_names, state="readonly")
        if pond_names:
            pond_cb.current(0)
        pond_cb.pack(fill="x", padx=20, pady=(0, 10))

        tk.Label(win, text="Jumlah Bibit (Ekor):", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        ekor_entry = tk.Entry(win, bg=self.colors["card"], fg="white", insertbackground="white", relief="flat")
        ekor_entry.insert(0, "1000")
        ekor_entry.pack(fill="x", padx=20, ipady=4, pady=(0, 10))

        tk.Label(win, text="Total Berat Bibit (Kg):", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        kg_entry = tk.Entry(win, bg=self.colors["card"], fg="white", insertbackground="white", relief="flat")
        kg_entry.insert(0, "20.0")
        kg_entry.pack(fill="x", padx=20, ipady=4, pady=(0, 10))

        tk.Label(win, text="Catatan / Keterangan:", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        note_entry = tk.Entry(win, bg=self.colors["card"], fg="white", insertbackground="white", relief="flat")
        note_entry.insert(0, "Bibit ukuran silet")
        note_entry.pack(fill="x", padx=20, ipady=4, pady=(0, 16))

        def submit():
            try:
                selected = pond_cb.get().split(":")[0]
                ekor = int(ekor_entry.get().strip())
                kg = float(kg_entry.get().strip())
                note = note_entry.get().strip()

                self.api.tebar_bibit(selected, ekor, kg, note)
                messagebox.showinfo("Sukses", f"Berhasil menebar {ekor:,} ekor bibit!")
                win.destroy()
                on_success()
            except Exception as ex:
                messagebox.showerror("Gagal Menebar Bibit", str(ex))

        tk.Button(win, text="Simpan Tebar Bibit", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", cursor="hand2", command=submit).pack(fill="x", padx=20, ipady=6)

    # ---------------- MODAL: CATAT KEMATIAN ----------------
    def _modal_catat_mortalitas(self, on_success):
        win = tk.Toplevel(self)
        win.title("Catat Mortalitas (Kematian)")
        win.geometry("380x360")
        win.configure(bg=self.colors["panel"])
        win.grab_set()

        try:
            ponds = self.api.get_ponds()
        except Exception as e:
            messagebox.showerror("Error", f"Gagal mengambil daftar kolam: {e}")
            win.destroy()
            return

        tk.Label(win, text="Kolam Terjadi Kematian:", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(16, 2))
        pond_names = [f"{p['id']}: {p['name']}" for p in ponds]
        pond_cb = ttk.Combobox(win, values=pond_names, state="readonly")
        if pond_names:
            pond_cb.current(0)
        pond_cb.pack(fill="x", padx=20, pady=(0, 10))

        tk.Label(win, text="Jumlah Ikan Mati (Ekor):", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        ekor_entry = tk.Entry(win, bg=self.colors["card"], fg="white", insertbackground="white", relief="flat")
        ekor_entry.insert(0, "10")
        ekor_entry.pack(fill="x", padx=20, ipady=4, pady=(0, 10))

        tk.Label(win, text="Estimasi Berat (Kg):", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        kg_entry = tk.Entry(win, bg=self.colors["card"], fg="white", insertbackground="white", relief="flat")
        kg_entry.insert(0, "2.5")
        kg_entry.pack(fill="x", padx=20, ipady=4, pady=(0, 10))

        tk.Label(win, text="Penyebab / Catatan:", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        note_entry = tk.Entry(win, bg=self.colors["card"], fg="white", insertbackground="white", relief="flat")
        note_entry.insert(0, "Fluktuasi suhu air hujan")
        note_entry.pack(fill="x", padx=20, ipady=4, pady=(0, 16))

        def submit():
            try:
                selected = pond_cb.get().split(":")[0]
                ekor = int(ekor_entry.get().strip())
                kg = float(kg_entry.get().strip())
                note = note_entry.get().strip()

                self.api.catat_mortalitas(selected, ekor, kg, note)
                messagebox.showinfo("Tercatat", f"Mortalitas {ekor:,} ekor berhasil dicatat.")
                win.destroy()
                on_success()
            except Exception as ex:
                messagebox.showerror("Gagal Mencatat Kematian", str(ex))

        tk.Button(win, text="Simpan Pencatatan", bg=self.colors["danger"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", cursor="hand2", command=submit).pack(fill="x", padx=20, ipady=6)


if __name__ == "__main__":
    app = GoorameDesktopApp()
    app.mainloop()
