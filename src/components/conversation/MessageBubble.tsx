// components/MessageBubble.tsx
import React, { useState, useEffect } from 'react';
import {
  useEditMessage,
  useRecallMessage,
  useDeleteMessageForMe,
  useAddReaction,
  useRemoveReaction
} from '@/hooks/useChat';
import { getAttachmentUrl } from '@/services/chatService';
import type { MessageWithDetails } from '@/services/chatService';
import { formatTime } from '@/utils/date';
import clsx from 'clsx';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { supabaseUrl } from '@/lib/supabase';
import { ImageAttachment } from './ImageAttachment';
import { AudioPlayer } from './AudioPlayer';
import { useConfirm } from '../modal/ModalConfirm';
import { EmojiPicker } from './EmojiPicker';
import { UserAvatar } from '../UserAvatar';

interface MessageBubbleProps {
  message: MessageWithDetails;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  onReply: () => void;
  onEdit: (content: string) => void;
  currentUserId: string;
}

// Helper function to detect and linkify URLs
const linkifyText = (text: string, isOwn: boolean) => {
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            'underline hover:opacity-80 font-medium break-all',
            isOwn ? 'text-blue-100' : 'text-blue-600'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  isOwn,
  showAvatar,
  showTimestamp,
  onReply,
  onEdit,
  currentUserId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content_text || '');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const confirm = useConfirm();

  const editMutation = useEditMessage();
  const recallMutation = useRecallMessage();
  const deleteForMeMutation = useDeleteMessageForMe();
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
    const confirmed = await confirm({
      title: 'Thu hồi tin nhắn',
      description: 'Bạn có chắc muốn thu hồi tin nhắn này? Tin nhắn sẽ được thay thế bằng "Tin nhắn đã được thu hồi" cho tất cả mọi người.',
      confirmText: 'Thu hồi',
      cancelText: 'Hủy',
      destructive: true,
      dismissible: true
    });

    if (!confirmed) return;

    try {
      await recallMutation.mutateAsync(message.id);
    } catch (error) {
      console.error('Error recalling message:', error);
    }
  };

  const handleDeleteForMe = async () => {
    const confirmed = await confirm({
      title: 'Xóa tin nhắn',
      description: 'Xóa tin nhắn này chỉ ở phía bạn? Người khác vẫn có thể xem tin nhắn.',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      destructive: true,
      dismissible: true
    });

    if (!confirmed) return;

    try {
      await deleteForMeMutation.mutateAsync({
        messageId: message.id,
        userId: currentUserId
      });
    } catch (error) {
      console.error('Error deleting message for me:', error);
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

  // Group reactions by emoji - THÊM CHECK NULL
  const groupedReactions =
    message?.reactions?.reduce((acc, reaction) => {
      if (!reaction || !reaction.emoji) return acc;
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {} as Record<string, typeof message.reactions>) || {};

  // Hiển thị system message (thành viên được thêm/xóa, rời nhóm, etc.)
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 text-sm dark:bg-[#2B2D31] dark:text-[#949BA4]">
          {message.content_text}
        </div>
      </div>
    );
  }

  // Hiển thị "Tin nhắn đã được thu hồi" nếu tin nhắn bị recalled hoặc deleted_for_me
  if (message.recalled_at || message.deleted_for_me) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[70%] px-4 py-2 rounded-lg bg-gray-100 text-gray-500 italic dark:bg-[#2B2D31] dark:text-[#949BA4]">
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
          <UserAvatar
            avatarUrl={message.sender.avatar_url}
            displayName={message.sender.display_name}
            size="sm"
            showStatus={false}
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
            <div className="px-3 py-1 mb-1 bg-gray-100 rounded-t-lg text-xs text-gray-600 border-l-2 border-primary">
              Trả lời: {message.reply_to.content_text || 'Tin nhắn'}
            </div>
          )}

          {/* Message content */}
          <div
            className={clsx(
              'flex items-center gap-2',
              isOwn && 'flex-row-reverse'
            )}
          >
            {/* Reaction picker button */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <EmojiPicker
                onEmojiSelect={(emoji) => handleReaction(emoji)}
                isOwn={isOwn}
              />
            </div>

            <div
              className={clsx(
                'px-4 py-2 rounded-lg',
                isOwn ? 'bg-primary text-white' : 'bg-gray-200 text-gray-900'
              )}
            >
              {/* Text content */}
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
                      className="text-xs px-2 py-1 bg-primary text-white rounded"
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
                      {linkifyText(message.content_text, isOwn)}
                    </p>
                  )}

                  {/* Attachments */}
                  {message?.attachments?.map((attachment, index) => (
                    <div key={attachment.id} className="mt-2">
                      {attachment.kind === 'image' && attachmentUrls[index] && (
                        <ImageAttachment
                          src={attachmentUrls[index]}
                          alt="Image"
                          isOwn={isOwn}
                        />
                      )}
                      {attachment.kind === 'video' && attachmentUrls[index] && (
                        <video
                          src={attachmentUrls[index]}
                          controls
                          className="max-w-full rounded-lg"
                          style={{ maxHeight: '400px' }}
                        />
                      )}
                      {attachment.kind === 'audio' && attachmentUrls[index] && (
                        <AudioPlayer src={attachmentUrls[index]} isOwn={isOwn} />
                      )}
                      {attachment.kind === 'file' && attachmentUrls[index] && (
                        <a
                          href={attachmentUrls[index]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                            <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                          </svg>
                          <span className="text-sm font-medium">
                            {attachment.storage_path.split('/').pop()}
                          </span>
                        </a>
                      )}
                    </div>
                  ))}

                  {/* Edited indicator */}
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

            {/* ✅ Dropdown menu (shadcn) */}
            <div
              className={'opacity-0 group-hover:opacity-100 transition-opacity'}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                    type="button"
                    aria-label="Mở menu"
                  >
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
                  className="min-w-[180px]"
                >
                  <DropdownMenuItem onClick={onReply}>Trả lời</DropdownMenuItem>

                  {isOwn && message.type === 'text' && (
                    <DropdownMenuItem
                      onClick={() => {
                        onEdit(message.content_text || '');
                        // trạng thái edit thực tế do parent quản
                        // nếu muốn edit inline ở đây thì gọi setIsEditing(true)
                      }}
                    >
                      Chỉnh sửa
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  {/* Delete options */}
                  <DropdownMenuItem
                    onClick={handleDeleteForMe}
                    className="text-orange-600 focus:text-orange-700"
                  >
                    Xóa ở phía tôi
                  </DropdownMenuItem>

                  {isOwn && (
                    <DropdownMenuItem
                      onClick={handleRecall}
                      className="text-red-600 focus:text-red-700"
                    >
                      Thu hồi với mọi người
                    </DropdownMenuItem>
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

          {/* Timestamp and read receipts */}
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
});
