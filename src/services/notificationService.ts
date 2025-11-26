// services/notificationService.ts
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase.type';

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type UserReport = Database['public']['Tables']['user_reports']['Row'];
export type PostReport = Database['public']['Tables']['post_reports']['Row'];
export type MessageReport = Database['public']['Tables']['message_reports']['Row'];

export type NotificationWithDetails = Notification & {
  // Thêm các field bổ sung từ data JSON
  sender?: {
    id: string;
    display_name: string;
    avatar_url: string;
  };
  conversation?: {
    id: string;
    title: string;
  };
  message?: {
    id: string;
    content: string;
  };
  post?: {
    id: string;
    content: string;
  };
};

// Lấy danh sách notifications (10 mới nhất, loại trừ các notification từ conversation có notif_level = 'none')
export const getNotifications = async (
  userId: string,
  limit: number = 10
): Promise<NotificationWithDetails[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit * 2); // Get more to filter

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Filter out notifications from conversations with notif_level = 'none'
  const filtered = await Promise.all(
    data.map(async (notification) => {
      try {
        const notificationData = (
          typeof notification.data === 'string' 
            ? JSON.parse(notification.data) 
            : notification.data
        ) as any;

        // Only filter conversation-related notifications
        const isConversationNotification = 
          notification.type === 'new_message' || 
          notification.type === 'message_mention' ||
          notification.type === 'mention';

        if (!isConversationNotification) {
          return notification as NotificationWithDetails;
        }

        console.log('🔍 Checking notification:', {
          notificationId: notification.id,
          type: notification.type,
          hasConversationId: !!notificationData?.conversation_id,
          hasMessageId: !!notificationData?.message_id
        });

        // Get conversation_id
        let conversationId = notificationData?.conversation_id;
        if (!conversationId && notificationData?.message_id) {
          const { data: message, error: messageError } = await supabase
            .from('messages')
            .select('conversation_id')
            .eq('id', notificationData.message_id)
            .single();
          
          if (messageError) {
            console.error('Error getting message:', messageError);
            return notification as NotificationWithDetails;
          }
          
          conversationId = message?.conversation_id;
        }

        if (!conversationId) {
          console.warn('No conversation_id found for notification:', notification.id);
          return notification as NotificationWithDetails;
        }

        console.log('🔍 Found conversation_id:', conversationId);

        // Check notif_level
        const { data: participant, error: participantError } = await supabase
          .from('conversation_participants')
          .select('notif_level')
          .eq('conversation_id', conversationId)
          .eq('user_id', userId)
          .single();

        if (participantError) {
          console.error('❌ Error getting participant:', participantError, {
            conversationId,
            userId
          });
          return notification as NotificationWithDetails;
        }

        console.log('🔍 Participant notif_level:', {
          conversationId,
          userId,
          notifLevel: participant?.notif_level,
          participant: participant ? 'found' : 'not found'
        });

        // Exclude if notif_level is 'none'
        if (participant?.notif_level === 'none') {
          console.log('🔕 Excluding notification - notif_level is none', {
            notificationId: notification.id,
            conversationId,
            userId,
            notifLevel: participant.notif_level
          });
          return null;
        }

        console.log('✅ Including notification - notif_level is not none:', participant?.notif_level);

        return notification as NotificationWithDetails;
      } catch {
        return notification as NotificationWithDetails;
      }
    })
  );

  return filtered.filter(n => n !== null).slice(0, limit) as NotificationWithDetails[];
};

// Đếm số notifications chưa đọc (loại trừ các notification từ conversation có notif_level = 'none')
export const getUnreadNotificationsCount = async (
  userId: string
): Promise<number> => {
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('id, type, data')
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('Error counting unread notifications:', error);
    return 0;
  }

  if (!notifications || notifications.length === 0) {
    return 0;
  }

  // Filter out notifications from conversations with notif_level = 'none'
  const filtered = await Promise.all(
    notifications.map(async (notification) => {
      try {
        const notificationData = (
          typeof notification.data === 'string' 
            ? JSON.parse(notification.data) 
            : notification.data
        ) as any;

        // Only filter conversation-related notifications
        const isConversationNotification = 
          notification.type === 'new_message' || 
          notification.type === 'message_mention' ||
          notification.type === 'mention';

        if (!isConversationNotification) {
          return notification;
        }

        // Get conversation_id
        let conversationId = notificationData?.conversation_id;
        if (!conversationId && notificationData?.message_id) {
          const { data: message } = await supabase
            .from('messages')
            .select('conversation_id')
            .eq('id', notificationData.message_id)
            .single();
          conversationId = message?.conversation_id;
        }

        if (!conversationId) {
          return notification;
        }

        // Check notif_level
        const { data: participant, error: participantError } = await supabase
          .from('conversation_participants')
          .select('notif_level')
          .eq('conversation_id', conversationId)
          .eq('user_id', userId)
          .single();

        if (participantError) {
          console.error('Error getting participant:', participantError);
          return notification;
        }

        // Exclude if notif_level is 'none'
        if (participant?.notif_level === 'none') {
          console.log('🔕 Excluding notification from count - notif_level is none', {
            notificationId: notification.id,
            conversationId,
            userId,
            notifLevel: participant.notif_level
          });
          return null;
        }

        return notification;
      } catch {
        return notification;
      }
    })
  );

  return filtered.filter(n => n !== null).length;
};

