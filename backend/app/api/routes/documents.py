from fastapi import APIRouter, Depends, UploadFile, File, Query
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List
from ...database import get_db
from ...schemas.document import (
    DocumentUploadResponse, DocumentListItem,
    DocumentDetail, UpdateReviewedData
)
from ...services import document_service, export_service

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload", response_model=List[DocumentUploadResponse])
async def upload_documents(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    documents = await document_service.save_upload_and_queue(files, db)
    return documents

@router.get("/", response_model=List[DocumentListItem])
def list_documents(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return document_service.get_all_documents(db, status=status, search=search)

@router.get("/{document_id}", response_model=DocumentDetail)
def get_document(document_id: UUID, db: Session = Depends(get_db)):
    return document_service.get_document_by_id(document_id, db)

@router.post("/{document_id}/retry", response_model=DocumentDetail)
def retry_job(document_id: UUID, db: Session = Depends(get_db)):
    return document_service.retry_failed_job(document_id, db)

@router.put("/{document_id}/review", response_model=DocumentDetail)
def update_review(
    document_id: UUID,
    body: UpdateReviewedData,
    db: Session = Depends(get_db)
):
    return document_service.update_reviewed_data(document_id, body.reviewed_data, db)

@router.post("/{document_id}/finalize", response_model=DocumentDetail)
def finalize(document_id: UUID, db: Session = Depends(get_db)):
    return document_service.finalize_document(document_id, db)

@router.get("/{document_id}/export")
def export_document(
    document_id: UUID,
    format: str = Query("json", enum=["json", "csv"]),
    db: Session = Depends(get_db)
):
    if format == "csv":
        content = export_service.export_as_csv(document_id, db)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={document_id}.csv"}
        )
    content = export_service.export_as_json(document_id, db)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={document_id}.json"}
    )
