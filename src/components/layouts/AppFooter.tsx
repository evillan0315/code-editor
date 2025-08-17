import React from 'react';
import { Icon } from '@/components/ui/Icon';
import Logo from '@/components/ui/Logo';
import { CodeMirrorStatus } from '@/components/editor/CodeMirrorStatus';
import { useStore } from '@nanostores/react';
import { isRecordingInProgress } from '@/stores/recordingStatus';

export function AppFooter() {
  const $isRecordingInProgress = useStore(isRecordingInProgress);

  return (
    <footer
      className='
        flex             
        items-center     
        justify-between
        px-2 py-2        
        border-t         
        text-sm          
        bg-secondary
      '
    >
      <div className='flex-shrink-0 pr-4 min-w-[20%] '>
        <div className='flex items-center gap-3'>
          <Icon icon='vscode-icons:file-type-reactjs' width='1.2em' height='1.2em' />{' '}
          <span>© {new Date().getFullYear()} CODEGen · Smart IDE</span>
        </div>
      </div>
      <div className='flex-grow text-center mx-4 min-w-[50%-100px]'>
        <CodeMirrorStatus />
      </div>
      <div className='flex-shrink-1 flex items-center justify-between  min-w-[calc(30%)] px-3'>
        <div className='flex items-center justify-between gap-3 w-full'>
          {$isRecordingInProgress && (
            <div className='flex items-center gap-1 text-red-500 font-bold'>
              <Icon icon='mdi:record-circle' className='animate-pulse' />
              <span>REC</span>
            </div>
          )}
          <div></div>
          <div>
            <Logo />
          </div>
        </div>
      </div>
    </footer>
  );
}
