import { atom } from 'nanostores';

/**
 * Nanostore to track if a screen recording is currently in progress.
 * Updated by RecordingManager, consumed by components like AppFooter.
 */
export const isRecordingInProgress = atom<boolean>(false);
