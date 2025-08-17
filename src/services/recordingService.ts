import { apiFetch } from "@/services/apiFetch";
import {
  RecordingStatusResponse,
  StartRecordingResponse,
  StopRecordingResponse,
  RecordingFilePath,
  RecordingMetadata,
  PaginationRecordingResultDto,
} from "@/types/recording";

const BASE_API_PATH = "/api/recording";

export const recordingService = {
  getRecordingStatus(): Promise<RecordingStatusResponse> {
    return apiFetch<RecordingStatusResponse>(`${BASE_API_PATH}/status`, {
      method: "GET",
    });
  },

  listRecordings(): Promise<RecordingFilePath[]> {
    return apiFetch<RecordingFilePath[]>(`${BASE_API_PATH}/list`, {
      method: "GET",
    });
  },

  // This endpoint is for listing recordings from the DB, not just files on disk.
  // It provides more metadata like type, status, duration etc.
  listPaginatedRecordings(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PaginationRecordingResultDto> {
    return apiFetch<PaginationRecordingResultDto>(
      `${BASE_API_PATH}/paginated?page=${page}&pageSize=${pageSize}`,
      { method: "GET" },
    );
  },

  getRecordingMetadata(file: string): Promise<RecordingMetadata> {
    // Note: backend expects 'file' to be full path or filename if in downloads/recordings
    return apiFetch<RecordingMetadata>(
      `${BASE_API_PATH}/metadata?file=${encodeURIComponent(file)}`,
      {
        method: "GET",
      },
    );
  },

  captureScreen(): Promise<StopRecordingResponse> {
    // Backend API returns { id, status, path } for capture
    return apiFetch<StopRecordingResponse>(`${BASE_API_PATH}/capture`, {
      method: "POST",
    });
  },

  startRecording(): Promise<StartRecordingResponse> {
    return apiFetch<StartRecordingResponse>(`${BASE_API_PATH}/record-start`, {
      method: "POST",
    });
  },

  stopRecording(id: string): Promise<StopRecordingResponse> {
    return apiFetch<StopRecordingResponse>(
      `${BASE_API_PATH}/record-stop?id=${encodeURIComponent(id)}`,
      { method: "POST" },
    );
  },

  deleteRecording(id: string): Promise<void> {
    return apiFetch<void>(`${BASE_API_PATH}/${id}`, {
      method: "DELETE",
    });
  },
};
