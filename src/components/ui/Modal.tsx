import React, { FC, PropsWithChildren } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { MotionModal } from '@/components/motion/MotionModal';

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
  size = 'md',
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
      overlayClassName='fixed inset-0 bg-dark/50 backdrop-blur-sm flex items-center justify-center overflow-y-auto'
      contentClassName={`relative modal-body text-base rounded-lg shadow-xl border w-full flex flex-col overflow-hidden max-h-[90vh] ${sizeClasses[size]} ${className || ''}`}
      closeOnOverlayClick={closeOnOverlayClick}
      closeOnEscape={closeOnEscape}
      zIndex={zIndex}
    >
      {title && (
        <div className='flex items-center justify-between py-4 px-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0'>
          <h2 className='text-lg font-semibold'>{title}</h2>
        </div>
      )}
      <Button
        onClick={onClose}
        className='border-0 absolute top-2 right-2 z-10'
        aria-label='Close modal'
        variant='warning'
      >
        <div className='flex items-center'>
          <Icon icon='mdi:close' className='w-8 h-8' />
        </div>
      </Button>
      <div className='flex-1 overflow-y-auto custom-scrollbar p-6'>{children}</div>
    </MotionModal>
  );
};
