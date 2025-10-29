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

// Group invite type (based on SQL migration)
export interface GroupInvite {
  id: string;
  conversation_id: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
}

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
  deleted_for_me?: boolean; // Flag để hiển thị tin nhắn đã xóa ở phía user
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

// Lấy danh sách conversations (bao gồm cả direct và group) - OPTIMIZED
export const getConversations = async (
  userId: string
): Promise<ConversationWithDetails[]> => {
  // Step 1: Get all conversation IDs for this user (both direct and group)
  const { data: userConvos, error: convoError } = await supabase
    .from('conversation_participants')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId)
    .is('left_at', null);

  if (convoError) throw convoError;
  if (!userConvos || userConvos.length === 0) return [];

  const conversationIds = userConvos.map((c) => c.conversation_id);
  const lastReadMap = new Map(
    userConvos.map((c) => [c.conversation_id, c.last_read_at])
  );

  // Step 2: Fetch conversations and participants in PARALLEL
  const [conversationsRes, participantsRes, directPairsRes] =
    await Promise.all([
      // Get conversations basic info
      supabase
        .from('conversations')
        .select('id, title, type, updated_at, created_at, last_message_id, photo_url')
        .in('id', conversationIds),

      // Get ALL participants for these conversations in ONE query
      supabase
        .from('conversation_participants')
        .select('conversation_id, user_id, profile:profiles(id, display_name, avatar_url, status)')
        .in('conversation_id', conversationIds)
        .is('left_at', null),

      // Get direct pairs info in ONE query
      supabase
        .from('direct_pairs')
        .select('conversation_id, user_a, user_b')
        .in('conversation_id', conversationIds)
    ]);

  if (conversationsRes.error) throw conversationsRes.error;

  // Step 3: Get last messages based on last_message_id from conversations
  const messageIds = conversationsRes.data
    ?.map((c) => c.last_message_id)
    .filter(Boolean) as string[];

  let messagesMap = new Map<string, any>();
  if (messageIds && messageIds.length > 0) {
    const { data: messagesData } = await supabase
      .from('messages')
      .select('id, content_text, type, sender_id, created_at, recalled_at')
      .in('id', messageIds);
    
    messagesMap = new Map(
      messagesData?.map((msg) => [msg.id, msg]) || []
    );
  }

  // Step 4: Create lookup maps for efficient data assembly
  const participantsByConvo = new Map<string, any[]>();
  participantsRes.data?.forEach((p) => {
    if (!participantsByConvo.has(p.conversation_id)) {
      participantsByConvo.set(p.conversation_id, []);
    }
    participantsByConvo.get(p.conversation_id)!.push(p);
  });

  const directPairsMap = new Map(
    directPairsRes.data?.map((dp) => [dp.conversation_id, dp]) || []
  );

  // Step 5: Get unread counts in parallel for all conversations
  const unreadCountsRes = await Promise.all(
    conversationIds.map(async (convId) => {
      const lastReadAt = lastReadMap.get(convId);
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', convId)
        .gt('created_at', lastReadAt || '1970-01-01')
        .neq('sender_id', userId);
      return [convId, count || 0] as const;
    })
  );
  
  const unreadCounts = new Map<string, number>();
  unreadCountsRes.forEach(([convId, count]) => {
    unreadCounts.set(convId, count);
  });

  // Step 6: Assemble final data structure
  const conversationsWithDetails: ConversationWithDetails[] =
    conversationsRes.data?.map((convo) => {
      const participants = participantsByConvo.get(convo.id) || [];
      const lastMessage = convo.last_message_id
        ? messagesMap.get(convo.last_message_id)
        : null;
      const unreadCount = unreadCounts.get(convo.id) || 0;

      return {
        ...convo,
        participants,
        last_message: lastMessage,
        unread_count: unreadCount
      };
    }) || [];

  // Sort by updated_at descending
  return conversationsWithDetails.sort(
    (a, b) =>
      new Date(b.updated_at || 0).getTime() -
      new Date(a.updated_at || 0).getTime()
  );
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

