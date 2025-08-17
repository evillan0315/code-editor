// src/components/ui/Modal.tsx
import React, { FC, PropsWithChildren } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { MotionModal } from "@/components/motion/MotionModal"; // Import MotionModal
import "@/styles/modal.css"; // Keep existing styles

interface ModalProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  className?: string; // For additional styling on the modal content wrapper
  // Props to control MotionModal behavior
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  zIndex?: number;
}

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  className, // This prop applies to the modal's content wrapper
  closeOnOverlayClick = true, // Default to true for user-friendliness
  closeOnEscape = true, // Default to true for user-friendliness
  zIndex, // Pass directly to MotionModal; if undefined, MotionModal uses its default (1000)
  children,
}) => {
  // MotionModal internally handles `isOpen` and conditional rendering with AnimatePresence.
  // So, `if (!isOpen) return null;` is no longer needed here.

  return (
    <MotionModal
      isOpen={isOpen}
      onClose={onClose} // MotionModal will call this for overlay clicks, escape key, and explicit calls
      // 'modal-backdrop' styles will be applied to MotionModal's overlay div.
      // MotionModal already handles `fixed inset-0 flex items-center justify-center` and default background.
      overlayClassName="modal-backdrop"
      // Combine the fixed styles for the modal content with the `className` prop
      contentClassName={`relative modal-wrapper rounded-lg shadow-xl border w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden ${className || ""}`}
      closeOnOverlayClick={closeOnOverlayClick}
      closeOnEscape={closeOnEscape}
      zIndex={zIndex}
    >
      {/* Modal Header */}
      <div className="modal-header flex items-center justify-between px-4 py-2 border-b flex-shrink-0">
        <h2 className="text-lg font-semibold">{title}</h2>

        <Button
          onClick={onClose} // Explicit button to close the modal
          className="border-0"
          aria-label="Close modal"
          variant="warning"
        >
          <div className="flex items-center">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </div>
        </Button>
      </div>

      {/* Modal Body */}
      <div className="modal-body flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </MotionModal>
  );
};
