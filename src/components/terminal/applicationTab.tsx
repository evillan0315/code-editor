// src/components/applicationTab.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react'; // Using @iconify/react for React components

interface Tab {
  name: string;
  icon: string;
  content: React.ReactNode; // Content can be string or JSX element
}

// Define your tabs data. If this were dynamic, it might come from props or a fetch.
const tabs: Tab[] = [
  {
    name: 'BashAI',
    icon: 'mynaui:terminal-solid',
    content: 'Welcome to the Bash tab!',
  },
  // Add other tabs here if needed, e.g.,
  // { name: 'Browser', icon: 'mdi:web', content: <BrowserViewer /> },
  // { name: 'Files', icon: 'mdi:folder', content: 'File explorer content...' },
];

interface AppTabsProps {
  // Define any props the AppTabs component might receive
  // For example, an array of actual components for content
  // tabComponents: React.ReactNode[];
}

const AppTabs: React.FC<AppTabsProps> = () => {
  // State: createSignal -> useState
  const [activeTab, setActiveTab] = useState<number>(0);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  // Ref: let tabRef -> useRef
  const tabRef = useRef<HTMLDivElement>(null); // Correct type for div element

  // Functions: Wrap in useCallback for performance and stability
  const scrollTabs = useCallback((direction: 'left' | 'right') => {
    if (!tabRef.current) return; // Access ref via .current
    const scrollAmount = 150;
    tabRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []); // No dependencies for ref object itself

  const checkScroll = useCallback(() => {
    if (!tabRef.current) return;
    setCanScrollLeft(tabRef.current.scrollLeft > 0);
    setCanScrollRight(
      tabRef.current.scrollLeft + tabRef.current.clientWidth < tabRef.current.scrollWidth,
    );
  }, []); // No dependencies for ref object itself

  // Effects: onMount, createEffect -> useEffect
  useEffect(() => {
    checkScroll(); // Initial check on mount

    const currentTabRef = tabRef.current; // Capture current ref value for cleanup
    if (currentTabRef) {
      currentTabRef.addEventListener('scroll', checkScroll);
    }
    window.addEventListener('resize', checkScroll);

    // Cleanup: onCleanup -> return function from useEffect
    return () => {
      if (currentTabRef) {
        currentTabRef.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]); // Dependency: checkScroll function

  return (
    <div className='w-full mx-auto mt-2 bg-black rounded-2xl shadow-lg'>
      <div className='relative flex items-center'>
        {canScrollLeft && ( // Access state directly: canScrollLeft() -> canScrollLeft
          <button
            className='absolute left-0 z-10 h-full p-1 rounded-lg text-center border border-neutral-900 bg-neutral-800'
            onClick={() => scrollTabs('left')}
          >
            <Icon
              width='1.4em'
              height='1.4em'
              icon='mdi:chevron-left'
              className='text-neutral-300'
            />
          </button>
        )}
        <div
          className='flex overflow-x-auto no-scrollbar space-x-1 px-4'
          ref={tabRef} // Assign ref directly to the element
        >
          {tabs.map((tab, index) => {
            const isActive = activeTab === index; // activeTab() -> activeTab
            return (
              <button
                key={index} // Important: Add a unique key for list items in React
                className={`flex gap-1 items-center justify-center font-bold border border-neutral-800 rounded-lg pl-1 py-0 ${
                  isActive
                    ? 'border-neutral-600 text-neutral-300 bg-neutral-950'
                    : 'border-transparent text-gray-500 hover:text-zinc-400'
                }`}
                onClick={() => setActiveTab(index)}
              >
                <Icon icon={tab.icon} width='1.4em' height='1.4em' />
                <span className='text-sm'>{tab.name}</span>{' '}
                <span className='p-0 m-0'>
                  {' '}
                  <Icon
                    width='1.2em'
                    height='1.2em'
                    icon='mdi:close'
                    className='px-1 mr-1 mt-1 hover:text-neutral-100'
                  />
                </span>
              </button>
            );
          })}
        </div>
        {canScrollRight && ( // Access state directly: canScrollRight() -> canScrollRight
          <button
            className='absolute right-0 z-10 h-full p-1 rounded-lg text-center border border-neutral-900 bg-neutral-800'
            onClick={() => scrollTabs('right')}
          >
            <Icon
              width='1.4em'
              height='1.4em'
              icon='mdi:chevron-right'
              className='text-neutral-300'
            />
          </button>
        )}
      </div>
      <div className='mt-4'>{tabs[activeTab].content}</div> {/* activeTab() -> activeTab */}
    </div>
  );
};

export default AppTabs;
