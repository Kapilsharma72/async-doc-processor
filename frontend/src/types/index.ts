export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface DocumentListItem {
  id: string;
  original_filename: string;
  file_type: string;
  file_size: string;
  status: JobStatus;
  processing_stage: string;
  finalized: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetail extends DocumentListItem {
  extracted_data: Record<string, unknown> | null;
  reviewed_data: Record<string, unknown> | null;
  error_message: string | null;
  retry_count: string;
}

export interface ProgressEvent {
  job_id: string;
  event: string;
  stage: string;
  message: string;
}
