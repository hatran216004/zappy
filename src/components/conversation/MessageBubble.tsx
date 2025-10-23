// components/MessageBubble.tsx
import React, { useState, useEffect } from 'react';
import {
  useEditMessage,
  useRecallMessage,
  useAddReaction,
  useRemoveReaction
} from '@/hooks/useChat';
import { getAttachmentUrl } from '@/services/chatService';
import type { MessageWithDetails } from '@/services/chatService';
import { supabaseUrl } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import clsx from 'clsx';

interface MessageBubbleProps {
  message: MessageWithDetails;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  onReply: () => void;
  currentUserId: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar,
  showTimestamp,
  onReply,
  currentUserId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content_text || '');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);

  const editMutation = useEditMessage();
  const recallMutation = useRecallMessage();
  const addReactionMutation = useAddReaction();
  const removeReactionMutation = useRemoveReaction();

  // Load attachment URLs
  useEffect(() => {
    const loadAttachments = async () => {
      if (!message.attachments || message.attachments.length === 0) return;
      const urls = await Promise.all(
        message.attachments.map((att) => getAttachmentUrl(att.storage_path))
      );
      setAttachmentUrls(urls);
    };
    loadAttachments();
  }, [message.attachments]);

  const handleEdit = async () => {
    if (!editText.trim()) return;
    try {
      await editMutation.mutateAsync({
        messageId: message.id,
        content: editText.trim()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleRecall = async () => {
    if (!confirm('Bạn có chắc muốn thu hồi tin nhắn này?')) return;
    try {
      await recallMutation.mutateAsync(message.id);
    } catch (error) {
      console.error('Error recalling message:', error);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!message.reactions) return;
    const existingReaction = message.reactions.find(
      (r) => r.user_id === currentUserId && r.emoji === emoji
    );
    try {
      if (existingReaction) {
        await removeReactionMutation.mutateAsync({
          messageId: message.id,
          userId: currentUserId,
          emoji
        });
      } else {
        await addReactionMutation.mutateAsync({
          messageId: message.id,
          userId: currentUserId,
          emoji
        });
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group reactions by emoji
  const groupedReactions =
    message?.reactions?.reduce((acc, reaction) => {
      if (!reaction || !reaction.emoji) return acc;
      if (!acc[reaction.emoji]) acc[reaction.emoji] = [];
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {} as Record<string, typeof message.reactions>) || {};

  // Message recalled
  if (message.recalled_at) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[70%] px-4 py-2 rounded-lg bg-gray-100 text-gray-500 italic">
          Tin nhắn đã được thu hồi
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}
      >
        {/* Avatar */}
        {showAvatar && !isOwn && message?.sender && (
          <img
            src={`${supabaseUrl}${message.sender.avatar_url}`}
            alt={message.sender.display_name}
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
        {!showAvatar && !isOwn && <div className="w-8" />}

        <div className="flex flex-col">
          {/* Sender name */}
          {showAvatar && !isOwn && message?.sender && (
            <span className="text-xs text-gray-500 mb-1 px-2">
              {message.sender.display_name}
            </span>
          )}

          {/* Reply to */}
          {message?.reply_to && (
            <div className="px-3 py-1 mb-1 bg-gray-100 rounded-t-lg text-xs text-gray-600 border-l-2 border-blue-500">
              Trả lời: {message.reply_to.content_text || 'Tin nhắn'}
            </div>
          )}

          {/* Message content */}
          <div
            className={clsx(
              'flex items-center gap-2',
              isOwn ? 'flex-row-reverse' : ''
            )}
          >
            <div
              className={`px-4 py-2 rounded-lg ${
                isOwn ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'
              }`}
            >
              {isEditing ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-2 border rounded text-gray-900"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleEdit}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {message.content_text && (
                    <p className="break-words whitespace-pre-wrap">
                      {message.content_text}
                    </p>
                  )}

                  {/* Attachments */}
                  {message?.attachments?.map((attachment, index) => (
                    <div key={attachment.id} className="mt-2">
                      {attachment.kind === 'image' && attachmentUrls[index] && (
                        <img
                          src={attachmentUrls[index]}
                          alt="Attachment"
                          className="max-w-full rounded cursor-pointer hover:opacity-90"
                          onClick={() =>
                            window.open(attachmentUrls[index], '_blank')
                          }
                        />
                      )}
                      {attachment.kind === 'video' && attachmentUrls[index] && (
                        <video
                          src={attachmentUrls[index]}
                          controls
                          className="max-w-full rounded"
                        />
                      )}
                      {attachment.kind === 'audio' && attachmentUrls[index] && (
                        <audio
                          src={attachmentUrls[index]}
                          controls
                          className="w-full"
                        />
                      )}
                      {attachment.kind === 'file' && attachmentUrls[index] && (
                        <a
                          href={attachmentUrls[index]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                            <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                          </svg>
                          <span className="text-sm">
                            {attachment.storage_path.split('/').pop()}
                          </span>
                        </a>
                      )}
                    </div>
                  ))}

                  {message.edited_at && (
                    <span
                      className={`text-xs ${
                        isOwn ? 'text-blue-200' : 'text-gray-500'
                      } ml-2`}
                    >
                      (đã chỉnh sửa)
                    </span>
                  )}
                </>
              )}
            </div>

            <div
              className={'opacity-0 group-hover:opacity-100 transition-opacity'}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align={isOwn ? 'end' : 'start'}
                  className="w-40"
                >
                  <DropdownMenuItem onClick={onReply}>
                    💬 Trả lời
                  </DropdownMenuItem>

                  {isOwn && message.type === 'text' && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      ✏️ Chỉnh sửa
                    </DropdownMenuItem>
                  )}

                  {isOwn && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleRecall}
                        className="text-red-600 focus:text-red-600"
                      >
                        🗑️ Thu hồi
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Reactions */}
          {groupedReactions && Object.keys(groupedReactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 px-2">
              {Object.entries(groupedReactions).map(([emoji, reactions]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs"
                >
                  <span>{emoji}</span>
                  <span>{reactions?.length || 0}</span>
                </button>
              ))}
            </div>
          )}

          {/* Timestamp */}
          {showTimestamp && (
            <div
              className={`flex items-center gap-2 mt-1 px-2 ${
                isOwn ? 'justify-end' : ''
              }`}
            >
              <span className="text-xs text-gray-500">
                {formatTime(message.created_at)}
              </span>
              {isOwn && message?.read_receipts?.length > 0 && (
                <span className="text-xs text-blue-600">✓ Đã xem</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
