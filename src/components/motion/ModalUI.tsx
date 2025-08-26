// src/components/motion/ModalUI.tsx
// (Previously src/services/CreateModalService.tsx)
import React, { FC } from 'react';
import { Button } from '@/components/ui/Button';
import { FormInput } from '@/components/form/FormControl';
import { MotionModal } from '@/components/motion/MotionModal';
import { useStore } from '@nanostores/react';
// Import the Nanostore and action functions
import {
  modalState,
  handleOk,
  handleCancel,
  setPromptInputValue,
  resolveOkVariant, // Import ModalType if not already globally available
} from '@/stores/modal'; // Adjust path as needed

// No props needed for this UI component anymore, as it gets state from the store
export const ModalUI: FC = () => {
  // Use useStore to subscribe to the modalState Nanostore
  const { isOpen, type, message, inputValue } = useStore(modalState);

  // No longer need currentDirectory, action, resolveFn useRef, or memoization for functions here.
  // All state and logic is handled by the Nanostore and its helper functions.

  return (
    <MotionModal
      isOpen={isOpen}
      onClose={handleCancel} // Calls the global handleCancel
      closeOnOverlayClick={true}
      closeOnEscape={true}
      overlayClassName="dialog-modal"
      contentClassName="dialog-modal-body w-full max-w-lg rounded-lg shadow-md p-6 space-y-4"
      zIndex={1000}
    >
      <pre className="whitespace-pre-wrap text-sm">{message}</pre>

      {type === 'prompt' && (
        <FormInput
          type="text"
          value={inputValue}
          onChange={(e) => setPromptInputValue(e.target.value)} // Calls the global setPromptInputValue
          placeholder="Enter value"
          className="w-full"
          autoFocus
        />
      )}

      <div className="flex justify-end gap-2">
        {type !== 'alert' && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCancel} // Calls the global handleCancel
            className={`btn-${type}-cancel`}
          >
            Cancel
          </Button>
        )}
        <Button
          variant={resolveOkVariant(type)} // Calls the global resolveOkVariant
          size="sm"
          onClick={handleOk} // Calls the global handleOk
          className={`btn-${type}-ok px-4`}
        >
          OK
        </Button>
      </div>
    </MotionModal>
  );
};
