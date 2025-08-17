// src/stores/modalStore.ts
import { map } from "nanostores";
import { type ButtonVariant } from "@/components/ui/Button"; // Import ButtonVariant type

// Define the types for the modal state
export type ModalType = "confirm" | "prompt" | "alert";

// The Nanostore map to hold the modal's reactive state
export const modalState = map<{
  isOpen: boolean;
  type: ModalType;
  message: string;
  inputValue: string;
}>({
  isOpen: false,
  type: "confirm", // Default type
  message: "",
  inputValue: "",
});

// A plain JavaScript variable to hold the Promise resolver function.
// This is outside of React and Nanostores, making it accessible globally.
let resolveFn: ((value: any) => void) | null = null;

// Public functions to open specific types of modals (exposed to app components)
export const openModal = <T>(
  modalType: ModalType,
  msg: string,
  defaultValue: string = "",
): Promise<T> => {
  // Update the Nanostore state to open the modal
  modalState.set({
    isOpen: true,
    type: modalType,
    message: msg,
    inputValue: defaultValue,
  });

  // Return a new Promise that will be resolved/rejected by handleOk/handleCancel
  return new Promise<T>((resolve) => {
    resolveFn = resolve;
  });
};

export const confirm = (msg: string): Promise<boolean> => {
  return openModal<boolean>("confirm", msg);
};

export const prompt = (
  msg: string,
  defaultValue = "",
): Promise<string | null> => {
  return openModal<string | null>("prompt", msg, defaultValue);
};

export const alert = (msg: string): Promise<void> => {
  return openModal<void>("alert", msg);
};

// Functions to handle user interactions within the modal (internal to the modal UI, but modify global state)

export const handleOk = () => {
  modalState.setKey("isOpen", false); // Close the modal
  if (!resolveFn) return;

  const currentType = modalState.get().type;
  if (currentType === "confirm") {
    resolveFn(true);
  } else if (currentType === "prompt") {
    resolveFn(modalState.get().inputValue); // Resolve with current input value
  } else {
    resolveFn(); // For alert, just resolve void
  }
  resolveFn = null; // Clear the resolver
};

export const handleCancel = () => {
  modalState.setKey("isOpen", false); // Close the modal
  if (!resolveFn) return;

  const currentType = modalState.get().type;
  if (currentType === "confirm") {
    resolveFn(false);
  } else if (currentType === "prompt") {
    resolveFn(null); // For prompt, resolve with null on cancel
  }
  // For alert, handleCancel should technically not be available, or resolveFn()
  resolveFn = null; // Clear the resolver
};

export const setPromptInputValue = (value: string) => {
  modalState.setKey("inputValue", value); // Update input value in the store
};

export const resolveOkVariant = (type: ModalType): ButtonVariant => {
  switch (type) {
    case "confirm":
      return "error";
    case "prompt":
      return "info";
    case "alert":
      return "warning";
    default:
      return "primary";
  }
};
