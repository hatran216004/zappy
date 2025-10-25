/* eslint-disable @typescript-eslint/no-explicit-any */
// services/chatService.ts
import { Database } from '@/types/supabase.type';
import { supabase } from './friendServices';

export type Message = Database['public']['Tables']['messages']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationParticipant =
  Database['public']['Tables']['conversation_participants']['Row'];
export type Attachment = Database['public']['Tables']['attachments']['Row'];
export type MessageReaction =
  Database['public']['Tables']['message_reactions']['Row'];
export type ReadReceipt = Database['public']['Tables']['read_receipts']['Row'];

export interface ConversationWithDetails extends Conversation {
  participants: (ConversationParticipant & {
    profile: Database['public']['Tables']['profiles']['Row'];
  })[];
  last_message?: Message;
  unread_count?: number;
}

export interface MessageWithDetails extends Message {
  sender: Database['public']['Tables']['profiles']['Row'];
  attachments: Attachment[];
  reactions: (MessageReaction & {
    user: Database['public']['Tables']['profiles']['Row'];
  })[];
  reply_to?: Message;
  read_receipts: ReadReceipt[];
}

// ============================================
// CONVERSATIONS
// ============================================

// Lấy hoặc tạo conversation 1:1
export const getOrCreateDirectConversation = async (
  currentUserId: string,
  otherUserId: string
): Promise<string> => {
  // Check if direct conversation exists
  const { data: existingPair } = await supabase
    .from('direct_pairs')
    .select('conversation_id')
    .or(
      `and(user_a.eq.${currentUserId},user_b.eq.${otherUserId}),and(user_a.eq.${otherUserId},user_b.eq.${currentUserId})`
    )
    .single();

  if (existingPair) {
    return existingPair.conversation_id;
  }

  // Create new conversation
  const { data: newConvo, error: convoError } = await supabase
    .from('conversations')
    .insert({
      type: 'direct',
      created_by: currentUserId
    })
    .select()
    .single();

  if (convoError) throw convoError;

  // Create direct pair
  const { error: pairError } = await supabase.from('direct_pairs').insert({
    conversation_id: newConvo.id,
    user_a: currentUserId,
    user_b: otherUserId
  });

  if (pairError) throw pairError;

  // Add participants
  const { error: participantsError } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: newConvo.id, user_id: currentUserId },
      { conversation_id: newConvo.id, user_id: otherUserId }
    ]);

  if (participantsError) throw participantsError;

  return newConvo.id;
};

// Lấy danh sách conversations
export const getConversations = async (
  userId: string
): Promise<ConversationWithDetails[]> => {
  // Cách 1: Query trực tiếp từ conversations
  const { data, error } = await supabase
    .from('conversations')
    .select(
      `
    id, title, updated_at, created_at,
    conversation_participants!inner(
      user_id,
      joined_at,
      last_read_at,
      left_at,
      profile:profiles(id, display_name, avatar_url, username, status, last_seen_at)
    ),
    last_message:messages!conversations_last_message_id_fkey(
      id, content_text, type, sender_id, created_at,
      sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)
    )
  `
    )
    .eq('conversation_participants.user_id', userId)
    .is('conversation_participants.left_at', null)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  // Get participants and unread count for each conversation
  const conversationsWithDetails = await Promise.all(
    (data || []).map(async (convo) => {
      // Get all participants with profiles
      const { data: participants, error: error1 } = await supabase
        .from('conversation_participants')
        .select(
          `
          *,
          profile:profiles(*)
        `
        )
        .eq('conversation_id', convo.id)
        .is('left_at', null);

      if (error1) throw error1;

      // Find current user's participant record
      const userParticipant = participants?.find((p) => p.user_id === userId);

      // Get unread count
      const { count: unreadCount, error: error2 } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', convo.id)
        .gt('created_at', userParticipant?.last_read_at || '1970-01-01')
        .neq('sender_id', userId);

      if (error2) throw error2;

      return {
        ...convo,
        participants: participants || [],
        unread_count: unreadCount || 0
      };
    })
  );

  return conversationsWithDetails;
};