// Đánh dấu notification đã đọc
export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Đánh dấu tất cả notifications đã đọc
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Subscribe to realtime notifications
export const subscribeToNotifications = (
  userId: string,
  onNotification: (notification: Notification) => void
) => {
  const channelName = `notifications:${userId}`;
  
  // Remove existing channel if any
  const existingChannel = supabase.getChannels().find(ch => ch.topic === channelName);
  if (existingChannel) {
    supabase.removeChannel(existingChannel);
  }

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('🔔 Realtime notification payload:', payload);
        onNotification(payload.new as Notification);
      }
    )
    .subscribe((status) => {
      console.log('🔔 Notification subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to notifications');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error subscribing to notifications');
      }
    });

  return () => {
    console.log('🔕 Unsubscribing from notifications');
    supabase.removeChannel(channel);
  };
};

// Lấy chi tiết User Report
export const getUserReport = async (reportId: string): Promise<UserReport | null> => {
  const { data, error } = await supabase
    .from('user_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    console.error('Error fetching user report:', error);
    return null;
  }

  return data;
};

// Lấy chi tiết Post Report
export const getPostReport = async (reportId: string): Promise<PostReport | null> => {
  const { data, error } = await supabase
    .from('post_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    console.error('Error fetching post report:', error);
    return null;
  }

  return data;
};

// Lấy chi tiết Message Report
export const getMessageReport = async (reportId: string): Promise<MessageReport | null> => {
  const { data, error } = await supabase
    .from('message_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    console.error('Error fetching message report:', error);
    return null;
  }

  return data;
};

// Helper function để format notification message
export const getNotificationMessage = (notification: NotificationWithDetails): string => {
  const data = notification.data as any;

  switch (notification.type) {
    case 'new_message':
      return `${data.sender_name} đã gửi tin nhắn mới`;
    
    case 'message_mention':
      return `${data.sender_name} đã nhắc đến bạn trong cuộc trò chuyện`;
    
    case 'message_reaction':
      return `${data.sender_name} đã thả cảm xúc vào tin nhắn của bạn`;
    
    case 'friend_request':
      return `${data.sender_name} đã gửi lời mời kết bạn`;
    
    case 'friend_request_accepted':
      return `${data.sender_name} đã chấp nhận lời mời kết bạn`;
    
    case 'post_mention':
      return `${data.author_name} đã nhắc đến bạn trong bài viết`;
    
    case 'post_reaction':
      return `${data.sender_name} đã thả cảm xúc vào bài viết của bạn`;
    
    case 'post_comment':
      return `${data.sender_name} đã bình luận về bài viết của bạn`;
    
    case 'comment_reaction':
      return `${data.sender_name} đã thả cảm xúc vào bình luận của bạn`;
    
    case 'user_report_reviewed':
      return `Báo cáo người dùng "${data.reported_user_name || 'người dùng'}" của bạn đã được quản trị viên xem xét`;
    
    case 'user_report_resolved':
      return `Báo cáo người dùng "${data.reported_user_name || 'người dùng'}" của bạn đã được giải quyết. Hành động đã được thực hiện`;
    
    case 'user_report_dismissed':
      return `Báo cáo người dùng "${data.reported_user_name || 'người dùng'}" của bạn đã bị từ chối. Không có vi phạm quy tắc`;
    
    case 'post_report_reviewed':
      return `Báo cáo bài viết của bạn đã được quản trị viên xem xét`;
    
    case 'post_report_resolved':
      return `Báo cáo bài viết của bạn đã được giải quyết. Hành động đã được thực hiện`;
    
    case 'post_report_dismissed':
      return `Báo cáo bài viết của bạn đã bị từ chối. Nội dung không vi phạm quy tắc`;
    
    case 'message_report_reviewed':
      return `Báo cáo tin nhắn của bạn đã được quản trị viên xem xét`;
    
    case 'message_report_resolved':
      return `Báo cáo tin nhắn của bạn đã được giải quyết. Hành động đã được thực hiện`;
    
    case 'message_report_dismissed':
      return `Báo cáo tin nhắn của bạn đã bị từ chối. Nội dung không vi phạm quy tắc`;
    
    default:
      return 'Bạn có thông báo mới';
  }
};

