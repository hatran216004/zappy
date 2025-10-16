import { Pin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { twMerge } from 'tailwind-merge';
// import { useParams } from 'react-router';
import { Conversation } from './ConversatinList';

export default function ConversationItem({
  conversation
}: {
  conversation: Conversation;
}) {
  // const { conversationId } = useParams();

  const isActive = false;

  return (
    <div
      className={twMerge(
        'flex items-center gap-3 p-4 cursor-pointer ',
        isActive ? 'bg-blue-600/20' : 'hover:bg-gray-200 dark:hover:bg-gray-800'
      )}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={conversation.avatar} />
        <AvatarFallback className="bg-zinc-300">
          {conversation.name[0]}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className="font-medium truncate text-gray-900 dark:text-gray-100">
            {conversation.name}
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {conversation.time}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-xs truncate text-gray-500 dark:text-gray-400">
            {conversation.lastMsg}
          </p>
          <div className="flex items-center gap-1">
            {conversation.unread && (
              <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5">
                {conversation.unread > 99 ? '99+' : conversation.unread}
              </span>
            )}
            {conversation.pinned && (
              <Pin className="size-3 text-gray-400 dark:text-gray-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
