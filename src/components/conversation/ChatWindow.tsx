import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  useMessages,
  useMessagesRealtime,
  useSendTextMessage,
  useSendFileMessage,
  useTypingIndicator,
  useMarkMessagesAsRead,
  useConversation,
  useSearchMessages
} from '../../hooks/useChat';
import ChatHeader from './ChatHeader';
import { useParams } from 'react-router';
import ChatFooter from '../ChatWindow/ChatFooter';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface ChatWindowProps {
  userId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ userId }) => {
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [messageText, setMessageText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const prevScrollTopRef = useRef<number>(0);
  const isFirstLoadRef = useRef(true);
  const isTypingRef = useRef(false);

  const { data: conversation } = useConversation(conversationId);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessages(conversationId);
  const sendTextMutation = useSendTextMessage();
  const sendFileMutation = useSendFileMessage();
  const markAsReadMutation = useMarkMessagesAsRead();
  const { typingUsers, sendTyping } = useTypingIndicator(
    conversationId,
    userId
  );
  const { data: searchData } = useSearchMessages(
    conversationId,
    debouncedSearchQuery
  );

  useMessagesRealtime(conversationId, userId);

  // Reset typing state khi chuyển conversation
  useEffect(() => {
    isTypingRef.current = false;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [conversationId]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Flatten & sort messages
  const flatPages = data?.pages.flat() ?? [];
  const messages = useMemo(() => {
    const arr = [...flatPages];
    arr.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return arr;
  }, [flatPages]);

  // ✅ 1. Scroll xuống cuối khi LẦN ĐẦU vào conversation
  useEffect(() => {
    if (messages.length > 0 && isFirstLoadRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
        isFirstLoadRef.current = false;
      }, 100);
    }
  }, [messages.length]);

  // ✅ 2. Auto-scroll xuống khi có message mới VÀ user đang ở cuối (<=80px)
  const isNearBottom = () => {
    if (!listRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    return scrollHeight - (scrollTop + clientHeight) <= 80;
  };

  useEffect(() => {
    if (!isFetchingNextPage && !isFirstLoadRef.current && isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isFetchingNextPage]);

  // ✅ Auto-scroll khi có typing indicator xuất hiện lần đầu
  const prevTypingLengthRef = useRef(0);
  
  useEffect(() => {
    // Chỉ scroll khi typing indicator MỚI XUẤT HIỆN (từ 0 -> 1+)
    if (typingUsers.length > 0 && prevTypingLengthRef.current === 0 && isNearBottom()) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    prevTypingLengthRef.current = typingUsers.length;
  }, [typingUsers.length]);

  // ✅ 3. KHÔNG scroll khi load tin nhắn cũ - preserve scroll position
  const handleLoadOlder = async () => {
    if (listRef.current) {
      prevScrollHeightRef.current = listRef.current.scrollHeight;
      prevScrollTopRef.current = listRef.current.scrollTop;
    }
    await fetchNextPage();
  };

  useEffect(() => {
    if (!listRef.current || !prevScrollHeightRef.current) return;
    if (!isFetchingNextPage && prevScrollHeightRef.current > 0) {
      const newScrollHeight = listRef.current.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      listRef.current.scrollTop = prevScrollTopRef.current + diff;
      prevScrollHeightRef.current = 0;
      prevScrollTopRef.current = 0;
    }
  }, [data, isFetchingNextPage]);

  // ✅ Mark messages as read - DEBOUNCED
  useEffect(() => {
    if (!messages.length) return;

    const timer = setTimeout(() => {
      const unreadMessageIds = messages
        .filter((msg) => {
          if (msg.sender_id === userId) return false;
          const hasRead = msg.read_receipts?.some((r) => r.user_id === userId);
          return !hasRead;
        })
        .map((msg) => msg.id);

      if (unreadMessageIds.length > 0) {
        markAsReadMutation.mutate({
          conversationId,
          userId,
          messageIds: unreadMessageIds
        });
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [messages.length, conversationId, userId]);

  // Clear typing on unmount hoặc conversation change
  useEffect(
    () => () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTyping(false);
        console.log('🧹 OFF: Cleanup');
      }
    },
    [conversationId, sendTyping]
  );

  // ✅ 5. Handle typing indicator - OPTIMIZED & DEBUGGED
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessageText(newValue);

    // LUÔN clear timeout cũ trước
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // CASE 1: Input rỗng hoàn toàn
    if (newValue.length === 0) {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTyping(false);
        console.log('🛑 OFF: Empty');
      }
      return;
    }

    // CASE 2: Chỉ khoảng trắng
    if (newValue.trim().length === 0) {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTyping(false);
        console.log('🛑 OFF: Whitespace');
      }
      return;
    }

    // CASE 3: Có nội dung
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(true);
      console.log('▶️ ON: First char');
    }

    // Set timeout 5s
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTyping(false);
        console.log('⏱️ OFF: Timeout');
      }
    }, 5000);
  }, [sendTyping]);

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim()) return;

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Tắt typing
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTyping(false);
      console.log('📤 OFF: Sending');
    }

    try {
      await sendTextMutation.mutateAsync({
        conversationId,
        senderId: userId,
        content: messageText.trim(),
        replyToId: replyTo || undefined
      });

      setMessageText('');
      setReplyTo(null);
      inputRef.current?.focus();
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }, [messageText, conversationId, userId, replyTo, sendTextMutation, sendTyping]);

  // ✅ 5. Handle edit message - FOCUS & FILL INPUT
  const handleEditMessage = useCallback((_messageId: string, content: string) => {
    setIsEditing(true);
    setMessageText(content);
    inputRef.current?.focus();
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let type: 'image' | 'video' | 'file' | 'audio' = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/') || file.name.endsWith('.webm')) type = 'audio';

    console.log('📁 File selected:', { name: file.name, type: file.type, detectedType: type });

    try {
      await sendFileMutation.mutateAsync({
        conversationId,
        senderId: userId,
        file,
        type
      });
      console.log('✅ File sent successfully');
    } catch (error) {
      console.error('❌ Error sending file:', error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [conversationId, userId, sendFileMutation]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // ✅ 6. Handle emoji select
  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessageText((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  // ✅ 7. Search functionality - Using API search
  const searchResults = useMemo(() => {
    return searchData?.map((msg) => msg.id) || [];
  }, [searchData]);

  const handleSearch = useCallback(
    async (query: string, direction: 'next' | 'prev') => {
      if (!query.trim()) {
        setSearchQuery('');
        setCurrentSearchIndex(0);
        return;
      }

      // Check if query changed
      const queryChanged = query !== searchQuery;

      if (queryChanged) {
        setSearchQuery(query);
        setCurrentSearchIndex(0);
        // Wait for search data to load, then scroll to first result
        return;
      }

      if (searchResults.length === 0) {
        return;
      }

      // Navigate through results
      let newIndex = currentSearchIndex;
      if (direction === 'next') {
        newIndex =
          currentSearchIndex < searchResults.length - 1
            ? currentSearchIndex + 1
            : 0;
      } else {
        newIndex =
          currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
      }

      setCurrentSearchIndex(newIndex);

      // Get the message ID
      const messageId = searchResults[newIndex];

      // Check if message is loaded
      const isLoaded = messages.some((msg) => msg.id === messageId);

      if (isLoaded) {
        // Message is loaded, just scroll to it
        const messageElement = messageRefs.current[messageId];
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        // Message not loaded yet, need to fetch older messages
        console.log('Message not loaded, fetching older messages...');
        
        // Find the timestamp of the target message from searchData
        const targetMessage = searchData?.find((msg) => msg.id === messageId);
        
        if (targetMessage) {
          // Keep fetching until we find the message or run out of pages
          let attempts = 0;
          const maxAttempts = 10;
          
          while (!messages.some((msg) => msg.id === messageId) && attempts < maxAttempts && hasNextPage) {
            await fetchNextPage();
            attempts++;
            
            // Small delay to let React update
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Try to scroll again after loading
          setTimeout(() => {
            const messageElement = messageRefs.current[messageId];
            if (messageElement) {
              messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 200);
        }
      }
    },
    [searchQuery, searchResults, currentSearchIndex, messages, searchData, hasNextPage, fetchNextPage]
  );

  // Auto-scroll to first search result when search data changes
  useEffect(() => {
    if (searchResults.length > 0 && searchQuery && currentSearchIndex === 0) {
      const messageId = searchResults[0];
      const messageElement = messageRefs.current[messageId];
      
      if (messageElement) {
        setTimeout(() => {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [searchResults, searchQuery, currentSearchIndex]);

  const handleCloseSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setCurrentSearchIndex(0);
  }, []);

  const otherParticipant = conversation?.participants.find(
    (p) => p.user_id !== userId
  );

  return (
    <div className="flex flex-col h-screen justify-between">
      <ChatHeader
        otherParticipant={otherParticipant}
        typingUsers={typingUsers}
        onSearch={handleSearch}
        searchResults={
          searchResults.length > 0
            ? { current: currentSearchIndex + 1, total: searchResults.length }
            : undefined
        }
        onCloseSearch={handleCloseSearch}
      />

      <div
        ref={listRef}
        className="h-[calc(100%-122px)] overflow-y-auto p-4 space-y-2"
      >
        {/* ✅ 4. Load button - 50 messages at a time */}
        {hasNextPage && (
          <div className="text-center pb-4">
            <button
              onClick={handleLoadOlder}
              disabled={isFetchingNextPage}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {isFetchingNextPage ? 'Đang tải...' : 'Tải tin nhắn cũ hơn'}
            </button>
          </div>
        )}

        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const showAvatar =
            !prevMessage || prevMessage.sender_id !== message.sender_id;
          const showTimestamp =
            !prevMessage ||
            new Date(message.created_at).getTime() -
              new Date(prevMessage.created_at).getTime() >
              5 * 60 * 1000;

          const isHighlighted =
            searchResults.length > 0 &&
            searchResults[currentSearchIndex] === message.id;

          return (
            <div
              key={message.id}
              ref={(el) => {
                messageRefs.current[message.id] = el;
              }}
              className={`transition-all ${
                isHighlighted
                  ? 'bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2 '
                  : ''
              }`}
            >
              <MessageBubble
                message={message}
                isOwn={message.sender_id === userId}
                showAvatar={showAvatar}
                showTimestamp={showTimestamp}
                onReply={() => setReplyTo(message.id)}
                onEdit={(content) => handleEditMessage(message.id, content)}
                currentUserId={userId}
              />
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator
            userName={otherParticipant?.profile?.display_name}
            avatarUrl={otherParticipant?.profile?.avatar_url}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Đang trả lời:{' '}
              {messages.find((m) => m.id === replyTo)?.content_text}
            </p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Edit indicator */}
      {isEditing && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800 flex items-center justify-between">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Đang chỉnh sửa tin nhắn
          </p>
          <button
            onClick={() => {
              setIsEditing(false);
              setMessageText('');
            }}
            className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
          >
            Hủy
          </button>
        </div>
      )}

      <ChatFooter
        fileInputRef={fileInputRef}
        inputRef={inputRef}
        messageText={messageText}
        handleInputChange={handleInputChange}
        handleKeyPress={handleKeyPress}
        handleSendMessage={handleSendMessage}
        handleFileSelect={handleFileSelect}
        handleEmojiSelect={handleEmojiSelect}
        sendFileMutation={sendFileMutation}
        sendTextMutation={sendTextMutation}
      />
    </div>
  );
};

export default ChatWindow;