// Lấy messages - OPTIMIZED với batch queries
export const getMessages = async (
  conversationId: string,
  limit: number = 50,
  before?: string,
  currentUserId?: string
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
      edited_at,
      fts,
      location,
      sender:profiles!messages_sender_id_fkey(*),
      attachments(*)
    `
    )
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) query = query.lt('created_at', before);

  const { data: messages, error } = await query;
  if (error) {
    console.error('Fetch messages error:', error);
    throw error;
  }

  if (!messages || messages.length === 0) return [];

  // --- STEP 1.5: Mark messages deleted by current user ---
  let deletedMessageIds = new Set<string>();
  if (currentUserId) {
    const messageIds = messages.map((m) => m.id);
    const { data: deletedMessages } = await supabase
      .from('deleted_messages')
      .select('message_id')
      .eq('user_id', currentUserId)
      .in('message_id', messageIds);

    deletedMessageIds = new Set(
      deletedMessages?.map((dm) => dm.message_id) || []
    );
  }

  const messageIds = messages.map((m) => m.id);

  // --- STEP 2: lấy các message được reply_to ---
  const replyIds = [
    ...new Set(messages.map((m) => m.reply_to_id).filter(Boolean))
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

  // --- STEP 3: BATCH fetch reactions + read receipts cho TẤT CẢ messages ---
  const [reactionsRes, receiptsRes] = await Promise.all([
    supabase
      .from('message_reactions')
      .select(
        `
        *,
        user:profiles!message_reactions_user_id_fkey(*)
      `
      )
      .in('message_id', messageIds),
    supabase.from('read_receipts').select('*').in('message_id', messageIds)
  ]);

  // Create lookup maps for reactions and receipts by message_id
  const reactionsByMessageId = new Map<string, any[]>();
  reactionsRes.data?.forEach((reaction) => {
    if (!reactionsByMessageId.has(reaction.message_id)) {
      reactionsByMessageId.set(reaction.message_id, []);
    }
    reactionsByMessageId.get(reaction.message_id)!.push(reaction);
  });

  const receiptsByMessageId = new Map<string, any[]>();
  receiptsRes.data?.forEach((receipt) => {
    if (!receiptsByMessageId.has(receipt.message_id)) {
      receiptsByMessageId.set(receipt.message_id, []);
    }
    receiptsByMessageId.get(receipt.message_id)!.push(receipt);
  });

  // --- STEP 4: Assemble messages with details ---
  const messagesWithDetails = messages.map((msg) => ({
    ...msg,
    reply_to: msg.reply_to_id ? repliesById[msg.reply_to_id] ?? null : null,
    reactions: reactionsByMessageId.get(msg.id) || [],
    read_receipts: receiptsByMessageId.get(msg.id) || [],
    deleted_for_me: deletedMessageIds.has(msg.id) // Thêm flag deleted_for_me
  }));

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
    .not('content_text', 'is', null) // Chỉ tìm messages có content
    .ilike('content_text', `%${query}%`)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Search messages error:', error);
    throw error;
  }

  // Filter out null content_text (just in case)
  return (data || []).filter((msg) => msg.content_text !== null) as { 
    id: string; 
    content_text: string; 
    created_at: string 
  }[];
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

// Recall message (delete for everyone)
export const recallMessage = async (messageId: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({
      recalled_at: new Date().toISOString()
    })
    .eq('id', messageId);

  if (error) throw error;
};

// Delete message for current user only
export const deleteMessageForMe = async (
  messageId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase.from('deleted_messages').insert({
    message_id: messageId,
    user_id: userId
  });

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
          read_receipts: readReceipts || [],
          deleted_for_me: false // New messages are not deleted
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
          read_receipts: readReceipts || [],
          deleted_for_me: false // Keep existing state or default to false
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

// ============================================
// CONVERSATION MEDIA & FILES
// ============================================

// Lấy ảnh/video từ conversation
export const getConversationMedia = async (
  conversationId: string,
  type: 'image' | 'video' | 'both' = 'both',
  limit: number = 50
): Promise<Attachment[]> => {
  let query = supabase
    .from('attachments')
    .select(
      `
      *,
      messages!inner(conversation_id, created_at)
    `
    )
    .eq('messages.conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (type === 'image') {
    query = query.eq('kind', 'image');
  } else if (type === 'video') {
    query = query.eq('kind', 'video');
  } else {
    query = query.in('kind', ['image', 'video']);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching media:', error);
    throw error;
  }

  return data || [];
};

// Lấy files từ conversation
export const getConversationFiles = async (
  conversationId: string,
  limit: number = 50
): Promise<
  Array<
    Attachment & {
      messages: { created_at: string };
    }
  >
> => {
  const { data, error } = await supabase
    .from('attachments')
    .select(
      `
      *,
      messages!inner(conversation_id, created_at)
    `
    )
    .eq('messages.conversation_id', conversationId)
    .in('kind', ['file', 'audio'])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching files:', error);
    throw error;
  }

  return data || [];
};

// Lấy links từ conversation - extract từ messages
export const getConversationLinks = async (
  conversationId: string,
  limit: number = 50
): Promise<
  Array<{
    id: string;
    content_text: string;
    created_at: string;
    urls: string[];
  }>
> => {
  const { data, error } = await supabase
    .from('messages')
    .select('id, content_text, created_at')
    .eq('conversation_id', conversationId)
    .not('content_text', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200); // Fetch more to find links

  if (error) {
    console.error('Error fetching messages for links:', error);
    throw error;
  }

  // Extract URLs using regex
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const messagesWithLinks = (data || [])
    .map((msg) => {
      const urls = msg.content_text?.match(urlRegex) || [];
      return {
        id: msg.id,
        content_text: msg.content_text || '',
        created_at: msg.created_at,
        urls
      };
    })
    .filter((msg) => msg.urls.length > 0)
    .slice(0, limit);

  return messagesWithLinks;
};

// ============================================
// GROUP CHAT FUNCTIONS
// ============================================

// Create a new group conversation
export const createGroupConversation = async (
  title: string,
  memberIds: string[], // List of user IDs to add
  creatorId: string,
  photoUrl?: string
): Promise<string> => {
  // Create conversation
  const { data: newConvo, error: convoError } = await supabase
    .from('conversations')
    .insert({
      type: 'group',
      title,
      photo_url: photoUrl || 'default-image.png',
      created_by: creatorId
    })
    .select()
    .single();

  if (convoError) throw convoError;

  // Add creator as admin
  const participants = [
    {
      conversation_id: newConvo.id,
      user_id: creatorId,
      role: 'admin' as const
    }
  ];

  // Add members
  memberIds.forEach((memberId) => {
    if (memberId !== creatorId) {
      participants.push({
        conversation_id: newConvo.id,
        user_id: memberId,
        role: 'member' as const
      });
    }
  });

  const { error: participantsError } = await supabase
    .from('conversation_participants')
    .insert(participants);

  if (participantsError) throw participantsError;

  // Create system message
  const { error: msgError } = await supabase.from('messages').insert({
    conversation_id: newConvo.id,
    sender_id: creatorId,
    type: 'system',
    content_text: `Nhóm "${title}" đã được tạo`
  });

  if (msgError) console.error('Error creating system message:', msgError);

  return newConvo.id;
};

// Generate invite link for a group
export const generateGroupInvite = async (
  conversationId: string,
  createdBy: string,
  expiresInHours?: number,
  maxUses?: number
): Promise<GroupInvite> => {
  // Generate random invite code
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

  const expiresAt = expiresInHours
    ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from('group_invites')
    .insert({
      conversation_id: conversationId,
      invite_code: inviteCode,
      created_by: createdBy,
      expires_at: expiresAt,
      max_uses: maxUses || null
    })
    .select()
    .single();

  if (error) throw error;

  return data as GroupInvite;
};

// Get active invites for a conversation
export const getGroupInvites = async (
  conversationId: string
): Promise<GroupInvite[]> => {
  const { data, error } = await supabase
    .from('group_invites')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data as GroupInvite[]) || [];
};

// Revoke/deactivate an invite
export const revokeGroupInvite = async (inviteId: string): Promise<void> => {
  const { error } = await supabase
    .from('group_invites')
    .update({ is_active: false })
    .eq('id', inviteId);

  if (error) throw error;
};

// Join group via invite code (calls database function)
export const joinGroupViaInvite = async (
  inviteCode: string
): Promise<string> => {
  const { data, error } = await supabase.rpc('join_group_via_invite', {
    _invite_code: inviteCode
  });

  if (error) throw error;

  return data as string; // Returns conversation_id
};

// Update group info (name, photo)
export const updateGroupInfo = async (
  conversationId: string,
  updates: {
    title?: string;
    photo_url?: string;
  }
): Promise<void> => {
  const { error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', conversationId);

  if (error) throw error;
};

// Add members to group
export const addGroupMembers = async (
  conversationId: string,
  userIds: string[],
  addedBy: string
): Promise<void> => {
  const participants = userIds.map((userId) => ({
    conversation_id: conversationId,
    user_id: userId,
    role: 'member' as const
  }));

  const { error } = await supabase
    .from('conversation_participants')
    .insert(participants);

  if (error) throw error;

  // Create system messages for each added member
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  if (profiles) {
    const messages = profiles.map((profile) => ({
      conversation_id: conversationId,
      sender_id: addedBy,
      type: 'system' as const,
      content_text: `${profile.display_name} đã được thêm vào nhóm`
    }));

    await supabase.from('messages').insert(messages);
  }
};

// Remove member from group
export const removeGroupMember = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ left_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) throw error;
};

// Leave group
export const leaveGroup = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ left_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) throw error;

  // Create system message
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .single();

  if (profile) {
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      type: 'system',
      content_text: `${profile.display_name} đã rời khỏi nhóm`
    });
  }
};

// Promote member to admin
export const promoteToAdmin = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('conversation_participants')
    .update({ role: 'admin' })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) throw error;
};

export { supabase };
