// src/components/chat/ChatInput.tsx
import React, { memo } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Textarea } from "@/components/ui/TextArea";
import { useStore } from "@nanostores/react";
import { persona } from "@/stores/ui";
import { Send, Trash2, Loader2, Paperclip } from "lucide-react";
import { MAX_FILE_SIZE_MB } from "@/constants/chat";
import {
  PERSONAS, // PERSONAS constant is correctly imported
} from "@/constants/gemini";
import { DropdownMenu } from "@/components/DropdownMenu"; // Import the DropdownMenu component

// Define the type for files stored in state
// This should ideally be in '@/types/chat'
interface SelectedFileType {
  file: File;
  base64: string;
  mimeType: string;
}

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  selectedFiles: SelectedFileType[];
  isSendingMessage: boolean;
  onSendMessage: () => Promise<void>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  activeConversationId?: string;
  systemInstructions?: string;
  /**
   * Callback fired when a persona is selected from the dropdown.
   * @param personaKey The key identifying the selected persona (e.g., 'bash-admin').
   * @param personaInstruction The full system instruction associated with the persona.
   */
  onSelectPersona: (personaKey: string, personaInstruction: string) => void;
}

const ChatInput = memo((props: ChatInputProps) => {
  const {
    newMessage,
    setNewMessage,
    selectedFiles,
    isSendingMessage,
    onSendMessage,
    onFileChange,
    onRemoveFile,
    onKeyDown,
    fileInputRef,
    textareaRef,
    activeConversationId,
    onSelectPersona, // Destructure the new prop
    systemInstructions,
  } = props;

  // Declare a variable to hold the toggle function provided by DropdownMenu
  let dropdownToggleFunction: (() => void) | undefined;
  const $persona = useStore(persona);
  return (
    <>
      <div className="ai-chat-input-wrapper px-4 pt-4">
        <div className="">
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 rounded-md border border-gray-200 dark:border-gray-700">
              {selectedFiles.map((fileData, index) => (
                <div
                  key={index}
                  className="flex items-center text-sm  px-3 py-1 rounded-full gap-2"
                >
                  <span className="truncate max-w-[150px]">
                    <Paperclip className="inline-block h-3 w-3 mr-1" />{" "}
                    {fileData.file.name} (
                    {Math.round(fileData.file.size / 1024)} KB)
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveFile(index)}
                    type="button"
                    disabled={isSendingMessage}
                    className="h-6 w-6"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="ai-chat-input shadow-xs shadow-zinc-600 flex items-end justify-end flex-col  py-2  shadow-xl rounded-full   py-0 px-4 ">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              maxRows={6}
              className="bg-transparent resize-none flex-1 min-h-[50px] overflow-auto p-0 items-end text-lg"
              disabled={isSendingMessage}
            />
          </div>
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center ">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={onFileChange}
                accept="image/*, application/pdf, .txt, .csv, .ts, .tsx, .pdf"
                multiple // Now correctly enabled for multi-file selection
                disabled={isSendingMessage}
              />
              <DropdownMenu
                className={`path-dropdown `}
                direction="up"
                width="200px"
                trigger={({ isOpen, toggle, ref }) => {
                  // Capture the toggle function here
                  dropdownToggleFunction = toggle;
                  return (
                    <Button
                      ref={ref}
                      className={
                        isSendingMessage ? "cursor-not-allowed opacity-50" : ""
                      }
                      title="Select AI Persona"
                      disabled={isSendingMessage}
                      onClick={toggle}
                    >
                      <span className="block w-10 h-10 rounded-md p-2">
                        <Icon
                          width="1.6em"
                          height="1.6em"
                          icon="mdi:account-voice"
                        />
                      </span>
                    </Button>
                  );
                }}
              >
                <div className="bg-secondary  rounded-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase border-b py-4 px-2">
                    Personas
                  </h3>
                  {Object.entries(PERSONAS).map(([key, value]) => (
                    <Button
                      key={key}
                      variant="ghost"
                      className="w-full justify-start text-left px-2 py-1.5 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                      onClick={() => {
                        onSelectPersona(key, value); // Call the new prop with key and instruction
                        // Use the captured toggle function to close the dropdown
                        dropdownToggleFunction?.();
                      }}
                    >
                      {/* Format key for display (e.g., 'bash-admin' -> 'Bash Admin') */}
                      {key
                        .replace(/-/g, " ") // Replace hyphens with spaces
                        .split(" ")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")}
                    </Button>
                  ))}
                </div>
              </DropdownMenu>
              <Button
                onClick={() => console.log("log")}
                title={`Record  Voice`}
                size="lg"
                disabled={isSendingMessage}
              >
                <Icon
                  icon="mdi-light:microphone"
                  className="text-gray-500 dark:text-gray-300"
                  height="1.5m"
                  width="1.5em"
                />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                title={`Attach files (max ${MAX_FILE_SIZE_MB}MB each)`}
                disabled={isSendingMessage}
                className={
                  isSendingMessage ? "cursor-not-allowed opacity-50" : ""
                }
              >
                <Paperclip className="h-5 w-5 text-gray-500 dark:text-gray-300" />
              </Button>
            </div>

            <div className="flex items-center ">
              <Button
                type="button"
                size="icon"
                onClick={onSendMessage}
                disabled={
                  isSendingMessage ||
                  (!newMessage.trim() && selectedFiles.length === 0)
                }
                className={
                  isSendingMessage ||
                  (!newMessage.trim() && selectedFiles.length === 0)
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }
              >
                {isSendingMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 min-h-2 flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>
          {activeConversationId ? `ConvID: ${activeConversationId}` : ""}
        </span>
        <span>{systemInstructions ? `persona: ${$persona}` : ""} </span>
      </div>
    </>
  );
});

ChatInput.displayName = "ChatInput";
export default ChatInput;
