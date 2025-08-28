// src/components/chat/ConversationListView.tsx
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { RequestType, type ConversationSummary } from '@/types/chat'; // Import RequestType and ConversationSummary

interface ConversationListViewProps {
  conversations: ConversationSummary[];
  loadingConversations: boolean;
  onSelectConversation: (conversationId: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchQuery: string; // Corrected typo from 'earchQuery' to 'searchQuery'
  onSearchChange: (query: string) => void;
  selectedRequestType: RequestType | null; // New prop for selected filter
  onFilterChange: (type: RequestType | null) => void; // New prop for filter change handler
}

const ConversationListView = memo((props: ConversationListViewProps) => {
  const {
    conversations,
    loadingConversations,
    onSelectConversation,
    currentPage,
    totalPages,
    onPageChange,
    searchQuery,
    onSearchChange,
    selectedRequestType, // Destructure new prop
    onFilterChange, // Destructure new prop
  } = props;

  // Define Framer Motion variants for the slide animation
  const listVariants = {
    hidden: {
      width: 0,
      opacity: 0,
      transition: { duration: 0.25, ease: 'easeOut' },
    },
    visible: {
      width: 'min(350px, 40vw)', // Use a responsive width
      opacity: 1,
      transition: { duration: 0.25, ease: 'easeIn' },
    },
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleRequestTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value;
    onFilterChange(value === '' ? null : (value as RequestType));
  };

  // Helper function to format RequestType for display
  const formatRequestType = (type: RequestType | null | undefined): string => {
    if (!type) return 'N/A';
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <motion.div
      className="overflow-hidden bg-dark border-r flex flex-col"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={listVariants}
    >
      <div className="p-2 border-b border-zinc-700 space-y-2">
        {' '}
        {/* Added space-y-2 for gap */}
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 rounded-md border border-zinc-600 bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder-zinc-400 text-sm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {/* Request Type Filter Dropdown */}
        <div className="relative">
          <select
            className="w-full pl-3 pr-8 py-2 rounded-md border border-zinc-600 bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-primary text-foreground text-sm appearance-none cursor-pointer"
            value={selectedRequestType || ''}
            onChange={handleRequestTypeChange}
          >
            <option value="">All Request Types</option>
            {Object.values(RequestType).map((type) => (
              <option key={type} value={type}>
                {formatRequestType(type)}
              </option>
            ))}
          </select>
          {/* Custom chevron for select dropdown */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 py-2">
        {loadingConversations ? (
          <p className="text-xs flex items-center justify-center py-4 text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading
            conversations...
          </p>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-center py-4 text-zinc-400">
            No conversations found. Start a new one!
          </p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.conversationId}
              className="border-b border-zinc-700 last:border-b-0 hover:bg-zinc-700 text-base transition cursor-pointer shadow-lg p-2 mx-2 rounded-md"
              onClick={() => onSelectConversation(conv.conversationId)}
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-zinc-400 truncate">
                    {new Date(conv.lastUpdatedAt).toLocaleString()}
                  </div>
                  {conv.firstRequestType && (
                    <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary-foreground text-[10px] rounded-full whitespace-nowrap">
                      {formatRequestType(conv.firstRequestType)}
                    </span>
                  )}
                </div>
                <div className="text-sm text-zinc-200 font-medium line-clamp-2">
                  {conv.lastPrompt || 'Untitled Chat'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!loadingConversations && totalPages > 1 && (
        <div className="flex justify-between items-center p-2 border-t border-zinc-700 bg-dark sticky bottom-0">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="p-1 rounded-md text-zinc-400 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs text-zinc-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="p-1 rounded-md text-zinc-400 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </motion.div>
  );
});

ConversationListView.displayName = 'ConversationListView';
export default ConversationListView;
