import os
import sys
import threading
import csv
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

# Try to import Pillow for logo loading
try:
    from PIL import Image, ImageTk
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# Default API URL (Railway Backend or Localhost)
DEFAULT_API_URL = os.environ.get(
    "GOORAME_API_URL", 
    "https://vivacious-cat-production-1b1669c9.up.railway.app/api"
)

try:
    import requests
except ImportError:
    requests = None


def format_rupiah(amount) -> str:
    """Format angka ke format Rupiah Indonesia."""
    try:
        val = float(amount or 0)
        return f"Rp {val:,.0f}".replace(",", ".")
    except Exception:
        return f"Rp {amount}"


def format_number(val, decimal=1) -> str:
    """Format angka ribuan dan desimal."""
    try:
        f = float(val or 0)
        if decimal == 0 or f.is_integer():
            return f"{int(f):,}".replace(",", ".")
        return f"{f:,.{decimal}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except Exception:
        return str(val)


def get_asset_path(filename: str) -> str:
    """Mendapatkan path file asset baik saat development maupun saat dibundel PyInstaller."""
    candidates = []
    # 1. PyInstaller temporary folder
    if hasattr(sys, "_MEIPASS"):
        candidates.append(os.path.join(sys._MEIPASS, filename))
        candidates.append(os.path.join(sys._MEIPASS, "public", filename))
    # 2. Folder script saat ini
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates.append(os.path.join(script_dir, filename))
    candidates.append(os.path.join(script_dir, "public", filename))
    candidates.append(os.path.join(script_dir, "..", "public", filename))
    # 3. Current Working Directory
    candidates.append(os.path.join(os.getcwd(), filename))
    candidates.append(os.path.join(os.getcwd(), "public", filename))

    for p in candidates:
        if os.path.exists(p):
            return p
    return filename


