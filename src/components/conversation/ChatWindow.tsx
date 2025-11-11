import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  useMessages,
  useMessagesRealtime,
  useConversationRealtime,
  useSendTextMessage,
  useSendFileMessage,
  useSendLocationMessage,
  useTypingIndicator,
  useMarkMessagesAsRead,
  useConversation,
  useSearchMessages,
  useEditMessage,
  useReactionsRealtime
} from '../../hooks/useChat';
import { useStartCall } from '../../hooks/useStartCall';
import ChatHeader from './ChatHeader';
import { useParams } from 'react-router';
import ChatFooter from '../ChatWindow/ChatFooter';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ImagePreview } from './ImagePreview';
import { LocationPicker } from './LocationPicker';
import { twMerge } from 'tailwind-merge';
import { PinnedMessage, getPinnedMessages, pinMessage, subscribePinnedMessages, unpinMessage } from '@/services/chatService';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  userId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ userId }) => {
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [messageText, setMessageText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [imageToSend, setImageToSend] = useState<File | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

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
    useMessages(conversationId, userId);
  const sendTextMutation = useSendTextMessage();
  const sendFileMutation = useSendFileMessage();
  const sendLocationMutation = useSendLocationMessage();
  const editMessageMutation = useEditMessage();
  const markAsReadMutation = useMarkMessagesAsRead();
  const startCallMutation = useStartCall();
  const { typingUsers, sendTyping } = useTypingIndicator(
    conversationId,
    userId
  );
  const { data: searchData } = useSearchMessages(
    conversationId,
    debouncedSearchQuery
  );

  // Pinned messages state
  const [pinned, setPinned] = useState<PinnedMessage[]>([]);
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const pins = await getPinnedMessages(conversationId);
        if (isMounted) setPinned(pins);
      } catch (e) {
        console.warn('Load pinned messages failed:', e);
      }
    })();
    const unsubscribe = subscribePinnedMessages(conversationId, async () => {
      const pins = await getPinnedMessages(conversationId);
      setPinned(pins);
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [conversationId]);

  useMessagesRealtime(conversationId, userId);
  useConversationRealtime(conversationId); // ⭐ Subscribe to conversation updates (background, etc.)
  useReactionsRealtime(conversationId); // ⭐ Subscribe to reactions updates

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
    }, 500);

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

  // ✅ 5. Handle typing indicator
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessageText(newValue);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (newValue.length === 0 || newValue.trim().length === 0) {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTyping(false);
        console.log('🛑 OFF');
      }
      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(true);
      console.log('▶️ ON');
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendTyping(false);
        console.log('⏱️ OFF');
      }
    }, 5000);
  }, [sendTyping]);

  const handleSendMessage = useCallback(async () => {
    setMessageText('');

    if (!messageText.trim()) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTyping(false);
      console.log('📤 OFF: Sending');
    }

    try {
      // Check if we're editing a message
      if (isEditing && editingMessageId) {
        await editMessageMutation.mutateAsync({
          messageId: editingMessageId,
          content: messageText.trim()
        });
        
        setIsEditing(false);
        setEditingMessageId(null);
      } else {
        // Send new message
        // Resolve @all -> all participant IDs (except current user)
        const resolvedMentionedIds = (() => {
          if (!mentionedUserIds || mentionedUserIds.length === 0) return undefined;
          const hasAll = mentionedUserIds.includes('ALL');
          let ids = hasAll
            ? (conversation?.participants || []).map((p) => p.user_id).filter((id) => id !== userId)
            : mentionedUserIds;
          // unique
          ids = Array.from(new Set(ids));
          return ids.length ? ids : undefined;
        })();
        await sendTextMutation.mutateAsync({
          conversationId,
          senderId: userId,
          content: messageText.trim(),
          replyToId: replyTo || undefined,
          mentionedUserIds: resolvedMentionedIds
        });
        
        setReplyTo(null);
        setMentionedUserIds([]);
      }
      
      inputRef.current?.focus();
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }, [messageText, conversationId, userId, replyTo, isEditing, editingMessageId, sendTextMutation, editMessageMutation, sendTyping]);

  const handleEditMessage = useCallback((messageId: string, content: string) => {
    setIsEditing(true);
    setEditingMessageId(messageId);
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

    if (type === 'image') {
      setImageToSend(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

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

    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [conversationId, userId, sendFileMutation]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessageText((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  const handleSendImage = useCallback(async () => {
    if (!imageToSend) return;
    try {
      await sendFileMutation.mutateAsync({
        conversationId,
        senderId: userId,
        file: imageToSend,
        type: 'image'
      });
      console.log('✅ Image sent successfully');
      setImageToSend(null);
    } catch (error) {
      console.error('❌ Error sending image:', error);
    }
  }, [imageToSend, conversationId, userId, sendFileMutation]);

  const handleCancelImage = useCallback(() => {
    setImageToSend(null);
  }, []);

  // Pin / Unpin handlers
  const handlePin = useCallback(async (messageId: string) => {
    // Optimistic update
    setPinned((prev) => {
      if (prev.some((p) => p.message_id === messageId)) return prev;
      if (prev.length >= 3) {
        toast.error('Tối đa 3 tin nhắn được ghim');
        return prev;
      }
      const target = messages.find((m) => m.id === messageId);
      const optimistic: PinnedMessage = {
        id: `optimistic-${messageId}`,
        conversation_id: conversationId,
        message_id: messageId,
        pinned_by: userId,
        created_at: new Date().toISOString(),
        message: target
          ? {
              id: target.id,
              content_text: target.content_text || '',
              created_at: target.created_at,
              type: target.type,
              sender: target.sender as any
            }
          : undefined
      };
      return [optimistic, ...prev].slice(0, 3);
    });

    try {
      await pinMessage(conversationId, messageId, userId);
      toast.success('Đã ghim tin nhắn');
    } catch (e: any) {
      // rollback
      setPinned((prev) => prev.filter((p) => p.message_id !== messageId && !p.id.startsWith('optimistic-')));
      const msg = e?.message || String(e);
      toast.error(msg.includes('Maximum 3') ? 'Tối đa 3 tin nhắn được ghim' : 'Không thể ghim tin nhắn');
    }
  }, [conversationId, userId, messages]);

  const handleUnpin = useCallback(async (messageId: string) => {
    // Optimistic update
    setPinned((prev) => prev.filter((p) => p.message_id !== messageId));
    try {
      await unpinMessage(conversationId, messageId);
      toast.success('Đã bỏ ghim');
    } catch (e) {
      // In case of failure, refetch server state
      const pins = await getPinnedMessages(conversationId);
      setPinned(pins);
      toast.error('Không thể bỏ ghim');
    }
  }, [conversationId]);

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

      const queryChanged = query !== searchQuery;
      if (queryChanged) {
        setSearchQuery(query);
        setCurrentSearchIndex(0);
        return;
      }

      if (searchResults.length === 0) return;

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

      const messageId = searchResults[newIndex];
      const isLoaded = messages.some((msg) => msg.id === messageId);

      if (isLoaded) {
        const messageElement = messageRefs.current[messageId];
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        console.log('Message not loaded, fetching older messages...');
        const targetMessage = searchData?.find((msg) => msg.id === messageId);
        if (targetMessage) {
          let attempts = 0;
          const maxAttempts = 10;
          while (!messages.some((msg) => msg.id === messageId) && attempts < maxAttempts && hasNextPage) {
            await fetchNextPage();
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 100));
          }
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

  const handleLocationClick = useCallback(() => {
    setShowLocationPicker(true);
  }, []);

  const handleCall = useCallback(async (userId: string, isVideo: boolean) => {
    try {
      await startCallMutation.mutateAsync({
        userId,
        isVideoEnabled: isVideo
      });
    } catch (error) {
      console.error('Error starting call:', error);
    }
  }, [startCallMutation]);

  const handleLocationSelect = useCallback(async (location: { 
    latitude: number; 
    longitude: number; 
    address: string;
    displayMode: 'interactive' | 'static';
  }) => {
    try {
      await sendLocationMutation.mutateAsync({
        conversationId,
        senderId: userId,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        displayMode: location.displayMode
      });
      console.log('✅ Location sent successfully');
    } catch (error) {
      console.error('❌ Error sending location:', error);
    }
  }, [conversationId, userId, sendLocationMutation]);

  const otherParticipant = conversation?.participants.find(
    (p) => p.user_id !== userId
  );

  // Get background styling from conversation
  const getBackgroundStyle = () => {
    if (!conversation) return {};
    
    const { background_type, background_value } = conversation;
    
    if (background_type === 'color') {
      return { backgroundColor: background_value };
    } else if (background_type === 'gradient') {
      return { background: background_value };
    } else if (background_type === 'image') {
      return {
        backgroundImage: `url(${background_value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    
    return {};
  };

  return (
    <div
      className="
        flex flex-col h-screen justify-between
        bg-white text-gray-900
        dark:bg-[#313338] dark:text-[#F2F3F5]
      "
    >
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
        conversation={conversation}
        currentUserId={userId}
        onCall={handleCall}
        pinned={pinned}
        onUnpin={handleUnpin}
        onJumpTo={(messageId) => {
          const el = messageRefs.current[messageId];
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          else {
            // best effort: try to fetch older pages then scroll (simplified)
            console.log('Pinned message not loaded yet');
          }
        }}
      />

      <div
        ref={listRef}
        className="
          h-[calc(100%-122px)] overflow-y-auto p-4 space-y-2
          discord-scroll
        "
        style={getBackgroundStyle()}
      >
        {/* Load older */}
        {hasNextPage && (
          <div className="text-center pb-2">
            <button
              onClick={handleLoadOlder}
              disabled={isFetchingNextPage}
              className="
                inline-flex items-center gap-2
                text-xs px-3 py-1.5 rounded-full
                bg-gray-100 text-gray-700 hover:bg-gray-200
                dark:bg-[#1E1F22] dark:text-[#F2F3F5] dark:hover:bg-white/5
                disabled:opacity-50 transition
                ring-1 ring-transparent hover:ring-[#5865F2]/40
              "
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
              className={twMerge(
                "transition-all rounded-lg",
                isHighlighted
                  ? "ring-2 ring-[#5865F2]/40 bg-gray-100 dark:bg-white/5"
                  : ""
              )}
            >
              <MessageBubble
                message={message}
                isOwn={message.sender_id === userId}
                showAvatar={showAvatar}
                showTimestamp={showTimestamp}
                onReply={() => setReplyTo(message.id)}
                onEdit={(content) => handleEditMessage(message.id, content)}
                currentUserId={userId}
                isPinned={pinned.some((p) => p.message_id === message.id)}
                onPin={() => handlePin(message.id)}
                onUnpin={() => handleUnpin(message.id)}
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
        <div
          className="
            px-4 py-2 flex items-center justify-between
            bg-gray-50 border-t border-gray-200 text-gray-700
            dark:bg-[#2B2D31] dark:border-[#3F4246] dark:text-[#B5BAC1]
          "
        >
          <div className="flex-1">
            <p className="text-sm">
              Đang trả lời:{' '}
              {messages.find((m) => m.id === replyTo)?.content_text}
            </p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="
              text-[#5865F2] hover:opacity-80
              dark:text-[#5865F2]
            "
            aria-label="Đóng"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      {/* Edit indicator */}
      {isEditing && (
        <div
          className="
            px-4 py-2 flex items-center justify-between
            bg-gray-50 border-t border-gray-200 text-gray-700
            dark:bg-[#2B2D31] dark:border-[#3F4246] dark:text-[#B5BAC1]
          "
        >
          <p className="text-sm">Đang chỉnh sửa tin nhắn</p>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditingMessageId(null);
              setMessageText('');
            }}
            className="text-[#5865F2] hover:opacity-80 dark:text-[#5865F2]"
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
        handleLocationClick={handleLocationClick}
        sendFileMutation={sendFileMutation}
        sendTextMutation={sendTextMutation}
        participants={
          conversation?.participants?.map((p) => ({
            id: p.user_id,
            name: p.profile.display_name,
            avatar_url: p.profile.avatar_url
          })) || []
        }
        onMentionSelected={(userId) => {
          setMentionedUserIds((prev) =>
            prev.includes(userId) ? prev : [...prev, userId]
          );
        }}
      />

      {/* Image Preview Modal */}
      {imageToSend && (
        <ImagePreview
          file={imageToSend}
          onSend={handleSendImage}
          onCancel={handleCancelImage}
          isSending={sendFileMutation.isPending}
        />
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
};

export default ChatWindow;
