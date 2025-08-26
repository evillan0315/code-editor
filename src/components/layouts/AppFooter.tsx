import React, { useCallback, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';

import { useStore } from '@nanostores/react';
import { recordingAtom } from '@/stores/recording';
import { Button } from '@/components/ui/Button';
import { recordingService } from '@/services/recordingService';
import { useToast } from '@/hooks/useToast';

export function AppFooter() {
  const { showToast } = useToast();
  const {
    isRecording,
    id: currentRecordingId,
    lastStoppedRecording,
  } = useStore(recordingAtom);

  const [isCapturing, setIsCapturing] = useState(false);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [isStoppingRecording, setIsStoppingRecording] = useState(false);

  const handleCaptureScreen = useCallback(async () => {
    setIsCapturing(true);
    try {
      const result = await recordingService.captureScreen();
      showToast(`Screenshot captured: ${result.path}`, 'success');
    } catch (err: any) {
      showToast(`Error capturing screen: ${err.message}`, 'error');
    } finally {
      setIsCapturing(false);
    }
  }, [showToast]);

  const handleStartRecording = useCallback(async () => {
    setIsStartingRecording(true);
    try {
      const result = await recordingService.startRecording();
      recordingAtom.set({
        isRecording: true,
        id: result.id,
        path: result.path,
        startedAt: new Date().toISOString(),
        lastStoppedRecording: null,
        mediaToOpen: null,
      });
      showToast(`Recording started: id: ${result.id}`, 'info');
    } catch (err: any) {
      showToast(`Error starting recording: ${err.message}`, 'error');
      recordingAtom.set({
        ...recordingAtom.get(),
        isRecording: false,
        id: null,
        path: null,
        startedAt: null,
      });
    } finally {
      setIsStartingRecording(false);
    }
  }, [showToast]);

  const handleStopRecording = useCallback(async () => {
    if (!currentRecordingId) {
      showToast('No active recording to stop.', 'info');
      return;
    }
    setIsStoppingRecording(true);
    try {
      const result = await recordingService.stopRecording(currentRecordingId);
      showToast(`Recording stopped: ${result.path}`, 'success');
      recordingAtom.set({
        isRecording: false,
        id: null,
        path: null,
        startedAt: null,
        lastStoppedRecording: result,
        mediaToOpen: null,
      });
    } catch (err: any) {
      showToast(`Error stopping recording: ${err.message}`, 'error');
    } finally {
      setIsStoppingRecording(false);
    }
  }, [currentRecordingId, showToast]);

  const handlePlayLastRecording = useCallback(() => {
    if (lastStoppedRecording) {
      if (
        lastStoppedRecording.status === 'ready' ||
        lastStoppedRecording.status === 'finished'
      ) {
        recordingAtom.setKey('mediaToOpen', lastStoppedRecording);
      } else {
        showToast(
          `Recording is not yet ready for playback (status: ${lastStoppedRecording.status}). Please wait.`,
          'info',
        );
      }
    } else {
      showToast('No last stopped recording available for playback.', 'info');
    }
  }, [lastStoppedRecording, showToast]);

  return (
    <footer
      className="
        flex             
        items-center     
        justify-between
        px-2 py-2        
        border-t         
        text-sm          
    
      "
    >
      <div className="flex-shrink-0 pr-4 min-w-[20%] ">
        <div className="flex items-center gap-3">
          <Icon
            icon="vscode-icons:file-type-reactjs"
            width="1.2em"
            height="1.2em"
          />{' '}
          <span>© {new Date().getFullYear()} CODEGen · Smart IDE</span>
        </div>
      </div>
      <div className="flex-grow text-center mx-4 min-w-[50%-100px]"></div>
      <div className="flex-shrink-1 flex items-center justify-between  min-w-[calc(30%)] px-3">
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCaptureScreen}
              disabled={
                isCapturing || isStartingRecording || isStoppingRecording
              }
              loading={isCapturing}
              variant="secondary"
              size="sm"
              title="Capture Screenshot"
              className="flex items-center px-2 py-1"
            >
              <Icon icon="mdi:camera-outline" className="mr-1" />
              Capture
            </Button>

            {isRecording ? (
              <Button
                onClick={handleStopRecording}
                disabled={
                  isCapturing || isStartingRecording || isStoppingRecording
                }
                loading={isStoppingRecording}
                variant="error"
                size="sm"
                title="Stop Recording"
                className="flex items-center px-2 py-1"
              >
                <Icon icon="mdi:stop" className="mr-1" />
                Stop
              </Button>
            ) : (
              <Button
                onClick={handleStartRecording}
                disabled={
                  isCapturing || isStartingRecording || isStoppingRecording
                }
                loading={isStartingRecording}
                variant="success"
                size="sm"
                title="Start Recording"
                className="flex items-center px-2 py-1"
              >
                <Icon icon="mdi:record" className="mr-1" />
                Record
              </Button>
            )}
            {lastStoppedRecording && !isRecording && (
              <Button
                onClick={handlePlayLastRecording}
                variant="primary"
                size="sm"
                title={`Play Last Recording: ${lastStoppedRecording.path.split('/').pop()}`}
                className="flex items-center px-2 py-1"
              >
                <Icon icon="mdi:play" className="mr-1" />
                Play Last
              </Button>
            )}
          </div>
          <div>
            <Logo />
          </div>
        </div>
      </div>
    </footer>
  );
}
