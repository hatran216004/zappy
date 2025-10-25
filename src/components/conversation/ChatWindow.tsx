import React, { useState, useRef, useEffect } from 'react';
import {
  useMessages,
  useMessagesRealtime,
  useSendTextMessage,
  useSendFileMessage,
  useTypingIndicator,
  useMarkMessagesAsRead,
  useConversation
} from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import ChatHeader from './ChatHeader';
import ChatFooter from '../ChatWindow/ChatFooter';
import { useParams } from 'react-router';

interface ChatWindowProps {
  userId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ userId }) => {
  const params = useParams();
  const conversationId = params.conversationId as string;

  const [messageText, setMessageText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  // const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  useMessagesRealtime(conversationId, userId);

  // Flatten messages from infinite query
  const messages = data?.pages.flat() || [];

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Mark messages as read - ĐƠN GIẢN HÓA
  useEffect(() => {
    if (!messages.length) return;

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
  }, [messages.length, conversationId, userId]);

  useEffect(
    () => () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        sendTyping(false);
      }
    },
    [sendTyping]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    if (!typingUsers.includes(userId)) {
      sendTyping(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(false), 3000);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      await sendTextMutation.mutateAsync({
        conversationId,
        senderId: userId,
        content: messageText.trim(),
        replyToId: replyTo || undefined
      });

      setMessageText('');
      setReplyTo(null);
      sendTyping(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine file type
    let type: 'image' | 'video' | 'file' | 'audio' = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    try {
      await sendFileMutation.mutateAsync({
        conversationId,
        senderId: userId,
        file,
        type
      });
    } catch (error) {
      console.error('Error sending file:', error);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get other participant info
  const otherParticipant = conversation?.participants.find(
    (p) => p.user_id !== userId
  );

  return (
    <>
      <div className="flex flex-col h-screen justify-between">
        <ChatHeader
          otherParticipant={otherParticipant}
          typingUsers={typingUsers}
        />

        <div className="h-[calc(100%-122px)] overflow-y-auto p-4 space-y-2">
          {hasNextPage && (
            <div className="text-center pb-4">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
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

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === userId}
                showAvatar={showAvatar}
                showTimestamp={showTimestamp}
                onReply={() => setReplyTo(message.id)}
                currentUserId={userId}
              />
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {replyTo && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                Đang trả lời:{' '}
                {messages.find((m) => m.id === replyTo)?.content_text}
              </p>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="text-gray-500 hover:text-gray-700"
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

        <ChatFooter
          fileInputRef={fileInputRef}
          handleInputChange={handleInputChange}
          inputRef={inputRef}
          handleFileSelect={handleFileSelect}
          handleKeyPress={handleKeyPress}
          handleSendMessage={handleSendMessage}
          messageText={messageText}
          sendFileMutation={sendFileMutation}
          sendTextMutation={sendTextMutation}
        />
      </div>
    </>
  );
};

export default ChatWindow;
