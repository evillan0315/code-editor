import React, { FC, PropsWithChildren } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { MotionModal } from '@/components/motion/MotionModal'; // Import MotionModal
import '@/styles/modal.css'; // Keep existing styles

type ModalSize = 'sm' | 'md' | 'lg' | 'fullscreen';

interface ModalProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  className?: string; // For additional styling on the modal content wrapper
  size?: ModalSize; // New prop for controlling modal size
  // Props to control MotionModal behavior
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  zIndex?: number;
}

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  className,
  size = 'md', // Default size to 'md'
  closeOnOverlayClick = true,
  closeOnEscape = true,
  zIndex,
  children,
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-[80%]',
    fullscreen: 'w-full max-w-full h-full max-h-[100vh-100px] rounded-none',
  };

  return (
    <MotionModal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName='modal-backdrop'
      contentClassName={`relative modal-wrapper rounded-lg shadow-xl border w-full flex flex-col overflow-hidden ${sizeClasses[size]} ${className || ''}`}
      closeOnOverlayClick={closeOnOverlayClick}
      closeOnEscape={closeOnEscape}
      zIndex={zIndex}
    >
      {title && (
        <div className='modal-header flex items-center justify-between px-2 pb-2 border-b flex-shrink-0'>
          <h2 className='text-lg font-semibold'>{title}</h2>
        </div>
      )}
      <Button
        onClick={onClose}
        className='border-0 absolute top-2 right-2'
        aria-label='Close modal'
        variant='warning'
      >
        <div className='flex items-center'>
          <Icon icon='mdi:close' className='w-5 h-5' />
        </div>
      </Button>
      {/* Modal Body */}
      <div className='modal-body flex-1 overflow-y-auto custom-scrollbar'>{children}</div>
    </MotionModal>
  );
};
