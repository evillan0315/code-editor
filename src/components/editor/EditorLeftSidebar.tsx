import { useStore } from "@nanostores/react";
import { showLeftSidebar } from "@/stores/layout";
import EditorFileExplorer from "@/components/editor/EditorFileExplorer";
export function EditorLeftSidebar() {
  const isVisible = useStore(showLeftSidebar);

  if (!isVisible) return null;

  return (
    <aside className="flex flex-col h-full w-full relative">
      <div className="flex flex-1">
        <EditorFileExplorer />
      </div>
    </aside>
  );
}
