// src/hooks/useRealtimeFileEvents.ts
import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  editorActiveFilePath,
  editorFilesMap,
  editorFileTreeNodes,
  editorOpenFiles,
  editorCurrentDirectory,
  fileSystemEvents,
  type EditorFileEntry,
} from "@/stores/editorContent";
import { useToast } from "@/hooks/useToast";
import { // Potentially useful if event just gives path
  getParentPath,
  removeItemFromTree,
  updateTreeWithNewItem,
} from "@/utils/fileTreeUtils";

// For demonstration

interface RealtimeFileEventsDependencies {
  fetchAndSetFileTree: () => Promise<void>;
}

export function useRealtimeFileEvents({
  fetchAndSetFileTree,
}: RealtimeFileEventsDependencies) {
  const { showToast } = useToast();
  const latestFsEvent = useStore(fileSystemEvents); // Subscribe to fileSystemEvents atom

  useEffect(() => {
    // Start the mock watcher when the component mounts
    //startMockFileSystemWatcher();

    // Subscribe to fileSystemEvents atom
    const unsubscribe = fileSystemEvents.listen((event) => {
      if (!event) return; // Ignore null events

      const currentNodes = editorFileTreeNodes.get();
      const explorerRoot = editorCurrentDirectory.get();
      let updatedNodes = [...currentNodes]; // Start with a copy

      console.log("Processing FS Event:", event.type, event);

      switch (event.type) {
        case "created":
          if (event.item) {
            const parentPath = getParentPath(event.path);
            updatedNodes = updateTreeWithNewItem(
              currentNodes,
              parentPath,
              event.item,
              explorerRoot,
            );
            editorFileTreeNodes.set(updatedNodes);
            showToast(`Real-time: '${event.item.name}' created.`, "info");
            //fetchAndSetFileTree();
          }
          break;

        case "deleted":
          const { updatedNodes: nodesAfterDeletion } = removeItemFromTree(
            currentNodes,
            event.path,
          );
          editorFileTreeNodes.set(nodesAfterDeletion);
          showToast(
            `Real-time: '${event.path.split("/").pop()}' deleted.`,
            "info",
          );

          // Clean up editor states if a deleted file/folder was open
          editorOpenFiles.set(
            editorOpenFiles.get().filter((p) => !p.startsWith(event.path)),
          );

          const editorMapAfterDelete: Record<string, EditorFileEntry> = {};
          for (const [key, value] of Object.entries(editorFilesMap.get())) {
            if (!key.startsWith(event.path)) {
              editorMapAfterDelete[key] = value;
            }
          }
          editorFilesMap.set(editorMapAfterDelete);

          if (editorActiveFilePath.get().startsWith(event.path)) {
            editorActiveFilePath.set("");
          }
          // fetchAndSetFileTree();
          break;

        case "renamed":
          if (event.item) {
            const { updatedNodes: nodesAfterRemoval } = removeItemFromTree(
              currentNodes,
              event.oldPath,
            );

            // The 'item' from the event is the already updated item
            const newRenamedItem = event.item;

            const parentPath = getParentPath(event.newPath);
            updatedNodes = updateTreeWithNewItem(
              nodesAfterRemoval, // Add to the tree after old item is removed
              parentPath,
              newRenamedItem,
              explorerRoot,
            );
            editorFileTreeNodes.set(updatedNodes);
            showToast(
              `Real-time: '${event.oldPath.split("/").pop()}' renamed to '${event.item.name}'.`,
              "info",
            );

            // Update editor states for open files/editor content
            const updateOpenFiles = (files: string[]) =>
              files.map((p) => {
                if (p === event.oldPath) return event.newPath;
                if (p.startsWith(event.oldPath + "/"))
                  return p.replace(event.oldPath, event.newPath);
                return p;
              });
            editorOpenFiles.set(updateOpenFiles(editorOpenFiles.get()));

            const updateEditorMap = (map: Record<string, EditorFileEntry>) => {
              const newMap: Record<string, EditorFileEntry> = {};
              for (const [key, value] of Object.entries(map)) {
                if (key === event.oldPath) newMap[event.newPath] = value;
                else if (key.startsWith(event.oldPath + "/"))
                  newMap[key.replace(event.oldPath, event.newPath)] = value;
                else newMap[key] = value;
              }
              return newMap;
            };
            editorFilesMap.set(updateEditorMap(editorFilesMap.get()));

            const currentActivePath = editorActiveFilePath.get();
            if (currentActivePath === event.oldPath) {
              editorActiveFilePath.set(event.newPath);
            } else if (currentActivePath.startsWith(event.oldPath + "/")) {
              editorActiveFilePath.set(
                currentActivePath.replace(event.oldPath, event.newPath),
              );
            }
          } else {
            // Fallback to full refresh if event data is incomplete
            console.warn(
              "Renamed item data incomplete for real-time update. Initiating full refresh.",
            );
          }
          //fetchAndSetFileTree();
          break;

        case "modified":
          // For 'modified' events, we typically don't update the tree structure.
          // You might trigger a re-read of the file if it's currently open,
          // or just update its 'modified' timestamp if `FileItem` had one.
          showToast(
            `Real-time: '${event.path.split("/").pop()}' modified.`,
            "info",
          );
          // If the file is open and active, you might want to re-fetch its content
          // to reflect external changes, or show a warning.
          // Example:
          // if (editorActiveFilePath.get() === event.path) {
          //   // Potentially trigger re-read, but be careful with unsaved changes.
          // }
          break;

        default:
          console.warn("Unknown file system event type:", event.type);
      }
    });

    // Clean up the subscription and mock watcher when the component unmounts
    return () => {
      unsubscribe();
      //stopMockFileSystemWatcher();
    };
  }, [latestFsEvent, showToast, fetchAndSetFileTree]); // Dependencies for useEffect

  // This hook doesn't return any handlers, its purpose is side effects
  return {};
}
