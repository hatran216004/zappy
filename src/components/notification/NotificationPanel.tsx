// components/notification/NotificationPanel.tsx
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead
} from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/components/ui/button';
import { CheckCheck, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotificationPanelProps {
  userId: string;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  userId,
  onClose
}) => {
  const { data: notifications, isLoading } = useNotifications(userId, 10);
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  // Note: Realtime notifications are handled in Navbar component

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate(userId);
  };

  const handleNotificationClick = (notificationId: string) => {
    if (!markAsReadMutation.isPending) {
      markAsReadMutation.mutate(notificationId);
    }
  };

  const unreadNotifications = notifications?.filter((n) => !n.read_at) || [];
  const hasUnread = unreadNotifications.length > 0;

  return (
    <div className="flex flex-col h-[500px] overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">Thông báo</h3>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <CheckCheck className="h-3 w-3 mr-1" />
            )}
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification.id)}
                onClose={onClose}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="text-sm">Không có thông báo nào</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
