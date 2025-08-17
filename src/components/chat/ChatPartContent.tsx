// src/components/chat/ChatPartContent.tsx
import React, { memo, useState, useCallback } from "react";
import MarkdownViewer from "@/components/MarkdownViewerType"; // Assuming this component exists
import type { ConversationPart } from "@/types/chat";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon"; // Import Icon from Iconify
import { useToast } from "@/hooks/useToast";

interface ChatPartContentProps {
  part: ConversationPart;
  role: string;
  isLastMessage: boolean;
  isSending: boolean;
  setIsSendingMessage: (sending: boolean) => void;
}

const ChatPartContent = memo(
  ({
    part,
    role,
    isLastMessage,
    isSending,
    setIsSendingMessage,
  }: ChatPartContentProps) => {
    const { showToast } = useToast();
    // State to manage the visual feedback of the copy button (e.g., changing to a checkmark)
    const [copied, setCopied] = useState(false);

    // Callback function to handle the copy action
    const handleCopy = useCallback(async () => {
      // Ensure there is text to copy
      if (part.text) {
        try {
          await navigator.clipboard.writeText(part.text);
          setCopied(true); // Set state to indicate text has been copied
          showToast("Copied to clipboard!", "success"); // Show success notification

          // Reset the 'copied' state after a short delay
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        } catch (err) {
          console.error("Failed to copy text: ", err);
          showToast("Failed to copy!", "error");
        }
      }
    }, [part.text]); // Re-create handler only if part.text changes

    return (
      <>
        {part.text &&
          (role === "model" ? (
            // For 'model' role, we wrap the MarkdownViewer in a relative div
            // to position the copy button absolutely above it.
            // 'group' class is used to make the copy button visible on hover.
            <div className="relative group">
              {/* Copy Button */}
              <Button
                onClick={handleCopy}
                className="absolute -top-6 right-0 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                title="Copy message"
                aria-label="Copy message to clipboard" // Accessibility improvement
              >
                {/* Iconify component: shows 'check' icon if copied, otherwise 'copy' icon */}
                <Icon
                  icon={copied ? "lucide:check" : "lucide:copy"}
                  width="2em"
                  height="2em"
                />
              </Button>
              <MarkdownViewer markdown={part.text} />
            </div>
          ) : (
            // For other roles (e.g., 'user'), render plain text
            <p className="whitespace-pre-wrap">{part.text}</p>
          ))}
        {part.inlineData && (
          <div className="mt-2 max-w-[200px] h-auto">
            {part.inlineData.mime_type.startsWith("image/") ? (
              <img
                src={`data:${part.inlineData.mime_type};base64,${part.inlineData.data}`}
                alt="Uploaded file"
                className="max-w-full h-auto rounded-md object-contain"
              />
            ) : (
              <p className="text-xs text-gray-400">
                [File: {part.inlineData.mime_type}]
              </p>
            )}
          </div>
        )}
      </>
    );
  },
);

ChatPartContent.displayName = "ChatPartContent";
export default ChatPartContent;
