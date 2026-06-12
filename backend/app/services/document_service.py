import os
import aiofiles
from uuid import UUID
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from ..models.document import Document, JobStatus
from ..worker.tasks import process_document
from ..config import settings

async def save_upload_and_queue(files: list[UploadFile], db: Session) -> list[Document]:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    documents = []
    
    for file in files:
        # Save file
        safe_name = f"{os.urandom(8).hex()}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, safe_name)
        
        content = await file.read()
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)
        
        # Create DB record
        doc = Document(
            filename=safe_name,
            original_filename=file.filename,
            file_size=str(len(content)),
            file_type=file.content_type,
            status=JobStatus.QUEUED,
            processing_stage="queued"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        # Queue Celery task
        task = process_document.delay(str(doc.id))
        doc.celery_task_id = task.id
        db.commit()
        
        documents.append(doc)
    
    return documents

def get_all_documents(db: Session, status: str = None, search: str = None):
    query = db.query(Document)
    if status:
        query = query.filter(Document.status == status)
    if search:
        query = query.filter(Document.original_filename.ilike(f"%{search}%"))
    return query.order_by(Document.created_at.desc()).all()

def get_document_by_id(document_id: UUID, db: Session):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

def retry_failed_job(document_id: UUID, db: Session):
    doc = get_document_by_id(document_id, db)
    if doc.status != JobStatus.FAILED:
        raise HTTPException(status_code=400, detail="Only failed jobs can be retried")
    
    doc.status = JobStatus.QUEUED
    doc.processing_stage = "queued"
    doc.error_message = None
    doc.retry_count = str(int(doc.retry_count or "0") + 1)
    db.commit()
    
    task = process_document.delay(str(doc.id))
    doc.celery_task_id = task.id
    db.commit()
    return doc

def update_reviewed_data(document_id: UUID, reviewed_data: dict, db: Session):
    doc = get_document_by_id(document_id, db)
    doc.reviewed_data = reviewed_data
    db.commit()
    db.refresh(doc)
    return doc

def finalize_document(document_id: UUID, db: Session):
    doc = get_document_by_id(document_id, db)
    if doc.status != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Only completed jobs can be finalized")
    doc.finalized = "true"
    db.commit()
    db.refresh(doc)
    return doc
