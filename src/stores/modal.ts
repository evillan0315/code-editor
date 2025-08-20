// src/stores/modal.ts
import { map } from 'nanostores';
import { type ButtonVariant } from '@/components/ui/Button';

export type ModalType = 'confirm' | 'prompt' | 'alert';

export const modalState = map<{
  isOpen: boolean;
  type: ModalType;
  message: string;
  inputValue: string;
}>({
  isOpen: false,
  type: 'confirm',
  message: '',
  inputValue: '',
});

// CHANGE THIS LINE: Make the 'value' parameter optional with '?'
let resolveFn: ((value?: any) => void) | null = null;

export const openModal = <T,>(
  modalType: ModalType,
  msg: string,
  defaultValue: string = '',
): Promise<T> => {
  modalState.set({
    isOpen: true,
    type: modalType,
    message: msg,
    inputValue: defaultValue,
  });

  return new Promise<T>((resolve) => {
    resolveFn = resolve;
  });
};

export const confirm = (msg: string): Promise<boolean> => {
  return openModal<boolean>('confirm', msg);
};

export const prompt = (msg: string, defaultValue = ''): Promise<string | null> => {
  return openModal<string | null>('prompt', msg, defaultValue);
};

export const alert = (msg: string): Promise<void> => {
  return openModal<void>('alert', msg);
};

export const handleOk = () => {
  modalState.setKey('isOpen', false);
  if (!resolveFn) return;

  const currentType = modalState.get().type;
  if (currentType === 'confirm') {
    resolveFn(true);
  } else if (currentType === 'prompt') {
    resolveFn(modalState.get().inputValue);
  } else {
    resolveFn(); // This will now be valid
  }
  resolveFn = null;
};

export const handleCancel = () => {
  modalState.setKey('isOpen', false);
  if (!resolveFn) return;

  const currentType = modalState.get().type;
  if (currentType === 'confirm') {
    resolveFn(false);
  } else if (currentType === 'prompt') {
    resolveFn(null);
  }
  // No else for 'alert' type here, as alerts don't have a cancel action
  resolveFn = null;
};

export const setPromptInputValue = (value: string) => {
  modalState.setKey('inputValue', value);
};

export const resolveOkVariant = (type: ModalType): ButtonVariant => {
  switch (type) {
    case 'confirm':
      return 'error';
    case 'prompt':
      return 'info';
    case 'alert':
      return 'warning';
    default:
      return 'primary';
  }
};
