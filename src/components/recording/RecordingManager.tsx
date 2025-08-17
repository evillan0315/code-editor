import React, { useState, useEffect, useCallback } from 'react';
import { recordingService } from '@/services/recordingService';
import { showToast } from '@/stores/toast';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import Loading from '@/components/Loading'; // Assuming this component exists
import {
  RecordingStatusResponse,
  RecordingResultDto, // For displaying database-stored recordings
} from '@/types/recording';
import { formatBytes } from '@/utils/formatters'; // Need a helper for file size formatting
import { confirm } from '@/stores/modal'; // For confirmation dialogs
import { useStore } from '@nanostores/react';
import { recordingAtom } from '@/stores/recording';
import { Modal } from '@/components/ui/Modal'; // Import the Modal component
import { API_URL } from '@/constants'; // Import API_URL for media streaming

interface RecordingManagerProps {}

const RecordingManager: React.FC<RecordingManagerProps> = () => {
  // Use nanostore for reactive recording status
  const {
    isRecording,
    id: currentRecordingId,
    path: currentRecordingPath,
    startedAt: currentRecordingStartedAt,
    lastStoppedRecording,
    mediaToOpen, // Destructure new mediaToOpen from atom
  } = useStore(recordingAtom);

  const [recordings, setRecordings] = useState<RecordingResultDto[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [isStoppingRecording, setIsStoppingRecording] = useState(false);

  // Modal states for media playback
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<RecordingResultDto | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10; // Can be configurable

  const fetchStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const currentStatus = await recordingService.getRecordingStatus();
      // Update the global recording status store
      recordingAtom.set({
        ...recordingAtom.get(), // Preserve lastStoppedRecording and mediaToOpen
        isRecording: currentStatus.recording,
        id: currentStatus.id || null, // Ensure ID is passed from backend
        path: currentStatus.file || null,
        startedAt: currentStatus.startedAt || null,
      });
    } catch (err: any) {
      showToast(`Error fetching recording status: ${err.message}`, 'error');
      // On error, assume recording is not active or status is unknown, reset store
      recordingAtom.set({
        ...recordingAtom.get(), // Preserve lastStoppedRecording and mediaToOpen
        isRecording: false,
        id: null,
        path: null,
        startedAt: null,
      });
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

  // New effect to open modal when mediaToOpen is set by other components (e.g., AppFooter)
  useEffect(() => {
    if (mediaToOpen && !isMediaModalOpen) {
      handleOpenMedia(mediaToOpen);
      // Clear mediaToOpen once the modal is opened
      recordingAtom.set({ ...recordingAtom.get(), mediaToOpen: null });
    }
  }, [mediaToOpen, isMediaModalOpen]);

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
      // Update nanostore directly to reflect recording in progress (optimistic)
      recordingAtom.set({
        isRecording: true,
        id: result.id,
        path: result.path,
        startedAt: new Date().toISOString(), // Use current time as startedAt
        lastStoppedRecording: null, // Clear any previous stopped recording
        mediaToOpen: null, // Ensure no media is pending to open
      });
      showToast(`Recording started: id: ${result.id} path: ${result.path}`, 'info');
      // No need to call fetchStatus immediately as store is already updated
    } catch (err: any) {
      showToast(`Error starting recording: ${err.message}`, 'error');
      // If start failed, ensure recording status is reset (or remains false)
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
      // Clear active recording state and set last stopped recording
      recordingAtom.set({
        isRecording: false,
        id: null,
        path: null,
        startedAt: null,
        lastStoppedRecording: result, // Store the stopped recording for potential playback
        mediaToOpen: null, // Do NOT auto-open modal here
      });
      fetchRecordings(); // Refresh list to show new recording
    } catch (err: any) {
      showToast(`Error stopping recording: ${err.message}`, 'error');
      // If stopping failed, do NOT clear the recording state. Let fetchStatus (polling) update it later if it really died.
    } finally {
      setIsStoppingRecording(false);
    }
  }, [currentRecordingId, showToast, fetchRecordings]);

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
      a;
    },
    [totalPages],
  );

  const handleDownloadFile = useCallback(
    (filePath: string, fileName: string) => {
      try {
        // For security, backend should have a dedicated download endpoint that validates auth and file path.
        // E.g., /api/recording/download?file=path/to/file.mp4
        // For now, assuming a direct URL or backend serves downloads securely.
        const url = `${API_URL}/downloads/recordings/${fileName}`;
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

  const handleOpenMedia = useCallback((media: RecordingResultDto) => {
    console.log(media, 'handleOpenMedia');
    setSelectedMedia(media);
    setIsMediaModalOpen(true);
  }, []);

  const handleCloseMediaModal = useCallback(() => {
    setIsMediaModalOpen(false);
    setSelectedMedia(null);
  }, []);

  const getMediaUrl = (filePath: string) => {
    const fileName = filePath.split('/').pop();
    // Using the /api/file/stream endpoint from NestJS backend as requested
    return `${API_URL}/api/file/stream?filePath=${encodeURIComponent(filePath)}`;
  };

  return (
    <div className='p-4 bg-dark text-gray-100 min-h-screen'>
      <h1 className='text-2xl font-bold mb-6'>Screen Recording & Capture</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
        {/* Recording Controls */}
        <div className='bg-secondary p-6 rounded-lg shadow-md border border-gray-700'>
          <h2 className='text-xl font-semibold mb-4'>Controls</h2>
          <div className='flex items-center gap-4'>
            <Button
              onClick={handleCaptureScreen}
              disabled={isCapturing || isStartingRecording || isStoppingRecording}
              loading={isCapturing}
              variant='primary'
              size='lg'
              title='Capture Screenshot'
            >
              <Icon icon='mdi:camera-outline' className='mr-2' />
              {/* No text, icon only as per request */}
            </Button>

            {isRecording ? (
              <Button
                onClick={handleStopRecording}
                disabled={isCapturing || isStartingRecording || isStoppingRecording}
                loading={isStoppingRecording}
                variant='error'
                size='lg'
                title='Stop Recording'
              >
                <Icon icon='mdi:stop' />
                {/* No text, icon only as per request */}
              </Button>
            ) : (
              <Button
                onClick={handleStartRecording}
                disabled={isCapturing || isStartingRecording || isStoppingRecording}
                loading={isStartingRecording}
                variant='success'
                size='lg'
                title='Start Recording'
              >
                <Icon icon='mdi:record' />
                {/* No text, icon only as per request */}
              </Button>
            )}
          </div>
        </div>

        {/* Current Status */}
        <div className='bg-secondary p-6 rounded-lg shadow-md border border-gray-700'>
          <h2 className='text-xl font-semibold mb-4'>Current Status</h2>
          {isLoadingStatus ? (
            <Loading />
          ) : (
            <div>
              <p className='text-lg'>
                Status:{' '}
                <span
                  className={`font-semibold ${isRecording ? 'text-green-400' : 'text-red-400'}`}
                >
                  {isRecording ? 'RECORDING' : 'Idle'}
                </span>
              </p>
              {currentRecordingPath && (
                <p className='text-sm mt-2'>
                  File:{' '}
                  <span className='font-mono text-gray-300 break-all'>
                    {currentRecordingPath.split('/').pop()}
                  </span>
                </p>
              )}
              {currentRecordingStartedAt && (
                <p className='text-sm'>
                  Started At: {new Date(currentRecordingStartedAt).toLocaleString()}
                </p>
              )}
              {!isRecording && (
                <p className='text-sm italic text-gray-400 mt-2'>
                  No active recording. Click 'Start Recording' to begin.
                </p>
              )}
            </div>
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
                      Status
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
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300 break-all flex items-center gap-2'>
                        {rec.type === 'screenRecord' &&
                          (rec.status === 'finished' || rec.status === 'ready') && (
                            <Button
                              onClick={() => handleOpenMedia(rec)}
                              variant='primary'
                              size='sm'
                              title='Play Recording'
                              className='flex-shrink-0'
                            >
                              <Icon icon='mdi:play' />
                            </Button>
                          )}
                        {rec.type === 'screenShot' &&
                          (rec.status === 'finished' || rec.status === 'ready') && (
                            <Button
                              onClick={() => handleOpenMedia(rec)}
                              variant='primary'
                              size='sm'
                              title='View Screenshot'
                              className='flex-shrink-0'
                            >
                              <Icon icon='mdi:play' />
                            </Button>
                          )}
                        <span className='flex-grow'>{rec.path.split('/').pop()}</span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm'>
                        <Icon
                          icon='mdi:circle'
                          className={`
                            w-3 h-3 rounded-full inline-block mr-2
                            ${
                              rec.status === 'finished' || rec.status === 'ready'
                                ? 'text-green-500' // Success
                                : rec.status === 'started'
                                  ? 'text-blue-500' // Info
                                  : 'text-red-500' // Error/Other
                            }
                          `}
                          title={rec.status}
                        />
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

      {/* Media Playback Modal */}
      <Modal
        isOpen={isMediaModalOpen}
        onClose={handleCloseMediaModal}
        title={selectedMedia ? `Opened: ${selectedMedia.path.split('/').pop()}` : 'Media Player'}
        size='lg' // Changed to fullscreen as per request for modal sizes
        className='bg-secondary p-2 flex flex-col' // Added flex flex-col for internal layout
      >
        {selectedMedia && (
          <div className='flex items-center justify-center bg-secondary rounded-md flex-grow'>
            {selectedMedia.type === 'screenRecord' ? (
              <video
                controls
                src={getMediaUrl(selectedMedia.path)}
                className='w-full h-full object-contain'
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            ) : selectedMedia.type === 'screenShot' ? (
              <img
                src={getMediaUrl(selectedMedia.path)}
                alt={selectedMedia.path.split('/').pop()}
                className='w-full h-full object-contain'
              />
            ) : (
              <p className='text-gray-400'>Unsupported media type.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RecordingManager;
