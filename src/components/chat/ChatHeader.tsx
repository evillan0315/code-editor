import React, { memo } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import { Trash2 } from 'lucide-react';
import { showBottomRight, toggleBottomRight } from '@/stores/layout';
interface ChatHeaderProps {
  showConversationList: boolean;
  onToggleChatList: () => void;
  onNewChat: () => void;
  onDeleteConversation: () => void;
  activeConversationId: string | null;
  isSendingMessage: boolean;
}

const ChatHeader = memo((props: ChatHeaderProps) => {
  const {
    showConversationList,
    onToggleChatList,
    onNewChat,
    onDeleteConversation,
    activeConversationId,
    isSendingMessage,
  } = props;

  return (
    <div className='ai-chat-header  flex bg-secondary border-b  h-12 px-1 shadow-md w-full'>
      <div className='flex items-center justify-between w-full'>
        <div className='flex flex-shrink items-center gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='secondary'
                title='More options'
                className={`
                  ${isSendingMessage ? 'cursor-not-allowed opacity-50' : ''}
                
                `}
                disabled={isSendingMessage}
              >
                <Icon icon='mdi:dots-vertical' width='2em' height='2em' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onSelect={onDeleteConversation}
                disabled={!activeConversationId}
                className='text-red-500 hover:bg-red-50 dark:hover:bg-red-900'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                <span>Delete Conversation</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant='secondary'
            onClick={onToggleChatList}
            title='View All Chats'
            className={`
              ${isSendingMessage ? 'cursor-not-allowed opacity-50' : ''}
              
            `}
            disabled={isSendingMessage}
          >
            {}
            <Icon icon='mdi:chat-outline' width='2em' height='2em' />
          </Button>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-md text-neutral-500 block truncate whitespace-no-wrap px-2 max-w-[100%]'>
            Code Assist
          </span>
        </div>
        <div className='flex flex-shrink-1 items-center gap-1'>
          <Button
            variant='secondary'
            onClick={onNewChat}
            title='Start a new conversation'
            className={`
              ${isSendingMessage ? 'cursor-not-allowed opacity-50' : ''}
             
            `}
            disabled={isSendingMessage}
          >
            <Icon icon='mdi-light:plus' width='2em' height='2em' />
          </Button>

          <Button
            variant='secondary'
            className={`${showBottomRight.get() ? 'active' : ''}`}
            title='Toggle bottom right sidebar content'
            onClick={toggleBottomRight}
          >
            <Icon icon='mdi:dock-top' width='2em' height='2em' />
          </Button>
        </div>
      </div>
    </div>
  );
});

ChatHeader.displayName = 'ChatHeader';
export default ChatHeader;
