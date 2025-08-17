export interface RecordingStatusResponse {
  recording: boolean;
  id: string | null; // Added to track the current recording's ID from the database
  file: string | null;
  startedAt: string | null;
}

export interface StartRecordingResponse {
  id: string;
  path: string;
}

export interface StopRecordingResponse {
  id: string;
  status: string;
  path: string;
}

export interface RecordingFilePath {
  path: string;
  // Add any other relevant file metadata here if `list` returns more
}

export interface RecordingMetadata {
  size: number;
  modified: string;
}

export interface RecordingResultDto {
  id: string;
  path: string;
  type: string;
  pid: string;
  status: string;
  data: any;
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
