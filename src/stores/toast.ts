// src/stores/toast.ts
import { atom } from 'nanostores';
import { nanoid } from 'nanoid';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastPosY = 'top' | 'center' | 'bottom';
export type ToastPosX = 'left' | 'center' | 'right';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  position: ToastPosition;
}

export interface ToastPosition {
  x: ToastPosX;
  y: ToastPosY;
}

interface ToastMap {
  [key: string]: Toast[];
}

export const toastStore = atom<ToastMap>({});

const MAX_PER_POSITION = 5;

const getPositionKey = (position: ToastPosition) =>
  `${position.y}-${position.x}`;

export function showToast(
  message: string,
  type: ToastType = 'info',
  duration = 3000,
  position: ToastPosition = { x: 'right', y: 'bottom' },
) {
  const id = nanoid();
  const toast: Toast = { id, message, type, duration, position };
  const key = getPositionKey(position);

  toastStore.set({
    ...toastStore.get(),
    [key]: [
      ...(toastStore.get()[key]?.slice(-MAX_PER_POSITION + 1) || []),
      toast,
    ],
  });

  setTimeout(() => removeToast(id), duration);
}

export function removeToast(id: string) {
  const map = toastStore.get();
  const newMap: ToastMap = {};
  for (const key in map) {
    newMap[key] = map[key].filter((toast) => toast.id !== id);
  }
  toastStore.set(newMap);
}

export function removeAllToasts() {
  toastStore.set({});
}
