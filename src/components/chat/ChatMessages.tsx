import React, { memo } from "react";
import { Loader2, MessageSquareText } from "lucide-react";
import ChatPartContent from "./ChatPartContent"; // Relative import
import type { ConversationHistoryItem, ConversationPart } from "@/types/chat";

interface ChatMessagesProps {
  chatHistory: ConversationHistoryItem[];
  /**
   * Indicates if a message is currently being sent by the user AND the AI is processing its response.
   * This is a read-only prop passed from AiChatPanel.
   */
  isSendingMessage: boolean;
  loadingHistory: boolean;
  chatMessagesEndRef: React.RefObject<HTMLDivElement>;
  // REMOVED: setIsSendingMessage - ChatMessages should not modify this state.
}

const ChatMessages = memo(
  ({
    chatHistory,
    isSendingMessage,
    loadingHistory,
    chatMessagesEndRef,
  }: ChatMessagesProps) => {
    // Removed setIsSendingMessage from destructuring
    if (loadingHistory) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-4 ">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <p className="mt-2 text-sm">Loading conversation history...</p>
        </div>
      );
    }

    if (chatHistory.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center ">
          <MessageSquareText className="h-8 w-8 mb-2" />
          <p className="text-2xl">What's on your mind today?</p>
          <p className="text-sm">Your message history will appear here.</p>
        </div>
      );
    }

    return (
      <div className="ai-chaat-messages-wrapper flex-1 overflow-y-auto py-3 space-y-4 text-sm scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-700 dark:scrollbar-track-gray-800">
        {chatHistory.map((msg, index) => {
          const isUser = msg.role === "user";
          const isLastMessage = index === chatHistory.length - 1;

          return (
            <React.Fragment key={msg.id}> {/* MODIFIED: Rely directly on msg.id as it's now guaranteed unique */}
              {" "}
              <div
                className={`flex ${isUser ? "justify-end py-6" : "justify-start"} px-4`}
              >
                <div
                  className={`
                            max-w-[100%] p-3 rounded-lg flex flex-col gap-2
                            ${
                              isUser
                                ? "user-message-wrapper"
                                : "ai-model-message-wrapper"
                            }
                        `}
                >
                  {msg.parts.map(
                    (part: ConversationPart, partIndex: number) => (
                      <ChatPartContent
                        key={partIndex} // Key for part within a message
                        part={part}
                        role={msg.role}
                        isLastMessage={isLastMessage}
                        isSending={isSendingMessage} // Pass the global sending state
                        setIsSendingMessage={() => {}} // Pass a no-op function for consistency, as this component doesn't control sending state
                      />
                    ),
                  )}
                </div>
              </div>
              {/* Timestamp below the message bubble */}
              <div
                className={`px-4 pb-10 border-b text-xs italic ${isUser ? "text-right text-primary" : "text-left text-accent"}`}
              >
                {`Sent by ${isUser ? "You" : "AI"} on ${new Date(msg.createdAt).toLocaleTimeString()} ${new Date(msg.createdAt).toLocaleDateString()}`}
              </div>
              {/* Optional: Separator line (only if desired, consider if it clutters) */}
              {/* {isLastMessage ? null : <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 w-full"></div>} */}
            </React.Fragment>
          );
        })}
        {/* AI thinking indicator for initial processing before content appears */}
        {isSendingMessage &&
          chatHistory.length > 0 &&
          chatHistory[chatHistory.length - 1].role === "user" && (
            <div className="flex justify-start px-4 mt-2">
              <div className="max-w-[80%] p-3 rounded-lg flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                AI is thinking...
              </div>
            </div>
          )}
        <div ref={chatMessagesEndRef} /> {/* For auto-scrolling */}
      </div>
    );
  },
);

ChatMessages.displayName = "ChatMessages";
export default ChatMessages;
