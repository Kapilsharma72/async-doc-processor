import json
import csv
import io
from uuid import UUID
from sqlalchemy.orm import Session
from .document_service import get_document_by_id

def export_as_json(document_id: UUID, db: Session) -> str:
    doc = get_document_by_id(document_id, db)
    data = doc.reviewed_data or doc.extracted_data or {}
    export_payload = {
        "id": str(doc.id),
        "filename": doc.original_filename,
        "status": doc.status,
        "finalized": doc.finalized,
        "data": data,
    }
    return json.dumps(export_payload, indent=2)

def export_as_csv(document_id: UUID, db: Session) -> str:
    doc = get_document_by_id(document_id, db)
    data = doc.reviewed_data or doc.extracted_data or {}
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["field", "value"])
    writer.writerow(["id", str(doc.id)])
    writer.writerow(["filename", doc.original_filename])
    writer.writerow(["status", doc.status])
    writer.writerow(["finalized", doc.finalized])
    
    for key, value in data.items():
        writer.writerow([key, json.dumps(value) if isinstance(value, (dict, list)) else value])
    
    return output.getvalue()
