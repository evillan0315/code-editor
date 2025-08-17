// src/components/inputContextMenu.tsx

import React, { useCallback } from 'react'; // Removed useState, useEffect, useMemo
import { Icon } from '@iconify/react';

// CommandDetail interface now defined in Terminal.tsx,
// so we import it or define it again here for clarity
interface CommandDetail {
  name: string;
  description: string;
  icon: string;
  options: string[];
  instructions: string;
  context: string;
  topics: string[];
  tags?: string[];
}

export interface InputContextMenuProps {
  position: { x: number; y: number };
  inputValue: string; // Still passed, but not used for filtering here anymore
  onSelect: (option: string) => void;
  filteredOptions: CommandDetail[]; // New prop: receives already filtered options
}

const InputContextMenu: React.FC<InputContextMenuProps> = (props) => {
  // filteredOptions is now received as a prop
  const { filteredOptions, onSelect } = props;

  // Handle option selection
  const handleOptionClick = useCallback(
    (optionName: string) => {
      onSelect(optionName);
    },
    [onSelect],
  );

  // If there are no filtered options, don't render the menu
  if (filteredOptions.length === 0) {
    return null;
  }

  return (
    <div
      className=' fixed text-sm rounded-xl shadow-xl z-10 border border-neutral-900 p-1 bg-black'
      style={{
        left: `${props.position.x}px`,
        top: `${props.position.y}px`,
        width: '200px',
        height: '300px',
      }}
    >
      <div className='flex flex-col text-left'>
        {filteredOptions.map((optionDetail) => (
          <button
            key={optionDetail.name}
            className='py-2 px-4 rounded-xl hover:bg-neutral-900 flex gap-2 items-center text-left text-white'
            onClick={() => handleOptionClick(optionDetail.name)}
          >
            {optionDetail.icon && <Icon width='1.4em' height='1.4em' icon={optionDetail.icon} />}
            {optionDetail.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InputContextMenu;
