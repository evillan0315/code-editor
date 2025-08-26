import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  showRightSidebar,
  rightSidebarActiveTab,
  setRightSidebarActiveTab,
  setPreviewContent,
  toggleBottomRight,
  showBottomRight,
} from '@/stores/layout';
import {
  showChatConversationList,
  toggleChatConversationList,
  triggerNewChat,
} from '@/stores/chatUi'; // NEW: Import chat UI stores
import { AiChatPanel } from '@/components/AiChatPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export function EditorRightSidebar() {
  const $visible = useStore(showRightSidebar);
  const $activeTab = useStore(rightSidebarActiveTab);
  const $showChatConversationList = useStore(showChatConversationList); // NEW: Subscribe to chat list visibility

  // Clear preview content when the sidebar is closed or the tab changes away from preview
  useEffect(() => {
    if (!$visible || $activeTab !== 'preview') {
      setPreviewContent({ type: null, content: null });
    }
  }, [$visible, $activeTab]);

  if (!$visible) return null;

  return (
    <aside className="flex flex-col h-full w-full relative bg-dark border-l">
      <div className="flex items-center justify-around h-12 border-b border-dark-secondary bg-secondary flex-shrink-0">
        {/* NEW: View All Chats button icon at the beginning of the tabs */}
        <Button
          variant="secondary"
          className={`${$activeTab === 'codeAssist' && $showChatConversationList ? 'active' : ''}`}
          onClick={() => {
            if ($activeTab === 'codeAssist') {
              toggleChatConversationList(); // Toggle only if CodeAssist is already active
            } else {
              setRightSidebarActiveTab('codeAssist'); // Switch to CodeAssist tab
              showChatConversationList.set(true); // Ensure conversation list is visible
            }
          }}
          title="View All Chats"
        >
          <Icon icon="mdi:chat-outline" width="2em" height="2em" />
        </Button>
        <Button
          variant="ghost"
          className={`flex-1 rounded-none h-full ${$activeTab === 'codeAssist' ? 'bg-dark' : 'hover:bg-hover'}`}
          onClick={() => setRightSidebarActiveTab('codeAssist')}
          title="Code Assist Chat"
        >
          <Icon icon="mdi:robot-outline" className="mr-2" />
          CodeAssist
        </Button>
        <Button
          variant="ghost"
          className={`flex-1 rounded-none h-full ${$activeTab === 'preview' ? 'bg-dark' : 'hover:bg-secondary'}`}
          onClick={() => setRightSidebarActiveTab('preview')}
          title="Preview Content"
        >
          <Icon icon="mdi:eye-outline" className="mr-2" />
          Preview
        </Button>
        {/* NEW: Start a New Conversation button icon at the end of the tabs */}
        <Button
          variant="secondary"
          onClick={() => {
            setRightSidebarActiveTab('codeAssist'); // Always switch to CodeAssist tab
            triggerNewChat(); // Trigger new chat event
          }}
          title="Start a new conversation"
        >
          <Icon icon="mdi-light:plus" width="2em" height="2em" />
        </Button>
        <Button
          variant="secondary"
          className={`${showBottomRight.get() ? 'active' : ''}`}
          title="Toggle bottom right sidebar content"
          onClick={toggleBottomRight}
        >
          <Icon icon="mdi:dock-top" width="2em" height="2em" />
        </Button>
      </div>
      <div className="flex-grow overflow-hidden">
        {$activeTab === 'codeAssist' && <AiChatPanel />}
        {$activeTab === 'preview' && <PreviewPanel />}
      </div>
    </aside>
  );
}
