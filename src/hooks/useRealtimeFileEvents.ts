// src/hooks/useRealtimeFileEvents.ts
import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  editorActiveFilePath,
  editorFilesMap,
  editorFileTreeNodes,
  editorOpenFiles,
  editorCurrentDirectory,
  fileSystemEvents,
  type EditorFileEntry,
} from '@/stores/editorContent';
import { useToast } from '@/hooks/useToast';
import {
  getParentPath,
  removeItemFromTree,
  updateTreeWithNewItem,
} from '@/utils/fileTree';

interface RealtimeFileEventsDependencies {
  fetchAndSetFileTree: () => Promise<void>;
}

export function useRealtimeFileEvents({
  fetchAndSetFileTree,
}: RealtimeFileEventsDependencies) {
  const { showToast } = useToast();
  const latestFsEvent = useStore(fileSystemEvents);

  useEffect(() => {
    const unsubscribe = fileSystemEvents.listen((event) => {
      if (!event) return;

      const currentNodes = editorFileTreeNodes.get();
      const explorerRoot = editorCurrentDirectory.get();
      let updatedNodes = [...currentNodes];

      console.log('Processing FS Event:', event.type, event);

      switch (event.type) {
        case 'created':
          if (event.item) {
            const parentPath = getParentPath(event.path);
            updatedNodes = updateTreeWithNewItem(
              currentNodes,
              parentPath,
              event.item,
              explorerRoot,
            );
            editorFileTreeNodes.set(updatedNodes);
            showToast(`Real-time: '${event.item.name}' created.`, 'info');
          }
          break;

        case 'deleted':
          const { updatedNodes: nodesAfterDeletion } = removeItemFromTree(
            currentNodes,
            event.path,
          );
          editorFileTreeNodes.set(nodesAfterDeletion);
          showToast(
            `Real-time: '${event.path.split('/').pop()}' deleted.`,
            'info',
          );

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
            editorActiveFilePath.set('');
          }

          break;

        case 'renamed':
          if (event.item) {
            const { updatedNodes: nodesAfterRemoval } = removeItemFromTree(
              currentNodes,
              event.oldPath,
            );

            const newRenamedItem = event.item;

            const parentPath = getParentPath(event.newPath);
            updatedNodes = updateTreeWithNewItem(
              nodesAfterRemoval,
              parentPath,
              newRenamedItem,
              explorerRoot,
            );
            editorFileTreeNodes.set(updatedNodes);
            showToast(
              `Real-time: '${event.oldPath.split('/').pop()}' renamed to '${event.item.name}'.`,
              'info',
            );

            const updateOpenFiles = (files: string[]) =>
              files.map((p) => {
                if (p === event.oldPath) return event.newPath;
                if (p.startsWith(event.oldPath + '/'))
                  return p.replace(event.oldPath, event.newPath);
                return p;
              });
            editorOpenFiles.set(updateOpenFiles(editorOpenFiles.get()));

            const updateEditorMap = (map: Record<string, EditorFileEntry>) => {
              const newMap: Record<string, EditorFileEntry> = {};
              for (const [key, value] of Object.entries(map)) {
                if (key === event.oldPath) newMap[event.newPath] = value;
                else if (key.startsWith(event.oldPath + '/'))
                  newMap[key.replace(event.oldPath, event.newPath)] = value;
                else newMap[key] = value;
              }
              return newMap;
            };
            editorFilesMap.set(updateEditorMap(editorFilesMap.get()));

            const currentActivePath = editorActiveFilePath.get();
            if (currentActivePath === event.oldPath) {
              editorActiveFilePath.set(event.newPath);
            } else if (currentActivePath.startsWith(event.oldPath + '/')) {
              editorActiveFilePath.set(
                currentActivePath.replace(event.oldPath, event.newPath),
              );
            }
          } else {
            console.warn(
              'Renamed item data incomplete for real-time update. Initiating full refresh.',
            );
          }

          break;

        case 'modified':
          showToast(
            `Real-time: '${event.path.split('/').pop()}' modified.`,
            'info',
          );

          break;

        default:
          console.warn('Unknown file system event type:', event.type);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [latestFsEvent, showToast, fetchAndSetFileTree]);

  return {};
}
