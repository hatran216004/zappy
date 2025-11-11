// components/MessageBubble.tsx
import React, { useState, useEffect } from 'react';
import {
  useEditMessage,
  useRecallMessage,
  useDeleteMessageForMe,
  useDeleteMessageAsAdmin,
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
import { ImageAttachment } from './ImageAttachment';
import { AudioPlayer } from './AudioPlayer';
import { useConfirm } from '../modal/ModalConfirm';
import { EmojiPicker } from './EmojiPicker';
import { UserAvatar } from '../UserAvatar';
import { LocationMessage } from './LocationMessage';
import { PollMessage } from './PollMessage';
import toast from 'react-hot-toast';

interface MessageBubbleProps {
  message: MessageWithDetails;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  onReply: () => void;
  onEdit: (content: string) => void;
  currentUserId: string;
  isPinned?: boolean;
  onPin?: () => void;
  onUnpin?: () => void;
  onJumpToMessage?: (messageId: string) => void;
  onForward?: () => void;
  isAdmin?: boolean; // Current user is admin
  conversationType?: string; // 'direct' | 'group'
  conversationId?: string; // For admin delete
}

// Helper function to detect and linkify URLs and render mentions with avatar+name
const linkifyText = (
  text: string,
  isOwn: boolean,
  mentions?: {
    mentioned_user_id: string;
    user?: { display_name?: string; avatar_url?: string };
  }[]
) => {
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
    // Render mentions by replacing @Display Name exactly as in mentions list
    let nodes: React.ReactNode[] = [part];
    (mentions || []).forEach((m, mi) => {
      const name = m.user?.display_name;
      if (!name) return;
      const token = `@${name}`;
      const nextNodes: React.ReactNode[] = [];
      nodes.forEach((node, ni) => {
        if (typeof node !== 'string') {
          nextNodes.push(node);
          return;
        }
        const segments = node.split(token);
        segments.forEach((seg, si) => {
          if (si > 0) {
            nextNodes.push(
              <span
                key={`m-${index}-${mi}-${ni}-${si}`}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-blue-700 align-middle"
              >
                <img
                  src={m.user?.avatar_url || '/default_user.jpg'}
                  className="w-4 h-4 rounded-full object-cover"
                  alt={name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default_user.jpg';
                  }}
                />
                <span
                  className={clsx(
                    'text-xs font-medium',
                    isOwn ? 'text-blue-100' : 'text-blue-700'
                  )}
                >
                  @{name}
                </span>
              </span>
            );
          }
          if (seg) nextNodes.push(seg);
        });
      });
      nodes = nextNodes;
    });
    return <span key={index}>{nodes}</span>;
  });
};

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(
  ({
    message,
    isOwn,
    showAvatar,
    showTimestamp,
    onReply,
    onEdit,
    currentUserId,
    isPinned,
    onPin,
    onUnpin,
    onJumpToMessage,
    onForward,
    isAdmin = false,
    conversationType,
    conversationId
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(message.content_text || '');
    const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
    const confirm = useConfirm();

    const editMutation = useEditMessage();
    const recallMutation = useRecallMessage();
    const deleteForMeMutation = useDeleteMessageForMe();
    const deleteAsAdminMutation = useDeleteMessageAsAdmin();
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
        description:
          'Bạn có chắc muốn thu hồi tin nhắn này? Tin nhắn sẽ được thay thế bằng "Tin nhắn đã được thu hồi" cho tất cả mọi người.',
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
        description:
          'Xóa tin nhắn này chỉ ở phía bạn? Người khác vẫn có thể xem tin nhắn.',
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

    const handleDeleteAsAdmin = async () => {
      if (!conversationId) return;

      const confirmed = await confirm({
        title: 'Xóa tin nhắn (Admin)',
        description:
          'Bạn có chắc muốn xóa tin nhắn này? Tin nhắn sẽ bị xóa cho tất cả mọi người trong nhóm.',
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        destructive: true,
        dismissible: true
      });

      if (!confirmed) return;

      try {
        await deleteAsAdminMutation.mutateAsync({
          messageId: message.id,
          adminId: currentUserId,
          conversationId
        });
        toast.success('Đã xóa tin nhắn');
      } catch (error) {
        console.error('Error deleting message as admin:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Không thể xóa tin nhắn';
        toast.error(errorMessage);
      }
    };

    const handleReaction = async (emoji: string) => {
      if (!conversationId) return;

      try {
        // Optimistic update will happen immediately in the hook
        // addReaction will handle:
        // - If user already has this emoji → keep it (no change)
        // - If user has different emoji → replace with new one
        // - If user has no reaction → add new one
        await addReactionMutation.mutateAsync({
          messageId: message.id,
          userId: currentUserId,
          emoji,
          conversationId
        });
      } catch (error) {
        console.error('Error handling reaction:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Không thể thêm reaction';
        toast.error(errorMessage);
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
          className={`flex gap-2 max-w-[70%] ${
            isOwn ? 'flex-row-reverse' : ''
          }`}
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (message.reply_to?.id) {
                    onJumpToMessage?.(message.reply_to.id);
                  }
                }}
                className="text-left px-3 py-1 mb-1 bg-gray-100 hover:bg-gray-200 rounded-t-lg text-xs text-gray-700 border-l-2 border-primary transition-colors"
                title="Nhảy tới tin nhắn được trả lời"
              >
                Trả lời: {message.reply_to.content_text || 'Tin nhắn'}
              </button>
            )}

            {/* Forwarded badge */}
            {message.is_forwarded && (
              <div
                className={clsx(
                  'flex items-center gap-1 px-3 py-1 mb-1 text-xs font-medium',
                  isOwn ? 'text-blue-100' : 'text-blue-600'
                )}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                <span>Đã chuyển tiếp</span>
                {message.forwarded_from_user && (
                  <span
                    className={clsx(
                      'ml-1',
                      isOwn ? 'text-blue-200' : 'text-gray-500'
                    )}
                  >
                    từ {message.forwarded_from_user.display_name}
                  </span>
                )}
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
                  'rounded-lg',
                  !(
                    Boolean(
                      message.location_latitude && message.location_longitude
                    ) ||
                    Boolean(
                      message?.attachments?.some((a) => a.kind === 'image')
                    )
                  ) && 'px-4 py-2',
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
                    {/* Poll message */}
                    {message.type === 'poll' && (
                      <div className="p-2">
                        <PollMessage
                          messageId={message.id}
                          conversationId={message.conversation_id}
                        />
                      </div>
                    )}

                    {/* Location Message */}
                    {message.location_latitude &&
                      message.location_longitude && (
                        <LocationMessage
                          latitude={message.location_latitude}
                          longitude={message.location_longitude}
                          address={message.location_address}
                          displayMode={
                            message.location_display_mode as
                              | 'interactive'
                              | 'static'
                              | null
                          }
                        />
                      )}

                    {message.content_text &&
                      !message.location_latitude &&
                      message.type !== 'poll' && (
                        <p className="break-words whitespace-pre-wrap">
                          {linkifyText(
                            message.content_text,
                            isOwn,
                            message.mentions
                          )}
                        </p>
                      )}

                    {/* Attachments */}
                    {message?.attachments?.map((attachment, index) => (
                      <div
                        key={attachment.id}
                        className={clsx(
                          // Không thêm khoảng đệm/margin đối với ảnh
                          attachment.kind === 'image' ? '' : 'mt-2'
                        )}
                      >
                        {attachment.kind === 'image' &&
                          attachmentUrls[index] && (
                            <ImageAttachment
                              src={attachmentUrls[index]}
                              alt="Image"
                              isOwn={isOwn}
                            />
                          )}
                        {attachment.kind === 'video' &&
                          attachmentUrls[index] && (
                            <video
                              src={attachmentUrls[index]}
                              controls
                              className="max-w-full rounded-lg"
                              style={{ maxHeight: '400px' }}
                            />
                          )}
                        {attachment.kind === 'audio' &&
                          attachmentUrls[index] && (
                            <AudioPlayer
                              src={attachmentUrls[index]}
                              isOwn={isOwn}
                            />
                          )}
                        {attachment.kind === 'file' &&
                          attachmentUrls[index] && (
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
                className={
                  'opacity-0 group-hover:opacity-100 transition-opacity'
                }
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
                    <DropdownMenuItem onClick={onReply}>
                      Trả lời
                    </DropdownMenuItem>

                    {/* Forward */}
                    {onForward && (
                      <DropdownMenuItem onClick={onForward}>
                        Chuyển tiếp
                      </DropdownMenuItem>
                    )}

                    {/* Pin / Unpin */}
                    {!isPinned ? (
                      <DropdownMenuItem onClick={onPin}>
                        Ghim tin nhắn
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={onUnpin}>
                        Bỏ ghim
                      </DropdownMenuItem>
                    )}

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

                    {/* Admin delete option - for group messages from other members */}
                    {isAdmin &&
                      conversationType === 'group' &&
                      !isOwn &&
                      conversationId && (
                        <DropdownMenuItem
                          onClick={handleDeleteAsAdmin}
                          className="text-orange-600 focus:text-orange-700"
                        >
                          Xóa tin nhắn (Admin)
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
                {isPinned && (
                  <span className="text-xs text-amber-600">Đã ghim</span>
                )}
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
  }
);
