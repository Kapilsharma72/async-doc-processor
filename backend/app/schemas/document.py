from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime
from uuid import UUID
from ..models.document import JobStatus

class DocumentUploadResponse(BaseModel):
    id: UUID
    filename: str
    status: JobStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

class DocumentListItem(BaseModel):
    id: UUID
    original_filename: str
    file_type: Optional[str]
    file_size: Optional[str]
    status: JobStatus
    processing_stage: Optional[str]
    finalized: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class DocumentDetail(BaseModel):
    id: UUID
    original_filename: str
    file_type: Optional[str]
    file_size: Optional[str]
    status: JobStatus
    processing_stage: Optional[str]
    extracted_data: Optional[Dict[str, Any]]
    reviewed_data: Optional[Dict[str, Any]]
    finalized: str
    error_message: Optional[str]
    retry_count: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UpdateReviewedData(BaseModel):
    reviewed_data: Dict[str, Any]

class ExportFormat(str):
    JSON = "json"
    CSV = "csv"
