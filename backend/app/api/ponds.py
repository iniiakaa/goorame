from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.pond import Pond, StockMutation
from app.schemas.pond import (
    PondCreate,
    PondResponse,
    TebarBibitRequest,
    MortalitasRequest,
    StockMutationResponse,
)

router = APIRouter(prefix="/ponds", tags=["Manajemen Kolam & Stok"])

@router.get("", response_model=list[PondResponse])
def get_all_ponds(db: Session = Depends(get_db)):
    return db.query(Pond).order_by(Pond.name).all()

@router.post("", response_model=PondResponse)
def create_pond(payload: PondCreate, db: Session = Depends(get_db)):
    pond = Pond(
        name=payload.name,
        type=payload.type,
        dimension=payload.dimension,
        capacity_ekor=payload.capacity_ekor,
        initial_stock=payload.initial_stock,
        current_ekor=payload.initial_stock,
        current_kg_estimasi=payload.initial_kg,
        total_tebar=payload.initial_stock,
        total_mati=0,
        total_panen=0,
        survival_rate=100.0,
        status="AKTIF",
    )
    db.add(pond)
    db.commit()
    db.refresh(pond)
    return pond

@router.post("/tebar", response_model=StockMutationResponse)
def tebar_bibit(payload: TebarBibitRequest, db: Session = Depends(get_db)):
    pond = db.query(Pond).filter(Pond.id == payload.pond_id).first()
    if not pond:
        raise HTTPException(status_code=404, detail="Kolam tidak ditemukan")

    date_str = datetime.now().strftime("%Y-%m-%d")
    mutation = StockMutation(
        pond_id=pond.id,
        date=date_str,
        type="TEBAR",
        ekor=payload.ekor,
        weight_kg=payload.weight_kg,
        note=payload.note,
        reference_id=f"TBR-{datetime.now().strftime('%Y%m%d%H%M')}",
    )
    db.add(mutation)

    # Update pond stock
    pond.total_tebar += payload.ekor
    pond.current_ekor += payload.ekor
    pond.current_kg_estimasi += payload.weight_kg
    if pond.total_tebar > 0:
        sr = ((pond.total_tebar - pond.total_mati) / pond.total_tebar) * 100.0
        pond.survival_rate = round(max(0.0, min(100.0, sr)), 1)

    db.commit()
    db.refresh(mutation)
    return mutation

@router.post("/mortalitas", response_model=StockMutationResponse)
def catat_mortalitas(payload: MortalitasRequest, db: Session = Depends(get_db)):
    pond = db.query(Pond).filter(Pond.id == payload.pond_id).first()
    if not pond:
        raise HTTPException(status_code=404, detail="Kolam tidak ditemukan")

    date_str = datetime.now().strftime("%Y-%m-%d")
    mutation = StockMutation(
        pond_id=pond.id,
        date=date_str,
        type="MATI",
        ekor=payload.ekor,
        weight_kg=payload.weight_kg,
        note=payload.note,
        reference_id=f"MT-{datetime.now().strftime('%Y%m%d%H%M')}",
    )
    db.add(mutation)

    # Update pond stock
    pond.total_mati += payload.ekor
    pond.current_ekor = max(0, pond.current_ekor - payload.ekor)
    pond.current_kg_estimasi = max(0.0, pond.current_kg_estimasi - payload.weight_kg)
    if pond.total_tebar > 0:
        sr = ((pond.total_tebar - pond.total_mati) / pond.total_tebar) * 100.0
        pond.survival_rate = round(max(0.0, min(100.0, sr)), 1)

    db.commit()
    db.refresh(mutation)
    return mutation

@router.get("/mutations", response_model=list[StockMutationResponse])
def get_all_mutations(db: Session = Depends(get_db)):
    return db.query(StockMutation).order_by(StockMutation.created_at.desc()).all()

