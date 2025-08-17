import React from "react";
import { FileItem, ContextMenuItem } from "@/types/file-system";

// --- File Size & Conversation Limits ---
export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const CONVERSATION_LIST_LIMIT = 50;
export const CONVERSATION_HISTORY_LIMIT = 1000;
export const TYPE_SPEED_MS = 0;

export const FILE_SERVICE = {};

export const FILE_EXPLORER_CONTEXT_MENU_ITEMS: ContextMenuItem[] = [
  {
    type: "header",
    label: "Create File",
  },
  {
    id: "create-file",
    label: "Optimize Code",
    action: (event: React.MouseEvent, file: FileItem) => {
      console.log(file);
    },
    icon: "mdi:speedometer",
    type: "button",
  },
  {
    type: "divider",
  },
  {
    id: "Delete-File",
    label: "Delete File",
    action: (event: MouseEvent, file: FileItem) => {},
    icon: "mdi:magnify",
    type: "button",
  },
];
