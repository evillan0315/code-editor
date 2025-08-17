import { useCallback } from "react";
import { showToast as showToastAction, removeToast } from "@/stores/toast";
import type { ToastType, ToastPosition } from "@/types/toast";

export function useToast() {
  const showToast = useCallback(
    (
      message: string,
      type?: ToastType,
      duration?: number,
      position?: ToastPosition,
    ) => {
      showToastAction(message, type, duration, position);
    },
    [], // No dependencies; stable
  );

  return {
    showToast,
    removeToast,
  };
}
