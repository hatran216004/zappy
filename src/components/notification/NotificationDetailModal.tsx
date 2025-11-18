// components/notification/NotificationDetailModal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { NotificationWithDetails, getNotificationMessage } from '@/services/notificationService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/badge';

interface NotificationDetailModalProps {
  open: boolean;
  onClose: () => void;
  notification: NotificationWithDetails;
}

export const NotificationDetailModal: React.FC<
  NotificationDetailModalProps
> = ({ open, onClose, notification }) => {
  const navigate = useNavigate();
  const data = notification.data as any;

  const handleAction = () => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'new_message':
      case 'message_reaction':
        if (data.conversation_id) {
          navigate(`/chat/${data.conversation_id}`);
          onClose();
        }
        break;

      case 'friend_request':
      case 'friend_request_accepted':
        navigate('/friends');
        onClose();
        break;

      case 'post_reaction':
      case 'post_comment':
      case 'comment_reaction':
        if (data.post_id) {
          navigate(`/posts/${data.post_id}`);
          onClose();
        }
        break;

      case 'user_report_reviewed':
      case 'user_report_resolved':
      case 'user_report_dismissed':
      case 'post_report_reviewed':
      case 'post_report_resolved':
      case 'post_report_dismissed':
        if (data.post_id) {
          navigate(`/posts/${data.post_id}`);
          onClose();
        }
        break;
      case 'message_report_reviewed':
      case 'message_report_resolved':
      case 'message_report_dismissed':
        if (data.conversation_id) {
          navigate(`/chat/${data.conversation_id}`);
          onClose();
        }
        break;

      default:
        break;
    }
  };

  const isReportNotification = () => {
    return [
      'user_report_reviewed',
      'user_report_resolved',
      'user_report_dismissed',
      'post_report_reviewed',
      'post_report_resolved',
      'post_report_dismissed',
      'message_report_reviewed',
      'message_report_resolved',
      'message_report_dismissed'
    ].includes(notification.type);
  };

  const getActionButtonText = () => {
    switch (notification.type) {
      case 'new_message':
      case 'message_reaction':
        return 'Xem tin nhắn';
      case 'friend_request':
        return 'Xem lời mời';
      case 'friend_request_accepted':
        return 'Xem bạn bè';
      case 'post_reaction':
      case 'post_comment':
      case 'comment_reaction':
        return 'Xem bài viết';
      case 'message_report_reviewed':
      case 'message_report_resolved':
      case 'message_report_dismissed':
        return 'Xem tin nhắn';
      case 'post_report_reviewed':
      case 'post_report_resolved':
      case 'post_report_dismissed':
        return 'Xem bài viết';
      default:
        return 'Xem chi tiết';
    }
  };

  const getReasonText = (reason: string) => {
    const reasonMap: Record<string, string> = {
      spam: 'Spam',
      harassment: 'Quấy rối',
      inappropriate_content: 'Nội dung không phù hợp',
      violence: 'Bạo lực',
      hate_speech: 'Ngôn từ thù địch',
      fake_news: 'Tin giả',
      other: 'Khác'
    };
    return reasonMap[reason] || reason;
  };

  const getStatusBadge = () => {
    const reportTypes = [
      'user_report_reviewed',
      'user_report_resolved',
      'user_report_dismissed',
      'post_report_reviewed',
      'post_report_resolved',
      'post_report_dismissed',
      'message_report_reviewed',
      'message_report_resolved',
      'message_report_dismissed'
    ];

    if (reportTypes.includes(notification.type)) {
      if (notification.type.includes('reviewed')) {
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Đã xem xét
          </Badge>
        );
      } else if (notification.type.includes('resolved')) {
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Đã giải quyết
          </Badge>
        );
      } else if (notification.type.includes('dismissed')) {
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Đã từ chối
          </Badge>
        );
      }
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chi tiết thông báo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sender Info - Only show for non-report notifications */}
          {data.sender_name && !isReportNotification() && (
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={data.sender_avatar} />
                <AvatarFallback>{data.sender_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{data.sender_name}</p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: vi
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Report Notification Header */}
          {isReportNotification() && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Thông báo báo cáo</h3>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                  locale: vi
                })}
              </p>
            </div>
          )}

          {/* Message */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm">{getNotificationMessage(notification)}</p>
          </div>

          {/* Report Details */}
          {isReportNotification() && (
            <div className="space-y-4 p-4 border rounded-lg">
              {/* Reported Item Info */}
              {notification.type.startsWith('user_report_') && (
                <div>
                  <p className="text-sm font-medium mb-1">Người dùng được báo cáo:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.reported_user_name || 'Người dùng'}
                  </p>
                </div>
              )}

              {notification.type.startsWith('post_report_') && (
                <div>
                  <p className="text-sm font-medium mb-1">Bài viết được báo cáo:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.post_preview || 'Bài viết'}
                  </p>
                </div>
              )}

              {notification.type.startsWith('message_report_') && (
                <div>
                  <p className="text-sm font-medium mb-1">Tin nhắn được báo cáo:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.message_preview || 'Tin nhắn'}
                  </p>
                </div>
              )}

              {/* Report Reason */}
              {data.reason && (
                <div>
                  <p className="text-sm font-medium mb-1">Lý do báo cáo:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getReasonText(data.reason)}
                  </p>
                </div>
              )}

              {/* Description */}
              {data.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Mô tả thêm:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.description}
                  </p>
                </div>
              )}

              {/* Admin Info */}
              {data.reviewed_by_name && (
                <div>
                  <p className="text-sm font-medium mb-1">Được xử lý bởi:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.reviewed_by_name}
                  </p>
                  {data.reviewed_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(data.reviewed_at), {
                        addSuffix: true,
                        locale: vi
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* Status Message */}
              <div className="pt-2 border-t">
                {notification.type.includes('reviewed') && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Báo cáo của bạn đã được xem xét bởi quản trị viên.
                  </p>
                )}
                {notification.type.includes('resolved') && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Báo cáo của bạn đã được giải quyết. Hành động đã được thực hiện.
                  </p>
                )}
                {notification.type.includes('dismissed') && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Báo cáo của bạn đã bị từ chối. Nội dung được báo cáo không vi phạm quy tắc cộng đồng.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Preview Content - For non-report notifications */}
          {data.preview && !isReportNotification() && (
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {data.preview}
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            {(data.conversation_id || data.post_id) && (
              <Button onClick={handleAction}>{getActionButtonText()}</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

