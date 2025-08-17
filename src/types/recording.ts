export interface RecordingStatusResponse {
  recording: boolean;
  file: string | null;
  startedAt: string | null; // ISO string
  id?: string; // Add id if backend's status endpoint provides it
}

export interface StartRecordingResponse {
  path: string;
  id: string; // Recording ID from DB
}

export interface StopRecordingResponse {
  id: string;
  status: string; // e.g., "finished", "stopped"
  path: string;
}

// For the list endpoint, the backend returns string[] of full paths.
// For displaying records from the DB (if we decide to use the paginated endpoint),
// we would use CreateRecordingDto / RecordingResultDto from the backend.
export type RecordingFilePath = string;

export interface RecordingMetadata {
  size: number;
  modified: string; // ISO string
}

// Corresponds to CreateRecordingDto / RecordingResultDto from the backend
export interface RecordingResultDto {
  id: string;
  path: string;
  type: string; // e.g., 'screenRecord', 'screenShot'
  pid: string;
  status: string;
  data: { // Dynamic data, typically JSONB field in DB
    startedAt?: string;
    stoppedAt?: string;
    duration?: number;
    fileSize?: number;
    capturedAt?: string;
    // Add other properties that might be stored in 'data' field
    [key: string]: any;
  };
  createdAt: string;
  createdById: string;
}

export interface PaginationRecordingResultDto {
  items: RecordingResultDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
