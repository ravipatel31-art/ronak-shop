from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Enquiry
from ..schemas import EnquiryIn


router = APIRouter(prefix="/api", tags=["enquiries"])


@router.post("/enquiries", status_code=status.HTTP_201_CREATED)
def create_enquiry(payload: EnquiryIn, db: Session = Depends(get_db)) -> dict:
    enquiry = Enquiry(**payload.model_dump())
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return {
        "id": enquiry.id,
        "name": enquiry.name,
        "email": enquiry.email,
        "phone": enquiry.phone,
        "category": enquiry.category,
        "message": enquiry.message,
        "created_at": enquiry.created_at.isoformat(),
    }


@router.get("/enquiries", response_model=list[dict])
def list_enquiries(
    db: Session = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
) -> list[dict]:
    q = db.query(Enquiry).order_by(Enquiry.created_at.desc())
    total = q.count()
    items = q.limit(limit).offset(offset).all()
    return [
        {
            "id": e.id,
            "name": e.name,
            "email": e.email,
            "phone": e.phone,
            "category": e.category,
            "message": e.message,
            "created_at": e.created_at.isoformat(),
            "total": total,
            "has_more": offset + limit < total,
        }
        for e in items
    ]
