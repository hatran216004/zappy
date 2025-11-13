import { useState, useRef, useEffect, useMemo } from 'react';
import {
  useThreadMessages,
  useSendThreadMessage,
  useThreadMessagesRealtime,
  useThreadReactionsRealtime,
  useThreadReadReceiptsRealtime,
  useMarkThreadMessagesAsRead
} from '@/hooks/useChat';
import { MessageBubble } from '../conversation/MessageBubble';
import ChatFooter from '../ChatWindow/ChatFooter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ThreadWithDetails } from '@/services/chatService';
import { twMerge } from 'tailwind-merge';

interface ThreadViewProps {
  thread: ThreadWithDetails;
  conversationId: string;
  currentUserId: string;
  onBack: () => void;
  isChatRestricted?: boolean;
}

export function ThreadView({
  thread,
  conversationId,
  currentUserId,
  onBack
}: ThreadViewProps) {
  const [messageText, setMessageText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useThreadMessages(thread.id, currentUserId);

  const sendMessageMutation = useSendThreadMessage();
  const markAsReadMutation = useMarkThreadMessagesAsRead();

  // Subscribe to real-time thread messages updates
  useThreadMessagesRealtime(thread.id, currentUserId);

  // Subscribe to real-time thread reactions updates
  useThreadReactionsRealtime(thread.id);

  // Subscribe to real-time thread read receipts updates
  useThreadReadReceiptsRealtime(thread.id);

  // Flatten & sort messages
  const messages = useMemo(() => {
    const flatPages = data?.pages.flat() ?? [];
    const arr = [...flatPages];
    arr.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return arr;
  }, [data?.pages]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // ✅ Mark thread messages as read - DEBOUNCED
  useEffect(() => {
    if (!messages.length) return;

    const timer = setTimeout(() => {
      const unreadMessageIds = messages
        .filter((msg) => {
          if (msg.sender_id === currentUserId) return false;
          const hasRead = msg.read_receipts?.some(
            (r) => r.user_id === currentUserId
          );
          return !hasRead;
        })
        .map((msg) => msg.id);

      if (unreadMessageIds.length > 0) {
        markAsReadMutation.mutate({
          threadId: thread.id,
          userId: currentUserId,
          messageIds: unreadMessageIds
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [messages.length, thread.id, currentUserId]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || thread.is_closed) return;

    // Clear input immediately (optimistic UI)
    const content = messageText.trim();
    const replyToId = replyTo;
    setMessageText('');
    setReplyTo(null);

    try {
      await sendMessageMutation.mutateAsync({
        threadId: thread.id,
        conversationId,
        senderId: currentUserId,
        content,
        replyToId: replyToId || undefined
      });
    } catch {
      // Error handled by hook
      // Restore input on error (optional - user might want to retry)
      // setMessageText(content);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white dark:bg-gray-900">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{thread.title}</h3>
          {thread.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {thread.description}
            </p>
          )}
        </div>
        {thread.is_closed && (
          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
            Đã đóng
          </span>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 h-[500px]" ref={listRef}>
        <div className="p-4 space-y-1">
          {/* Load more button */}
          {hasNextPage && (
            <div className="flex justify-center py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  'Tải thêm tin nhắn'
                )}
              </Button>
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

            return (
              <div
                key={message.id}
                className={twMerge('transition-all rounded-lg')}
              >
                <MessageBubble
                  message={message}
                  isOwn={message.sender_id === currentUserId}
                  showAvatar={showAvatar}
                  showTimestamp={showTimestamp}
                  onReply={() => setReplyTo(message.id)}
                  onEdit={() => {
                    // Edit message in thread (same as main chat)
                  }}
                  currentUserId={currentUserId}
                  conversationType="group"
                  conversationId={conversationId}
                  threadId={thread.id}
                />
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Footer */}
      {!thread.is_closed && (
        <ChatFooter
          fileInputRef={fileInputRef}
          inputRef={inputRef}
          messageText={messageText}
          handleInputChange={(e) => setMessageText(e.target.value)}
          handleKeyPress={handleKeyPress}
          handleSendMessage={handleSendMessage}
          handleFileSelect={() => {
            // File upload in threads (can be added later)
            console.log('File upload in threads not implemented yet');
          }}
          handleEmojiSelect={(emoji) => {
            setMessageText((prev) => prev + emoji);
          }}
          handleLocationClick={() => {
            // Location in threads (can be added later)
            console.log('Location in threads not implemented yet');
          }}
          sendFileMutation={{ isPending: false }}
          sendTextMutation={sendMessageMutation}
          participants={[]}
          onMentionSelected={() => {}}
          disabled={!thread.is_joined}
        />
      )}
    </div>
  );
}
