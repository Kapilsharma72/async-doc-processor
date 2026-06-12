from sqlalchemy import Column, String, DateTime, JSON, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from ..database import Base

class JobStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_size = Column(String)
    file_type = Column(String)
    status = Column(Enum(JobStatus), default=JobStatus.QUEUED)
    celery_task_id = Column(String, nullable=True)
    processing_stage = Column(String, nullable=True)
    extracted_data = Column(JSON, nullable=True)
    reviewed_data = Column(JSON, nullable=True)
    finalized = Column(String, default="false")
    error_message = Column(Text, nullable=True)
    retry_count = Column(String, default="0")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
