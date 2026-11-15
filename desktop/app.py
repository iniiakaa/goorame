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

    def add_coa(self, code, name, category, normal_balance, description=""):
        res = requests.post(
            f"{self.base_url}/accounting/coa",
            json={
                "code": code,
                "name": name,
                "category": category,
                "normal_balance": normal_balance,
                "description": description,
            },
            timeout=10,
        )
        res.raise_for_status()
        return res.json()

    def get_journals(self):
        res = requests.get(f"{self.base_url}/accounting/journals", timeout=10)
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

    def add_sale(self, buyer_name, pond_id, quantity_ekor, weight_kg, price_per_kg, payment_status, due_date=None, cash_account_id=None, note=""):
        res = requests.post(
            f"{self.base_url}/sales",
            json={
                "buyer_name": buyer_name,
                "pond_id": pond_id,
                "quantity_ekor": quantity_ekor,
                "weight_kg": weight_kg,
                "price_per_kg": price_per_kg,
                "payment_status": payment_status,
                "due_date": due_date,
                "cash_account_id": cash_account_id,
                "note": note,
            },
            timeout=10,
        )
        res.raise_for_status()
        return res.json()

    def add_expense(self, category, nominal, cash_account_id, note=""):
        res = requests.post(
            f"{self.base_url}/expenses",
            json={
                "category": category,
                "nominal": nominal,
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
        self.geometry("1100x720")
        self.minsize(850, 540)

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
            "accent": "#38bdf8",     # Sky 400
            "warning": "#f59e0b",    # Amber 500
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
        self.style.configure("TNotebook", background=self.colors["bg"], borderwidth=0)
        self.style.configure("TNotebook.Tab", background=self.colors["panel"], foreground=self.colors["text"], padding=[12, 6], font=("Segoe UI", 9, "bold"))
        self.style.map("TNotebook.Tab", background=[("selected", self.colors["primary"])], foreground=[("selected", "#ffffff")])

    def clear_container(self):
        for widget in self.container.winfo_children():
            widget.destroy()

    # ========================== LOGIN SCREEN ==========================
    def show_login_screen(self):
        self.clear_container()

        center_frame = tk.Frame(self.container, bg=self.colors["panel"], padx=36, pady=32, highlightbackground=self.colors["border"], highlightthickness=1)
        center_frame.place(relx=0.5, rely=0.5, anchor="center", width=440)

        # Title
        tk.Label(center_frame, text="🐟 Goorame Desktop", font=("Segoe UI", 20, "bold"), bg=self.colors["panel"], fg=self.colors["text"]).pack(pady=(0, 4))
        tk.Label(center_frame, text="Mini-ERP Budidaya & Akuntansi Gurame", font=("Segoe UI", 9), bg=self.colors["panel"], fg=self.colors["muted"]).pack(pady=(0, 20))

        # API Server URL field
        tk.Label(center_frame, text="Server API URL (Railway Cloud / Local):", font=("Segoe UI", 8, "bold"), bg=self.colors["panel"], fg=self.colors["muted"]).pack(anchor="w")
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
        status_label = tk.Label(center_frame, text="", font=("Segoe UI", 9), bg=self.colors["panel"], fg=self.colors["danger"], wraplength=360)
        status_label.pack(pady=(0, 8))

        def do_login():
            url = api_entry.get().strip()
            u = user_entry.get().strip()
            p = pass_entry.get().strip()

            if not u or not p:
                status_label.config(text="Username dan kata sandi wajib diisi!")
                return

            self.api.set_base_url(url)
            status_label.config(text="Menghubungkan ke Railway...", fg=self.colors["accent"])
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

        # Tab 1: Kolam & Stok (Available to both Pemilik & Pekerja)
        tab_kolam = tk.Frame(notebook, bg=self.colors["bg"], padx=12, pady=12)
        notebook.add(tab_kolam, text="  Stok Kolam  ")
        self._build_kolam_view(tab_kolam)

        # If Pemilik: show Penjualan, Beban/Pengeluaran, Jurnal Umum, & COA
        if user.get("role") == "PEMILIK":
            # Tab 2: Penjualan
            tab_penjualan = tk.Frame(notebook, bg=self.colors["bg"], padx=12, pady=12)
            notebook.add(tab_penjualan, text="  Penjualan (Auto 4110)  ")
            self._build_sales_view(tab_penjualan)

            # Tab 3: Pengeluaran / Beli Pakan (Auto Persediaan 1160/1170 & Beban 6110/6120)
            tab_beban = tk.Frame(notebook, bg=self.colors["bg"], padx=12, pady=12)
            notebook.add(tab_beban, text="  Pengeluaran & Pakan (Auto 1160/6110)  ")
            self._build_expenses_view(tab_beban)

            # Tab 4: Jurnal Umum Double-Entry
            tab_jurnal = tk.Frame(notebook, bg=self.colors["bg"], padx=12, pady=12)
            notebook.add(tab_jurnal, text="  Buku Jurnal Umum (Double-Entry)  ")
            self._build_journals_view(tab_jurnal)

            # Tab 5: Master Data Bagan Akun (COA 1110-6190)
            tab_keuangan = tk.Frame(notebook, bg=self.colors["bg"], padx=12, pady=12)
            notebook.add(tab_keuangan, text="  Bagan Akun (COA Terstandarisasi)  ")
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
        tk.Button(btn_frame, text="➕ Tebar Bibit", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", cursor="hand2", command=lambda: self._modal_tebar_bibit(refresh_ponds)).pack(side="left", padx=4, ipady=4, ipadx=8)
        tk.Button(btn_frame, text="⚠️ Catat Kematian (Mortalitas)", bg=self.colors["danger"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", cursor="hand2", command=lambda: self._modal_catat_mortalitas(refresh_ponds)).pack(side="left", padx=4, ipady=4, ipadx=8)

        refresh_ponds()

    # ---------------- VIEW: PENJUALAN ----------------
    def _build_sales_view(self, parent):
        header = tk.Frame(parent, bg=self.colors["bg"])
        header.pack(fill="x", pady=(0, 10))
        tk.Label(header, text="Catatan Penjualan (Auto-Journal ke 4110 & 1140 Piutang)", font=("Segoe UI", 12, "bold"), bg=self.colors["bg"], fg=self.colors["text"]).pack(side="left")

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
        tree.column("status", width=120, anchor="center")
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
        tk.Button(btn_frame, text="➕ Tambah Penjualan Baru", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", cursor="hand2", command=lambda: self._modal_tambah_penjualan(refresh_sales)).pack(side="left", padx=4, ipady=4, ipadx=8)

        refresh_sales()

    # ---------------- VIEW: PENGELUARAN & PAKAN ----------------
    def _build_expenses_view(self, parent):
        header = tk.Frame(parent, bg=self.colors["bg"])
        header.pack(fill="x", pady=(0, 10))
        tk.Label(header, text="Pengeluaran Operasional & Pembelian Pakan (Auto-Journal 1160/1170/6110/6120)", font=("Segoe UI", 12, "bold"), bg=self.colors["bg"], fg=self.colors["text"]).pack(side="left")

        columns = ("no", "date", "category", "nominal", "cash", "note")
        tree = ttk.Treeview(parent, columns=columns, show="headings", height=10)
        tree.heading("no", text="No Bukti")
        tree.heading("date", text="Tanggal")
        tree.heading("category", text="Kategori")
        tree.heading("nominal", text="Nominal (Rp)")
        tree.heading("cash", text="Rekening Kas/Bank")
        tree.heading("note", text="Keterangan")

        tree.column("no", width=140)
        tree.column("date", width=90)
        tree.column("category", width=120, anchor="center")
        tree.column("nominal", width=130, anchor="e")
        tree.column("cash", width=180)
        tree.column("note", width=250)
        tree.pack(fill="both", expand=True, pady=(0, 12))

        def refresh_expenses():
            for row in tree.get_children():
                tree.delete(row)
            try:
                expenses = self.api.get_expenses()
                for exp in expenses:
                    nom_fmt = f"Rp {exp.get('nominal', 0):,.0f}".replace(",", ".")
                    tree.insert("", "end", values=(
                        exp.get("expense_no"),
                        exp.get("date"),
                        exp.get("category"),
                        nom_fmt,
                        exp.get("cash_account_name", ""),
                        exp.get("note", ""),
                    ))
            except Exception as e:
                messagebox.showerror("Gagal Mengambil Data Pengeluaran", str(e))

        btn_frame = tk.Frame(parent, bg=self.colors["bg"])
        btn_frame.pack(fill="x")
        tk.Button(btn_frame, text="🔄 Refresh Pengeluaran", bg=self.colors["card"], fg=self.colors["text"], relief="flat", cursor="hand2", command=refresh_expenses).pack(side="left", padx=(0, 8), ipady=4, ipadx=8)
        tk.Button(btn_frame, text="➕ Catat Pengeluaran Baru", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", cursor="hand2", command=lambda: self._modal_tambah_pengeluaran(refresh_expenses)).pack(side="left", padx=4, ipady=4, ipadx=8)

        refresh_expenses()

    # ---------------- VIEW: JURNAL UMUM (AUTO-JOURNAL AUDIT) ----------------
    def _build_journals_view(self, parent):
        header = tk.Frame(parent, bg=self.colors["bg"])
        header.pack(fill="x", pady=(0, 10))
        tk.Label(header, text="Ayat Jurnal Umum Otomatis (Double-Entry Verification)", font=("Segoe UI", 12, "bold"), bg=self.colors["bg"], fg=self.colors["text"]).pack(side="left")

        columns = ("entry_no", "date", "desc", "acc_code", "acc_name", "debit", "credit")
        tree = ttk.Treeview(parent, columns=columns, show="headings", height=11)
        tree.heading("entry_no", text="No Jurnal")
        tree.heading("date", text="Tanggal")
        tree.heading("desc", text="Keterangan")
        tree.heading("acc_code", text="Kode")
        tree.heading("acc_name", text="Nama Akun Terpetakan")
        tree.heading("debit", text="Debet (Rp)")
        tree.heading("credit", text="Kredit (Rp)")

        tree.column("entry_no", width=120)
        tree.column("date", width=85)
        tree.column("desc", width=260)
        tree.column("acc_code", width=65, anchor="center")
        tree.column("acc_name", width=220)
        tree.column("debit", width=110, anchor="e")
        tree.column("credit", width=110, anchor="e")
        tree.pack(fill="both", expand=True, pady=(0, 12))

        def refresh_journals():
            for row in tree.get_children():
                tree.delete(row)
            try:
                journals = self.api.get_journals()
                for j in journals:
                    for it in j.get("items", []):
                        deb_fmt = f"Rp {it.get('debit', 0):,.0f}".replace(",", ".") if it.get('debit') else "—"
                        kred_fmt = f"Rp {it.get('credit', 0):,.0f}".replace(",", ".") if it.get('credit') else "—"
                        tree.insert("", "end", values=(
                            j.get("entry_number"),
                            j.get("date"),
                            j.get("description"),
                            it.get("account_code"),
                            it.get("account_name"),
                            deb_fmt,
                            kred_fmt,
                        ))
            except Exception as e:
                messagebox.showerror("Gagal Mengambil Jurnal", str(e))

        btn_frame = tk.Frame(parent, bg=self.colors["bg"])
        btn_frame.pack(fill="x")
        tk.Button(btn_frame, text="🔄 Refresh Jurnal Umum", bg=self.colors["card"], fg=self.colors["text"], relief="flat", cursor="hand2", command=refresh_journals).pack(side="left", ipady=4, ipadx=8)

        refresh_journals()

    # ---------------- VIEW: BAGAN AKUN (COA 1110-6190) ----------------
    def _build_accounting_view(self, parent):
        header = tk.Frame(parent, bg=self.colors["bg"])
        header.pack(fill="x", pady=(0, 10))
        tk.Label(header, text="Bagan Akun Terstandarisasi (1000 Aset, 2000 Kewajiban, 3000 Ekuitas, 4000 Pendapatan, 5000 HPP, 6000 Beban)", font=("Segoe UI", 11, "bold"), bg=self.colors["bg"], fg=self.colors["text"]).pack(side="left")

        columns = ("code", "name", "category", "normal", "desc")
        tree = ttk.Treeview(parent, columns=columns, show="headings", height=12)
        tree.heading("code", text="Kode")
        tree.heading("name", text="Nama Akun")
        tree.heading("category", text="Kategori")
        tree.heading("normal", text="Saldo Normal")
        tree.heading("desc", text="Deskripsi & Fungsi Akun")

        tree.column("code", width=80, anchor="center")
        tree.column("name", width=240)
        tree.column("category", width=120)
        tree.column("normal", width=95, anchor="center")
        tree.column("desc", width=340)
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

        btn_frame = tk.Frame(parent, bg=self.colors["bg"])
        btn_frame.pack(fill="x")
        tk.Button(btn_frame, text="🔄 Refresh COA", bg=self.colors["card"], fg=self.colors["text"], relief="flat", cursor="hand2", command=refresh_coa).pack(side="left", padx=(0, 8), ipady=4, ipadx=8)
        tk.Button(btn_frame, text="➕ Tambah Akun COA Baru", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", cursor="hand2", command=lambda: self._modal_tambah_coa(refresh_coa)).pack(side="left", padx=4, ipady=4, ipadx=8)

        refresh_coa()

    # ---------------- MODAL: TAMBAH COA ----------------
    def _modal_tambah_coa(self, on_success):
        win = tk.Toplevel(self)
        win.title("Tambah Akun Baru ke COA")
        win.geometry("400x380")
        win.configure(bg=self.colors["panel"])
        win.grab_set()

        tk.Label(win, text="Kode Akun (misal 1190, 6150):", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(16, 2))
        code_entry = tk.Entry(win, bg=self.colors["card"], fg="white", insertbackground="white", relief="flat")
        code_entry.pack(fill="x", padx=20, ipady=4, pady=(0, 10))

        tk.Label(win, text="Nama Akun:", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        name_entry = tk.Entry(win, bg=self.colors["card"], fg="white", insertbackground="white", relief="flat")
        name_entry.pack(fill="x", padx=20, ipady=4, pady=(0, 10))

        tk.Label(win, text="Kategori Akun:", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        cat_cb = ttk.Combobox(win, values=["ASET", "KEWAJIBAN", "EKUITAS", "PENDAPATAN", "BEBAN"], state="readonly")
        cat_cb.current(4)
        cat_cb.pack(fill="x", padx=20, pady=(0, 10))

        tk.Label(win, text="Saldo Normal:", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        norm_cb = ttk.Combobox(win, values=["DEBIT", "KREDIT"], state="readonly")
        norm_cb.current(0)
        norm_cb.pack(fill="x", padx=20, pady=(0, 10))

        tk.Label(win, text="Keterangan / Fungsi:", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        desc_entry = tk.Entry(win, bg=self.colors["card"], fg="white", insertbackground="white", relief="flat")
        desc_entry.pack(fill="x", padx=20, ipady=4, pady=(0, 16))

        def submit():
            try:
                code = code_entry.get().strip()
                name = name_entry.get().strip()
                cat = cat_cb.get()
                norm = norm_cb.get()
                desc = desc_entry.get().strip()
                if not code or not name:
                    messagebox.showerror("Error", "Kode dan Nama Akun wajib diisi!")
                    return
                self.api.add_coa(code, name, cat, norm, desc)
                messagebox.showinfo("Sukses", f"Akun {code} - {name} berhasil ditambahkan!")
                win.destroy()
                on_success()
            except Exception as ex:
                messagebox.showerror("Gagal Tambah Akun", str(ex))

        tk.Button(win, text="Simpan Akun COA", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", cursor="hand2", command=submit).pack(fill="x", padx=20, ipady=6)

    # ---------------- MODAL: TAMBAH PENJUALAN (AUTO-JOURNAL 4110 & 1140) ----------------
    def _modal_tambah_penjualan(self, on_success):
        win = tk.Toplevel(self)
        win.title("Catat Penjualan (Auto-Journal 4110 & 1140)")
        win.geometry("420x480")
        win.configure(bg=self.colors["panel"])
        win.grab_set()

        try:
            ponds = self.api.get_ponds()
            cashes = self.api.get_cash_accounts()
        except Exception as e:
            messagebox.showerror("Error", f"Gagal memuat data: {e}")
            win.destroy()
            return

        tk.Label(win, text="Nama Pembeli / Restoran:", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(12, 2))
        buyer_entry = tk.Entry(win, bg=self.colors["card"], fg="white", insertbackground="white", relief="flat")
        buyer_entry.insert(0, "Restoran Gurame Segar")
        buyer_entry.pack(fill="x", padx=20, ipady=4, pady=(0, 8))

        tk.Label(win, text="Pilih Kolam Panen:", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        pond_names = [f"{p['id']}: {p['name']}" for p in ponds]
        pond_cb = ttk.Combobox(win, values=pond_names, state="readonly")
        if pond_names:
            pond_cb.current(0)
        pond_cb.pack(fill="x", padx=20, pady=(0, 8))

        tk.Label(win, text="Jumlah Panen (Ekor):", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        ekor_entry = tk.Entry(win, bg=self.colors["card"], fg="white", insertbackground="white", relief="flat")
        ekor_entry.insert(0, "200")
        ekor_entry.pack(fill="x", padx=20, ipady=4, pady=(0, 8))

        tk.Label(win, text="Total Berat (Kg):", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        kg_entry = tk.Entry(win, bg=self.colors["card"], fg="white", insertbackground="white", relief="flat")
        kg_entry.insert(0, "150.0")
        kg_entry.pack(fill="x", padx=20, ipady=4, pady=(0, 8))

        tk.Label(win, text="Harga Jual per Kg (Rp):", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        price_entry = tk.Entry(win, bg=self.colors["card"], fg="white", insertbackground="white", relief="flat")
        price_entry.insert(0, "45000")
        price_entry.pack(fill="x", padx=20, ipady=4, pady=(0, 8))

        tk.Label(win, text="Status Pembayaran:", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        status_cb = ttk.Combobox(win, values=["LUNAS", "TEMPO"], state="readonly")
        status_cb.current(0)
        status_cb.pack(fill="x", padx=20, pady=(0, 8))

        tk.Label(win, text="Rekening Kas/Bank Penampung (Jika Lunas):", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        cash_names = [f"{c['id']}: {c['name']} (Saldo: Rp {c['balance']:,.0f})" for c in cashes]
        cash_cb = ttk.Combobox(win, values=cash_names, state="readonly")
        if cash_names:
            cash_cb.current(0)
        cash_cb.pack(fill="x", padx=20, pady=(0, 16))

        def submit():
            try:
                buyer = buyer_entry.get().strip()
                selected_pond = pond_cb.get().split(":")[0]
                ekor = int(ekor_entry.get().strip())
                kg = float(kg_entry.get().strip())
                price = float(price_entry.get().strip())
                pay_stat = status_cb.get()
                selected_cash = cash_cb.get().split(":")[0] if pay_stat == "LUNAS" and cash_names else None

                self.api.add_sale(buyer, selected_pond, ekor, kg, price, pay_stat, cash_account_id=selected_cash, note="Penjualan dari Tkinter Desktop")
                messagebox.showinfo("Sukses", f"Penjualan {buyer} berhasil dicatat!\nJurnal otomatis masuk ke 4110 & Kas/Piutang.")
                win.destroy()
                on_success()
            except Exception as ex:
                messagebox.showerror("Gagal Simpan Penjualan", str(ex))

        tk.Button(win, text="Simpan & Buat Jurnal Otomatis", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", cursor="hand2", command=submit).pack(fill="x", padx=20, ipady=6)

    # ---------------- MODAL: TAMBAH PENGELUARAN (AUTO-JOURNAL 1160/6110) ----------------
    def _modal_tambah_pengeluaran(self, on_success):
        win = tk.Toplevel(self)
        win.title("Catat Pengeluaran (Auto-Journal 1160/1170/6110/6120)")
        win.geometry("400x380")
        win.configure(bg=self.colors["panel"])
        win.grab_set()

        try:
            cashes = self.api.get_cash_accounts()
        except Exception as e:
            messagebox.showerror("Error", f"Gagal memuat data kas: {e}")
            win.destroy()
            return

        tk.Label(win, text="Kategori Pengeluaran:", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(16, 2))
        cat_map = {
            "PAKAN (Persediaan 1160)": "PAKAN",
            "OBAT & VITAMIN (Persediaan 1170)": "OBAT",
            "GAJI PEKERJA (Beban 6110)": "GAJI",
            "LISTRIK & POMPA (Beban 6120)": "OPERASIONAL",
        }
        cat_cb = ttk.Combobox(win, values=list(cat_map.keys()), state="readonly")
        cat_cb.current(0)
        cat_cb.pack(fill="x", padx=20, pady=(0, 10))

        tk.Label(win, text="Nominal Pengeluaran (Rp):", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        nom_entry = tk.Entry(win, bg=self.colors["card"], fg="white", insertbackground="white", relief="flat")
        nom_entry.insert(0, "500000")
        nom_entry.pack(fill="x", padx=20, ipady=4, pady=(0, 10))

        tk.Label(win, text="Sumber Rekening Kas/Bank:", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        cash_names = [f"{c['id']}: {c['name']} (Saldo: Rp {c['balance']:,.0f})" for c in cashes]
        cash_cb = ttk.Combobox(win, values=cash_names, state="readonly")
        if cash_names:
            cash_cb.current(0)
        cash_cb.pack(fill="x", padx=20, pady=(0, 10))

        tk.Label(win, text="Keterangan / Catatan:", bg=self.colors["panel"], fg=self.colors["text"]).pack(anchor="w", padx=20, pady=(0, 2))
        note_entry = tk.Entry(win, bg=self.colors["card"], fg="white", insertbackground="white", relief="flat")
        note_entry.insert(0, "Beli pelet grower 2 sak")
        note_entry.pack(fill="x", padx=20, ipady=4, pady=(0, 16))

        def submit():
            try:
                cat_key = cat_cb.get()
                category = cat_map[cat_key]
                nominal = float(nom_entry.get().strip())
                cash_id = cash_cb.get().split(":")[0]
                note = note_entry.get().strip()

                self.api.add_expense(category, nominal, cash_id, note)
                messagebox.showinfo("Sukses", f"Pengeluaran {category} Rp {nominal:,.0f} berhasil dicatat!\nJurnal otomatis terbentuk sesuai aturan COA.")
                win.destroy()
                on_success()
            except Exception as ex:
                messagebox.showerror("Gagal Simpan Pengeluaran", str(ex))

        tk.Button(win, text="Simpan Pengeluaran", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", cursor="hand2", command=submit).pack(fill="x", padx=20, ipady=6)

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
