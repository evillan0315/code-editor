// src/components/SearchToggleInput.tsx
import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';

interface SearchToggleInputProps {
  value: string;
  onChange: (val: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}

const SearchToggleInput: React.FC<SearchToggleInputProps> = ({
  value,
  onChange,
  show,
  onToggle,
  placeholder = 'Search...',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [show]);

  return (
    <div className="search-toggle-input flex items-center gap-1 p-2 w-full ">
      <Icon onClick={onToggle} icon="mdi:search" width="1.5em" height="1.5em" />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`transition-all duration-300 ease-in-out py-2 border-gray-700 bg-secondary ${
          show ? 'opacity-100 ml-1' : 'w-0 opacity-0 pointer-events-none'
        }`}
      />
    </div>
  );
};

export default SearchToggleInput;
