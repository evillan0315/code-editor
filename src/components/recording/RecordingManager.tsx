import React, { useState, useEffect, useCallback } from 'react';
import { recordingService } from '@/services/recordingService';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import Loading from '@/components/Loading'; // Assuming this component exists
import {
  RecordingStatusResponse,
  RecordingResultDto, // For displaying database-stored recordings
} from '@/types/recording';
import { formatBytes } from '@/utils/formatters'; // Need a helper for file size formatting
import { confirm } from '@/stores/modal'; // For confirmation dialogs
import { isRecordingInProgress } from '@/stores/recordingStatus'; // Import the new store

interface RecordingManagerProps {}

const RecordingManager: React.FC<RecordingManagerProps> = () => {
  const { showToast } = useToast();

  const [status, setStatus] = useState<RecordingStatusResponse | null>(null);
  const [recordings, setRecordings] = useState<RecordingResultDto[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [isStoppingRecording, setIsStoppingRecording] = useState(false);
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null); // To track the ID of the recording in progress

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10; // Can be configurable

  const fetchStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const currentStatus = await recordingService.getRecordingStatus();
      setStatus(currentStatus);
      isRecordingInProgress.set(currentStatus.recording); // Update the global recording status store

      if (currentStatus.recording) {
        // If backend reports recording, try to get its ID (if available, usually from the start call)
        // This might require a more robust way to map live recording to a DB ID.
        // For now, assume if file is present, it's the current one.
        // A better approach would be for /status to return the DB ID.
        // Assuming currentStatus.id exists in the RecordingStatusResponse (if backend is modified)
        setCurrentRecordingId((currentStatus as any).id || null);
      } else {
        setCurrentRecordingId(null);
      }
    } catch (err: any) {
      showToast(`Error fetching recording status: ${err.message}`, 'error');
      setStatus(null);
      setCurrentRecordingId(null);
      isRecordingInProgress.set(false); // Ensure store is false on error
    } finally {
      setIsLoadingStatus(false);
    }
  }, [showToast]);

  const fetchRecordings = useCallback(async () => {
    setIsLoadingRecordings(true);
    try {
      const result = await recordingService.listPaginatedRecordings(currentPage, pageSize);
      setRecordings(result.items);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      showToast(`Error listing recordings: ${err.message}`, 'error');
      setRecordings([]);
      setTotalPages(1);
    } finally {
      setIsLoadingRecordings(false);
    }
  }, [currentPage, showToast]);

  useEffect(() => {
    fetchStatus();
    fetchRecordings();

    // Set up polling for status updates (e.g., every 5 seconds)
    const statusInterval = setInterval(fetchStatus, 5000);
    return () => clearInterval(statusInterval);
  }, [fetchStatus, fetchRecordings]);

  const handleCaptureScreen = useCallback(async () => {
    setIsCapturing(true);
    try {
      const result = await recordingService.captureScreen();
      showToast(`Screenshot captured: ${result.path}`, 'success');
      fetchRecordings(); // Refresh list to show new screenshot
    } catch (err: any) {
      showToast(`Error capturing screen: ${err.message}`, 'error');
    } finally {
      setIsCapturing(false);
    }
  }, [showToast, fetchRecordings]);

  const handleStartRecording = useCallback(async () => {
    setIsStartingRecording(true);
    try {
      const result = await recordingService.startRecording();
      setCurrentRecordingId(result.id);
      showToast(`Recording started: ${result.path}`, 'success');
      fetchStatus(); // Update status immediately
    } catch (err: any) {
      showToast(`Error starting recording: ${err.message}`, 'error');
    } finally {
      setIsStartingRecording(false);
    }
  }, [showToast, fetchStatus]);

  const handleStopRecording = useCallback(async () => {
    if (!currentRecordingId) {
      showToast('No active recording to stop.', 'info');
      return;
    }
    setIsStoppingRecording(true);
    try {
      const result = await recordingService.stopRecording(currentRecordingId);
      showToast(`Recording stopped: ${result.path}`, 'success');
      setCurrentRecordingId(null); // Clear active recording ID
      fetchStatus(); // Update status immediately
      fetchRecordings(); // Refresh list to show new recording
    } catch (err: any) {
      showToast(`Error stopping recording: ${err.message}`, 'error');
    } finally {
      setIsStoppingRecording(false);
    }
  }, [currentRecordingId, showToast, fetchStatus, fetchRecordings]);

  const handleDeleteRecording = useCallback(
    async (id: string, name: string) => {
      const confirmed = await confirm(
        `Are you sure you want to delete '${name}'? This action cannot be undone.`,
      );
      if (!confirmed) return;

      try {
        await recordingService.deleteRecording(id);
        showToast(`Recording '${name}' deleted successfully.`, 'success');
        fetchRecordings(); // Refresh list
      } catch (err: any) {
        showToast(`Error deleting recording '${name}': ${err.message}`, 'error');
      }
    },
    [showToast, fetchRecordings],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage > 0 && newPage <= totalPages) {
        setCurrentPage(newPage);
      }
    },
    [totalPages],
  );

  const handleDownloadFile = useCallback(
    (filePath: string, fileName: string) => {
      try {
        // For security, backend should have a dedicated download endpoint that validates auth and file path.
        // E.g., /api/recording/download?file=path/to/file.mp4
        // For now, assuming a direct URL or backend serves downloads securely.
        const url = `${import.meta.env.VITE_API_URL}/downloads/recordings/${fileName}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName; // Suggests filename for download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Downloading ${fileName}...`, 'info');
      } catch (err: any) {
        showToast(`Error preparing download: ${err.message}`, 'error');
      }
    },
    [showToast],
  );

  return (
    <div className='p-4 bg-dark text-gray-100 min-h-screen'>
      <h1 className='text-2xl font-bold mb-6'>Screen Recording & Capture</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
        {/* Recording Controls */}
        <div className='bg-secondary p-6 rounded-lg shadow-md border border-gray-700'>
          <h2 className='text-xl font-semibold mb-4'>Controls</h2>
          <div className='space-y-4'>
            <div className='flex items-center gap-4'>
              <Button
                onClick={handleCaptureScreen}
                disabled={isCapturing || isStartingRecording || isStoppingRecording}
                loading={isCapturing}
                variant='primary'
                size='lg'
              >
                <Icon icon='mdi:camera-outline' className='mr-2' />
                {isCapturing ? 'Capturing...' : 'Capture Screenshot'}
              </Button>
              <Button
                onClick={handleStartRecording}
                disabled={
                  status?.recording || isCapturing || isStartingRecording || isStoppingRecording
                }
                loading={isStartingRecording}
                variant='success'
                size='lg'
              >
                <Icon icon='mdi:record' className='mr-2' />
                {isStartingRecording ? 'Starting...' : 'Start Recording'}
              </Button>
              <Button
                onClick={handleStopRecording}
                disabled={
                  !status?.recording || isCapturing || isStartingRecording || isStoppingRecording
                }
                loading={isStoppingRecording}
                variant='error'
                size='lg'
              >
                <Icon icon='mdi:stop' className='mr-2' />
                {isStoppingRecording ? 'Stopping...' : 'Stop Recording'}
              </Button>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className='bg-secondary p-6 rounded-lg shadow-md border border-gray-700'>
          <h2 className='text-xl font-semibold mb-4'>Current Status</h2>
          {isLoadingStatus ? (
            <Loading />
          ) : status ? (
            <div>
              <p className='text-lg'>
                Status:{' '}
                <span
                  className={`font-semibold ${status.recording ? 'text-green-400' : 'text-red-400'}`}
                >
                  {status.recording ? 'RECORDING' : 'Idle'}
                </span>
              </p>
              {status.file && (
                <p className='text-sm mt-2'>
                  File:{' '}
                  <span className='font-mono text-gray-300 break-all'>
                    {status.file.split('/').pop()}
                  </span>
                </p>
              )}
              {status.startedAt && (
                <p className='text-sm'>Started At: {new Date(status.startedAt).toLocaleString()}</p>
              )}
              {!status.recording && (
                <p className='text-sm italic text-gray-400 mt-2'>
                  No active recording. Click 'Start Recording' to begin.
                </p>
              )}
            </div>
          ) : (
            <p className='text-gray-400'>Could not fetch status.</p>
          )}
        </div>
      </div>

      {/* Recordings List */}
      <div className='bg-secondary p-6 rounded-lg shadow-md border border-gray-700'>
        <h2 className='text-xl font-semibold mb-4'>Saved Recordings & Screenshots</h2>
        {isLoadingRecordings ? (
          <Loading />
        ) : recordings.length === 0 ? (
          <p className='text-gray-400'>No recordings or screenshots saved yet.</p>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-700'>
                <thead className='bg-gray-800'>
                  <tr>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'
                    >
                      Name
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'
                    >
                      Type
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'
                    >
                      Status
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'
                    >
                      Duration
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'
                    >
                      Size
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'
                    >
                      Created At
                    </th>
                    <th scope='col' className='relative px-6 py-3'>
                      <span className='sr-only'>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-800'>
                  {recordings.map((rec) => (
                    <tr key={rec.id} className='hover:bg-gray-800'>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300 break-all'>
                        {rec.path.split('/').pop()}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-400'>
                        {rec.type === 'screenRecord' ? 'Screen Recording' : 'Screenshot'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-400'>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            rec.status === 'finished' || rec.status === 'ready'
                              ? 'bg-green-100 text-green-800'
                              : rec.status === 'started'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-400'>
                        {rec.data?.duration && typeof rec.data.duration === 'number'
                          ? `${rec.data.duration.toFixed(1)} s`
                          : 'N/A'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-400'>
                        {rec.data?.fileSize && typeof rec.data.fileSize === 'number'
                          ? formatBytes(rec.data.fileSize)
                          : 'N/A'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-400'>
                        {new Date(rec.createdAt).toLocaleDateString()}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                        <div className='flex justify-end space-x-2'>
                          <Button
                            onClick={() => handleDownloadFile(rec.path, rec.path.split('/').pop()!)}
                            variant='secondary'
                            size='sm'
                            title='Download'
                          >
                            <Icon icon='mdi:download' />
                          </Button>
                          <Button
                            onClick={() =>
                              handleDeleteRecording(rec.id, rec.path.split('/').pop()!)
                            }
                            variant='error'
                            size='sm'
                            title='Delete'
                          >
                            <Icon icon='mdi:trash-can-outline' />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className='flex items-center justify-between pt-4 border-t border-gray-700 mt-4'>
                <div className='flex-1 flex justify-between sm:justify-end'>
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant='secondary'
                    size='sm'
                    className='mr-2'
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant='secondary'
                    size='sm'
                  >
                    Next
                  </Button>
                </div>
                <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-center'>
                  <p className='text-sm text-gray-400'>
                    Page <span className='font-medium'>{currentPage}</span> of{' '}
                    <span className='font-medium'>{totalPages}</span>
                  </p>
                </div>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RecordingManager;
