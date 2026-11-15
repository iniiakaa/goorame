from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Autentikasi & Pengguna"])

DISPLAY_NAMES: dict[str, str] = {
    "PEMILIK": "Pemilik",
    "PEKERJA": "Pekerja",
}

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    clean_username = payload.username.strip().lower()
    user = db.query(User).filter(User.username == clean_username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username tidak terdaftar di sistem",
        )

    # Validasi password ketat dengan verify_password
    if not payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kata sandi harus diisi",
        )

    # Cek kecocokan password
    is_valid = verify_password(payload.password, user.password_hash)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kata sandi tidak sesuai",
        )

    # Normalisasi nama tampilan agar tidak ada nama lama (H. Slamet, Pak Budi, dll)
    expected_name = DISPLAY_NAMES.get(user.role, user.role.capitalize())
    if user.full_name != expected_name:
        user.full_name = expected_name
        db.commit()
        db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }

@router.get("/users", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()


class PatchUserRequest(BaseModel):
    full_name: str | None = None


@router.patch("/users/{user_id}", response_model=UserResponse)
def patch_user(user_id: str, payload: PatchUserRequest, db: Session = Depends(get_db)):
    """Update user data - digunakan untuk migrasi nama tampilan."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    if payload.full_name is not None:
        user.full_name = payload.full_name
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    """Hapus akun ghost / akun sisa demo yang tidak terpakai."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    # Lindungi akun utama
    if user.username in ("pemilik", "pekerja"):
        raise HTTPException(status_code=403, detail="Akun utama tidak dapat dihapus melalui endpoint ini")
    db.delete(user)
    db.commit()
    return {"message": f"Akun '{user.username}' berhasil dihapus"}

