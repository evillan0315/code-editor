// src/components/chat/ConversationListView.tsx
import React, { memo } from "react";
import { motion } from "framer-motion"; // Import motion from framer-motion
import { Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react"; // Import Chevron icons
import type { ConversationSummary } from "@/types/chat"; // Assuming from '@/types/chat'

interface ConversationListViewProps {
  conversations: ConversationSummary[];
  loadingConversations: boolean;
  onSelectConversation: (conversationId: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  earchQuery: string;
  onSearchChange: (query: string) => void;
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
  } = props;

  // Define Framer Motion variants for the slide animation
  const listVariants = {
    hidden: {
      width: 0,
      opacity: 0,
      transition: { duration: 0.25, ease: "easeOut" },
    },
    // Use a responsive width, e.g., min(350px, 40vw) or adjust as needed for your IDE layout
    visible: {
      width: "min(350px, 40vw)",
      opacity: 1,
      transition: { duration: 0.25, ease: "easeIn" },
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

  return (
    // Use motion.div and apply the variants
    // Remove flex-1 and max-w-[60%] from here, as 'width' is now controlled by Framer Motion.
    // The parent flex container will handle the remaining space.
    <motion.div
      className="overflow-hidden bg-dark border-r flex flex-col" // Changed overflow-y-auto to overflow-hidden, inner div will scroll
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={listVariants}
    >
      <div className="p-2 border-b ">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 " />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 rounded-md border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 py-2">
        {" "}
        {/* This inner div will take available vertical space and handle its own scroll */}
        {loadingConversations ? (
          <p className="text-xs flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading
            conversations...
          </p>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-center py-4">
            No conversations found. Start a new one!
          </p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.conversationId}
              className="border-b hover:bg-zinc-100 dark:hover:bg-zinc-700 text-base transition cursor-pointer shadow-lg p-2 mx-2 rounded-md" // Added mx-2 and rounded-md for better spacing
              onClick={() => onSelectConversation(conv.conversationId)}
            >
              <div className="flex flex-col">
                {" "}
                {/* Changed to flex-col for better stacking of text */}
                <div className="text-xs  truncate mb-1">
                  {new Date(conv.lastUpdatedAt).toLocaleString()}
                </div>
                <div className="text-sm  font-medium line-clamp-2">
                  {conv.lastPrompt || "Untitled Chat"}
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

ConversationListView.displayName = "ConversationListView";
export default ConversationListView;
