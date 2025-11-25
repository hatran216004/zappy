import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ConversationItem from './ConversationItem';
import type { ConversationWithDetails } from '@/services/chatService';
import { GripVertical } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface SortableConversationItemProps {
  conversation: ConversationWithDetails;
  userId: string;
  isSelected: boolean;
}

export function SortableConversationItem({
  conversation,
  userId,
  isSelected
}: SortableConversationItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: conversation.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={twMerge(
        'group relative',
        isDragging && 'z-50'
      )}
    >
      {/* Active pill (trái) */}
      <div
        className={twMerge(
          'absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all',
          conversation.id === isSelected
            ? 'h-8 bg-[#5865F2]'
            : 'h-0 bg-transparent'
        )}
      />

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="
          absolute left-2 top-1/2 -translate-y-1/2
          p-1.5 rounded cursor-grab active:cursor-grabbing
          opacity-0 group-hover:opacity-100 transition-opacity
          hover:bg-gray-200 dark:hover:bg-gray-700
          z-10 touch-none
        "
        title="Kéo để sắp xếp"
        onClick={(e) => e.preventDefault()}
      >
        <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
      </div>

      {/* Conversation item with padding for drag handle */}
      <div className="pl-10">
        <ConversationItem
          conversation={conversation}
          userId={userId}
          isSelected={isSelected}
        />
      </div>
    </div>
  );
}

