import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getChatSummary24h, type ChatSummary } from '@/services/chatService';
import { BarChart3, Users, MessageSquare, Clock, TrendingUp, Hash } from 'lucide-react';

interface SummaryChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  conversationName: string;
}

export function SummaryChatModal({
  open,
  onOpenChange,
  conversationId,
  conversationName
}: SummaryChatModalProps) {
  const [summary, setSummary] = useState<ChatSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadSummary();
    }
  }, [open, conversationId]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getChatSummary24h(conversationId);
      setSummary(data);
    } catch (err) {
      console.error('Error loading summary:', err);
      setError('Không thể tải tóm tắt cuộc trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '💬';
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'file': return '📎';
      case 'audio': return '🎵';
      case 'location': return '📍';
      case 'poll': return '📊';
      default: return '📄';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            Tóm tắt cuộc trò chuyện - {conversationName}
          </DialogTitle>
          <p className="text-sm text-gray-500">Thống kê 24 giờ gần nhất</p>
        </DialogHeader>

        {loading && (
          <div className="py-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            Đang phân tích...
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-red-500">
            {error}
            <Button onClick={loadSummary} variant="outline" className="mt-4">
              Thử lại
            </Button>
          </div>
        )}

        {!loading && !error && summary && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                  <MessageSquare className="size-5" />
                  <span className="text-sm font-medium">Tổng tin nhắn</span>
                </div>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {summary.totalMessages}
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                  <Users className="size-5" />
                  <span className="text-sm font-medium">Người tham gia</span>
                </div>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {summary.totalParticipants}
                </p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                  <Clock className="size-5" />
                  <span className="text-sm font-medium">Giờ cao điểm</span>
                </div>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {formatHour(summary.mostActiveHour)}
                </p>
              </div>
            </div>

            {/* Most Active Users */}
            {summary.messagesByUser.length > 0 && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="size-5 text-blue-500" />
                  <h3 className="font-semibold">Thành viên tích cực nhất</h3>
                </div>
                <div className="space-y-3">
                  {summary.messagesByUser.slice(0, 5).map((user, index) => (
                    <div
                      key={user.userId}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="text-lg font-bold text-gray-400 w-6">
                        #{index + 1}
                      </div>
                      <img
                        src={user.avatar || '/default-avatar.png'}
                        alt={user.userName}
                        className="size-10 rounded-full"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{user.userName}</p>
                        <p className="text-sm text-gray-500">{user.count} tin nhắn</p>
                      </div>
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(user.count / summary.totalMessages) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {Math.round((user.count / summary.totalMessages) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message Types */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="size-5 text-green-500" />
                <h3 className="font-semibold">Loại tin nhắn</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(summary.messagesByType)
                  .filter(([_, count]) => count > 0)
                  .map(([type, count]) => (
                    <div
                      key={type}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center"
                    >
                      <div className="text-2xl mb-1">{getTypeIcon(type)}</div>
                      <p className="text-sm text-gray-500 capitalize">{type}</p>
                      <p className="text-lg font-bold">{count}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top Keywords */}
            {summary.topKeywords.length > 0 && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Hash className="size-5 text-orange-500" />
                  <h3 className="font-semibold">Từ khóa nổi bật</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.topKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {summary.totalMessages === 0 && (
              <div className="py-12 text-center text-gray-500">
                <MessageSquare className="size-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Chưa có tin nhắn nào</p>
                <p className="text-sm">Không có tin nhắn nào trong 24 giờ qua</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button onClick={loadSummary} disabled={loading}>
            Làm mới
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

