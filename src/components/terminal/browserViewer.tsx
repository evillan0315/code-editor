// src/components/browserViewer.tsx

import React, { useState, useCallback } from 'react';
import { Icon } from '@iconify/react'; // Using @iconify/react for React components

interface BrowserViewerProps {
  // Define any props if needed, e.g., defaultUrl?: string;
}

const BrowserViewer: React.FC<BrowserViewerProps> = () => {
  // State: createSignal -> useState
  const [currentUrl, setCurrentUrl] = useState<string>('https://board-api.duckdns.org');
  const [inputUrl, setInputUrl] = useState<string>(currentUrl); // Initialize with currentUrl
  const [history, setHistory] = useState<string[]>([currentUrl]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Helper function (no state/props dependencies, so no useCallback needed)
  const sanitizeUrl = (url: string): string => {
    return url.startsWith('http') ? url : `https://${url}`;
  };

  // Functions: Wrap in useCallback for performance and stability
  const navigateTo = useCallback(
    (url: string) => {
      const safeUrl = sanitizeUrl(url);
      // Slice history to remove future entries if navigating back and then to a new URL
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(safeUrl);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setCurrentUrl(safeUrl);
      setInputUrl(safeUrl);
    },
    [history, historyIndex], // Dependencies for useCallback
  );

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      setInputUrl(history[newIndex]);
    }
  }, [history, historyIndex]); // Dependencies

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      setInputUrl(history[newIndex]);
    }
  }, [history, historyIndex]); // Dependencies

  const refresh = useCallback(() => {
    // A common trick to force iframe refresh is to change its `src` slightly,
    // then revert it. Or, just setting it to itself can sometimes work.
    // Setting it to a new string (even if semantically the same) can trigger a re-render.
    setCurrentUrl((prev) => prev + ''); // Force re-render by creating a new string object
  }, []); // No dependencies for refresh as it just triggers a re-render of currentUrl

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        navigateTo(inputUrl);
      }
    },
    [navigateTo, inputUrl], // Dependencies
  );

  return (
    <div className='w-full mx-auto overflow-hidden bg-neutral-950'>
      {/* Toolbar */}
      <div className='flex items-center justify-center gap-2 py-2 border-neutral-800 bg-zinc-950 px-2'>
        <button
          className='p-2 rounded-md bg-neutral-800 text-white hover:bg-neutral-700 transition'
          onClick={goBack}
          disabled={historyIndex === 0} // Access state directly: historyIndex() -> historyIndex
        >
          <Icon icon='mdi:arrow-left' width='1.4em' height='1.4em' />
        </button>
        <button
          className='p-2 rounded-md bg-neutral-800 text-white hover:bg-neutral-700 transition'
          onClick={goForward}
          disabled={historyIndex === history.length - 1} // history().length -> history.length
        >
          <Icon icon='mdi:arrow-right' width='1.4em' height='1.4em' />
        </button>
        <button
          className='p-2 rounded-md bg-neutral-800 text-white hover:bg-neutral-700 transition'
          onClick={refresh}
        >
          <Icon icon='mdi:refresh' width='1.4em' height='1.4em' />
        </button>
        <input
          className='flex-1 px-3 py-2 rounded-md bg-neutral-800 text-white placeholder:text-neutral-400 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
          value={inputUrl} // inputUrl() -> inputUrl
          onChange={(e) => setInputUrl(e.currentTarget.value)} // onInput -> onChange
          onKeyDown={handleInputKeyDown}
          placeholder='Enter a URL (e.g., github.com)'
        />
        <button
          className='px-3 py-2 rounded-md bg-gray-900 text-white hover:bg-blue-700 transition flex items-center gap-1'
          onClick={() => navigateTo(inputUrl)} // inputUrl() -> inputUrl
        >
          Go
        </button>
      </div>

      {/* Browser View */}
      <iframe
        src={currentUrl} // currentUrl() -> currentUrl
        className='w-full h-[600px] border-none bg-neutral-900'
        sandbox='allow-same-origin allow-scripts allow-forms allow-popups'
        loading='lazy'
      />
    </div>
  );
};

export default BrowserViewer;
