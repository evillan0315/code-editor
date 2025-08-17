import {
  CreateModalService,
} from "@/components/ui/CreateModalService";

const modalInstance = CreateModalService();

export const Modal = modalInstance.Modal;
export const confirm = modalInstance.confirm;
export const prompt = modalInstance.prompt;
export const alert = modalInstance.alert;
