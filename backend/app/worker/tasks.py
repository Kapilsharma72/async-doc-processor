import time
import json
import redis
from uuid import UUID
from ..worker.celery_app import celery_app
from ..config import settings
from ..database import SessionLocal
from ..models.document import Document, JobStatus

redis_client = redis.from_url(settings.REDIS_URL)

def publish_progress(job_id: str, event: str, stage: str, message: str):
    """Publish progress event to Redis Pub/Sub channel"""
    payload = json.dumps({
        "job_id": job_id,
        "event": event,
        "stage": stage,
        "message": message,
    })
    redis_client.publish(f"job_progress:{job_id}", payload)

def update_job_stage(db, document: Document, stage: str, status: JobStatus = None):
    document.processing_stage = stage
    if status:
        document.status = status
    db.commit()

@celery_app.task(bind=True, name="process_document", max_retries=3)
def process_document(self, document_id: str):
    db = SessionLocal()
    try:
        document = db.query(Document).filter(
            Document.id == document_id
        ).first()
        
        if not document:
            return {"error": "Document not found"}

        # Stage 1: Job Started
        publish_progress(document_id, "job_started", "started", "Job has started processing")
        update_job_stage(db, document, "started", JobStatus.PROCESSING)
        time.sleep(1)

        # Stage 2: Parsing Started
        publish_progress(document_id, "document_parsing_started", "parsing", "Parsing document content")
        update_job_stage(db, document, "parsing")
        time.sleep(2)

        # Stage 3: Parsing Completed
        publish_progress(document_id, "document_parsing_completed", "parsing_done", "Document parsing completed")
        update_job_stage(db, document, "parsing_done")
        time.sleep(1)

        # Stage 4: Extraction Started
        publish_progress(document_id, "field_extraction_started", "extracting", "Starting field extraction")
        update_job_stage(db, document, "extracting")
        time.sleep(2)

        # Simulate extraction logic
        extracted = {
            "title": document.original_filename.rsplit(".", 1)[0].replace("_", " ").title(),
            "category": _detect_category(document.file_type),
            "summary": f"Processed document: {document.original_filename}. Contains structured data extracted via async pipeline.",
            "extracted_keywords": _extract_keywords(document.original_filename),
            "file_metadata": {
                "filename": document.original_filename,
                "file_type": document.file_type,
                "file_size": document.file_size,
            },
            "status": "extracted"
        }

        # Stage 5: Extraction Completed
        publish_progress(document_id, "field_extraction_completed", "extraction_done", "Field extraction completed")
        update_job_stage(db, document, "extraction_done")
        time.sleep(1)

        # Stage 6: Store Result
        document.extracted_data = extracted
        document.status = JobStatus.COMPLETED
        document.processing_stage = "completed"
        db.commit()

        # Stage 7: Job Completed
        publish_progress(document_id, "job_completed", "completed", "Document processing finished successfully")
        
        return {"status": "success", "document_id": document_id}

    except Exception as exc:
        db.rollback()
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.status = JobStatus.FAILED
            document.error_message = str(exc)
            document.processing_stage = "failed"
            db.commit()
        publish_progress(document_id, "job_failed", "failed", f"Processing failed: {str(exc)}")
        raise self.retry(exc=exc, countdown=5)
    finally:
        db.close()

def _detect_category(file_type: str) -> str:
    if not file_type:
        return "Unknown"
    ft = file_type.lower()
    if "pdf" in ft:
        return "PDF Document"
    elif "image" in ft:
        return "Image File"
    elif "text" in ft or "csv" in ft:
        return "Text/Data File"
    elif "word" in ft or "docx" in ft:
        return "Word Document"
    return "General Document"

def _extract_keywords(filename: str) -> list:
    words = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").split()
    return list(set([w.lower() for w in words if len(w) > 3]))[:8]
