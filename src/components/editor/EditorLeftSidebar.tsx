import { useStore } from '@nanostores/react';
import { showLeftSidebar } from '@/stores/layout';
import EditorExplorer from '@/components/editor/EditorExplorer';
export function EditorLeftSidebar() {
  const isVisible = useStore(showLeftSidebar);

  if (!isVisible) return null;

  return (
    <aside className="flex flex-col h-full w-full relative">
      <EditorExplorer />
    </aside>
  );
}
