import { useEffect, useState } from 'react';
import { getCallHistory, type CallHistoryItem } from '@/services/callService';
import { useAuth } from '@/stores/user';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { supabaseUrl, getAvatarUrl, getGroupPhotoUrl } from '@/lib/supabase';

export default function CallHistoryPage() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const loadCallHistory = async () => {
      try {
        setLoading(true);
        const data = await getCallHistory(user.id, 100);
        setCalls(data);
      } catch (error) {
        console.error('Error loading call history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCallHistory();
  }, [user?.id]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Đang gọi...';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallIcon = (call: CallHistoryItem, userId: string) => {
    const isOutgoing = call.started_by === userId;
    const isMissed = call.ended_at === null || call.duration === null || call.duration < 5;

    if (call.type === 'video') {
      return <Video className="w-5 h-5" />;
    }

    if (isMissed) {
      return <PhoneMissed className="w-5 h-5 text-red-500" />;
    }

    if (isOutgoing) {
      return <PhoneOutgoing className="w-5 h-5 text-green-500" />;
    }

    return <PhoneIncoming className="w-5 h-5 text-blue-500" />;
  };

  const getCallTitle = (call: CallHistoryItem) => {
    if (call.conversation_type === 'direct') {
      return call.other_user_name || 'Người dùng';
    }
    return call.conversation_title || 'Nhóm';
  };

  const getCallAvatar = (call: CallHistoryItem) => {
    if (call.conversation_type === 'direct') {
      return getAvatarUrl(call.other_user_avatar || null);
    }
    return getGroupPhotoUrl(call.conversation_photo_url || null);
  };

  const getCallSubtitle = (call: CallHistoryItem, userId: string) => {
    const isOutgoing = call.started_by === userId;
    const isMissed = call.ended_at === null || call.duration === null || call.duration < 5;

    if (isMissed) {
      return isOutgoing ? 'Cuộc gọi nhỡ' : 'Cuộc gọi đến nhỡ';
    }

    if (isOutgoing) {
      return 'Cuộc gọi đi';
    }

    return 'Cuộc gọi đến';
  };

  if (loading) {
    return (
      <div className="col-span-12 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Đang tải lịch sử cuộc gọi...</p>
          </div>
        </div>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="col-span-12 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Phone className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Chưa có cuộc gọi nào</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-12 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Lịch sử cuộc gọi
          </h1>

        <div className="space-y-2">
          {calls.map((call) => (
            <div
              key={call.id}
              className="
                flex items-center gap-4 p-4
                bg-white dark:bg-[#2B2D31]
                rounded-lg border border-gray-200 dark:border-[#3F4246]
                hover:bg-gray-50 dark:hover:bg-[#313338]
                transition-colors
              "
            >
              {/* Avatar */}
              <Avatar className="h-12 w-12">
                <AvatarImage src={getCallAvatar(call)} />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                  {getCallTitle(call).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {getCallTitle(call)}
                  </h3>
                  {call.type === 'video' && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                      Video
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getCallSubtitle(call, user?.id || '')}
                </p>
              </div>

              {/* Icon & Duration */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDuration(call.duration)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(call.started_at), {
                      addSuffix: true,
                      locale: vi
                    })}
                  </div>
                </div>
                <div className="text-gray-400 dark:text-gray-500">
                  {getCallIcon(call, user?.id || '')}
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}

