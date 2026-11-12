import os
import sys
import uvicorn

# Ensure the backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    # Railway injects PORT env var; fallback to 8000 for local dev
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0"  # Must bind to 0.0.0.0 on Railway / cloud

    reload_enabled = os.environ.get("ENV", "production") == "development"

    print("==================================================")
    print("🚀 Goorame Mini-ERP Backend (FastAPI)")
    print(f"🌍 Host: {host}:{port}")
    print("📖 Swagger UI: /docs")
    print("==================================================")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload_enabled,
    )
