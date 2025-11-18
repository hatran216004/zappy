// components/notification/NotificationItem.tsx
import { NotificationWithDetails, getNotificationMessage } from '@/services/notificationService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { twMerge } from 'tailwind-merge';
import { useState } from 'react';
import { NotificationDetailModal } from './NotificationDetailModal';
import {
  MessageCircle,
  Heart,
  UserPlus,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface NotificationItemProps {
  notification: NotificationWithDetails;
  onClick: () => void;
  onClose: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  onClose
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const data = notification.data as any;
  const isUnread = !notification.read_at;

  const handleClick = () => {
    onClick();
    setShowDetailModal(true);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'new_message':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'message_reaction':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'friend_request':
      case 'friend_request_accepted':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case 'post_reaction':
      case 'comment_reaction':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'post_comment':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'user_report_reviewed':
      case 'post_report_reviewed':
      case 'message_report_reviewed':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'user_report_resolved':
      case 'post_report_resolved':
      case 'message_report_resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'user_report_dismissed':
      case 'post_report_dismissed':
      case 'message_report_dismissed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <MessageCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={twMerge(
          'w-full flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left',
          isUnread && 'bg-blue-50 dark:bg-blue-900/20'
        )}
      >
        {/* Avatar or Icon */}
        <div className="flex-shrink-0 relative">
          {data.sender_avatar ? (
            <Avatar className="h-10 w-10">
              <AvatarImage src={data.sender_avatar} />
              <AvatarFallback>{data.sender_name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {getIcon()}
            </div>
          )}
          {isUnread && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {getNotificationMessage(notification)}
          </p>
          {data.preview && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
              {data.preview}
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: vi
            })}
          </p>
        </div>
      </button>

      {/* Detail Modal */}
      <NotificationDetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          onClose();
        }}
        notification={notification}
      />
    </>
  );
};