// Lấy thông tin conversation
export const getConversation = async (
  conversationId: string
): Promise<ConversationWithDetails> => {
  const { data: convo, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) throw error;

  const { data: participants } = await supabase
    .from('conversation_participants')
    .select(
      `
      *,
      profile:profiles(*)
    `
    )
    .eq('conversation_id', conversationId)
    .is('left_at', null);

  return {
    ...convo,
    participants: participants || []
  };
};

// ============================================
// MESSAGES
// ============================================

// Lấy messages
export const getMessages = async (
  conversationId: string,
  limit: number = 50,
  before?: string
): Promise<MessageWithDetails[]> => {
  console.log('Conversation ID:', conversationId);

  // --- STEP 1: lấy messages cơ bản ---
  let query = supabase
    .from('messages')
    .select(
      `
      id,
      conversation_id,
      content_text,
      type,
      sender_id,
      created_at,
      reply_to_id,
      recalled_at,
      sender:profiles!messages_sender_id_fkey(*),
      attachments(*)
    `
    )
    .eq('conversation_id', conversationId)
    .is('recalled_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) query = query.lt('created_at', before);

  const { data: messages, error } = await query;
  if (error) {
    console.error('Fetch messages error:', error);
    throw error;
  }

  // --- STEP 2: lấy các message được reply_to ---
  const replyIds = [
    ...new Set((messages ?? []).map((m) => m.reply_to_id).filter(Boolean))
  ];

  let repliesById: Record<string, any> = {};
  if (replyIds.length > 0) {
    const { data: replies, error: repliesErr } = await supabase
      .from('messages')
      .select(
        `
        id, content_text, type, sender_id, created_at,
        sender:profiles!messages_sender_id_fkey(*)
      `
      )
      .in('id', replyIds as string[]);

    if (repliesErr) console.error('Fetch reply_to error:', repliesErr);
    repliesById = Object.fromEntries((replies ?? []).map((r) => [r.id, r]));
  }

  // --- STEP 3: lấy reactions + read receipts cho từng message ---
  const messagesWithDetails = await Promise.all(
    (messages || []).map(async (msg) => {
      const [reactionsRes, receiptsRes] = await Promise.all([
        supabase
          .from('message_reactions')
          .select(
            `
            *,
            user:profiles!message_reactions_user_id_fkey(*)
          `
          )
          .eq('message_id', msg.id),
        supabase.from('read_receipts').select('*').eq('message_id', msg.id)
      ]);

      return {
        ...msg,
        reply_to: msg.reply_to_id ? repliesById[msg.reply_to_id] ?? null : null,
        reactions: reactionsRes.data || [],
        read_receipts: receiptsRes.data || []
      };
    })
  );

  return messagesWithDetails.reverse(); // để tin cũ trước, mới sau
};

// Gửi text message
export const sendTextMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  replyToId?: string
): Promise<Message> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      type: 'text',
      content_text: content,
      reply_to_id: replyToId
    })
    .select()
    .single();

  if (error) throw error;

  // Update conversation's last_message_id and updated_at
  await supabase
    .from('conversations')
    .update({
      last_message_id: data.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId);

  return data;
};

