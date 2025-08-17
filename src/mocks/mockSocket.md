// src/mocks/mockSocket.ts
import { ISocket, NodeJS } from "@/types/socket-interfaces";
import { FileSystemEvent, fileSystemEvents } from "@/stores/editorContent";
import { FileItem, APIProps } from "@/types/file-system";
import { getParentPath, createNewFileItem } from "@/utils/fileTreeUtils";
import { SOCKET_EVENTS } from "@/constants";

// Helper for simulating async operations
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Simple in-memory file system for the mock
const mockFs: Record<string, FileItem> = {
  "/": { name: "", path: "/", type: "dir", children: [] }, // Root
  "~/": { name: "~/", path: "~/", type: "dir", children: [] }, // User home dir
  "~/project/": {
    name: "project",
    path: "~/project/",
    type: "dir",
    children: [],
  },
  "~/project/index.js": {
    name: "index.js",
    path: "~/project/index.js",
    type: "file",
    content: "console.log('Hello Mock!');",
    language: "javascript",
  },
  "~/test.txt": {
    name: "test.txt",
    path: "~/test.txt",
    type: "file",
    content: "This is a test file.",
    language: "plain",
  },
};

// Populate initial children
mockFs["/"].children = [mockFs["~/"]];
mockFs["~/"].children = [mockFs["~/project/"], mockFs["~/test.txt"]];
mockFs["~/project/"].children = [mockFs["~/project/index.js"]];

// Function to get children for a path (used by mock)
const getChildrenForPath = (path: string): FileItem[] => {
  const item = mockFs[path];
  if (item && item.type === "dir" && item.children) {
    return item.children.filter((child) => child.path.startsWith(path));
  }
  return [];
};

// Function to get a file item by path
const getFileItemByPath = (path: string): FileItem | undefined => {
  return mockFs[path];
};

// Event queue for simulating real-time pushes
const realTimeEventQueue: FileSystemEvent[] = [
  {
    type: "created",
    path: "~/mock_file.txt",
    item: createNewFileItem("mock_file.txt", "~/mock_file.txt", "file"),
  },
  {
    type: "created",
    path: "~/mock_folder/",
    item: createNewFileItem("mock_folder", "~/mock_folder/", "dir"),
  },
  {
    type: "renamed",
    oldPath: "~/mock_file.txt",
    newPath: "~/renamed_file.txt",
    item: createNewFileItem("renamed_file.txt", "~/renamed_file.txt", "file"),
  },
  {
    type: "created",
    path: "~/mock_folder/nested_mock_file.js",
    item: createNewFileItem(
      "nested_mock_file.js",
      "~/mock_folder/nested_mock_file.js",
      "file",
    ),
  },
  { type: "deleted", path: "~/renamed_file.txt" },
  {
    type: "renamed",
    oldPath: "~/mock_folder/",
    newPath: "~/renamed_mock_folder/",
    item: createNewFileItem(
      "renamed_mock_folder",
      "~/renamed_mock_folder/",
      "dir",
    ),
  },
  { type: "deleted", path: "~/renamed_mock_folder/" },
];

let realTimeEventInterval: NodeJS.Timeout | null = null;
let currentEventIndex = 0;

export class MockSocket implements ISocket {
  public id: string = `mock-socket-${Math.random().toString(36).substring(2, 9)}`;
  public connected: boolean = false;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private onceListeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  constructor() {
    console.log(`MockSocket created with ID: ${this.id}`);
  }

