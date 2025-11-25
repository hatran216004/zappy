// components/ConversationsList.tsx
// 🎨 Discord-like styling with DARK/LIGHT modes (UI-only, no logic changes)

import React, { useState, useMemo } from 'react';
import {
  useConversations,
  useConversationsRealtime,
  useGetOrCreateDirectConversation
} from '@/hooks/useChat';
import { SortableConversationItem } from './SortableConversationItem';
import { useFriends, useFriendsRealtime } from '@/hooks/useFriends';
import { useNavigate } from 'react-router';
import { UserAvatar } from '../UserAvatar';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragMoveEvent,
  Modifier
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useConversationOrder } from '@/hooks/useConversationOrder';

interface ConversationsListProps {
  userId: string;
  selectedConversationId?: string;
  selectedFilter?: string | null;
  tab?: string;
  sidebarRef?: React.RefObject<HTMLElement>;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  userId,
  selectedConversationId,
  selectedFilter = null,
  tab = 'all',
  sidebarRef
}) => {
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations(userId);
  const { data: friends } = useFriends(userId);
  const getOrCreateConversation = useGetOrCreateDirectConversation();
  const [isCreating, setIsCreating] = useState(false);
  const { sortConversations, reorderConversations } =
    useConversationOrder(userId);
  const listContainerRef = React.useRef<HTMLDivElement>(null);

  useFriendsRealtime(userId);
  useConversationsRealtime(userId);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // Require 8px movement before drag starts
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleSelectFriend = async (friendId: string) => {
    if (isCreating) return;
    try {
      setIsCreating(true);
      const conversationId = await getOrCreateConversation.mutateAsync({
        currentUserId: userId,
        otherUserId: friendId
      });
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Error creating/opening conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter friends based on label if selectedFilter is set
  const filteredFriends = selectedFilter
    ? friends?.filter((friend) => friend.label_id?.includes(selectedFilter))
    : friends;

  // Filter conversations based on label if selectedFilter is set
  let filteredConversations = selectedFilter
    ? conversations?.filter((conv) => {
        // Only filter direct conversations (2 participants)
        if (conv.participants.length !== 2) return true; // Keep group conversations

        // Find the other participant (not current user)
        const otherParticipant = conv.participants.find(
          (p) => p.user_id !== userId
        );
        if (!otherParticipant) return false;

        // Check if that participant is a friend with the selected label
        const friend = filteredFriends?.find(
          (f) => f.id === otherParticipant.user_id
        );
        return friend !== undefined;
      })
    : conversations;

  // Apply tab filter (all/unread/groups)
  if (tab === 'unread') {
    filteredConversations = filteredConversations?.filter((conv) => {
      // Show conversations with unread messages
      return (conv.unread_count ?? 0) > 0;
    });
  } else if (tab === 'groups') {
    filteredConversations = filteredConversations?.filter((conv) => {
      // Show only group conversations
      return conv.type === 'group';
    });
  }

  // Sort conversations by saved order
  const sortedConversations = filteredConversations
    ? sortConversations(filteredConversations)
    : [];

  // Modifier to restrict drag to ChatSidebar bounds
  const restrictToSidebar: Modifier = useMemo(() => {
    return ({ transform, draggingNodeRect }) => {
      if (
        !sidebarRef?.current ||
        !draggingNodeRect ||
        !listContainerRef.current
      ) {
        return transform;
      }

      // Get sidebar bounds and list container bounds
      const sidebarBounds = sidebarRef.current.getBoundingClientRect();
      const listBounds = listContainerRef.current.getBoundingClientRect();
      const { y } = transform;

      // Use the more restrictive bounds (list container within sidebar)
      const containerTop = Math.max(sidebarBounds.top, listBounds.top);
      const containerBottom = Math.min(sidebarBounds.bottom, listBounds.bottom);

      // Calculate restricted transform values
      // Completely prevent horizontal movement (x = 0) - only allow vertical dragging
      const restrictedX = 0;

      // Calculate min and max allowed Y transform values based on container bounds
      const minY = containerTop - draggingNodeRect.top;
      const maxY =
        containerBottom - draggingNodeRect.height - draggingNodeRect.top;

      // Clamp Y to stay within bounds - this prevents dragging outside container
      const restrictedY = Math.max(minY, Math.min(maxY, y));

      return {
        ...transform,
        x: restrictedX, // Always 0 - no horizontal movement allowed
        y: restrictedY
      };
    };
  }, [sidebarRef]);

  // Handle drag move - cancel if pointer moves outside sidebar bounds
  const handleDragMove = (event: DragMoveEvent) => {
    if (!sidebarRef?.current) return;

    const sidebarBounds = sidebarRef.current.getBoundingClientRect();
    const { activatorEvent } = event;

    // Get current pointer position
    if (
      activatorEvent &&
      'clientX' in activatorEvent &&
      'clientY' in activatorEvent
    ) {
      const pointerX = activatorEvent.clientX as number;
      const pointerY = activatorEvent.clientY as number;

      // If pointer moves outside sidebar bounds, prevent further dragging
      if (
        pointerX < sidebarBounds.left ||
        pointerX > sidebarBounds.right ||
        pointerY < sidebarBounds.top ||
        pointerY > sidebarBounds.bottom
      ) {
        // Cancel the drag by stopping the event
        if (activatorEvent.stopPropagation) {
          activatorEvent.stopPropagation();
        }
      }
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !sortedConversations) {
      return;
    }

    // Check if drop is within sidebar bounds
    if (sidebarRef?.current && over) {
      const sidebarBounds = sidebarRef.current.getBoundingClientRect();
      const overElement = document.querySelector(
        `[data-id="${over.id}"]`
      ) as HTMLElement;

      if (overElement) {
        const overRect = overElement.getBoundingClientRect();
        const overCenterX = overRect.left + overRect.width / 2;
        const overCenterY = overRect.top + overRect.height / 2;

        // If drop target is outside sidebar, cancel the drop
        if (
          overCenterX < sidebarBounds.left ||
          overCenterX > sidebarBounds.right ||
          overCenterY < sidebarBounds.top ||
          overCenterY > sidebarBounds.bottom
        ) {
          return;
        }
      }
    }

    const conversationIds = sortedConversations.map((c) => c.id);
    reorderConversations(
      conversationIds,
      active.id as string,
      over.id as string
    );

    // Update conversations order (will be reflected on next render via sortConversations)
    // The order is saved in localStorage by reorderConversations
  };

  const friendsWithoutConversation =
    filteredFriends?.filter((friend) => {
      const hasConversation = filteredConversations?.some((conv) => {
        if (conv.participants.length !== 2) return false;
        const hasFriend = conv.participants.some(
          (p) => p.user_id === friend.id
        );
        const hasCurrentUser = conv.participants.some(
          (p) => p.user_id === userId
        );
        return hasFriend && hasCurrentUser;
      });
      return !hasConversation;
    }) || [];

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-225px)] flex items-center justify-center flex-1 text-gray-600 dark:text-[#B5BAC1]">
        Đang tải...
      </div>
    );
  }

  // Empty state: không có conversation và không có bạn bè
  if (filteredConversations?.length === 0 && filteredFriends?.length === 0) {
    return (
      <div
        data-tour-id="conversations"
        className="flex flex-col items-center justify-center h-full p-8 text-center bg-white text-gray-900 dark:bg-[#1E1F22] dark:text-[#F2F3F5]"
      >
        <div className="mb-6 text-gray-400 dark:text-[#B5BAC1]">
          <svg
            className="w-20 h-20 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-[#F2F3F5]">
          {selectedFilter
            ? 'Không có tin nhắn nào với nhãn này'
            : 'Chưa có cuộc trò chuyện nào'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-[#B5BAC1] max-w-sm">
          {selectedFilter
            ? 'Hãy thử chọn nhãn khác hoặc tìm kiếm bạn bè để bắt đầu trò chuyện'
            : 'Hãy tìm kiếm và kết bạn để bắt đầu trò chuyện với mọi người'}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={listContainerRef}
      data-tour-id="conversations"
      className="py-2 pr-2 overflow-y-auto overflow-x-hidden h-full bg-white text-gray-900 dark:bg-[#1E1F22] dark:text-[#F2F3F5] relative"
      style={{
        contain: 'layout style paint',
        clipPath: sidebarRef?.current ? 'inset(0)' : 'none'
      }}
    >
      {/* Danh sách conversations với drag and drop */}
      {sortedConversations && sortedConversations.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          modifiers={sidebarRef ? [restrictToSidebar] : undefined}
        >
          <SortableContext
            items={sortedConversations.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedConversations.map((conversation) => (
              <SortableConversationItem
                key={conversation.id}
                conversation={conversation}
                userId={userId}
                isSelected={conversation.id === selectedConversationId}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Empty state cho conversations nếu chỉ có bạn bè */}
      {filteredConversations?.length === 0 &&
        friendsWithoutConversation.length > 0 && (
          <div className="flex flex-col items-center justify-center p-6 text-center border-b border-gray-200 dark:border-[#2B2D31]">
            <div className="mb-3 text-gray-400 dark:text-[#B5BAC1]">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="font-medium mb-1 text-gray-900 dark:text-white">
              Chưa có tin nhắn nào
            </p>
            <p className="text-sm text-gray-500 dark:text-[#B5BAC1]">
              Chọn bạn bè bên dưới để bắt đầu trò chuyện
            </p>
          </div>
        )}

      {/* Danh sách bạn bè chưa có conversation */}
      {friendsWithoutConversation.length > 0 && (
        <div className="mt-2">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-[#B5BAC1]">
            Bạn bè ({friendsWithoutConversation.length})
          </div>
          <div className="flex-1 overflow-y-auto">
            {friendsWithoutConversation.map((friend) => (
              <button
                key={friend.id}
                onClick={() => handleSelectFriend(friend.id)}
                className="w-full text-left"
                type="button"
                disabled={isCreating}
              >
                <div className="flex items-center gap-3 px-3 py-2.5 transition-colors disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-white/5">
                  {/* Avatar + status dot */}
                  <UserAvatar
                    avatarUrl={friend.avatar_url}
                    displayName={friend.display_name}
                    status={friend.status}
                    size="sm"
                    showStatus={true}
                    className="w-10 h-10"
                  />

                  {/* Text area */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[15px] text-gray-900 dark:text-white truncate">
                        {friend.display_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-[13px] text-gray-500 dark:text-[#B5BAC1] truncate">
                        @{friend.username}
                      </p>
                    </div>
                  </div>
                </div>

                {/* divider */}
                <div className="mx-16 border-b border-gray-200 dark:border-[#2B2D31]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state khi đang tạo conversation */}
      {isCreating && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div
            className="rounded-lg p-4 shadow-xl border
                          bg-white text-gray-900 border-gray-200
                          dark:bg-[#2B2D31] dark:text-[#F2F3F5] dark:border-[#3F4246]"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
              <span>Đang tạo cuộc trò chuyện...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationsList;