// Upload file and send message
export const sendFileMessage = async (
  conversationId: string,
  senderId: string,
  file: File,
  type: 'image' | 'video' | 'file' | 'audio'
): Promise<Message> => {
  // Upload file to storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${conversationId}/${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}.${fileExt}`;
  const storagePath = `attachments/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('chat-attachments')
    .upload(storagePath, file);

  if (uploadError) throw uploadError;

  // Create message
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      type: type
    })
    .select()
    .single();

  if (messageError) throw messageError;

  // Get file metadata
  let width: number | null = null;
  let height: number | null = null;
  let duration_ms: number | null = null;

  if (type === 'image' || type === 'video') {
    const metadata = await getMediaMetadata(file, type);
    width = metadata.width;
    height = metadata.height;
    duration_ms = metadata.duration_ms;
  }

  // Create attachment
  const { error: attachmentError } = await supabase.from('attachments').insert({
    message_id: message.id,
    uploader_id: senderId,
    kind: type,
    storage_path: storagePath,
    mime_type: file.type,
    byte_size: file.size,
    width,
    height,
    duration_ms
  });

  if (attachmentError) throw attachmentError;

  // Update conversation
  await supabase
    .from('conversations')
    .update({
      last_message_id: message.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId);

  return message;
};

// Helper to get media metadata
const getMediaMetadata = (
  file: File,
  type: 'image' | 'video'
): Promise<{
  width: number | null;
  height: number | null;
  duration_ms: number | null;
}> => {
  return new Promise((resolve) => {
    if (type === 'image') {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          duration_ms: null
        });
      };
      img.onerror = () =>
        resolve({ width: null, height: null, duration_ms: null });
      img.src = URL.createObjectURL(file);
    } else if (type === 'video') {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration_ms: Math.round(video.duration * 1000)
        });
      };
      video.onerror = () =>
        resolve({ width: null, height: null, duration_ms: null });
      video.src = URL.createObjectURL(file);
    } else {
      resolve({ width: null, height: null, duration_ms: null });
    }
  });
};

// Get attachment URL
export const getAttachmentUrl = async (
  storagePath: string
): Promise<string> => {
  const { data } = await supabase.storage
    .from('chat-attachments')
    .createSignedUrl(storagePath, 3600); // 1 hour

  return data?.signedUrl || '';
};

// Search messages in a conversation
export const searchMessages = async (
  conversationId: string,
  query: string
): Promise<{ id: string; content_text: string; created_at: string }[]> => {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('messages')
    .select('id, content_text, created_at')
    .eq('conversation_id', conversationId)
    .is('recalled_at', null)
    .ilike('content_text', `%${query}%`)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Search messages error:', error);
    throw error;
  }

  return data || [];
};

// Edit message
export const editMessage = async (
  messageId: string,
  newContent: string
): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({
      content_text: newContent,
      edited_at: new Date().toISOString()
    })
    .eq('id', messageId);

  if (error) throw error;
};

// Recall message
export const recallMessage = async (messageId: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({
      recalled_at: new Date().toISOString()
    })
    .eq('id', messageId);

  if (error) throw error;
};

// ============================================
// REACTIONS
// ============================================

// Add reaction
export const addReaction = async (
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> => {
  const { error } = await supabase.from('message_reactions').insert({
    message_id: messageId,
    user_id: userId,
    emoji
  });

  if (error) throw error;
};

// Remove reaction
export const removeReaction = async (
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> => {
  const { error } = await supabase
    .from('message_reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji);

  if (error) throw error;
};

// ============================================
// READ RECEIPTS
// ============================================

// Mark messages as read
export const markMessagesAsRead = async (
  conversationId: string,
  userId: string,
  messageIds: string[]
): Promise<void> => {
  // Update last_read_at
  const { error: updateError } = await supabase
    .from('conversation_participants')
    .update({
      last_read_at: new Date().toISOString()
    })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (updateError) throw updateError;

  // Insert read receipts
  const receipts = messageIds.map((messageId) => ({
    message_id: messageId,
    user_id: userId
  }));

  const { error: receiptsError } = await supabase
    .from('read_receipts')
    .upsert(receipts, { onConflict: 'message_id,user_id' });

  if (receiptsError) throw receiptsError;
};

// ============================================
// TYPING INDICATOR
// ============================================

// Cache channels và last sent state để tránh gửi duplicate
const typingChannels = new Map<string, any>();
const lastTypingState = new Map<string, boolean>();
const pendingTyping = new Map<string, boolean>(); // Track pending sends

// Send typing indicator với rate limiting
export const sendTypingIndicator = (
  conversationId: string,
  userId: string,
  isTyping: boolean
): void => {
  const key = `${conversationId}:${userId}`;
  const lastState = lastTypingState.get(key);
  const isPending = pendingTyping.get(key);

  console.log(`🔍 sendTypingIndicator: isTyping=${isTyping}, lastState=${lastState}, pending=${isPending}`);

  // Skip nếu đang pending hoặc state giống nhau
  if (isPending) {
    console.log(`⏳ Skip: Already pending`);
    return;
  }

  if (lastState !== undefined && lastState === isTyping) {
    console.log(`⏭️ Skip: State unchanged`);
    return;
  }

  // Mark as pending và update state
  pendingTyping.set(key, true);
  lastTypingState.set(key, isTyping);

  // Lấy hoặc tạo channel
  let channel = typingChannels.get(conversationId);
  
  if (!channel) {
    channel = supabase.channel(`typing:${conversationId}`);
    channel.subscribe();
    typingChannels.set(conversationId, channel);
    console.log(`📡 Created channel: ${conversationId}`);
  }

  // Gửi typing event
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { user_id: userId, is_typing: isTyping }
  }).then(() => {
    console.log(`✅ Sent: ${isTyping ? 'START ▶️' : 'STOP ⏹️'}`);
    pendingTyping.delete(key);
  }).catch((error: any) => {
    console.error('❌ Error:', error);
    // Rollback
    lastTypingState.set(key, !isTyping);
    pendingTyping.delete(key);
  });
};

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

// Subscribe to conversation list changes
export const subscribeConversations = (
  userId: string,
  onUpdate: () => void
) => {
  const channel = supabase
    .channel('conversations_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations'
      },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversation_participants',
        filter: `user_id=eq.${userId}`
      },
      () => onUpdate()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Subscribe to messages in a conversation
export const subscribeMessages = (
  conversationId: string,
  onInsert: (message: MessageWithDetails) => void,
  onUpdate: (message: MessageWithDetails) => void,
  onDelete: (message: Message) => void
) => {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        const messageId = payload.new.id;

        // Fetch đầy đủ thông tin message như getMessages
        const { data: message } = await supabase
          .from('messages')
          .select(
            `
            *,
            sender:profiles!messages_sender_id_fkey(*),
            attachments(*)
          `
          )
          .eq('id', messageId)
          .single();

        if (!message) return;

        // Fetch reply_to nếu có
        let replyTo = null;
        if (message.reply_to_id) {
          const { data: reply } = await supabase
            .from('messages')
            .select(
              `
              id, content_text, type, sender_id, created_at,
              sender:profiles!messages_sender_id_fkey(*)
            `
            )
            .eq('id', message.reply_to_id)
            .single();
          replyTo = reply;
        }

        // Fetch reactions
        const { data: reactions } = await supabase
          .from('message_reactions')
          .select(
            `
            *,
            user:profiles!message_reactions_user_id_fkey(*)
          `
          )
          .eq('message_id', messageId);

        // Fetch read receipts
        const { data: readReceipts } = await supabase
          .from('read_receipts')
          .select('*')
          .eq('message_id', messageId);

        const fullMessage = {
          ...message,
          reply_to: replyTo,
          reactions: reactions || [],
          read_receipts: readReceipts || []
        };

        onInsert(fullMessage as unknown as MessageWithDetails);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        const messageId = payload.new.id;

        // Fetch đầy đủ thông tin
        const { data: message } = await supabase
          .from('messages')
          .select(
            `
            *,
            sender:profiles!messages_sender_id_fkey(*),
            attachments(*)
          `
          )
          .eq('id', messageId)
          .single();

        if (!message) return;

        // Fetch reply_to, reactions, read_receipts tương tự
        let replyTo = null;
        if (message.reply_to_id) {
          const { data: reply } = await supabase
            .from('messages')
            .select(
              `
              id, content_text, type, sender_id, created_at,
              sender:profiles!messages_sender_id_fkey(*)
            `
            )
            .eq('id', message.reply_to_id)
            .single();
          replyTo = reply;
        }

        const { data: reactions } = await supabase
          .from('message_reactions')
          .select(
            `
            *,
            user:profiles!message_reactions_user_id_fkey(*)
          `
          )
          .eq('message_id', messageId);

        const { data: readReceipts } = await supabase
          .from('read_receipts')
          .select('*')
          .eq('message_id', messageId);

        const fullMessage = {
          ...message,
          reply_to: replyTo,
          reactions: reactions || [],
          read_receipts: readReceipts || []
        };

        onUpdate(fullMessage as unknown as MessageWithDetails);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => onDelete(payload.old as Message)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Subscribe to reactions
export const subscribeReactions = (
  conversationId: string,
  onUpdate: () => void
) => {
  const channel = supabase
    .channel(`reactions:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'message_reactions'
      },
      () => onUpdate()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Subscribe to typing indicators
export const subscribeTyping = (
  conversationId: string,
  onTyping: (userId: string, isTyping: boolean) => void
) => {
  const channel = supabase
    .channel(`typing:${conversationId}`)
    .on('broadcast', { event: 'typing' }, (payload) => {
      onTyping(payload.payload.user_id, payload.payload.is_typing);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export { supabase };
