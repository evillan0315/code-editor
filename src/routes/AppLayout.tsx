import { useRef } from 'react';
import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  showLeftSidebar,
  showRightSidebar,
  showBottomLeft,
  showBottomRight,
  showTerminal,
} from '@/stores/layout';
import { AppHeader } from '@/components/layouts/AppHeader';
import { AppFooter } from '@/components/layouts/AppFooter';
import { EditorLeftSidebar } from '@/components/editor/EditorLeftSidebar';
import { EditorRightSidebar } from '@/components/editor/EditorRightSidebar';
import { AiChatPanel } from '@/components/AiChatPanel';
import ResumeOptimizerForm from '@/components/resume/ResumeOptimizerForm';
import RecordingManager from '@/components/recording/RecordingManager';
import Terminal from '@/components/terminal/TerminalOptimized';

import { useResizablePanel } from '@/hooks/useResizablePanel';
import { ModalUI } from '@/components/motion/ModalUI';
import {
  TARGET_LEFT_PERCENTAGE,
  TARGET_RIGHT_PERCENTAGE,
  MIN_DIMENSION_PX,
  MAX_LEFT_PERCENTAGE_CONSTRAINT,
  MAX_RIGHT_PERCENTAGE_CONSTRAINT,
  TARGET_TERMINAL_PERCENTAGE,
  MAX_TERMINAL_PERCENTAGE_CONSTRAINT,
  TARGET_SIDEBAR_BOTTOM_PANEL_PERCENTAGE,
} from '@/constants';

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  const isLeftVisible = useStore(showLeftSidebar);
  const isRightVisible = useStore(showRightSidebar);
  const isBottomLeftVisible = useStore(showBottomLeft);
  const isBottomRightVisible = useStore(showBottomRight);
  const isTermninalVisible = useStore(showTerminal);

  const leftSidebarRef = useRef(null);
  const rightSidebarRef = useRef(null);

  const mainContentRef = useRef<HTMLDivElement>(null);
  const { dimension: leftWidth, startResize: startLeftResize } = useResizablePanel({
    localStorageKey: 'leftSidebarWidth',
    initialTargetPercentage: TARGET_LEFT_PERCENTAGE,
    minPx: MIN_DIMENSION_PX,
    maxDynamicConstraintPercentage: MAX_LEFT_PERCENTAGE_CONSTRAINT,
    orientation: 'horizontal',
    anchor: 'left',
    parentRef: mainContentRef,
  });

  const { dimension: rightWidth, startResize: startRightResize } = useResizablePanel({
    localStorageKey: 'rightSidebarWidth',
    initialTargetPercentage: TARGET_RIGHT_PERCENTAGE,
    minPx: MIN_DIMENSION_PX,
    maxDynamicConstraintPercentage: MAX_RIGHT_PERCENTAGE_CONSTRAINT,
    orientation: 'horizontal',
    anchor: 'right',
    parentRef: mainContentRef,
  });

  const { dimension: terminalHeight, startResize: startTerminalResize } = useResizablePanel({
    localStorageKey: 'terminalHeight',
    initialTargetPercentage: TARGET_TERMINAL_PERCENTAGE,
    minPx: MIN_DIMENSION_PX,
    maxDynamicConstraintPercentage: MAX_TERMINAL_PERCENTAGE_CONSTRAINT,
    orientation: 'vertical',
    anchor: 'bottom',
    parentRef: mainContentRef,
  });

  const { dimension: leftSidebarBottomHeight, startResize: startLeftSidebarBottomResize } =
    useResizablePanel({
      localStorageKey: 'leftSidebarBottomHeight',
      initialTargetPercentage: TARGET_SIDEBAR_BOTTOM_PANEL_PERCENTAGE,
      minPx: MIN_DIMENSION_PX,
      parentRef: leftSidebarRef,
      orientation: 'vertical',
      anchor: 'bottom-to-top',
    });

  const { dimension: rightSidebarBottomHeight, startResize: startRightSidebarBottomResize } =
    useResizablePanel({
      localStorageKey: 'rightSidebarBottomHeight',
      initialTargetPercentage: TARGET_SIDEBAR_BOTTOM_PANEL_PERCENTAGE,
      minPx: MIN_DIMENSION_PX,
      parentRef: rightSidebarRef,
      orientation: 'vertical',
      anchor: 'bottom-to-top',
    });

  return (
    <div className="app-container flex flex-col h-full">
      <AppHeader />

      <div className="app-main flex flex-1 overflow-hidden">
        {isLeftVisible && (
          <>
            <div
              ref={leftSidebarRef}
              style={{ width: leftWidth }}
              className="flex flex-col flex-shrink-0 min-w-0 "
            >
              <div className="flex-grow overflow-auto relative">
                <EditorLeftSidebar />
              </div>

              {isBottomLeftVisible && (
                <>
                  <div
                    className="h-1 cursor-ns-resize resizer flex-shrink-0 hover:bg-sky-300 transition-colors duration-150"
                    onMouseDown={startLeftSidebarBottomResize}
                    aria-label="Resize left sidebar bottom panel"
                    role="separator"
                  />
                  <AnimatePresence>
                    <motion.div
                      key="left-sidebar-bottom-panel" /* Added unique key */
                      className="flex flex-col" // Changed overflow-y-auto to overflow-hidden, inner div will scroll
                      initial={{ height: 0, opacity: 0, y: '100%' }}
                      animate={{
                        height: leftSidebarBottomHeight,
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.25, ease: 'easeIn' },
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        y: '100%',
                        transition: { duration: 0.25, ease: 'easeOut' },
                      }}
                    >
                      <div style={{ height: leftSidebarBottomHeight }} className="overflow-hidden flex flex-col">
                        <pre className="whitespace-pre-wrap">
                          Left Sidebar Bottom Panel{`\n`}
                          This content is resizable from bottom-to-top.
                        </pre>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </>
              )}
                
            </div>

            <div
              className="w-1 cursor-col-resize resizer flex-shrink-0 hover:bg-sky-300 transition-colors duration-150"
              onMouseDown={startLeftResize}
              aria-label="Resize left sidebar"
              role="separator"
            />
          </>
        )}

        <div className="flex flex-col flex-grow min-w-0 overflow-hidden">
          <div className={`flex-grow min-h-0 h-full relative`}>
            {children}
          </div>

          {isTermninalVisible && (
            <>
              <div
                className="h-1 cursor-ns-resize resizer flex-shrink-0 hover:bg-sky-300 transition-colors duration-150"
                onMouseDown={startTerminalResize}
                aria-label="Resize terminal"
                role="separator"
              />
              <AnimatePresence>
                <motion.div
                  key="terminal-panel" /* Added unique key */
                  className="flex flex-col justify-end" // Changed overflow-y-auto to overflow-hidden, inner div will scroll
                  initial={{ height: 0, opacity: 0, y: '100%' }}
                  animate={{
                    height: terminalHeight,
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.25, ease: 'easeIn' },
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    y: '100%',
                    transition: { duration: 0.25, ease: 'easeOut' },
                  }}
                >
                  <div style={{ height: terminalHeight }} className="overflow-hidden flex flex-col text-sm">
                    <Terminal isResizing={startTerminalResize} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>

        {isRightVisible && (
          <>
            <div
              className="w-1 cursor-col-resize resizer flex-shrink-0 hover:bg-sky-300 transition-colors duration-150"
              onMouseDown={startRightResize}
              aria-label="Resize right sidebar"
              role="separator"
            />
            <div
              ref={rightSidebarRef}
              style={{ width: rightWidth }}
              className="h-full overflow-hidden flex-shrink-0 flex flex-col"
            >
              <div className="flex-grow min-h-0 overflow-auto">
                <AiChatPanel />
                <EditorRightSidebar />
              </div>

              {isBottomRightVisible && (
                <>
                  <div
                    className="h-1 cursor-ns-resize resizer flex-shrink-0 hover:bg-sky-300 transition-colors duration-150"
                    onMouseDown={startRightSidebarBottomResize}
                    aria-label="Resize right sidebar bottom panel"
                    role="separator"
                  />
                  <AnimatePresence>
                    <motion.div
                      key="right-sidebar-bottom-panel" /* Added unique key */
                      className="flex flex-col" // Changed overflow-y-auto to overflow-hidden, inner div will scroll
                      initial={{ height: 0, opacity: 0, y: '100%' }}
                      animate={{
                        height: rightSidebarBottomHeight,
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.25, ease: 'easeIn' },
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        y: '100%',
                        transition: { duration: 0.25, ease: 'easeOut' },
                      }}
                    >
                      <div
                        style={{ height: rightSidebarBottomHeight }}
                        className="flex-shrink-0 bg-secondary overflow-auto text-sm"
                      >
                           <RecordingManager />
                        <ResumeOptimizerForm />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <AppFooter />
      <ModalUI />
    </div>
  );
}