  // --- Socket.IO API Simulation ---
  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(listener);
    return this;
  }

  once(event: string, listener: (...args: any[]) => void): this {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event)?.add(listener);
    return this;
  }

  off(event: string, listener?: (...args: any[]) => void): this {
    if (listener) {
      this.listeners.get(event)?.delete(listener);
      this.onceListeners.get(event)?.delete(listener);
    } else {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    }
    return this;
  }

  emit(event: string, data: any): this {
    console.log(`MockSocket emitted: ${event}`, data);

    // Simulate server response based on the emitted event
    this.handleMockResponse(event, data);

    // Call any 'on' listeners
    this.listeners.get(event)?.forEach((listener) => listener(data));

    // Call any 'once' listeners and remove them
    this.onceListeners.get(event)?.forEach((listener) => {
      listener(data);
      this.onceListeners.get(event)?.delete(listener);
    });

    return this;
  }

  connect(): this {
    if (!this.connected) {
      this.connected = true;
      console.log(`MockSocket connected: ${this.id}`);
      // Simulate connect event to listeners
      setTimeout(
        () => this.listeners.get(SOCKET_EVENTS.CONNECT)?.forEach((l) => l()),
        50,
      );
      // Start real-time event simulation
      this.startRealTimeEventSimulation();
    }
    return this;
  }

  disconnect(): this {
    if (this.connected) {
      this.connected = false;
      console.log(`MockSocket disconnected: ${this.id}`);
      // Simulate disconnect event to listeners
      setTimeout(
        () => this.listeners.get(SOCKET_EVENTS.DISCONNECT)?.forEach((l) => l()),
        50,
      );
      this.stopRealTimeEventSimulation();
    }
    return this;
  }

  // --- Mock Response Logic ---
  private async handleMockResponse(event: string, data: APIProps) {
    let response: any;
    let responseEvent = `${data.event}Response`;
    let errorEvent = `${data.event}Error`;

    try {
      await delay(200); // Simulate network latency

      switch (data.event) {
        case "listDirectoryChildren":
          const dirPath = new URLSearchParams(data.endpoint.split("?")[1]).get(
            "directory",
          );
          if (dirPath) {
            response = getChildrenForPath(dirPath);
            // Simulate adding a few files dynamically on fetch
            if (dirPath === "~/") {
              response = [
                ...response,
                createNewFileItem(
                  `dynamic_file_${Date.now()}.txt`,
                  `~/dynamic_file_${Date.now()}.txt`,
                  "file",
                ),
              ];
            }
          } else {
            throw new Error("Directory path missing for listDirectoryChildren");
          }
          break;
        case "readFile":
          const filePathToRead = data.body?.filePath;
          const file = getFileItemByPath(filePathToRead);
          if (file && file.type === "file") {
            response = {
              content: file.content || `Mock content for ${filePathToRead}`,
              language: file.language || "plain",
            };
          } else {
            throw new Error(`File not found or not a file: ${filePathToRead}`);
          }
          break;
        case "saveFile":
          const filePathToSave = data.body?.filePath;
          const contentToSave = data.body?.content;
          if (filePathToSave && typeof contentToSave === "string") {
            const fileToUpdate = getFileItemByPath(filePathToSave);
            if (fileToUpdate && fileToUpdate.type === "file") {
              fileToUpdate.content = contentToSave; // Update mock FS
              response = { success: true };
            } else {
              mockFs[filePathToSave] = createNewFileItem(
                filePathToSave.split("/").pop()!,
                filePathToSave,
                "file",
              );
              mockFs[filePathToSave].content = contentToSave; // Create new mock file if not exists
              response = { success: true, created: true };
            }
          } else {
            throw new Error("File path or content missing for saveFile");
          }
          break;
        case "formatCode":
        case "optimizeCode":
        case "removeCodeComment":
        case "stripCodeBlock":
          // Simple mock for code transformations
          response = {
            content: `// Mock ${data.event} result\n${data.body?.content}`,
          };
          break;
        default:
          console.warn(`MockSocket: Unhandled dynamic event: ${data.event}`);
          return; // Don't emit response for unhandled events
      }

      this.listeners
        .get(responseEvent)
        ?.forEach((listener) => listener(response));
      this.onceListeners.get(responseEvent)?.forEach((listener) => {
        listener(response);
        this.off(responseEvent, listener);
      });
    } catch (error: any) {
      console.error(`MockSocket: Error handling ${data.event}:`, error.message);
      this.listeners
        .get(errorEvent)
        ?.forEach((listener) => listener({ message: error.message }));
      this.onceListeners.get(errorEvent)?.forEach((listener) => {
        listener({ message: error.message });
        this.off(errorEvent, listener);
      });
    }
  }

  // --- Real-time File System Event Simulation ---
  private startRealTimeEventSimulation() {
    if (realTimeEventInterval) return;

    currentEventIndex = 0; // Reset for new connection
    realTimeEventInterval = setInterval(() => {
      if (currentEventIndex < realTimeEventQueue.length) {
        const event = realTimeEventQueue[currentEventIndex];
        console.log(`MockSocket pushing FS event: ${event.type}`, event);

        // Simulate backend pushing generic FS change event
        // In a real setup, backend would push to this specific socket.
        // For mock, we directly publish to the nanostore, which is then consumed by the React hook.
        fileSystemEvents.set(event);

        currentEventIndex++;
      } else {
        console.log("MockSocket: All real-time events pushed.");
        this.stopRealTimeEventSimulation();
      }
    }, 7000); // Push an event every 7 seconds
  }

  private stopRealTimeEventSimulation() {
    if (realTimeEventInterval) {
      clearInterval(realTimeEventInterval);
      realTimeEventInterval = null;
    }
  }
}