class GoorameApiClient:
    """Klien API HTTP untuk berkomunikasi dengan Backend FastAPI & Database Railway."""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.token = None
        self.user = None

    def set_base_url(self, url: str):
        self.base_url = url.rstrip("/")

    def get_headers(self):
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def login(self, username, password, role="PEMILIK"):
        if not requests:
            raise RuntimeError("Pustaka 'requests' belum terpasang. Jalankan pip install requests.")
        res = requests.post(
            f"{self.base_url}/auth/login",
            json={"username": username.strip().lower(), "password": password, "role": role},
            timeout=12,
        )
        if res.status_code == 200:
            data = res.json()
            self.token = data.get("access_token")
            self.user = data.get("user")
            return self.user
        else:
            try:
                err = res.json().get("detail", "Gagal masuk ke sistem.")
            except Exception:
                err = res.text or f"Status {res.status_code}"
            raise ValueError(err)

    # 1. Reports & Dashboard
    def get_dashboard_summary(self):
        res = requests.get(f"{self.base_url}/reports/dashboard-summary", headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    def get_income_statement(self, period=None):
        params = {"period": period} if period else {}
        res = requests.get(f"{self.base_url}/reports/income-statement", params=params, headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    def get_balance_sheet(self):
        res = requests.get(f"{self.base_url}/reports/balance-sheet", headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    # 2. Ponds & Stock
    def get_ponds(self):
        res = requests.get(f"{self.base_url}/ponds", headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    def create_pond(self, name, type_pond, dimension, capacity_ekor, initial_stock, initial_kg):
        res = requests.post(
            f"{self.base_url}/ponds",
            json={
                "name": name,
                "type": type_pond,
                "dimension": dimension,
                "capacity_ekor": int(capacity_ekor),
                "initial_stock": int(initial_stock),
                "initial_kg": float(initial_kg),
            },
            headers=self.get_headers(),
            timeout=12,
        )
        res.raise_for_status()
        return res.json()

    def tebar_bibit(self, pond_id, ekor, weight_kg, note=""):
        res = requests.post(
            f"{self.base_url}/ponds/tebar",
            json={"pond_id": pond_id, "ekor": int(ekor), "weight_kg": float(weight_kg), "note": note},
            headers=self.get_headers(),
            timeout=12,
        )
        res.raise_for_status()
        return res.json()

    def catat_mortalitas(self, pond_id, ekor, weight_kg, note=""):
        res = requests.post(
            f"{self.base_url}/ponds/mortalitas",
            json={"pond_id": pond_id, "ekor": int(ekor), "weight_kg": float(weight_kg), "note": note},
            headers=self.get_headers(),
            timeout=12,
        )
        res.raise_for_status()
        return res.json()

    # 3. Sales
    def get_sales(self):
        res = requests.get(f"{self.base_url}/sales", headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    def create_sale(self, buyer_name, pond_id, ekor, weight_kg, price_per_kg, payment_status, cash_account_id=None, note=""):
        payload = {
            "buyer_name": buyer_name,
            "pond_id": pond_id,
            "ekor": int(ekor),
            "weight_kg": float(weight_kg),
            "price_per_kg": float(price_per_kg),
            "payment_status": payment_status,
            "cash_account_id": cash_account_id if payment_status == "LUNAS" else None,
            "note": note,
        }
        res = requests.post(f"{self.base_url}/sales", json=payload, headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    # 4. Expenses & Supplier
    def get_expenses(self):
        res = requests.get(f"{self.base_url}/expenses", headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    def create_expense(self, category, nominal, cash_account_id, note=""):
        payload = {
            "category": category,
            "nominal": float(nominal),
            "cash_account_id": cash_account_id,
            "note": note,
        }
        res = requests.post(f"{self.base_url}/expenses", json=payload, headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    def get_supplier_invoices(self):
        res = requests.get(f"{self.base_url}/expenses/supplier-invoices", headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    def create_supplier_invoice(self, supplier_name, item_category, total_amount, due_date, note=""):
        payload = {
            "supplier_name": supplier_name,
            "item_category": item_category,
            "total_amount": float(total_amount),
            "due_date": due_date,
            "note": note,
        }
        res = requests.post(f"{self.base_url}/expenses/supplier-invoices", json=payload, headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    def pay_supplier_invoice(self, invoice_id, amount, cash_account_id, note=""):
        payload = {
            "invoice_id": invoice_id,
            "amount": float(amount),
            "cash_account_id": cash_account_id,
            "note": note,
        }
        res = requests.post(f"{self.base_url}/expenses/supplier-payments", json=payload, headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    # 5. Cash Accounts
    def get_cash_accounts(self):
        res = requests.get(f"{self.base_url}/cash-accounts", headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    def create_cash_account(self, name, type_acc, account_number, initial_balance):
        payload = {
            "name": name,
            "type": type_acc,
            "account_number": account_number,
            "initial_balance": float(initial_balance),
        }
        res = requests.post(f"{self.base_url}/cash-accounts", json=payload, headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    def transfer_cash(self, from_account_id, to_account_id, amount, note=""):
        payload = {
            "from_account_id": from_account_id,
            "to_account_id": to_account_id,
            "amount": float(amount),
            "note": note,
        }
        res = requests.post(f"{self.base_url}/cash-accounts/transfer", json=payload, headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    # 6. Accounting & COA
    def get_coa(self):
        res = requests.get(f"{self.base_url}/accounting/coa", headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    def add_coa(self, code, name, category, normal_balance, description=""):
        res = requests.post(
            f"{self.base_url}/accounting/coa",
            json={
                "code": str(code),
                "name": name,
                "category": category,
                "normal_balance": normal_balance,
                "description": description,
            },
            headers=self.get_headers(),
            timeout=12,
        )
        res.raise_for_status()
        return res.json()

    def sync_standard_coa(self):
        res = requests.post(f"{self.base_url}/accounting/coa/sync-standard", headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    def get_journals(self):
        res = requests.get(f"{self.base_url}/accounting/journals", headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()

    def create_manual_journal(self, date_str, description, items):
        payload = {
            "date": date_str,
            "description": description,
            "items": items,
        }
        res = requests.post(f"{self.base_url}/accounting/journals", json=payload, headers=self.get_headers(), timeout=12)
        res.raise_for_status()
        return res.json()


class GoorameApp(tk.Tk):
    """Aplikasi Desktop Goorame dengan GUI Tkinter modern, logo Goorame, dan 8 modul lengkap."""

    def __init__(self):
        super().__init__()
        self.title("Goorame - Sistem Informasi Budidaya Gurame & Akuntansi")
        self.geometry("1180x760")
        self.minsize(980, 640)

        # Theme Colors (Modern Emerald & Dark Slate Aqua Palette)
        self.colors = {
            "bg": "#0B1311",
            "sidebar": "#101C18",
            "card": "#162520",
            "card_hover": "#1D322B",
            "border": "#243A32",
            "primary": "#10B981",
            "primary_hover": "#059669",
            "accent": "#06B6D4",
            "text": "#F1F5F9",
            "text_muted": "#94A3B8",
            "danger": "#EF4444",
            "warning": "#F59E0B",
            "success": "#10B981",
            "blue": "#3B82F6",
            "table_row_alt": "#13211C",
        }
        self.configure(bg=self.colors["bg"])

        # Cache gambar agar tidak ter-garbage-collected
        self.images_cache = {}

        # Set Window Icon
        self._setup_window_icon()

        # Initialize API client
        self.api = GoorameApiClient(DEFAULT_API_URL)

        # Configure TTK Styles
        self._setup_styles()

        # Main Container
        self.main_container = tk.Frame(self, bg=self.colors["bg"])
        self.main_container.pack(fill="both", expand=True)

        # Show Login Screen first
        self.show_login_screen()

    def _setup_window_icon(self):
        """Pasang icon resmi Goorame pada titlebar jendela."""
        logo_path = get_asset_path("logo-goorame.png")
        if not os.path.exists(logo_path):
            logo_path = get_asset_path("favicon.ico")

        if os.path.exists(logo_path) and HAS_PIL:
            try:
                img = Image.open(logo_path).convert("RGBA")
                icon_img = ImageTk.PhotoImage(img.resize((32, 32), Image.Resampling.LANCZOS))
                self.iconphoto(False, icon_img)
                self.images_cache["win_icon"] = icon_img
            except Exception as e:
                print(f"Icon window load error: {e}")

    def get_logo_photo(self, size=(48, 48)):
        """Muat gambar logo resmi Goorame sesuai ukuran."""
        if not HAS_PIL:
            return None
        cache_key = f"logo_{size[0]}_{size[1]}"
        if cache_key in self.images_cache:
            return self.images_cache[cache_key]

        logo_path = get_asset_path("logo-goorame.png")
        if not os.path.exists(logo_path):
            logo_path = get_asset_path("icon.png")

        if os.path.exists(logo_path):
            try:
                img = Image.open(logo_path).convert("RGBA")
                img.thumbnail(size, Image.Resampling.LANCZOS)
                photo = ImageTk.PhotoImage(img)
                self.images_cache[cache_key] = photo
                return photo
            except Exception as e:
                print(f"Logo load error: {e}")
        return None

    def _setup_styles(self):
        """Konfigurasi gaya visual TTK dark modern."""
        style = ttk.Style(self)
        try:
            style.theme_use("clam")
        except Exception:
            pass

        # Treeview styling
        style.configure(
            "Custom.Treeview",
            background=self.colors["card"],
            foreground=self.colors["text"],
            fieldbackground=self.colors["card"],
            bordercolor=self.colors["border"],
            borderwidth=1,
            rowheight=28,
            font=("Segoe UI", 9),
        )
        style.configure(
            "Custom.Treeview.Heading",
            background=self.colors["sidebar"],
            foreground=self.colors["primary"],
            font=("Segoe UI", 9, "bold"),
            relief="flat",
            padding=(6, 6),
        )
        style.map(
            "Custom.Treeview",
            background=[("selected", self.colors["primary_hover"])],
            foreground=[("selected", "#FFFFFF")],
        )

        # Notebook (Tabbed) styling
        style.configure(
            "Custom.TNotebook",
            background=self.colors["bg"],
            borderwidth=0,
            tabmargins=[2, 5, 2, 0],
        )
        style.configure(
            "Custom.TNotebook.Tab",
            background=self.colors["sidebar"],
            foreground=self.colors["text_muted"],
            padding=[16, 8],
            font=("Segoe UI", 9, "bold"),
            borderwidth=0,
        )
        style.map(
            "Custom.TNotebook.Tab",
            background=[("selected", self.colors["card"]), ("active", self.colors["card_hover"])],
            foreground=[("selected", self.colors["primary"]), ("active", self.colors["text"])],
        )

    def clear_container(self):
        """Hapus seluruh widget di main container."""
        for widget in self.main_container.winfo_children():
            widget.destroy()

    # =========================================================================
    # LOGIN SCREEN (Lengkap dengan Logo Resmi Goorame & Quick Demo)
    # =========================================================================
    def show_login_screen(self):
        self.clear_container()

        center_frame = tk.Frame(self.main_container, bg=self.colors["bg"])
        center_frame.place(relx=0.5, rely=0.5, anchor="center")

        card = tk.Frame(
            center_frame,
            bg=self.colors["card"],
            padx=36,
            pady=32,
            highlightbackground=self.colors["border"],
            highlightthickness=1,
        )
        card.pack()

        # 1. Logo Resmi Goorame
        logo_photo = self.get_logo_photo((72, 72))
        if logo_photo:
            logo_label = tk.Label(card, image=logo_photo, bg=self.colors["card"])
            logo_label.image = logo_photo
            logo_label.pack(pady=(0, 6))

        title = tk.Label(
            card,
            text="GOORAME",
            font=("Segoe UI", 20, "bold"),
            bg=self.colors["card"],
            fg=self.colors["primary"],
        )
        title.pack()

        subtitle = tk.Label(
            card,
            text="Sistem Informasi Budidaya Gurame & Akuntansi Double-Entry",
            font=("Segoe UI", 9),
            bg=self.colors["card"],
            fg=self.colors["text_muted"],
        )
        subtitle.pack(pady=(2, 18))

        # API URL Setting (Terkoneksi ke Railway)
        url_frame = tk.Frame(card, bg=self.colors["card"])
        url_frame.pack(fill="x", pady=(0, 14))

        tk.Label(url_frame, text="Server API (Live Railway):", font=("Segoe UI", 8, "bold"), bg=self.colors["card"], fg=self.colors["text_muted"]).pack(anchor="w")
        api_entry = tk.Entry(
            url_frame,
            font=("Segoe UI", 9),
            bg=self.colors["sidebar"],
            fg=self.colors["text"],
            insertbackground=self.colors["primary"],
            relief="flat",
            highlightbackground=self.colors["border"],
            highlightthickness=1,
        )
        api_entry.insert(0, self.api.base_url)
        api_entry.pack(fill="x", pady=2, ipady=4)

        # Form Login
        form_frame = tk.Frame(card, bg=self.colors["card"])
        form_frame.pack(fill="x")

        tk.Label(form_frame, text="Username", font=("Segoe UI", 9, "bold"), bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        user_entry = tk.Entry(
            form_frame,
            font=("Segoe UI", 10),
            bg=self.colors["sidebar"],
            fg=self.colors["text"],
            insertbackground=self.colors["primary"],
            relief="flat",
            highlightbackground=self.colors["border"],
            highlightthickness=1,
        )
        user_entry.insert(0, "pemilik")
        user_entry.pack(fill="x", pady=(2, 10), ipady=5)

        tk.Label(form_frame, text="Kata Sandi", font=("Segoe UI", 9, "bold"), bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        pass_entry = tk.Entry(
            form_frame,
            show="*",
            font=("Segoe UI", 10),
            bg=self.colors["sidebar"],
            fg=self.colors["text"],
            insertbackground=self.colors["primary"],
            relief="flat",
            highlightbackground=self.colors["border"],
            highlightthickness=1,
        )
        pass_entry.insert(0, "admin123")
        pass_entry.pack(fill="x", pady=(2, 16), ipady=5)

        status_label = tk.Label(card, text="", font=("Segoe UI", 9), bg=self.colors["card"], fg=self.colors["danger"])
        status_label.pack(pady=(0, 6))

        # Action Login
        def do_login():
            username = user_entry.get().strip()
            password = pass_entry.get().strip()
            self.api.set_base_url(api_entry.get().strip())

            if not username or not password:
                status_label.config(text="Username dan kata sandi wajib diisi!")
                return

            status_label.config(text="Menghubungkan ke Railway...", fg=self.colors["accent"])
            login_btn.config(state="disabled", text="Memverifikasi...")

            def worker():
                try:
                    user = self.api.login(username, password)
                    self.after(0, lambda: self.show_main_workspace(user))
                except Exception as ex:
                    self.after(0, lambda: status_label.config(text=f"Login Gagal: {ex}", fg=self.colors["danger"]))
                    self.after(0, lambda: login_btn.config(state="normal", text="Masuk ke Sistem"))

            threading.Thread(target=worker, daemon=True).start()

        login_btn = tk.Button(
            card,
            text="Masuk ke Sistem",
            font=("Segoe UI", 10, "bold"),
            bg=self.colors["primary"],
            fg="#FFFFFF",
            activebackground=self.colors["primary_hover"],
            activeforeground="#FFFFFF",
            relief="flat",
            cursor="hand2",
            command=do_login,
        )
        login_btn.pack(fill="x", ipady=7)

        # Quick Demo Buttons
        demo_frame = tk.Frame(card, bg=self.colors["card"])
        demo_frame.pack(fill="x", pady=(14, 0))

        def fill_demo(u, p):
            user_entry.delete(0, tk.END)
            user_entry.insert(0, u)
            pass_entry.delete(0, tk.END)
            pass_entry.insert(0, p)
            status_label.config(text=f"Akun demo '{u}' siap.", fg=self.colors["success"])

        btn_pemilik = tk.Button(
            demo_frame,
            text="Akun Pemilik (Full Akses)",
            font=("Segoe UI", 8),
            bg=self.colors["sidebar"],
            fg=self.colors["text"],
            relief="flat",
            cursor="hand2",
            command=lambda: fill_demo("pemilik", "admin123"),
        )
        btn_pemilik.pack(side="left", expand=True, fill="x", padx=(0, 4), ipady=4)

        btn_pekerja = tk.Button(
            demo_frame,
            text="Akun Pekerja (Stok Kolam)",
            font=("Segoe UI", 8),
            bg=self.colors["sidebar"],
            fg=self.colors["text"],
            relief="flat",
            cursor="hand2",
            command=lambda: fill_demo("pekerja", "pekerja123"),
        )
        btn_pekerja.pack(side="left", expand=True, fill="x", padx=(4, 0), ipady=4)

        # Enter key trigger login
        pass_entry.bind("<Return>", lambda e: do_login())
        user_entry.bind("<Return>", lambda e: do_login())

    # =========================================================================
    # MAIN WORKSPACE (8 Modul Lengkap dengan RBAC)
    # =========================================================================
    def show_main_workspace(self, user):
        self.clear_container()

        # Top Bar Navigation & Profil
        topbar = tk.Frame(self.main_container, bg=self.colors["sidebar"], height=58, padx=16, pady=8)
        topbar.pack(fill="x", side="top")

        left_nav = tk.Frame(topbar, bg=self.colors["sidebar"])
        left_nav.pack(side="left")

        # Topbar Logo
        top_logo = self.get_logo_photo((34, 34))
        if top_logo:
            logo_lbl = tk.Label(left_nav, image=top_logo, bg=self.colors["sidebar"])
            logo_lbl.image = top_logo
            logo_lbl.pack(side="left", padx=(0, 10))

        title_box = tk.Frame(left_nav, bg=self.colors["sidebar"])
        title_box.pack(side="left")

        brand_row = tk.Frame(title_box, bg=self.colors["sidebar"])
        brand_row.pack(anchor="w")

        tk.Label(
            brand_row,
            text="GOORAME",
            font=("Segoe UI", 12, "bold"),
            bg=self.colors["sidebar"],
            fg=self.colors["primary"],
        ).pack(side="left")

        tk.Label(
            brand_row,
            text="● LIVE RAILWAY",
            font=("Segoe UI", 7, "bold"),
            bg="#064E3B",
            fg="#6EE7B7",
            padx=6,
            pady=1,
        ).pack(side="left", padx=(8, 0))

        tk.Label(
            title_box,
            text="Sistem Informasi Budidaya Gurame & Akuntansi Double-Entry",
            font=("Segoe UI", 8),
            bg=self.colors["sidebar"],
            fg=self.colors["text_muted"],
        ).pack(anchor="w")

        # Right Bar: User Info & Controls
        right_nav = tk.Frame(topbar, bg=self.colors["sidebar"])
        right_nav.pack(side="right")

        user_role = user.get("role", "PEMILIK")
        display_name = "Pemilik" if user_role == "PEMILIK" else "Pekerja"
        access_desc = "Akses Finansial & Operasional" if user_role == "PEMILIK" else "Akses Petugas Lapangan"

        user_info_frame = tk.Frame(right_nav, bg=self.colors["sidebar"])
        user_info_frame.pack(side="left", padx=(0, 14))

        tk.Label(
            user_info_frame,
            text=f"[{user_role}] {display_name}",
            font=("Segoe UI", 9, "bold"),
            bg=self.colors["sidebar"],
            fg=self.colors["text"],
            anchor="e",
        ).pack(anchor="e")

        tk.Label(
            user_info_frame,
            text=access_desc,
            font=("Segoe UI", 7),
            bg=self.colors["sidebar"],
            fg=self.colors["text_muted"],
            anchor="e",
        ).pack(anchor="e")

        # Tombol Segarkan Data
        refresh_btn = tk.Button(
            right_nav,
            text="🔄 Segarkan",
            font=("Segoe UI", 8, "bold"),
            bg=self.colors["card"],
            fg=self.colors["accent"],
            relief="flat",
            cursor="hand2",
            padx=10,
            command=self.refresh_current_view,
        )
        refresh_btn.pack(side="left", padx=(0, 8), ipady=3)

        # Tombol Keluar (Logout)
        logout_btn = tk.Button(
            right_nav,
            text="Keluar",
            font=("Segoe UI", 8, "bold"),
            bg="#7F1D1D",
            fg="#FCA5A5",
            activebackground=self.colors["danger"],
            activeforeground="#FFFFFF",
            relief="flat",
            cursor="hand2",
            padx=10,
            command=self.show_login_screen,
        )
        logout_btn.pack(side="left", ipady=3)

        # Notebook Tabbed Views (8 Modul Lengkap)
        self.notebook = ttk.Notebook(self.main_container, style="Custom.TNotebook")
        self.notebook.pack(fill="both", expand=True, padx=12, pady=(6, 12))

        # TAB 1: Dashboard
        self.tab_dashboard = tk.Frame(self.notebook, bg=self.colors["bg"])
        # TAB 2: Kolam
        self.tab_kolam = tk.Frame(self.notebook, bg=self.colors["bg"])
        # TAB 3: Penjualan
        self.tab_penjualan = tk.Frame(self.notebook, bg=self.colors["bg"])
        # TAB 4: Pengeluaran & Pakan
        self.tab_pengeluaran = tk.Frame(self.notebook, bg=self.colors["bg"])
        # TAB 5: Utang & Piutang
        self.tab_utang = tk.Frame(self.notebook, bg=self.colors["bg"])
        # TAB 6: Kas & Bank
        self.tab_kas = tk.Frame(self.notebook, bg=self.colors["bg"])
        # TAB 7: Akuntansi (Jurnal & COA)
        self.tab_akuntansi = tk.Frame(self.notebook, bg=self.colors["bg"])
        # TAB 8: Laporan Keuangan
        self.tab_laporan = tk.Frame(self.notebook, bg=self.colors["bg"])

        # Pasang Tab sesuai Role (RBAC)
        if user_role == "PEMILIK":
            self.notebook.add(self.tab_dashboard, text="📊 Dashboard")
            self.notebook.add(self.tab_kolam, text="🏞️ Stok Kolam")
            self.notebook.add(self.tab_penjualan, text="🏷️ Penjualan (4110)")
            self.notebook.add(self.tab_pengeluaran, text="💸 Pengeluaran (1160/6110)")
            self.notebook.add(self.tab_utang, text="💳 Utang & Piutang")
            self.notebook.add(self.tab_kas, text="🏦 Dompet Kas & Bank")
            self.notebook.add(self.tab_akuntansi, text="📑 Akuntansi & COA")
            self.notebook.add(self.tab_laporan, text="📈 Laporan Keuangan")
        else:
            # PEKERJA: Hanya tab Stok Kolam
            self.notebook.add(self.tab_kolam, text="🏞️ Manajemen Kolam & Mutasi Ikan")

        # Build each tab UI
        if user_role == "PEMILIK":
            self._build_dashboard_tab()
            self._build_penjualan_tab()
            self._build_pengeluaran_tab()
            self._build_utang_tab()
            self._build_kas_tab()
            self._build_akuntansi_tab()
            self._build_laporan_tab()

        self._build_kolam_tab()

        # Initial Data Load
        self.refresh_current_view()

    def refresh_current_view(self):
        """Muat ulang seluruh data aktif di background thread."""
        user_role = self.api.user.get("role", "PEMILIK") if self.api.user else "PEMILIK"

        def worker():
            try:
                # 1. Kolam data (pemilik & pekerja)
                ponds = self.api.get_ponds()
                self.after(0, lambda: self._update_kolam_table(ponds))

                if user_role == "PEMILIK":
                    # 2. Dashboard summary
                    summary = self.api.get_dashboard_summary()
                    self.after(0, lambda: self._update_dashboard_kpis(summary, ponds))

                    # 3. Sales
                    sales = self.api.get_sales()
                    self.after(0, lambda: self._update_sales_table(sales))

                    # 4. Expenses
                    expenses = self.api.get_expenses()
                    self.after(0, lambda: self._update_expenses_table(expenses))

                    # 5. Supplier Invoices & Debts
                    invoices = self.api.get_supplier_invoices()
                    self.after(0, lambda: self._update_utang_table(invoices, sales))

                    # 6. Cash accounts
                    cash_accs = self.api.get_cash_accounts()
                    self.after(0, lambda: self._update_kas_cards(cash_accs))

                    # 7. Journals & COA
                    journals = self.api.get_journals()
                    coas = self.api.get_coa()
                    self.after(0, lambda: self._update_journals_table(journals))
                    self.after(0, lambda: self._update_coa_table(coas))

                    # 8. Reports (Income statement & Balance sheet)
                    inc = self.api.get_income_statement()
                    bs = self.api.get_balance_sheet()
                    self.after(0, lambda: self._update_laporan_view(inc, bs))
            except Exception as e:
                print(f"Error loading data: {e}")

        threading.Thread(target=worker, daemon=True).start()

    # =========================================================================
    # TAB 1: DASHBOARD VIEW
    # =========================================================================
    def _build_dashboard_tab(self):
        frame = self.tab_dashboard
        container = tk.Frame(frame, bg=self.colors["bg"], padx=14, pady=12)
        container.pack(fill="both", expand=True)

        header_frame = tk.Frame(container, bg=self.colors["bg"])
        header_frame.pack(fill="x", pady=(0, 12))

        tk.Label(
            header_frame,
            text="Ringkasan Eksekutif & Indikator Kunci (KPI)",
            font=("Segoe UI", 13, "bold"),
            bg=self.colors["bg"],
            fg=self.colors["text"],
        ).pack(side="left")

        # 6 KPI Metric Cards
        self.kpi_cards_frame = tk.Frame(container, bg=self.colors["bg"])
        self.kpi_cards_frame.pack(fill="x", pady=(0, 14))

        self.kpi_labels = {}
        metrics = [
            ("populasi", "🐟 Total Populasi Ikan", "0 Ekor", self.colors["primary"]),
            ("biomassa", "⚖️ Estimasi Biomassa", "0 Kg", self.colors["accent"]),
            ("kas", "💰 Total Kas & Bank", "Rp 0", self.colors["success"]),
            ("survival", "🛡️ Rata-rata Survival", "0%", "#10B981"),
            ("laba", "📈 Laba Bersih Berjalan", "Rp 0", self.colors["blue"]),
            ("utang", "💳 Utang Supplier Jatuh Tempo", "Rp 0", self.colors["warning"]),
        ]

        for i, (key, title, val, color) in enumerate(metrics):
            card = tk.Frame(
                self.kpi_cards_frame,
                bg=self.colors["card"],
                padx=12,
                pady=10,
                highlightbackground=self.colors["border"],
                highlightthickness=1,
            )
            card.grid(row=i // 3, column=i % 3, sticky="nsew", padx=4, pady=4)
            self.kpi_cards_frame.grid_columnconfigure(i % 3, weight=1)

            tk.Label(card, text=title, font=("Segoe UI", 8, "bold"), bg=self.colors["card"], fg=self.colors["text_muted"]).pack(anchor="w")
            lbl_val = tk.Label(card, text=val, font=("Segoe UI", 13, "bold"), bg=self.colors["card"], fg=color)
            lbl_val.pack(anchor="w", pady=(2, 0))
            self.kpi_labels[key] = lbl_val

        # Quick Actions Bar
        actions_bar = tk.Frame(container, bg=self.colors["card"], padx=12, pady=10, highlightbackground=self.colors["border"], highlightthickness=1)
        actions_bar.pack(fill="x", pady=(0, 14))

        tk.Label(actions_bar, text="Aksi Cepat:", font=("Segoe UI", 9, "bold"), bg=self.colors["card"], fg=self.colors["text"]).pack(side="left", padx=(0, 12))

        btn_tebar = tk.Button(actions_bar, text="➕ Tebar Bibit", bg="#065F46", fg="#A7F3D0", font=("Segoe UI", 8, "bold"), relief="flat", cursor="hand2", padx=10, command=self.open_modal_tebar_bibit)
        btn_tebar.pack(side="left", padx=3)

        btn_mati = tk.Button(actions_bar, text="⚠️ Catat Kematian", bg="#7F1D1D", fg="#FECACA", font=("Segoe UI", 8, "bold"), relief="flat", cursor="hand2", padx=10, command=self.open_modal_mortalitas)
        btn_mati.pack(side="left", padx=3)

        btn_jual = tk.Button(actions_bar, text="💰 Tambah Penjualan", bg="#064E3B", fg="#6EE7B7", font=("Segoe UI", 8, "bold"), relief="flat", cursor="hand2", padx=10, command=self.open_modal_tambah_penjualan)
        btn_jual.pack(side="left", padx=3)

        btn_beban = tk.Button(actions_bar, text="💸 Catat Pengeluaran", bg="#1E3A8A", fg="#BFDBFE", font=("Segoe UI", 8, "bold"), relief="flat", cursor="hand2", padx=10, command=self.open_modal_catat_pengeluaran)
        btn_beban.pack(side="left", padx=3)

        btn_byr_utang = tk.Button(actions_bar, text="💳 Bayar Utang Supplier", bg="#78350F", fg="#FDE68A", font=("Segoe UI", 8, "bold"), relief="flat", cursor="hand2", padx=10, command=self.open_modal_bayar_utang)
        btn_byr_utang.pack(side="left", padx=3)

        # Overview Table (Ringkasan Kolam & Stok)
        tk.Label(container, text="Kondisi Terkini Kolam Aktif:", font=("Segoe UI", 10, "bold"), bg=self.colors["bg"], fg=self.colors["text"]).pack(anchor="w", pady=(0, 4))
        
        cols = ("nama", "tipe", "kapasitas", "stok", "biomassa", "sr", "status")
        self.dash_tree = ttk.Treeview(container, columns=cols, show="headings", style="Custom.Treeview", height=7)
        self.dash_tree.heading("nama", text="Nama Kolam")
        self.dash_tree.heading("tipe", text="Tipe")
        self.dash_tree.heading("kapasitas", text="Kapasitas (Ekor)")
        self.dash_tree.heading("stok", text="Stok Ikan (Ekor)")
        self.dash_tree.heading("biomassa", text="Biomassa (Kg)")
        self.dash_tree.heading("sr", text="Survival Rate (%)")
        self.dash_tree.heading("status", text="Status")

        self.dash_tree.column("nama", width=220)
        self.dash_tree.column("tipe", width=110, anchor="center")
        self.dash_tree.column("kapasitas", width=120, anchor="e")
        self.dash_tree.column("stok", width=120, anchor="e")
        self.dash_tree.column("biomassa", width=120, anchor="e")
        self.dash_tree.column("sr", width=120, anchor="center")
        self.dash_tree.column("status", width=90, anchor="center")

        self.dash_tree.pack(fill="both", expand=True)

    def _update_dashboard_kpis(self, summary, ponds):
        if not summary:
            return
        total_pop = summary.get("total_fish_count", 0)
        total_bio = summary.get("total_fish_weight", 0.0)
        total_kas = summary.get("total_cash", 0.0)
        net_inc = summary.get("net_income", 0.0)
        utang = summary.get("total_payable_due", 0.0)

        # Avg SR
        avg_sr = 100.0
        if ponds:
            avg_sr = sum(float(p.get("survival_rate", 100)) for p in ponds) / len(ponds)

        self.kpi_labels["populasi"].config(text=f"{total_pop:,} Ekor".replace(",", "."))
        self.kpi_labels["biomassa"].config(text=f"{total_bio:,.1f} Kg".replace(",", "."))
        self.kpi_labels["kas"].config(text=format_rupiah(total_kas))
        self.kpi_labels["survival"].config(text=f"{avg_sr:.1f}%")
        self.kpi_labels["laba"].config(text=format_rupiah(net_inc), fg=self.colors["success"] if net_inc >= 0 else self.colors["danger"])
        self.kpi_labels["utang"].config(text=format_rupiah(utang))

        # Update mini dash tree
        for item in self.dash_tree.get_children():
            self.dash_tree.delete(item)
        for p in ponds:
            self.dash_tree.insert(
                "",
                "end",
                values=(
                    p.get("name"),
                    p.get("type"),
                    f"{p.get('capacity_ekor', 0):,}".replace(",", "."),
                    f"{p.get('current_ekor', 0):,}".replace(",", "."),
                    f"{p.get('current_kg_estimasi', 0):,.1f}".replace(",", "."),
                    f"{p.get('survival_rate', 100):.1f}%",
                    p.get("status", "AKTIF"),
                ),
            )

    # =========================================================================
    # TAB 2: STOK KOLAM VIEW
    # =========================================================================
    def _build_kolam_tab(self):
        frame = self.tab_kolam
        container = tk.Frame(frame, bg=self.colors["bg"], padx=14, pady=12)
        container.pack(fill="both", expand=True)

        header = tk.Frame(container, bg=self.colors["bg"])
        header.pack(fill="x", pady=(0, 10))

        tk.Label(
            header,
            text="Manajemen Stok Kolam & Pencatatan Biologis",
            font=("Segoe UI", 13, "bold"),
            bg=self.colors["bg"],
            fg=self.colors["text"],
        ).pack(side="left")

        # Action Buttons
        btn_bar = tk.Frame(header, bg=self.colors["bg"])
        btn_bar.pack(side="right")

        user_role = self.api.user.get("role", "PEMILIK") if self.api.user else "PEMILIK"
        if user_role == "PEMILIK":
            btn_add_kolam = tk.Button(
                btn_bar,
                text="+ Tambah Kolam Baru",
                font=("Segoe UI", 8, "bold"),
                bg=self.colors["sidebar"],
                fg=self.colors["text"],
                relief="flat",
                cursor="hand2",
                padx=10,
                command=self.open_modal_tambah_kolam,
            )
            btn_add_kolam.pack(side="left", padx=3, ipady=3)

        btn_tebar = tk.Button(
            btn_bar,
            text="➕ Tebar Bibit",
            font=("Segoe UI", 8, "bold"),
            bg="#065F46",
            fg="#A7F3D0",
            relief="flat",
            cursor="hand2",
            padx=10,
            command=self.open_modal_tebar_bibit,
        )
        btn_tebar.pack(side="left", padx=3, ipady=3)

        btn_mati = tk.Button(
            btn_bar,
            text="⚠️ Catat Kematian",
            font=("Segoe UI", 8, "bold"),
            bg="#7F1D1D",
            fg="#FECACA",
            relief="flat",
            cursor="hand2",
            padx=10,
            command=self.open_modal_mortalitas,
        )
        btn_mati.pack(side="left", padx=3, ipady=3)

        # Table Kolam
        cols = ("id", "name", "type", "dimension", "capacity", "current_ekor", "current_kg", "tebar", "mati", "sr", "status")
        self.kolam_tree = ttk.Treeview(container, columns=cols, show="headings", style="Custom.Treeview")

        self.kolam_tree.heading("id", text="ID")
        self.kolam_tree.heading("name", text="Nama Kolam")
        self.kolam_tree.heading("type", text="Tipe")
        self.kolam_tree.heading("dimension", text="Dimensi")
        self.kolam_tree.heading("capacity", text="Kapasitas (Ekor)")
        self.kolam_tree.heading("current_ekor", text="Stok (Ekor)")
        self.kolam_tree.heading("current_kg", text="Biomassa (Kg)")
        self.kolam_tree.heading("tebar", text="Total Tebar")
        self.kolam_tree.heading("mati", text="Mati (Ekor)")
        self.kolam_tree.heading("sr", text="SR (%)")
        self.kolam_tree.heading("status", text="Status")

        self.kolam_tree.column("id", width=60, anchor="center")
        self.kolam_tree.column("name", width=180)
        self.kolam_tree.column("type", width=100, anchor="center")
        self.kolam_tree.column("dimension", width=100)
        self.kolam_tree.column("capacity", width=100, anchor="e")
        self.kolam_tree.column("current_ekor", width=100, anchor="e")
        self.kolam_tree.column("current_kg", width=100, anchor="e")
        self.kolam_tree.column("tebar", width=90, anchor="e")
        self.kolam_tree.column("mati", width=80, anchor="e")
        self.kolam_tree.column("sr", width=70, anchor="center")
        self.kolam_tree.column("status", width=80, anchor="center")

        scrollbar = ttk.Scrollbar(container, orient="vertical", command=self.kolam_tree.yview)
        self.kolam_tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        self.kolam_tree.pack(fill="both", expand=True)

    def _update_kolam_table(self, ponds):
        self.ponds_cache = ponds or []
        for item in self.kolam_tree.get_children():
            self.kolam_tree.delete(item)

        for p in self.ponds_cache:
            self.kolam_tree.insert(
                "",
                "end",
                values=(
                    p.get("id"),
                    p.get("name"),
                    p.get("type"),
                    p.get("dimension", "-"),
                    f"{p.get('capacity_ekor', 0):,}".replace(",", "."),
                    f"{p.get('current_ekor', 0):,}".replace(",", "."),
                    f"{p.get('current_kg_estimasi', 0):,.1f}".replace(",", "."),
                    f"{p.get('total_tebar', 0):,}".replace(",", "."),
                    f"{p.get('total_mati', 0):,}".replace(",", "."),
                    f"{p.get('survival_rate', 100):.1f}%",
                    p.get("status", "AKTIF"),
                ),
            )

    # =========================================================================
    # TAB 3: PENJUALAN VIEW (Auto-Journaling 4110 & 1140)
    # =========================================================================
    def _build_penjualan_tab(self):
        frame = self.tab_penjualan
        container = tk.Frame(frame, bg=self.colors["bg"], padx=14, pady=12)
        container.pack(fill="both", expand=True)

        header = tk.Frame(container, bg=self.colors["bg"])
        header.pack(fill="x", pady=(0, 10))

        tk.Label(
            header,
            text="Faktur Penjualan Ikan (Otomatis Akun 4110 & 1140)",
            font=("Segoe UI", 13, "bold"),
            bg=self.colors["bg"],
            fg=self.colors["text"],
        ).pack(side="left")

        btn_bar = tk.Frame(header, bg=self.colors["bg"])
        btn_bar.pack(side="right")

        btn_export = tk.Button(
            btn_bar,
            text="📥 Ekspor CSV",
            font=("Segoe UI", 8, "bold"),
            bg=self.colors["sidebar"],
            fg=self.colors["text"],
            relief="flat",
            cursor="hand2",
            padx=10,
            command=lambda: self.export_treeview_to_csv(self.sales_tree, "laporan_penjualan_gurame.csv"),
        )
        btn_export.pack(side="left", padx=3, ipady=3)

        btn_add = tk.Button(
            btn_bar,
            text="+ Tambah Penjualan Baru",
            font=("Segoe UI", 8, "bold"),
            bg=self.colors["primary"],
            fg="#FFFFFF",
            relief="flat",
            cursor="hand2",
            padx=10,
            command=self.open_modal_tambah_penjualan,
        )
        btn_add.pack(side="left", padx=3, ipady=3)

        # Sales Table
        cols = ("invoice", "date", "buyer", "pond", "ekor", "weight", "price", "total", "status")
        self.sales_tree = ttk.Treeview(container, columns=cols, show="headings", style="Custom.Treeview")

        self.sales_tree.heading("invoice", text="No Faktur")
        self.sales_tree.heading("date", text="Tanggal")
        self.sales_tree.heading("buyer", text="Nama Pembeli / Restoran")
        self.sales_tree.heading("pond", text="Asal Kolam")
        self.sales_tree.heading("ekor", text="Jumlah (Ekor)")
        self.sales_tree.heading("weight", text="Berat (Kg)")
        self.sales_tree.heading("price", text="Harga / Kg")
        self.sales_tree.heading("total", text="Total Nilai")
        self.sales_tree.heading("status", text="Status Pembayaran")

        self.sales_tree.column("invoice", width=120)
        self.sales_tree.column("date", width=90, anchor="center")
        self.sales_tree.column("buyer", width=180)
        self.sales_tree.column("pond", width=140)
        self.sales_tree.column("ekor", width=90, anchor="e")
        self.sales_tree.column("weight", width=90, anchor="e")
        self.sales_tree.column("price", width=100, anchor="e")
        self.sales_tree.column("total", width=120, anchor="e")
        self.sales_tree.column("status", width=90, anchor="center")

        scrollbar = ttk.Scrollbar(container, orient="vertical", command=self.sales_tree.yview)
        self.sales_tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        self.sales_tree.pack(fill="both", expand=True)

    def _update_sales_table(self, sales):
        for item in self.sales_tree.get_children():
            self.sales_tree.delete(item)

        for s in (sales or []):
            self.sales_tree.insert(
                "",
                "end",
                values=(
                    s.get("invoice_no"),
                    s.get("date"),
                    s.get("buyer_name"),
                    s.get("pond_name") or s.get("pond_id"),
                    f"{s.get('ekor', 0):,}".replace(",", "."),
                    f"{s.get('weight_kg', 0):,.1f}".replace(",", "."),
                    format_rupiah(s.get("price_per_kg", 0)),
                    format_rupiah(s.get("total_amount", 0)),
                    s.get("payment_status", "LUNAS"),
                ),
            )

    # =========================================================================
    # TAB 4: PENGELUARAN VIEW (Auto-Journaling 1160/1170/6110/6120)
    # =========================================================================
    def _build_pengeluaran_tab(self):
        frame = self.tab_pengeluaran
        container = tk.Frame(frame, bg=self.colors["bg"], padx=14, pady=12)
        container.pack(fill="both", expand=True)

        header = tk.Frame(container, bg=self.colors["bg"])
        header.pack(fill="x", pady=(0, 10))

        tk.Label(
            header,
            text="Biaya & Pengeluaran Operasional (Auto-Persediaan & Beban)",
            font=("Segoe UI", 13, "bold"),
            bg=self.colors["bg"],
            fg=self.colors["text"],
        ).pack(side="left")

        btn_bar = tk.Frame(header, bg=self.colors["bg"])
        btn_bar.pack(side="right")

        btn_export = tk.Button(
            btn_bar,
            text="📥 Ekspor CSV",
            font=("Segoe UI", 8, "bold"),
            bg=self.colors["sidebar"],
            fg=self.colors["text"],
            relief="flat",
            cursor="hand2",
            padx=10,
            command=lambda: self.export_treeview_to_csv(self.exp_tree, "laporan_pengeluaran_operasional.csv"),
        )
        btn_export.pack(side="left", padx=3, ipady=3)

        btn_add = tk.Button(
            btn_bar,
            text="+ Catat Pengeluaran Baru",
            font=("Segoe UI", 8, "bold"),
            bg=self.colors["primary"],
            fg="#FFFFFF",
            relief="flat",
            cursor="hand2",
            padx=10,
            command=self.open_modal_catat_pengeluaran,
        )
        btn_add.pack(side="left", padx=3, ipady=3)

        cols = ("no", "date", "category", "nominal", "cash_account", "note")
        self.exp_tree = ttk.Treeview(container, columns=cols, show="headings", style="Custom.Treeview")

        self.exp_tree.heading("no", text="No Bukti")
        self.exp_tree.heading("date", text="Tanggal")
        self.exp_tree.heading("category", text="Kategori Biaya")
        self.exp_tree.heading("nominal", text="Nominal (Rp)")
        self.exp_tree.heading("cash_account", text="Dompet Kas / Bank")
        self.exp_tree.heading("note", text="Keterangan Operasional")

        self.exp_tree.column("no", width=120)
        self.exp_tree.column("date", width=90, anchor="center")
        self.exp_tree.column("category", width=130, anchor="center")
        self.exp_tree.column("nominal", width=130, anchor="e")
        self.exp_tree.column("cash_account", width=180)
        self.exp_tree.column("note", width=260)

        scrollbar = ttk.Scrollbar(container, orient="vertical", command=self.exp_tree.yview)
        self.exp_tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        self.exp_tree.pack(fill="both", expand=True)

    def _update_expenses_table(self, expenses):
        for item in self.exp_tree.get_children():
            self.exp_tree.delete(item)

        for e in (expenses or []):
            self.exp_tree.insert(
                "",
                "end",
                values=(
                    e.get("expense_no"),
                    e.get("date"),
                    e.get("category"),
                    format_rupiah(e.get("nominal", 0)),
                    e.get("cash_account_name"),
                    e.get("note", "-"),
                ),
            )

    # =========================================================================
    # TAB 5: UTANG & PIUTANG VIEW (Supplier Invoices & Pelunasan)
    # =========================================================================
    def _build_utang_tab(self):
        frame = self.tab_utang
        container = tk.Frame(frame, bg=self.colors["bg"], padx=14, pady=12)
        container.pack(fill="both", expand=True)

        header = tk.Frame(container, bg=self.colors["bg"])
        header.pack(fill="x", pady=(0, 10))

        tk.Label(
            header,
            text="Manajemen Utang Usaha Pemasok & Piutang Penjualan",
            font=("Segoe UI", 13, "bold"),
            bg=self.colors["bg"],
            fg=self.colors["text"],
        ).pack(side="left")

        btn_bar = tk.Frame(header, bg=self.colors["bg"])
        btn_bar.pack(side="right")

        btn_add_faktur = tk.Button(
            btn_bar,
            text="+ Faktur Tagihan Supplier (Kredit)",
            font=("Segoe UI", 8, "bold"),
            bg=self.colors["sidebar"],
            fg=self.colors["text"],
            relief="flat",
            cursor="hand2",
            padx=10,
            command=self.open_modal_tambah_faktur_supplier,
        )
        btn_add_faktur.pack(side="left", padx=3, ipady=3)

        btn_byr = tk.Button(
            btn_bar,
            text="💳 Bayar Utang Supplier",
            font=("Segoe UI", 8, "bold"),
            bg="#78350F",
            fg="#FDE68A",
            relief="flat",
            cursor="hand2",
            padx=10,
            command=self.open_modal_bayar_utang,
        )
        btn_byr.pack(side="left", padx=3, ipady=3)

        # Sub-Header 1: Utang Pemasok
        tk.Label(container, text="Daftar Faktur Tagihan Supplier (Akun 2110):", font=("Segoe UI", 10, "bold"), bg=self.colors["bg"], fg=self.colors["warning"]).pack(anchor="w", pady=(2, 4))

        cols_utang = ("inv_no", "supplier", "cat", "total", "paid", "remaining", "due_date", "status")
        self.utang_tree = ttk.Treeview(container, columns=cols_utang, show="headings", style="Custom.Treeview", height=7)

        self.utang_tree.heading("inv_no", text="No Faktur")
        self.utang_tree.heading("supplier", text="Nama Pemasok")
        self.utang_tree.heading("cat", text="Kategori")
        self.utang_tree.heading("total", text="Total Tagihan")
        self.utang_tree.heading("paid", text="Terbayar")
        self.utang_tree.heading("remaining", text="Sisa Utang")
        self.utang_tree.heading("due_date", text="Jatuh Tempo")
        self.utang_tree.heading("status", text="Status")

        self.utang_tree.column("inv_no", width=120)
        self.utang_tree.column("supplier", width=180)
        self.utang_tree.column("cat", width=110, anchor="center")
        self.utang_tree.column("total", width=120, anchor="e")
        self.utang_tree.column("paid", width=120, anchor="e")
        self.utang_tree.column("remaining", width=120, anchor="e")
        self.utang_tree.column("due_date", width=100, anchor="center")
        self.utang_tree.column("status", width=90, anchor="center")

        self.utang_tree.pack(fill="x", pady=(0, 10))

        # Sub-Header 2: Piutang Penjualan (Tempo)
        tk.Label(container, text="Daftar Piutang Usaha dari Penjualan Tempo (Akun 1140):", font=("Segoe UI", 10, "bold"), bg=self.colors["bg"], fg=self.colors["accent"]).pack(anchor="w", pady=(4, 4))

        cols_piutang = ("inv", "date", "buyer", "total", "status")
        self.piutang_tree = ttk.Treeview(container, columns=cols_piutang, show="headings", style="Custom.Treeview", height=6)

        self.piutang_tree.heading("inv", text="No Faktur Penjualan")
        self.piutang_tree.heading("date", text="Tanggal")
        self.piutang_tree.heading("buyer", text="Nama Pelanggan / Restoran")
        self.piutang_tree.heading("total", text="Total Piutang Belum Lunas")
        self.piutang_tree.heading("status", text="Status")

        self.piutang_tree.column("inv", width=140)
        self.piutang_tree.column("date", width=100, anchor="center")
        self.piutang_tree.column("buyer", width=220)
        self.piutang_tree.column("total", width=140, anchor="e")
        self.piutang_tree.column("status", width=100, anchor="center")

        self.piutang_tree.pack(fill="both", expand=True)

    def _update_utang_table(self, invoices, sales):
        self.invoices_cache = invoices or []
        for item in self.utang_tree.get_children():
            self.utang_tree.delete(item)

        for inv in self.invoices_cache:
            rem = inv.get("total_amount", 0) - inv.get("paid_amount", 0)
            self.utang_tree.insert(
                "",
                "end",
                values=(
                    inv.get("invoice_number"),
                    inv.get("supplier_name"),
                    inv.get("item_category"),
                    format_rupiah(inv.get("total_amount", 0)),
                    format_rupiah(inv.get("paid_amount", 0)),
                    format_rupiah(rem),
                    inv.get("due_date"),
                    inv.get("status"),
                ),
            )

        # Piutang from sales tempo
        for item in self.piutang_tree.get_children():
            self.piutang_tree.delete(item)

        for s in (sales or []):
            if s.get("payment_status") == "TEMPO":
                self.piutang_tree.insert(
                    "",
                    "end",
                    values=(
                        s.get("invoice_no"),
                        s.get("date"),
                        s.get("buyer_name"),
                        format_rupiah(s.get("total_amount", 0)),
                        "TEMPO (PIUTANG)",
                    ),
                )

    # =========================================================================
    # TAB 6: DOMPET KAS & BANK VIEW
    # =========================================================================
    def _build_kas_tab(self):
        frame = self.tab_kas
        container = tk.Frame(frame, bg=self.colors["bg"], padx=14, pady=12)
        container.pack(fill="both", expand=True)

        header = tk.Frame(container, bg=self.colors["bg"])
        header.pack(fill="x", pady=(0, 10))

        tk.Label(
            header,
            text="Dompet Kas Operasional & Rekening Bank (COA 1110-1130)",
            font=("Segoe UI", 13, "bold"),
            bg=self.colors["bg"],
            fg=self.colors["text"],
        ).pack(side="left")

        btn_bar = tk.Frame(header, bg=self.colors["bg"])
        btn_bar.pack(side="right")

        btn_trf = tk.Button(
            btn_bar,
            text="🔄 Transfer Antar Kas & Bank",
            font=("Segoe UI", 8, "bold"),
            bg=self.colors["primary"],
            fg="#FFFFFF",
            relief="flat",
            cursor="hand2",
            padx=10,
            command=self.open_modal_transfer_kas,
        )
        btn_trf.pack(side="left", padx=3, ipady=3)

        # Cards Saldo Kas & Bank
        self.kas_cards_container = tk.Frame(container, bg=self.colors["bg"])
        self.kas_cards_container.pack(fill="x", pady=(0, 14))

        # Buku Kas / Mutasi Kas Kronologis
        tk.Label(container, text="Daftar Akun Kas & Saldo:", font=("Segoe UI", 10, "bold"), bg=self.colors["bg"], fg=self.colors["text"]).pack(anchor="w", pady=(0, 4))

        cols = ("code", "name", "type", "acc_no", "balance")
        self.kas_tree = ttk.Treeview(container, columns=cols, show="headings", style="Custom.Treeview", height=8)

        self.kas_tree.heading("code", text="Kode COA")
        self.kas_tree.heading("name", text="Nama Akun Kas")
        self.kas_tree.heading("type", text="Tipe")
        self.kas_tree.heading("acc_no", text="Nomor Rekening")
        self.kas_tree.heading("balance", text="Saldo Kas Saat Ini")

        self.kas_tree.column("code", width=90, anchor="center")
        self.kas_tree.column("name", width=220)
        self.kas_tree.column("type", width=100, anchor="center")
        self.kas_tree.column("acc_no", width=180)
        self.kas_tree.column("balance", width=160, anchor="e")

        self.kas_tree.pack(fill="both", expand=True)

    def _update_kas_cards(self, cash_accs):
        self.cash_accs_cache = cash_accs or []

        # Update cards
        for widget in self.kas_cards_container.winfo_children():
            widget.destroy()

        for i, acc in enumerate(self.cash_accs_cache):
            card = tk.Frame(
                self.kas_cards_container,
                bg=self.colors["card"],
                padx=14,
                pady=10,
                highlightbackground=self.colors["border"],
                highlightthickness=1,
            )
            card.pack(side="left", expand=True, fill="x", padx=4)

            tk.Label(card, text=f"[{acc.get('code')}] {acc.get('name')}", font=("Segoe UI", 8, "bold"), bg=self.colors["card"], fg=self.colors["text_muted"]).pack(anchor="w")
            tk.Label(card, text=format_rupiah(acc.get("balance", 0)), font=("Segoe UI", 13, "bold"), bg=self.colors["card"], fg=self.colors["primary"]).pack(anchor="w", pady=(2, 0))
            tk.Label(card, text=f"No. Rek: {acc.get('account_number') or '-'}", font=("Segoe UI", 7), bg=self.colors["card"], fg=self.colors["text_muted"]).pack(anchor="w")

        # Update table
        for item in self.kas_tree.get_children():
            self.kas_tree.delete(item)

        for acc in self.cash_accs_cache:
            self.kas_tree.insert(
                "",
                "end",
                values=(
                    acc.get("code"),
                    acc.get("name"),
                    acc.get("type"),
                    acc.get("account_number") or "-",
                    format_rupiah(acc.get("balance", 0)),
                ),
            )

    # =========================================================================
    # TAB 7: AKUNTANSI & COA VIEW (Buku Jurnal Umum & Bagan Akun)
    # =========================================================================
    def _build_akuntansi_tab(self):
        frame = self.tab_akuntansi
        container = tk.Frame(frame, bg=self.colors["bg"], padx=14, pady=12)
        container.pack(fill="both", expand=True)

        header = tk.Frame(container, bg=self.colors["bg"])
        header.pack(fill="x", pady=(0, 10))

        tk.Label(
            header,
            text="Akuntansi Double-Entry & Bagan Akun (COA 1110-6190)",
            font=("Segoe UI", 13, "bold"),
            bg=self.colors["bg"],
            fg=self.colors["text"],
        ).pack(side="left")

        btn_bar = tk.Frame(header, bg=self.colors["bg"])
        btn_bar.pack(side="right")

        btn_sync = tk.Button(
            btn_bar,
            text="🔄 Sinkron COA Standar",
            font=("Segoe UI", 8, "bold"),
            bg=self.colors["sidebar"],
            fg=self.colors["accent"],
            relief="flat",
            cursor="hand2",
            padx=10,
            command=self.do_sync_coa_standard,
        )
        btn_sync.pack(side="left", padx=3, ipady=3)

        btn_add_coa = tk.Button(
            btn_bar,
            text="+ Akun COA Baru",
            font=("Segoe UI", 8, "bold"),
            bg=self.colors["sidebar"],
            fg=self.colors["text"],
            relief="flat",
            cursor="hand2",
            padx=10,
            command=self.open_modal_tambah_coa,
        )
        btn_add_coa.pack(side="left", padx=3, ipady=3)

        btn_add_ju = tk.Button(
            btn_bar,
            text="+ Entri Jurnal Manual",
            font=("Segoe UI", 8, "bold"),
            bg=self.colors["primary"],
            fg="#FFFFFF",
            relief="flat",
            cursor="hand2",
            padx=10,
            command=self.open_modal_jurnal_manual,
        )
        btn_add_ju.pack(side="left", padx=3, ipady=3)

        # Sub-notebook: 1. Jurnal Umum, 2. Bagan Akun (COA)
        sub_nb = ttk.Notebook(container, style="Custom.TNotebook")
        sub_nb.pack(fill="both", expand=True)

        # Sub-Tab 1: Jurnal Umum
        ju_frame = tk.Frame(sub_nb, bg=self.colors["bg"])
        sub_nb.add(ju_frame, text="📖 Buku Jurnal Umum (Audit Trail)")

        cols_ju = ("entry_no", "date", "desc", "ref", "acc_code", "acc_name", "debit", "credit")
        self.ju_tree = ttk.Treeview(ju_frame, columns=cols_ju, show="headings", style="Custom.Treeview")

        self.ju_tree.heading("entry_no", text="No Bukti JU")
        self.ju_tree.heading("date", text="Tanggal")
        self.ju_tree.heading("desc", text="Keterangan Transaksi")
        self.ju_tree.heading("ref", text="Ref")
        self.ju_tree.heading("acc_code", text="Kode Akun")
        self.ju_tree.heading("acc_name", text="Nama Akun")
        self.ju_tree.heading("debit", text="Debet (Rp)")
        self.ju_tree.heading("credit", text="Kredit (Rp)")

        self.ju_tree.column("entry_no", width=120)
        self.ju_tree.column("date", width=90, anchor="center")
        self.ju_tree.column("desc", width=240)
        self.ju_tree.column("ref", width=80, anchor="center")
        self.ju_tree.column("acc_code", width=80, anchor="center")
        self.ju_tree.column("acc_name", width=180)
        self.ju_tree.column("debit", width=110, anchor="e")
        self.ju_tree.column("credit", width=110, anchor="e")

        sb_ju = ttk.Scrollbar(ju_frame, orient="vertical", command=self.ju_tree.yview)
        self.ju_tree.configure(yscrollcommand=sb_ju.set)
        sb_ju.pack(side="right", fill="y")
        self.ju_tree.pack(fill="both", expand=True)

        # Sub-Tab 2: Bagan Akun COA
        coa_frame = tk.Frame(sub_nb, bg=self.colors["bg"])
        sub_nb.add(coa_frame, text="📑 Bagan Akun Terstandarisasi (COA)")

        cols_coa = ("code", "name", "category", "normal_balance", "desc")
        self.coa_tree = ttk.Treeview(coa_frame, columns=cols_coa, show="headings", style="Custom.Treeview")

        self.coa_tree.heading("code", text="Kode")
        self.coa_tree.heading("name", text="Nama Akun")
        self.coa_tree.heading("category", text="Kategori")
        self.coa_tree.heading("normal_balance", text="Saldo Normal")
        self.coa_tree.heading("desc", text="Deskripsi Standar Akuntansi")

        self.coa_tree.column("code", width=80, anchor="center")
        self.coa_tree.column("name", width=220)
        self.coa_tree.column("category", width=110, anchor="center")
        self.coa_tree.column("normal_balance", width=100, anchor="center")
        self.coa_tree.column("desc", width=360)

        sb_coa = ttk.Scrollbar(coa_frame, orient="vertical", command=self.coa_tree.yview)
        self.coa_tree.configure(yscrollcommand=sb_coa.set)
        sb_coa.pack(side="right", fill="y")
        self.coa_tree.pack(fill="both", expand=True)

    def _update_journals_table(self, journals):
        for item in self.ju_tree.get_children():
            self.ju_tree.delete(item)

        for j in (journals or []):
            entry_no = j.get("entry_number")
            date_str = j.get("date")
            desc = j.get("description")
            ref = j.get("ref_type", "-")
            items = j.get("items", [])

            for it in items:
                deb = it.get("debit", 0)
                cre = it.get("credit", 0)
                self.ju_tree.insert(
                    "",
                    "end",
                    values=(
                        entry_no,
                        date_str,
                        desc,
                        ref,
                        it.get("account_code"),
                        it.get("account_name"),
                        format_rupiah(deb) if deb > 0 else "-",
                        format_rupiah(cre) if cre > 0 else "-",
                    ),
                )

    def _update_coa_table(self, coas):
        self.coa_cache = coas or []
        for item in self.coa_tree.get_children():
            self.coa_tree.delete(item)

        for c in self.coa_cache:
            self.coa_tree.insert(
                "",
                "end",
                values=(
                    c.get("code"),
                    c.get("name"),
                    c.get("category"),
                    c.get("normal_balance"),
                    c.get("description") or "-",
                ),
            )

    def do_sync_coa_standard(self):
        try:
            res = self.api.sync_standard_coa()
            messagebox.showinfo("Berhasil", f"Sinkronisasi COA berhasil:\n{res.get('message', 'OK')}\nDitambahkan: {res.get('added', 0)}, Diperbarui: {res.get('updated', 0)}")
            self.refresh_current_view()
        except Exception as ex:
            messagebox.showerror("Gagal", f"Gagal sinkronisasi COA: {ex}")

    # =========================================================================
    # TAB 8: LAPORAN KEUANGAN VIEW (Laba Rugi, Neraca, Arus Kas)
    # =========================================================================
    def _build_laporan_tab(self):
        frame = self.tab_laporan
        container = tk.Frame(frame, bg=self.colors["bg"], padx=14, pady=12)
        container.pack(fill="both", expand=True)

        header = tk.Frame(container, bg=self.colors["bg"])
        header.pack(fill="x", pady=(0, 10))

        tk.Label(
            header,
            text="Laporan Keuangan Standar (Laba Rugi & Neraca)",
            font=("Segoe UI", 13, "bold"),
            bg=self.colors["bg"],
            fg=self.colors["text"],
        ).pack(side="left")

        btn_bar = tk.Frame(header, bg=self.colors["bg"])
        btn_bar.pack(side="right")

        btn_export = tk.Button(
            btn_bar,
            text="📥 Ekspor Laporan CSV",
            font=("Segoe UI", 8, "bold"),
            bg=self.colors["sidebar"],
            fg=self.colors["text"],
            relief="flat",
            cursor="hand2",
            padx=10,
            command=self.export_current_report,
        )
        btn_export.pack(side="left", padx=3, ipady=3)

        # Report selector
        selector_frame = tk.Frame(container, bg=self.colors["card"], padx=10, pady=8, highlightbackground=self.colors["border"], highlightthickness=1)
        selector_frame.pack(fill="x", pady=(0, 10))

        tk.Label(selector_frame, text="Pilih Format Laporan:", font=("Segoe UI", 9, "bold"), bg=self.colors["card"], fg=self.colors["text"]).pack(side="left", padx=(0, 10))

        self.report_type_var = tk.StringVar(value="LABA_RUGI")

        r1 = tk.Radiobutton(
            selector_frame,
            text="Laba (Rugi) Komprehensif",
            variable=self.report_type_var,
            value="LABA_RUGI",
            font=("Segoe UI", 9),
            bg=self.colors["card"],
            fg=self.colors["text"],
            selectcolor=self.colors["sidebar"],
            activebackground=self.colors["card"],
            activeforeground=self.colors["primary"],
            command=self._render_report_table,
        )
        r1.pack(side="left", padx=6)

        r2 = tk.Radiobutton(
            selector_frame,
            text="Posisi Keuangan (Neraca / Balance Sheet)",
            variable=self.report_type_var,
            value="NERACA",
            font=("Segoe UI", 9),
            bg=self.colors["card"],
            fg=self.colors["text"],
            selectcolor=self.colors["sidebar"],
            activebackground=self.colors["card"],
            activeforeground=self.colors["primary"],
            command=self._render_report_table,
        )
        r2.pack(side="left", padx=6)

        # Table Display for Report
        cols = ("section", "code", "name", "amount")
        self.report_tree = ttk.Treeview(container, columns=cols, show="headings", style="Custom.Treeview")

        self.report_tree.heading("section", text="Kelompok Akun")
        self.report_tree.heading("code", text="Kode")
        self.report_tree.heading("name", text="Deskripsi Komponen Keuangan")
        self.report_tree.heading("amount", text="Jumlah Nominal (Rp)")

        self.report_tree.column("section", width=140, anchor="center")
        self.report_tree.column("code", width=80, anchor="center")
        self.report_tree.column("name", width=340)
        self.report_tree.column("amount", width=180, anchor="e")

        sb_rep = ttk.Scrollbar(container, orient="vertical", command=self.report_tree.yview)
        self.report_tree.configure(yscrollcommand=sb_rep.set)
        sb_rep.pack(side="right", fill="y")
        self.report_tree.pack(fill="both", expand=True)

    def _update_laporan_view(self, inc, bs):
        self.inc_cache = inc or {}
        self.bs_cache = bs or {}
        self._render_report_table()

    def _render_report_table(self):
        rtype = self.report_type_var.get()
        for item in self.report_tree.get_children():
            self.report_tree.delete(item)

        if rtype == "LABA_RUGI":
            inc = getattr(self, "inc_cache", {})
            revs = inc.get("revenues", [])
            exps = inc.get("expenses", [])
            tot_rev = inc.get("total_revenue", 0)
            tot_exp = inc.get("total_expense", 0)
            net_inc = inc.get("net_income", 0)

            # 1. Pendapatan
            for r in revs:
                self.report_tree.insert("", "end", values=("PENDAPATAN", r.get("code"), r.get("name"), format_rupiah(r.get("amount", 0))))
            self.report_tree.insert("", "end", values=("TOTAL", "", "TOTAL PENDAPATAN USAHA (A)", format_rupiah(tot_rev)))

            # 2. Beban
            for e in exps:
                self.report_tree.insert("", "end", values=("BEBAN", e.get("code"), e.get("name"), format_rupiah(e.get("amount", 0))))
            self.report_tree.insert("", "end", values=("TOTAL", "", "TOTAL BEBAN OPERASIONAL (B)", format_rupiah(tot_exp)))

            # 3. Laba Bersih
            self.report_tree.insert("", "end", values=("HASIL", "", "LABA (RUGI) BERSIH PERIODE (A - B)", format_rupiah(net_inc)))

        elif rtype == "NERACA":
            bs = getattr(self, "bs_cache", {})
            assets = bs.get("assets", [])
            liabilities = bs.get("liabilities", [])
            equities = bs.get("equities", [])
            tot_assets = bs.get("total_assets", 0)
            tot_liab = bs.get("total_liabilities", 0)
            tot_eq = bs.get("total_equity", 0)
            is_bal = bs.get("is_balanced", True)

            # Assets
            for a in assets:
                self.report_tree.insert("", "end", values=("ASET", a.get("code"), a.get("name"), format_rupiah(a.get("amount", 0))))
            self.report_tree.insert("", "end", values=("TOTAL ASET", "", "TOTAL ASET USAHA (AKTIVA)", format_rupiah(tot_assets)))

            # Liabilities
            for l in liabilities:
                self.report_tree.insert("", "end", values=("KEWAJIBAN", l.get("code"), l.get("name"), format_rupiah(l.get("amount", 0))))
            self.report_tree.insert("", "end", values=("TOTAL UTANG", "", "TOTAL KEWAJIBAN / UTANG", format_rupiah(tot_liab)))

            # Equity
            for eq in equities:
                self.report_tree.insert("", "end", values=("EKUITAS", eq.get("code"), eq.get("name"), format_rupiah(eq.get("amount", 0))))
            self.report_tree.insert("", "end", values=("TOTAL EKUITAS", "", "TOTAL EKUITAS PEMILIK", format_rupiah(tot_eq)))

            # Balance summary
            tot_liab_eq = tot_liab + tot_eq
            bal_status = "SEIMBANG (BALANCE)" if is_bal else "TIDAK SEIMBANG"
            self.report_tree.insert("", "end", values=("STATUS NERACA", "", f"TOTAL KEWAJIBAN + EKUITAS [{bal_status}]", format_rupiah(tot_liab_eq)))

    def export_current_report(self):
        rtype = self.report_type_var.get()
        filename = f"laporan_{rtype.lower()}.csv"
        self.export_treeview_to_csv(self.report_tree, filename)

    # =========================================================================
    # MODAL DIALOGS (Tambah Kolam, Tebar, Mortalitas, Jual, Beban, Utang, Kas, COA)
    # =========================================================================
    def open_modal_tambah_kolam(self):
        dlg = tk.Toplevel(self)
        dlg.title("Tambah Kolam Budidaya Baru")
        dlg.geometry("460x420")
        dlg.configure(bg=self.colors["card"], padx=20, pady=20)
        dlg.transient(self)
        dlg.grab_set()

        tk.Label(dlg, text="Tambah Kolam Baru", font=("Segoe UI", 12, "bold"), bg=self.colors["card"], fg=self.colors["primary"]).pack(anchor="w", pady=(0, 12))

        # Fields
        tk.Label(dlg, text="Nama Kolam:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_nama = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_nama.pack(fill="x", pady=2)

        tk.Label(dlg, text="Tipe Kolam:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        cb_tipe = ttk.Combobox(dlg, values=["PEMBESARAN", "BIBIT", "PANEN", "KARANTINA"], state="readonly")
        cb_tipe.set("PEMBESARAN")
        cb_tipe.pack(fill="x", pady=2)

        tk.Label(dlg, text="Dimensi (misal: 15m x 20m x 1.5m):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_dim = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_dim.pack(fill="x", pady=2)

        tk.Label(dlg, text="Kapasitas Maksimal (Ekor):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_cap = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_cap.insert(0, "5000")
        e_cap.pack(fill="x", pady=2)

        tk.Label(dlg, text="Stok Awal (Ekor):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_stock = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_stock.insert(0, "0")
        e_stock.pack(fill="x", pady=2)

        tk.Label(dlg, text="Estimasi Bobot Awal (Kg):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_kg = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_kg.insert(0, "0.0")
        e_kg.pack(fill="x", pady=2)

        def save():
            try:
                self.api.create_pond(
                    e_nama.get().strip(),
                    cb_tipe.get(),
                    e_dim.get().strip(),
                    int(e_cap.get().strip()),
                    int(e_stock.get().strip()),
                    float(e_kg.get().strip()),
                )
                messagebox.showinfo("Berhasil", "Kolam baru berhasil didaftarkan!")
                dlg.destroy()
                self.refresh_current_view()
            except Exception as ex:
                messagebox.showerror("Error", f"Gagal menambahkan kolam: {ex}")

        tk.Button(dlg, text="Simpan Kolam", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", command=save).pack(fill="x", pady=(16, 0), ipady=5)

    def open_modal_tebar_bibit(self):
        dlg = tk.Toplevel(self)
        dlg.title("Tebar Bibit Baru ke Kolam")
        dlg.geometry("440x360")
        dlg.configure(bg=self.colors["card"], padx=20, pady=20)
        dlg.transient(self)
        dlg.grab_set()

        tk.Label(dlg, text="Tebar Bibit Baru", font=("Segoe UI", 12, "bold"), bg=self.colors["card"], fg=self.colors["primary"]).pack(anchor="w", pady=(0, 10))

        tk.Label(dlg, text="Pilih Kolam Tujuan:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        ponds = getattr(self, "ponds_cache", [])
        pond_names = [f"{p.get('name')} ({p.get('id')})" for p in ponds]
        cb_pond = ttk.Combobox(dlg, values=pond_names, state="readonly")
        if pond_names:
            cb_pond.current(0)
        cb_pond.pack(fill="x", pady=2)

        tk.Label(dlg, text="Jumlah Bibit (Ekor):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_ekor = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_ekor.insert(0, "1000")
        e_ekor.pack(fill="x", pady=2)

        tk.Label(dlg, text="Estimasi Total Bobot (Kg):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_kg = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_kg.insert(0, "50.0")
        e_kg.pack(fill="x", pady=2)

        tk.Label(dlg, text="Catatan / Suplier Bibit:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_note = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_note.insert(0, "Bibit Gurame Soang Ukuran 3-5 cm")
        e_note.pack(fill="x", pady=2)

        def save():
            try:
                idx = cb_pond.current()
                if idx < 0 or idx >= len(ponds):
                    messagebox.showerror("Error", "Pilih kolam terlebih dahulu")
                    return
                p_id = ponds[idx].get("id")
                self.api.tebar_bibit(p_id, int(e_ekor.get().strip()), float(e_kg.get().strip()), e_note.get().strip())
                messagebox.showinfo("Berhasil", "Bibit berhasil ditebar ke kolam!")
                dlg.destroy()
                self.refresh_current_view()
            except Exception as ex:
                messagebox.showerror("Error", f"Gagal tebar bibit: {ex}")

        tk.Button(dlg, text="Konfirmasi Tebar Bibit", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", command=save).pack(fill="x", pady=(16, 0), ipady=5)

    def open_modal_mortalitas(self):
        dlg = tk.Toplevel(self)
        dlg.title("Catat Kematian Ikan (Mortalitas)")
        dlg.geometry("440x360")
        dlg.configure(bg=self.colors["card"], padx=20, pady=20)
        dlg.transient(self)
        dlg.grab_set()

        tk.Label(dlg, text="Catat Kematian (Mortalitas)", font=("Segoe UI", 12, "bold"), bg=self.colors["card"], fg=self.colors["danger"]).pack(anchor="w", pady=(0, 10))

        tk.Label(dlg, text="Pilih Kolam:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        ponds = getattr(self, "ponds_cache", [])
        pond_names = [f"{p.get('name')} (Stok: {p.get('current_ekor')} ekor)" for p in ponds]
        cb_pond = ttk.Combobox(dlg, values=pond_names, state="readonly")
        if pond_names:
            cb_pond.current(0)
        cb_pond.pack(fill="x", pady=2)

        tk.Label(dlg, text="Jumlah Ikan Mati (Ekor):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_ekor = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_ekor.insert(0, "15")
        e_ekor.pack(fill="x", pady=2)

        tk.Label(dlg, text="Estimasi Bobot Ikan Mati (Kg):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_kg = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_kg.insert(0, "3.5")
        e_kg.pack(fill="x", pady=2)

        tk.Label(dlg, text="Penyebab / Catatan Kematian:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_note = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_note.insert(0, "Kematian harian wajar pasca hujan lebat")
        e_note.pack(fill="x", pady=2)

        def save():
            try:
                idx = cb_pond.current()
                if idx < 0 or idx >= len(ponds):
                    messagebox.showerror("Error", "Pilih kolam terlebih dahulu")
                    return
                p_id = ponds[idx].get("id")
                self.api.catat_mortalitas(p_id, int(e_ekor.get().strip()), float(e_kg.get().strip()), e_note.get().strip())
                messagebox.showinfo("Berhasil", "Mortalitas tercatat & stok kolam terupdate!")
                dlg.destroy()
                self.refresh_current_view()
            except Exception as ex:
                messagebox.showerror("Error", f"Gagal mencatat kematian: {ex}")

        tk.Button(dlg, text="Simpan Mortalitas", bg=self.colors["danger"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", command=save).pack(fill="x", pady=(16, 0), ipady=5)

    def open_modal_tambah_penjualan(self):
        dlg = tk.Toplevel(self)
        dlg.title("Tambah Penjualan Ikan (Auto 4110 & 1140)")
        dlg.geometry("480x490")
        dlg.configure(bg=self.colors["card"], padx=20, pady=20)
        dlg.transient(self)
        dlg.grab_set()

        tk.Label(dlg, text="Faktur Penjualan Baru", font=("Segoe UI", 12, "bold"), bg=self.colors["card"], fg=self.colors["primary"]).pack(anchor="w", pady=(0, 10))

        tk.Label(dlg, text="Nama Pembeli / Restoran:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_buyer = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_buyer.insert(0, "Restoran Gurame Bakar Pak Slamet")
        e_buyer.pack(fill="x", pady=2)

        tk.Label(dlg, text="Asal Kolam Panen:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        ponds = getattr(self, "ponds_cache", [])
        pond_names = [f"{p.get('name')} ({p.get('id')})" for p in ponds]
        cb_pond = ttk.Combobox(dlg, values=pond_names, state="readonly")
        if pond_names:
            cb_pond.current(0)
        cb_pond.pack(fill="x", pady=2)

        tk.Label(dlg, text="Jumlah Ikan (Ekor):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_ekor = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_ekor.insert(0, "200")
        e_ekor.pack(fill="x", pady=2)

        tk.Label(dlg, text="Total Berat (Kg):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_kg = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_kg.insert(0, "150.0")
        e_kg.pack(fill="x", pady=2)

        tk.Label(dlg, text="Harga per Kg (Rp):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_price = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_price.insert(0, "38000")
        e_price.pack(fill="x", pady=2)

        tk.Label(dlg, text="Status Pembayaran:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        cb_status = ttk.Combobox(dlg, values=["LUNAS", "TEMPO"], state="readonly")
        cb_status.set("LUNAS")
        cb_status.pack(fill="x", pady=2)

        tk.Label(dlg, text="Rekening Penerima (Jika Lunas):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        cash_accs = getattr(self, "cash_accs_cache", [])
        cash_names = [f"{c.get('name')} (Saldo: {format_rupiah(c.get('balance'))})" for c in cash_accs]
        cb_cash = ttk.Combobox(dlg, values=cash_names, state="readonly")
        if cash_names:
            cb_cash.current(0)
        cb_cash.pack(fill="x", pady=2)

        def save():
            try:
                idx_p = cb_pond.current()
                p_id = ponds[idx_p].get("id") if idx_p >= 0 else None
                c_id = None
                if cb_status.get() == "LUNAS":
                    idx_c = cb_cash.current()
                    c_id = cash_accs[idx_c].get("id") if idx_c >= 0 else None

                self.api.create_sale(
                    e_buyer.get().strip(),
                    p_id,
                    int(e_ekor.get().strip()),
                    float(e_kg.get().strip()),
                    float(e_price.get().strip()),
                    cb_status.get(),
                    c_id,
                    "Penjualan Gurame Konsumsi",
                )
                messagebox.showinfo("Berhasil", "Penjualan berhasil dicatat & jurnal otomatis terbuat!")
                dlg.destroy()
                self.refresh_current_view()
            except Exception as ex:
                messagebox.showerror("Error", f"Gagal mencatat penjualan: {ex}")

        tk.Button(dlg, text="Simpan & Terbitkan Faktur", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", command=save).pack(fill="x", pady=(16, 0), ipady=5)

    def open_modal_catat_pengeluaran(self):
        dlg = tk.Toplevel(self)
        dlg.title("Catat Pengeluaran (Auto-Jurnal 1160/1170/6110/6120)")
        dlg.geometry("460x400")
        dlg.configure(bg=self.colors["card"], padx=20, pady=20)
        dlg.transient(self)
        dlg.grab_set()

        tk.Label(dlg, text="Catat Pengeluaran Baru", font=("Segoe UI", 12, "bold"), bg=self.colors["card"], fg=self.colors["primary"]).pack(anchor="w", pady=(0, 10))

        tk.Label(dlg, text="Kategori Pengeluaran:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        cb_cat = ttk.Combobox(dlg, values=["PAKAN", "OBAT", "GAJI", "OPERASIONAL"], state="readonly")
        cb_cat.set("PAKAN")
        cb_cat.pack(fill="x", pady=2)

        tk.Label(dlg, text="Aturan Akuntansi Otomatis:", font=("Segoe UI", 8), bg=self.colors["card"], fg=self.colors["accent"]).pack(anchor="w", pady=(0, 4))

        tk.Label(dlg, text="Nominal Pengeluaran (Rp):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_nom = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_nom.insert(0, "1500000")
        e_nom.pack(fill="x", pady=2)

        tk.Label(dlg, text="Sumber Kas / Bank:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        cash_accs = getattr(self, "cash_accs_cache", [])
        cash_names = [f"{c.get('name')} (Saldo: {format_rupiah(c.get('balance'))})" for c in cash_accs]
        cb_cash = ttk.Combobox(dlg, values=cash_names, state="readonly")
        if cash_names:
            cb_cash.current(0)
        cb_cash.pack(fill="x", pady=2)

        tk.Label(dlg, text="Keterangan Pengeluaran:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_note = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_note.insert(0, "Pembelian pakan pelet gurame 5 sak")
        e_note.pack(fill="x", pady=2)

        def save():
            try:
                idx_c = cb_cash.current()
                if idx_c < 0:
                    messagebox.showerror("Error", "Pilih rekening sumber kas")
                    return
                c_id = cash_accs[idx_c].get("id")
                self.api.create_expense(cb_cat.get(), float(e_nom.get().strip()), c_id, e_note.get().strip())
                messagebox.showinfo("Berhasil", "Pengeluaran tercatat & saldo kas terpotong!")
                dlg.destroy()
                self.refresh_current_view()
            except Exception as ex:
                messagebox.showerror("Error", f"Gagal mencatat pengeluaran: {ex}")

        tk.Button(dlg, text="Konfirmasi Pengeluaran", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", command=save).pack(fill="x", pady=(16, 0), ipady=5)

    def open_modal_tambah_faktur_supplier(self):
        dlg = tk.Toplevel(self)
        dlg.title("Tambah Faktur Tagihan Supplier (Kredit)")
        dlg.geometry("460x380")
        dlg.configure(bg=self.colors["card"], padx=20, pady=20)
        dlg.transient(self)
        dlg.grab_set()

        tk.Label(dlg, text="Faktur Utang Usaha Pemasok (2110)", font=("Segoe UI", 12, "bold"), bg=self.colors["card"], fg=self.colors["warning"]).pack(anchor="w", pady=(0, 10))

        tk.Label(dlg, text="Nama Pemasok / Supplier:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_sup = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_sup.insert(0, "CV Pakan Makmur Mandiri")
        e_sup.pack(fill="x", pady=2)

        tk.Label(dlg, text="Kategori Barang:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        cb_cat = ttk.Combobox(dlg, values=["Pakan", "Bibit", "Obat / Suplemen", "Lain-lain"], state="readonly")
        cb_cat.set("Pakan")
        cb_cat.pack(fill="x", pady=2)

        tk.Label(dlg, text="Total Tagihan (Rp):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_amount = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_amount.insert(0, "6500000")
        e_amount.pack(fill="x", pady=2)

        tk.Label(dlg, text="Tanggal Jatuh Tempo (YYYY-MM-DD):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_due = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_due.insert(0, "2026-12-15")
        e_due.pack(fill="x", pady=2)

        tk.Label(dlg, text="Catatan Faktur:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_note = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_note.insert(0, "Pengiriman pakan pelet protein tinggi 20 sak")
        e_note.pack(fill="x", pady=2)

        def save():
            try:
                self.api.create_supplier_invoice(
                    e_sup.get().strip(),
                    cb_cat.get(),
                    float(e_amount.get().strip()),
                    e_due.get().strip(),
                    e_note.get().strip(),
                )
                messagebox.showinfo("Berhasil", "Faktur utang pemasok berhasil dicatat (Auto Jurnal Utang 2110)!")
                dlg.destroy()
                self.refresh_current_view()
            except Exception as ex:
                messagebox.showerror("Error", f"Gagal mencatat faktur: {ex}")

        tk.Button(dlg, text="Simpan Faktur Supplier", bg=self.colors["warning"], fg="black", font=("Segoe UI", 9, "bold"), relief="flat", command=save).pack(fill="x", pady=(16, 0), ipady=5)

    def open_modal_bayar_utang(self):
        dlg = tk.Toplevel(self)
        dlg.title("Pelunasan Utang Usaha Supplier")
        dlg.geometry("460x360")
        dlg.configure(bg=self.colors["card"], padx=20, pady=20)
        dlg.transient(self)
        dlg.grab_set()

        tk.Label(dlg, text="Pelunasan Utang Supplier (Debit 2110)", font=("Segoe UI", 12, "bold"), bg=self.colors["card"], fg=self.colors["primary"]).pack(anchor="w", pady=(0, 10))

        tk.Label(dlg, text="Pilih Faktur Tagihan yang Dibayar:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        invoices = getattr(self, "invoices_cache", [])
        unpaid_invs = [inv for inv in invoices if inv.get("status") != "LUNAS"]
        inv_names = [f"{inv.get('invoice_number')} - {inv.get('supplier_name')} (Sisa: {format_rupiah(inv.get('total_amount', 0) - inv.get('paid_amount', 0))})" for inv in unpaid_invs]

        if not unpaid_invs:
            tk.Label(dlg, text="Tidak ada faktur tagihan supplier yang belum lunas.", font=("Segoe UI", 9, "italic"), bg=self.colors["card"], fg=self.colors["success"]).pack(pady=20)
            return

        cb_inv = ttk.Combobox(dlg, values=inv_names, state="readonly")
        cb_inv.current(0)
        cb_inv.pack(fill="x", pady=2)

        tk.Label(dlg, text="Jumlah Nominal Pelunasan (Rp):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_amount = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        first_rem = unpaid_invs[0].get("total_amount", 0) - unpaid_invs[0].get("paid_amount", 0)
        e_amount.insert(0, str(int(first_rem)))
        e_amount.pack(fill="x", pady=2)

        tk.Label(dlg, text="Dibayar Menggunakan Kas / Bank:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        cash_accs = getattr(self, "cash_accs_cache", [])
        cash_names = [f"{c.get('name')} (Saldo: {format_rupiah(c.get('balance'))})" for c in cash_accs]
        cb_cash = ttk.Combobox(dlg, values=cash_names, state="readonly")
        if cash_names:
            cb_cash.current(0)
        cb_cash.pack(fill="x", pady=2)

        def save():
            try:
                idx_i = cb_inv.current()
                idx_c = cb_cash.current()
                if idx_i < 0 or idx_c < 0:
                    messagebox.showerror("Error", "Pilih faktur dan kas pembayar")
                    return
                inv_id = unpaid_invs[idx_i].get("id")
                c_id = cash_accs[idx_c].get("id")

                self.api.pay_supplier_invoice(inv_id, float(e_amount.get().strip()), c_id, "Pelunasan tagihan pakan/benih supplier")
                messagebox.showinfo("Berhasil", "Pembayaran utang berhasil dibukukan!")
                dlg.destroy()
                self.refresh_current_view()
            except Exception as ex:
                messagebox.showerror("Error", f"Gagal bayar utang: {ex}")

        tk.Button(dlg, text="Konfirmasi Pelunasan", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", command=save).pack(fill="x", pady=(16, 0), ipady=5)

    def open_modal_transfer_kas(self):
        dlg = tk.Toplevel(self)
        dlg.title("Transfer Antar Kas & Rekening Bank")
        dlg.geometry("460x360")
        dlg.configure(bg=self.colors["card"], padx=20, pady=20)
        dlg.transient(self)
        dlg.grab_set()

        tk.Label(dlg, text="Transfer Saldo Kas & Bank", font=("Segoe UI", 12, "bold"), bg=self.colors["card"], fg=self.colors["accent"]).pack(anchor="w", pady=(0, 10))

        cash_accs = getattr(self, "cash_accs_cache", [])
        cash_names = [f"{c.get('name')} ({c.get('code')})" for c in cash_accs]

        tk.Label(dlg, text="Dari Rekening Pengirim:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        cb_from = ttk.Combobox(dlg, values=cash_names, state="readonly")
        if cash_names:
            cb_from.current(0)
        cb_from.pack(fill="x", pady=2)

        tk.Label(dlg, text="Ke Rekening Penerima:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        cb_to = ttk.Combobox(dlg, values=cash_names, state="readonly")
        if len(cash_names) > 1:
            cb_to.current(1)
        cb_to.pack(fill="x", pady=2)

        tk.Label(dlg, text="Nominal Transfer (Rp):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_amount = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_amount.insert(0, "5000000")
        e_amount.pack(fill="x", pady=2)

        tk.Label(dlg, text="Keterangan / Keperluan:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_note = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_note.insert(0, "Pengisian kas kecil operasional kolam dari Bank BCA")
        e_note.pack(fill="x", pady=2)

        def save():
            try:
                i_from = cb_from.current()
                i_to = cb_to.current()
                if i_from == i_to:
                    messagebox.showerror("Error", "Rekening pengirim dan penerima tidak boleh sama")
                    return
                from_id = cash_accs[i_from].get("id")
                to_id = cash_accs[i_to].get("id")
                self.api.transfer_cash(from_id, to_id, float(e_amount.get().strip()), e_note.get().strip())
                messagebox.showinfo("Berhasil", "Transfer saldo kas & jurnal mutasi berhasil dibuat!")
                dlg.destroy()
                self.refresh_current_view()
            except Exception as ex:
                messagebox.showerror("Error", f"Gagal transfer: {ex}")

        tk.Button(dlg, text="Kirim Saldo Transfer", bg=self.colors["accent"], fg="black", font=("Segoe UI", 9, "bold"), relief="flat", command=save).pack(fill="x", pady=(16, 0), ipady=5)

    def open_modal_tambah_coa(self):
        dlg = tk.Toplevel(self)
        dlg.title("Tambah Akun Bagan Akun (COA)")
        dlg.geometry("440x360")
        dlg.configure(bg=self.colors["card"], padx=20, pady=20)
        dlg.transient(self)
        dlg.grab_set()

        tk.Label(dlg, text="Tambah Akun Bagan Akun (COA)", font=("Segoe UI", 12, "bold"), bg=self.colors["card"], fg=self.colors["primary"]).pack(anchor="w", pady=(0, 10))

        tk.Label(dlg, text="Kode Akun (misal: 6150):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_code = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_code.pack(fill="x", pady=2)

        tk.Label(dlg, text="Nama Akun:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_name = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_name.pack(fill="x", pady=2)

        tk.Label(dlg, text="Kategori Akun:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        cb_cat = ttk.Combobox(dlg, values=["ASET", "KEWAJIBAN", "EKUITAS", "PENDAPATAN", "BEBAN"], state="readonly")
        cb_cat.set("BEBAN")
        cb_cat.pack(fill="x", pady=2)

        tk.Label(dlg, text="Saldo Normal:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        cb_bal = ttk.Combobox(dlg, values=["DEBIT", "KREDIT"], state="readonly")
        cb_bal.set("DEBIT")
        cb_bal.pack(fill="x", pady=2)

        tk.Label(dlg, text="Deskripsi Akun:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_desc = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_desc.pack(fill="x", pady=2)

        def save():
            try:
                self.api.add_coa(e_code.get().strip(), e_name.get().strip(), cb_cat.get(), cb_bal.get(), e_desc.get().strip())
                messagebox.showinfo("Berhasil", "Akun COA baru berhasil didaftarkan!")
                dlg.destroy()
                self.refresh_current_view()
            except Exception as ex:
                messagebox.showerror("Error", f"Gagal menambahkan akun: {ex}")

        tk.Button(dlg, text="Simpan Akun COA", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", command=save).pack(fill="x", pady=(16, 0), ipady=5)

    def open_modal_jurnal_manual(self):
        dlg = tk.Toplevel(self)
        dlg.title("Entri Jurnal Umum Manual (Double-Entry)")
        dlg.geometry("520x450")
        dlg.configure(bg=self.colors["card"], padx=20, pady=20)
        dlg.transient(self)
        dlg.grab_set()

        tk.Label(dlg, text="Entri Jurnal Manual (Harus Seimbang)", font=("Segoe UI", 12, "bold"), bg=self.colors["card"], fg=self.colors["primary"]).pack(anchor="w", pady=(0, 10))

        tk.Label(dlg, text="Tanggal (YYYY-MM-DD):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_date = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_date.insert(0, datetime.now().strftime("%Y-%m-%d"))
        e_date.pack(fill="x", pady=2)

        tk.Label(dlg, text="Deskripsi Transaksi:", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_desc = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_desc.insert(0, "Penyesuaian saldo perlengkapan kolam")
        e_desc.pack(fill="x", pady=2)

        coas = getattr(self, "coa_cache", [])
        coa_names = [f"{c.get('code')} - {c.get('name')}" for c in coas]

        # Sisi Debet
        tk.Label(dlg, text="Akun Debet:", bg=self.colors["card"], fg=self.colors["accent"]).pack(anchor="w", pady=(6, 0))
        cb_deb = ttk.Combobox(dlg, values=coa_names, state="readonly")
        if coa_names:
            cb_deb.current(0)
        cb_deb.pack(fill="x", pady=2)

        tk.Label(dlg, text="Nominal Debet (Rp):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_deb_nom = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_deb_nom.insert(0, "1000000")
        e_deb_nom.pack(fill="x", pady=2)

        # Sisi Kredit
        tk.Label(dlg, text="Akun Kredit:", bg=self.colors["card"], fg=self.colors["warning"]).pack(anchor="w", pady=(6, 0))
        cb_cre = ttk.Combobox(dlg, values=coa_names, state="readonly")
        if len(coa_names) > 1:
            cb_cre.current(1)
        cb_cre.pack(fill="x", pady=2)

        tk.Label(dlg, text="Nominal Kredit (Rp):", bg=self.colors["card"], fg=self.colors["text"]).pack(anchor="w")
        e_cre_nom = tk.Entry(dlg, bg=self.colors["sidebar"], fg=self.colors["text"], insertbackground="white")
        e_cre_nom.insert(0, "1000000")
        e_cre_nom.pack(fill="x", pady=2)

        def save():
            try:
                d_val = float(e_deb_nom.get().strip())
                c_val = float(e_cre_nom.get().strip())
                if abs(d_val - c_val) > 0.01:
                    messagebox.showerror("Error", f"Jurnal tidak seimbang!\nTotal Debet (Rp {d_val:,.0f}) != Total Kredit (Rp {c_val:,.0f})")
                    return

                code_d = coas[cb_deb.current()].get("code")
                name_d = coas[cb_deb.current()].get("name")
                code_c = coas[cb_cre.current()].get("code")
                name_c = coas[cb_cre.current()].get("name")

                items = [
                    {"account_code": code_d, "account_name": name_d, "debit": d_val, "credit": 0.0},
                    {"account_code": code_c, "account_name": name_c, "debit": 0.0, "credit": c_val},
                ]

                self.api.create_manual_journal(e_date.get().strip(), e_desc.get().strip(), items)
                messagebox.showinfo("Berhasil", "Jurnal umum manual berhasil dibukukan!")
                dlg.destroy()
                self.refresh_current_view()
            except Exception as ex:
                messagebox.showerror("Error", f"Gagal membuat jurnal: {ex}")

        tk.Button(dlg, text="Simpan Jurnal Umum", bg=self.colors["primary"], fg="white", font=("Segoe UI", 9, "bold"), relief="flat", command=save).pack(fill="x", pady=(16, 0), ipady=5)

    # =========================================================================
    # EKSPOR KE CSV HELPER
    # =========================================================================
    def export_treeview_to_csv(self, tree, default_filename):
        try:
            filepath = filedialog.asksaveasfilename(
                defaultextension=".csv",
                filetypes=[("CSV Files", "*.csv"), ("All Files", "*.*")],
                initialfile=default_filename,
                title="Simpan File CSV",
            )
            if not filepath:
                return

            columns = tree["columns"]
            headers = [tree.heading(col)["text"] for col in columns]

            with open(filepath, mode="w", newline="", encoding="utf-8-sig") as f:
                writer = csv.writer(f)
                writer.writerow(headers)
                for item_id in tree.get_children():
                    row = tree.item(item_id)["values"]
                    writer.writerow(row)

            messagebox.showinfo("Ekspor Berhasil", f"File berhasil disimpan di:\n{filepath}")
        except Exception as ex:
            messagebox.showerror("Ekspor Gagal", f"Terjadi kesalahan saat menyimpan CSV:\n{ex}")


if __name__ == "__main__":
    app = GoorameApp()
    app.mainloop()
