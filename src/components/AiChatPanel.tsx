import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { showRightSidebar } from '@/stores/layout';
import { persona, aiConversationIdStore } from '@/stores/ui';
import { showChatConversationList, newChatEvent } from '@/stores/chatUi'; // NEW: Import chat UI stores
import { v4 as uuidv4 } from 'uuid';
import { apiService } from '@/services/apiService';
import { useToast } from '@/hooks/useToast';

import {
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  CONVERSATION_LIST_LIMIT,
  CONVERSATION_HISTORY_LIMIT,
} from '@/constants';
import { SYSTEM_INSTRUCTIONS_REACT_EXPERT, PERSONAS } from '@/constants';

import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import ConversationListView from '@/components/chat/ConversationListView';

import type {
  PaginatedResponse,
  ConversationSummary,
  ConversationHistoryItem,
  SendMessageResponse,
  PaginationParams,
  ChatRequestPayload as ApiChatRequestPayload,
  FileData,
  ModelResponse,
  RequestType, // Import RequestType from types
} from '@/types/chat';

import '@/styles/chat.css';

interface SelectedFileType {
  file: File;
  base64: string;
  mimeType: string;
}

export function AiChatPanel() {
  const $persona = useStore(persona);
  const $visible = useStore(showRightSidebar);
  const $newChatEvent = useStore(newChatEvent); // NEW: Subscribe to new chat event trigger
  const $showConversationList = useStore(showChatConversationList); // NEW: Subscribe to chat list visibility

  const { showToast } = useToast();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ConversationHistoryItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileType[]>([]);

  // REMOVED: [showConversationList, setShowConversationList] local state
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [conversationListPage, setConversationListPage] = useState(1);
  const [conversationListTotalPages, setConversationListTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRequestType, setSelectedRequestType] = useState<RequestType | null>(null); // NEW: State for request type filter

  const [systemInstructions, setSystemInstructions] = useState<string>(
    PERSONAS[$persona] || SYSTEM_INSTRUCTIONS_REACT_EXPERT,
  );

  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeConversationId, isSendingMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage, selectedFiles]);

  const handleConversationPageChange = useCallback((page: number) => {
    setConversationListPage(page);
  }, []);

  // UPDATED: fetchConversations now accepts search and requestType filters
  const fetchConversations = useCallback(
    async (
      pageToFetch: number,
      currentSearchQuery: string,
      currentRequestType: RequestType | null,
    ) => {
      setLoadingConversations(true);
      try {
        const params: PaginationParams = {
          page: pageToFetch,
          limit: CONVERSATION_LIST_LIMIT,
          search: currentSearchQuery, // Pass search query
          requestType: currentRequestType, // Pass request type filter
        };

        const response: PaginatedResponse<ConversationSummary> =
          await apiService.conversation.list(params);
        setConversations(response.data);
        setConversationListPage(pageToFetch);
        setConversationListTotalPages(response.totalPages);
      } catch (err: any) {
        console.error('Error fetching conversations:', err);
        showToast(
          `Error fetching conversations: ${err.message || 'An unexpected error occurred.'}`,
          'error',
        );
        setConversations([]);
        setConversationListPage(1);
        setConversationListTotalPages(1);
      } finally {
        setLoadingConversations(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    // Use $showConversationList from the store to decide when to fetch conversations
    if (!$showConversationList) return;

    // Call fetchConversations with current filters
    fetchConversations(conversationListPage, searchQuery, selectedRequestType);
  }, [
    $showConversationList, // NEW: React to store state
    conversationListPage,
    searchQuery, // Add searchQuery to dependencies
    selectedRequestType, // Add selectedRequestType to dependencies
    fetchConversations,
  ]);

  const fetchHistory = useCallback(
    async (convId: string) => {
      setLoadingHistory(true);
      try {
        const response: PaginatedResponse<ModelResponse> = await apiService.conversation.getHistory(
          convId,
          {
            page: 1,
            limit: CONVERSATION_HISTORY_LIMIT,
          } as PaginationParams,
        );

        // Convert ModelResponse to ConversationHistoryItem by adding an ID
        const historyWithIds: ConversationHistoryItem[] = response.data.map((item) => ({
          ...item,
          id: uuidv4(), // Assign a unique ID for React keys
        }));

        const sortedHistory = historyWithIds.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        setChatHistory(sortedHistory);
      } catch (err: any) {
        console.error('Error fetching conversation history:', err);
        showToast(
          `Error fetching history: ${err.message || 'An unexpected error occurred.'}`,
          'error',
        );
        setActiveConversationId(null);
        setChatHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    if (activeConversationId) {
      fetchHistory(activeConversationId);
    } else {
      setChatHistory([]);
    }
  }, [activeConversationId, fetchHistory]);

  const readFileAsDataURL = useCallback(
    (file: File): Promise<{ base64: string; mimeType: string }> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result?.toString().split(',')[1];
          if (base64String) {
            resolve({ base64: base64String, mimeType: file.type });
          } else {
            reject(new Error(`Failed to read file: ${file.name}`));
          }
        };
        reader.onerror = () => {
          reject(new Error(`Failed to read file: ${file.name}`));
        };
        reader.readAsDataURL(file);
      });
    },
    [],
  );

  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = newMessage.trim();

    if (!trimmedMessage && selectedFiles.length === 0) {
      showToast('Please enter a message or select at least one file.', 'warning');
      return;
    }
    if (isSendingMessage) return;

    setIsSendingMessage(true);

    const isNewConversation = !activeConversationId;

    const conversationToUseId = isNewConversation ? uuidv4() : activeConversationId;

    const userMessage: ConversationHistoryItem = {
      id: uuidv4(),
      role: 'user',
      parts: [],
      createdAt: new Date().toISOString(),
    };

    if (trimmedMessage) {
      userMessage.parts.push({ text: trimmedMessage });
    }

    let filesDataPayload: FileData[] = [];
    if (selectedFiles.length > 0) {
      filesDataPayload = selectedFiles.map((fileData) => ({
        type: fileData.mimeType,
        data: fileData.base64,
        name: fileData.file.name,
      }));

      selectedFiles.forEach((fileData) => {
        userMessage.parts.push({
          inlineData: {
            mime_type: fileData.mimeType,
            data: fileData.base64,
          },
        });
      });
    }

    setChatHistory((prev) => [...prev, userMessage]);

    setNewMessage('');
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const payload: ApiChatRequestPayload = {
        conversationId: conversationToUseId as string,
        prompt: trimmedMessage,
        systemInstruction: isNewConversation
          ? systemInstructions || SYSTEM_INSTRUCTIONS_REACT_EXPERT
          : undefined,
        // The `requestType` for the user message is typically determined by the content
        // e.g., TEXT_ONLY, TEXT_WITH_IMAGE. The backend determines this.
      };

      if (filesDataPayload.length > 0) {
        payload.filesData = filesDataPayload;
      }

      const response: SendMessageResponse = await apiService.conversation.sendMessage(payload);

      if (isNewConversation && response.conversationId) {
        setActiveConversationId(response.conversationId);
        aiConversationIdStore.set(response.conversationId);

        // Reset page and re-fetch conversations to include the new one, with current filters
        setConversationListPage(1);
        await fetchConversations(1, searchQuery, selectedRequestType);
      }

      if (response.modelResponse) {
        const modelHistoryItem: ConversationHistoryItem = {
          ...response.modelResponse,
          id: uuidv4(),
        };
        setChatHistory((prev) => [...prev, modelHistoryItem]);
      } else {
        console.warn('API response missing modelResponse:', response);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      showToast(`Error sending message: ${err.message || 'Failed to send message.'}`, 'error');

      setChatHistory((prev) => prev.filter((msg) => msg !== userMessage));

      setNewMessage(trimmedMessage);
      setSelectedFiles(selectedFiles);
    } finally {
      setIsSendingMessage(false);
      textareaRef.current?.focus();
    }
  }, [
    newMessage,
    selectedFiles,
    activeConversationId,
    isSendingMessage,
    showToast,
    fetchConversations,
    systemInstructions,
    searchQuery, // Add searchQuery dependency
    selectedRequestType, // Add selectedRequestType dependency
  ]);

  const handleNewChat = useCallback(async () => {
    setNewMessage('');
    setSelectedFiles([]);
    setChatHistory([]);
    setConversationListPage(1);
    setConversationListTotalPages(1);
    showChatConversationList.set(false); // NEW: Update Nanostore
    if (fileInputRef.current) fileInputRef.current.value = '';
    textareaRef.current?.focus();

    const currentSystemInstructions = PERSONAS[$persona] || SYSTEM_INSTRUCTIONS_REACT_EXPERT;
    setSystemInstructions(currentSystemInstructions);

    // Generate a new temporary ID for the new conversation
    const newConvoId = uuidv4();
    setActiveConversationId(newConvoId);
    aiConversationIdStore.set(newConvoId);

    setIsSendingMessage(true);
    try {
      const initialPrompt = 'Hello! Please introduce yourself and your capabilities.';

      const payload: ApiChatRequestPayload = {
        conversationId: newConvoId,
        prompt: initialPrompt,
        systemInstruction: currentSystemInstructions,
        // The `requestType` for initial prompt will likely be TEXT_ONLY
      };

      const response = await apiService.conversation.sendMessage(payload);

      if (response.modelResponse) {
        const initialModelHistoryItem: ConversationHistoryItem = {
          ...response.modelResponse,
          id: uuidv4(),
        };
        setChatHistory([initialModelHistoryItem]);
      } else {
        console.warn('Initial API response missing modelResponse:', response);
      }

      // Re-fetch conversations to include the new one, with current filters
      await fetchConversations(1, searchQuery, selectedRequestType);
    } catch (err: any) {
      console.error('Error sending initial message:', err);
      showToast(
        `Error starting new chat: ${err.message || 'Failed to get initial greeting.'}`,
        'error',
      );

      setActiveConversationId(null);
      aiConversationIdStore.set(null);
      setChatHistory([]);
    } finally {
      setIsSendingMessage(false);
    }
  }, [
    $persona,
    showToast,
    fetchConversations,
    searchQuery, // Add searchQuery dependency
    selectedRequestType, // Add selectedRequestType dependency
  ]);

  // NEW: Effect to listen for new chat events from the store
  useEffect(() => {
    if ($newChatEvent > 0) {
      // Only trigger if event count is greater than 0
      handleNewChat();
    }
  }, [$newChatEvent, handleNewChat]); // Dependency on the new chat event atom

  const handleSelectConversation = useCallback((convId: string) => {
    setActiveConversationId(convId);
    aiConversationIdStore.set(convId);
    showChatConversationList.set(false); // NEW: Update Nanostore
    setNewMessage('');
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    textareaRef.current?.focus();
  }, []);

  const handleSelectedPersona = useCallback(
    (personaName: string, sysInstruct: string) => {
      console.log(sysInstruct, 'sysInstruct');

      persona.set(personaName);

      handleNewChat();
    },
    [handleNewChat],
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      const newFiles: SelectedFileType[] = [];
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          showToast(
            `File '${file.name}' exceeds ${MAX_FILE_SIZE_MB}MB limit and will be skipped.`,
            'warning',
          );
          continue;
        }

        try {
          const { base64, mimeType } = await readFileAsDataURL(file);
          newFiles.push({ file, base64, mimeType });
        } catch (error: any) {
          showToast(`Could not read file '${file.name}': ${error.message}`, 'error');
        }
      }

      if (newFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [showToast, readFileAsDataURL],
  );

  const handleRemoveFile = useCallback((indexToRemove: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  const handleDeleteConversation = useCallback(async () => {
    if (!activeConversationId) {
      showToast('No active conversation to delete.', 'warning');
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to delete this conversation? This action cannot be undone.',
      )
    ) {
      return;
    }

    try {
      await apiService.conversation.delete(activeConversationId);
      showToast('Conversation deleted successfully.', 'success');
      handleNewChat(); // Start a new chat after deletion

      // Re-fetch conversations list after deletion, with current filters
      setConversationListPage(1);
      await fetchConversations(1, searchQuery, selectedRequestType);
    } catch (err: any) {
      console.error('Error deleting conversation:', err);
      showToast(
        `Error deleting conversation: ${err.message || 'Failed to delete conversation.'}`,
        'error',
      );
    }
  }, [
    activeConversationId,
    showToast,
    handleNewChat,
    fetchConversations,
    searchQuery, // Add searchQuery dependency
    selectedRequestType, // Add selectedRequestType dependency
  ]);

  useEffect(() => {
    const storedConvoId = aiConversationIdStore.get();
    if (storedConvoId) {
      setActiveConversationId(storedConvoId);
    } else {
      setActiveConversationId(null);
      setChatHistory([]);
    }

    setSystemInstructions(PERSONAS[$persona] || SYSTEM_INSTRUCTIONS_REACT_EXPERT);
  }, [$persona]);

  // NEW: Handler for search query change
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setConversationListPage(1); // Reset to first page when search query changes
  }, []);

  // NEW: Handler for request type filter change
  const handleRequestTypeFilterChange = useCallback((type: RequestType | null) => {
    setSelectedRequestType(type);
    setConversationListPage(1); // Reset to first page when filter changes
  }, []);

  if (!$visible) return null;

  return (
    <aside className="ai-chat-wrapper h-full w-full bg-dark overflow-hidden flex flex-col relative">
      {/* REMOVED: ChatHeader component */}

      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence>
          {$showConversationList && ( // NEW: Use $showConversationList from the store
            <ConversationListView
              key="conversation-list-view"
              conversations={conversations}
              loadingConversations={loadingConversations}
              onSelectConversation={handleSelectConversation}
              currentPage={conversationListPage}
              totalPages={conversationListTotalPages}
              onPageChange={handleConversationPageChange}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              selectedRequestType={selectedRequestType} // NEW: Pass selected request type
              onFilterChange={handleRequestTypeFilterChange} // NEW: Pass filter handler
            />
          )}
        </AnimatePresence>

        <div
          className="flex-1 flex flex-col min-w-0"
          onClick={() => showChatConversationList.set(false)} // NEW: Update Nanostore on click outside conversation list
        >
          <ChatMessages
            chatHistory={chatHistory}
            isSendingMessage={isSendingMessage}
            loadingHistory={loadingHistory}
            chatMessagesEndRef={chatMessagesEndRef}
          />
          <ChatInput
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            selectedFiles={selectedFiles}
            isSendingMessage={isSendingMessage}
            onSendMessage={handleSendMessage}
            onFileChange={handleFileChange}
            onRemoveFile={handleRemoveFile}
            onKeyDown={handleKeyDown}
            fileInputRef={fileInputRef}
            textareaRef={textareaRef}
            activeConversationId={activeConversationId}
            onSelectPersona={handleSelectedPersona}
            systemInstructions={systemInstructions}
          />
        </div>
      </div>
    </aside>
  );
}
