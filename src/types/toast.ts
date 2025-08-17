export type ToastType = "success" | "error" | "info";
export type ToastPosY = "top" | "center" | "bottom";
export type ToastPosX = "left" | "center" | "right";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface ToastPosition {
  x: ToastPosX;
  y: ToastPosY;
}
