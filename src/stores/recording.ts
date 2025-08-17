import { persistentAtom } from '@/utils/persistentAtom';
import { RecordingResultDto } from '@/types/recording';

interface RecordingState {
  isRecording: boolean;
  id: string | null;
  path: string | null;
  startedAt: string | null;
  lastStoppedRecording: RecordingResultDto | null; // Stores details of the most recently finished recording
  mediaToOpen: RecordingResultDto | null; // New: Signal to open media modal for a specific recording
}

/**
 * Nanostore to track the current screen recording's status, ID, file path, and start time.
 * Also stores the most recently stopped recording for immediate playback.
 * Updated by RecordingManager, consumed by any component needing live recording status or last recording info.
 */
export const recordingAtom = persistentAtom<RecordingState>('recordingStore', {
  isRecording: false,
  id: null,
  path: null,
  startedAt: null,
  lastStoppedRecording: null,
  mediaToOpen: null, // Initialize new state property
});
