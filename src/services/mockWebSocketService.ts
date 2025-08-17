// src/services/mockWebSocketService.ts
import { type FileItem } from "@/types/file-system"; // Ensure FileItem is imported if used directly

// This is a simplified mock WebSocket service.
// In a real application, you would connect to a WebSocket server:
// const ws = new WebSocket("ws://localhost:3000/ws/filesystem");

const mockWsEvents = [
  // Example events to simulate backend pushes
  {
    type: "created",
    path: "~/mock_file_1.txt",
    item: {
      name: "mock_file_1.txt",
      path: "~/mock_file_1.txt",
      type: "file",
    } as FileItem,
  },
  {
    type: "created",
    path: "~/mock_folder_1",
    item: {
      name: "mock_folder_1",
      path: "~/mock_folder_1",
      type: "dir",
      children: [],
      isOpen: false,
    } as FileItem,
  },
  {
    type: "created",
    path: "~/mock_folder_1/nested_file.txt",
    item: {
      name: "nested_file.txt",
      path: "~/mock_folder_1/nested_file.txt",
      type: "file",
    } as FileItem,
  },
  {
    type: "renamed",
    oldPath: "~/mock_file_1.txt",
    newPath: "~/renamed_file_1.txt",
    item: {
      name: "renamed_file_1.txt",
      path: "~/renamed_file_1.txt",
      type: "file",
    } as FileItem,
  },
  {
    type: "renamed",
    oldPath: "~/mock_folder_1",
    newPath: "~/renamed_folder_1",
    item: {
      name: "renamed_folder_1",
      path: "~/renamed_folder_1",
      type: "dir",
      children: [],
      isOpen: false,
    } as FileItem,
  },
  { type: "deleted", path: "~/renamed_file_1.txt" },
  { type: "deleted", path: "~/renamed_folder_1" },
  {
    type: "created",
    path: "~/mock_file_2.js",
    item: {
      name: "mock_file_2.js",
      path: "~/mock_file_2.js",
      type: "file",
    } as FileItem,
  },
];

let eventIndex = 0;
let intervalId: NodeJS.Timeout | null = null;

export const startMockFileSystemWatcher = () => {
  if (intervalId) return; // Already running

  console.log("Starting mock file system watcher...");
  eventIndex = 0; // Reset index each time it starts
  intervalId = setInterval(() => {
    if (eventIndex < mockWsEvents.length) {
      const event = mockWsEvents[eventIndex];
      console.log("Mock FS Event (published to store):", event);
      //fileSystemEvents.set(event); // Publish the event to the store
      eventIndex++;
    } else {
      console.log("Mock FS events finished.");
      //stopMockFileSystemWatcher();
    }
  }, 5000); // Send an event every 5 seconds for demonstration
};

export const stopMockFileSystemWatcher = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Stopped mock file system watcher.");
  }
};

// You might want to call startMockFileSystemWatcher() once on app load
// e.g., in your App.tsx or main entry point where useEditorExplorerActions is used.
