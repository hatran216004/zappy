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
  chat_enabled?: boolean; // For group chats: when true, only admins can send messages
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
  mentions?: {
    mentioned_user_id: string;
    user?: Database['public']['Tables']['profiles']['Row'];
  }[];
  is_forwarded?: boolean; // Flag to indicate forwarded message
  forwarded_from_user_id?: string; // Original sender ID
  forwarded_from_user?: Database['public']['Tables']['profiles']['Row']; // Original sender profile
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
  const [conversationsRes, participantsRes, directPairsRes] = await Promise.all(
    [
      // Get conversations basic info (exclude deleted groups)
      supabase
        .from('conversations')
        .select(
          'id, title, type, updated_at, created_at, last_message_id, photo_url'
        )
        .in('id', conversationIds)
        .or('is_deleted.is.null,is_deleted.eq.false'),

      // Get ALL participants for these conversations in ONE query
      supabase
        .from('conversation_participants')
        .select(
          'conversation_id, user_id, mute_until, role, profile:profiles(id, display_name, avatar_url, status)'
        )
        .in('conversation_id', conversationIds)
        .is('left_at', null),

      // Get direct pairs info in ONE query
      supabase
        .from('direct_pairs')
        .select('conversation_id, user_a, user_b')
        .in('conversation_id', conversationIds)
    ]
  );

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

    messagesMap = new Map(messagesData?.map((msg) => [msg.id, msg]) || []);
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
  // Improved: Count messages that don't have read_receipts for this user
  const unreadCountsRes = await Promise.all(
    conversationIds.map(async (convId) => {
      const lastReadAt = lastReadMap.get(convId);

      // Get all unread message IDs (messages after last_read_at, not sent by user)
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', convId)
        .gt('created_at', lastReadAt || '1970-01-01')
        .neq('sender_id', userId)
        .is('thread_id', null); // Only count main conversation messages, not thread messages

      if (!unreadMessages || unreadMessages.length === 0) {
        return [convId, 0] as const;
      }

      const unreadMessageIds = unreadMessages.map((m) => m.id);

      // Get read receipts for these messages by this user
      const { data: readReceipts } = await supabase
        .from('read_receipts')
        .select('message_id')
        .in('message_id', unreadMessageIds)
        .eq('user_id', userId);

      const readMessageIds = new Set(readReceipts?.map((r) => r.message_id) || []);

      // Count messages that don't have read receipts
      const unreadCount = unreadMessageIds.filter((id) => !readMessageIds.has(id)).length;

      return [convId, unreadCount] as const;
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

// Lấy danh sách group conversations (chỉ nhóm, không bao gồm direct chats)
export const getGroupConversations = async (
  userId: string
): Promise<ConversationWithDetails[]> => {
  // Get all conversations for user
  const allConversations = await getConversations(userId);

  // Filter only group type
  return allConversations.filter((convo) => convo.type === 'group');
};

// Lấy thông tin conversation
export const getConversation = async (
  conversationId: string
): Promise<ConversationWithDetails> => {
  const { data: convo, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .or('is_deleted.is.null,is_deleted.eq.false')
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

// Helper: Get other user ID from direct_pairs
export const getDirectPairInfo = async (
  conversationId: string,
  currentUserId: string
): Promise<{ otherUserId: string; isDirectChat: boolean }> => {
  const { data: directPair } = await supabase
    .from('direct_pairs')
    .select('user_a, user_b')
    .eq('conversation_id', conversationId)
    .maybeSingle();

  if (!directPair) {
    return { otherUserId: '', isDirectChat: false };
  }

  const otherUserId =
    directPair.user_a === currentUserId
      ? directPair.user_b
      : directPair.user_a;

  return { otherUserId, isDirectChat: true };
};

// Lấy messages - OPTIMIZED với batch queries và direct_pairs optimization
export const getMessages = async (
  conversationId: string,
  limit: number = 50,
  before?: string,
  currentUserId?: string
): Promise<MessageWithDetails[]> => {
  // Get direct pair info for optimization (parallel with message query)
  const directPairPromise = currentUserId
    ? getDirectPairInfo(conversationId, currentUserId)
    : Promise.resolve({ otherUserId: '', isDirectChat: false });

  console.log('📬 getMessages called:', {
    conversationId,
    limit,
    before: before ? 'yes' : 'no',
    currentUserId
  });
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
      location_latitude,
      location_longitude,
      location_address,
      location_display_mode,
      is_forwarded,
      forwarded_from_user_id,
      forwarded_from_user:profiles!messages_forwarded_from_user_id_fkey(*),
      mentions:message_mentions(
        mentioned_user_id,
        user:profiles!message_mentions_mentioned_user_id_fkey(*)
      ),
      sender:profiles!messages_sender_id_fkey(*),
      attachments(*)
    `
    )
    .eq('conversation_id', conversationId)
    .is('thread_id', null) // Only get messages in main conversation, not in threads
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) query = query.lt('created_at', before);

  const { data: messages, error } = await query;
  if (error) {
    console.error('Fetch messages error:', error);
    throw error;
  }

  if (!messages || messages.length === 0) return [];

  // Get direct pair info
  const { otherUserId, isDirectChat } = await directPairPromise;

  if (isDirectChat && otherUserId) {
    console.log('📬 Direct chat detected:', {
      conversationId,
      currentUser: currentUserId,
      otherUser: otherUserId,
      messageCount: messages.length
    });
  }

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
// Helper: Check if message can be sent (block strangers check)
const checkCanSendMessage = async (
  conversationId: string,
  senderId: string
): Promise<void> => {
  // Get conversation info
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('type, id')
    .eq('id', conversationId)
    .single();

  if (convError || !conversation) {
    throw new Error('Conversation not found');
  }

  // For direct conversations, check if recipient blocks strangers
  if (conversation.type === 'direct') {
    // Get direct pair to find recipient
    const { data: pair } = await supabase
      .from('direct_pairs')
      .select('user_a, user_b')
      .eq('conversation_id', conversationId)
      .single();

    if (pair) {
      const recipientId = pair.user_a === senderId ? pair.user_b : pair.user_a;

      // Get recipient profile to check setting
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('block_messages_from_strangers')
        .eq('id', recipientId)
        .single();

      // Check if blocked (either direction)
      const { data: blockData } = await supabase
        .from('blocks')
        .select('id')
        .or(
          `and(blocker_id.eq.${senderId},blocked_id.eq.${recipientId}),and(blocker_id.eq.${recipientId},blocked_id.eq.${senderId})`
        )
        .maybeSingle();

      if (blockData) {
        throw new Error(
          'Bạn không thể nhắn tin với người dùng này do đã bị chặn'
        );
      }

      // If recipient blocks strangers, check if sender is a friend
      if (recipientProfile?.block_messages_from_strangers) {
        // Check if they are friends (friends table: user_id -> friend_id)
        const { data: friendship1 } = await supabase
          .from('friends')
          .select('id')
          .eq('user_id', senderId)
          .eq('friend_id', recipientId)
          .maybeSingle();

        const { data: friendship2 } = await supabase
          .from('friends')
          .select('id')
          .eq('user_id', recipientId)
          .eq('friend_id', senderId)
          .maybeSingle();

        if (!friendship1 && !friendship2) {
          throw new Error(
            'Người nhận đã bật chế độ chặn tin nhắn từ người lạ. Bạn cần kết bạn trước.'
          );
        }
      }
    }
  }
  // For group conversations, allow (group admins can manage)
};

// Detect and replace special effects from message content
const detectMessageEffect = (content: string): { effect: string | null; cleanContent: string } => {
  const effects: Record<string, { effect: string; emoji: string }> = {
    ':fire:': { effect: 'fire', emoji: '🔥' },
    ':clap:': { effect: 'clap', emoji: '👏' }
  };

  let cleanContent = content;
  let detectedEffect: string | null = null;

  for (const [shortcode, { effect, emoji }] of Object.entries(effects)) {
    if (content.includes(shortcode)) {
      // Replace shortcode with emoji
      cleanContent = cleanContent.replace(new RegExp(shortcode, 'g'), emoji);
      detectedEffect = effect;
      break; // Only one effect per message
    }
  }

  return { effect: detectedEffect, cleanContent };
};

export const sendTextMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  replyToId?: string,
  mentionedUserIds?: string[]
): Promise<Message> => {
  // Check if message can be sent (block strangers check)
  await checkCanSendMessage(conversationId, senderId);

  // Detect special effects and replace shortcodes with emojis
  const { effect, cleanContent } = detectMessageEffect(content);

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      type: 'text',
      content_text: cleanContent, // Use cleaned content with emojis
      reply_to_id: replyToId,
      effect: effect
    })
    .select()
    .single();

  if (error) throw error;

  // Insert mentions if any
  if (mentionedUserIds && mentionedUserIds.length > 0) {
    const rows = mentionedUserIds.map((uid) => ({
      message_id: data.id,
      mentioned_user_id: uid
    }));
    const { error: mentionErr } = await supabase
      .from('message_mentions')
      .insert(rows);
    if (mentionErr) console.error('Insert mentions error:', mentionErr);
  }

  // Update conversation's last_message_id and updated_at
  await supabase
    .from('conversations')
    .update({
      last_message_id: data.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId);

  // Create notifications for other participants
  try {
    // Get sender info
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', senderId)
      .single();

    // Get conversation participants (excluding sender)
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id, mute_until, notif_level')
      .eq('conversation_id', conversationId)
      .neq('user_id', senderId)
      .is('left_at', null);

    if (participants && participants.length > 0 && senderProfile) {
      const now = new Date();
      const mentionedUserIdsSet = new Set(mentionedUserIds || []);

      // Filter participants based on mute status and notification level
      const eligibleParticipants = participants.filter((participant) => {
        // Check if muted
        if (participant.mute_until) {
          const muteDate = new Date(participant.mute_until);
          if (muteDate > now) {
            return false; // Muted, skip notification
          }
        }

        // Check notification level
        const notifLevel = participant.notif_level || 'all';

        if (notifLevel === 'none') {
          return false; // Notifications disabled
        }

        if (notifLevel === 'mentions') {
          // Only notify if user is mentioned
          return mentionedUserIdsSet.has(participant.user_id);
        }

        // notifLevel === 'all' - notify for all messages
        return true;
      });

      if (eligibleParticipants.length > 0) {
        const notifications = eligibleParticipants.map((participant) => {
          const isMentioned = mentionedUserIdsSet.has(participant.user_id);
          return {
            user_id: participant.user_id,
            type: isMentioned ? 'message_mention' : 'new_message',
            data: {
              sender_id: senderId,
              sender_name: senderProfile.display_name,
              sender_avatar: senderProfile.avatar_url,
              conversation_id: conversationId,
              message_id: data.id,
              message: content,
              preview: content.substring(0, 100),
              is_mention: isMentioned
            }
          };
        });

        await supabase.from('notifications').insert(notifications);
      }
    }
  } catch (notifError) {
    console.error('Error creating notifications:', notifError);
    // Don't throw error, message was sent successfully
  }

  return data;
};

// Upload file and send message
export const sendFileMessage = async (
  conversationId: string,
  senderId: string,
  file: File,
  type: 'image' | 'video' | 'file' | 'audio'
): Promise<Message> => {
  // Check if message can be sent (block strangers check)
  await checkCanSendMessage(conversationId, senderId);

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
    created_at: string;
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

// Admin delete message (xóa tin nhắn của thành viên khác trong nhóm)
export const deleteMessageAsAdmin = async (
  messageId: string,
  adminId: string,
  conversationId: string
): Promise<void> => {
  // Check if user is admin
  const { data: participant, error: participantError } = await supabase
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', adminId)
    .is('left_at', null)
    .single();

  if (participantError || !participant) {
    throw new Error('Không tìm thấy thông tin thành viên');
  }

  if (participant.role !== 'admin') {
    throw new Error('Chỉ admin mới có quyền xóa tin nhắn của thành viên khác');
  }

  // Check if conversation is group
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('type')
    .eq('id', conversationId)
    .single();

  if (convError || !conversation || conversation.type !== 'group') {
    throw new Error('Chỉ có thể xóa tin nhắn trong nhóm');
  }

  // Delete message (set recalled_at)
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

// Forward message to another conversation
export const forwardMessage = async ({
  messageId,
  targetConversationId,
  senderId
}: {
  messageId: string;
  targetConversationId: string;
  senderId: string;
}) => {
  // Get original message
  const { data: originalMessage, error: fetchError } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (fetchError || !originalMessage) {
    throw new Error('Message not found');
  }

  // Create new message in target conversation with forwarded flag
  const { data: newMessage, error: insertError } = await supabase
    .from('messages')
    .insert({
      conversation_id: targetConversationId,
      sender_id: senderId,
      type: originalMessage.type,
      content_text: originalMessage.content_text,
      is_forwarded: true,
      forwarded_from_user_id: originalMessage.sender_id
    })
    .select()
    .single();

  if (insertError) throw insertError;

  // Copy attachments if any
  if (originalMessage.type !== 'text' && originalMessage.type !== 'system') {
    const { data: attachments } = await supabase
      .from('attachments')
      .select('*')
      .eq('message_id', messageId);

    if (attachments && attachments.length > 0) {
      const newAttachments = attachments.map((att) => ({
        message_id: newMessage.id,
        kind: att.kind,
        storage_path: att.storage_path,
        mime_type: att.mime_type,
        byte_size: att.byte_size,
        width: att.width,
        height: att.height,
        duration_ms: att.duration_ms,
        uploader_id: senderId
      }));

      await supabase.from('attachments').insert(newAttachments);
    }
  }

  // Update last_message_id
  await supabase
    .from('conversations')
    .update({
      last_message_id: newMessage.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', targetConversationId);

  return newMessage;
};

// Send location message
export const sendLocationMessage = async (
  conversationId: string,
  senderId: string,
  latitude: number,
  longitude: number,
  address?: string,
  displayMode: 'interactive' | 'static' = 'interactive'
): Promise<Message> => {
  // Check if message can be sent (block strangers check)
  await checkCanSendMessage(conversationId, senderId);

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      type: 'location',
      content_text:
        address || `📍 Vị trí: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      location_latitude: latitude,
      location_longitude: longitude,
      location_address: address,
      location_display_mode: displayMode
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

// ============================================
// REACTIONS
// ============================================

// Add reaction
// Logic:
// - 1 user chỉ được react 1 emoji per message
// - Nếu chọn emoji khác → thay thế emoji cũ
// - Nếu click lại emoji đã có → giữ nguyên (count không đổi)
// - Nhiều user cùng react → count tự động tăng (database tự xử lý)
export const addReaction = async (
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> => {
  // Check if user already has a reaction on this message
  const { data: existingReactions, error: checkError } = await supabase
    .from('message_reactions')
    .select('emoji')
    .eq('message_id', messageId)
    .eq('user_id', userId);

  if (checkError) throw checkError;

  // Check if user has reactions with different emoji
  const hasDifferentEmoji = existingReactions?.some((r) => r.emoji !== emoji);

  // Case 1: User có emoji khác → Xóa tất cả reactions cũ, thêm emoji mới (thay thế)
  // 1 user chỉ được react 1 loại emoji (nhưng có thể click nhiều lần để tăng count)
  if (hasDifferentEmoji) {
    // Remove all existing reactions from this user
    const { error: deleteError } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;
  }

  // Case 2: User đã có emoji này hoặc chưa có → Thêm reaction mới (tăng count)
  // Nếu click lại emoji đã có → thêm duplicate → count tăng
  // Nếu chưa có → thêm mới
  const { error: insertError } = await supabase
    .from('message_reactions')
    .insert({
      message_id: messageId,
      user_id: userId,
      emoji
    });

  if (insertError) {
    // If duplicate constraint exists, try to handle gracefully
    if (insertError.code === '23505') {
      // Unique constraint violation - might have unique constraint on (message_id, user_id, emoji)
      // In this case, user can't add duplicate, but we should still allow if they have different emoji
      throw new Error('Không thể thêm reaction trùng lặp');
    }
    throw insertError;
  }
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
// MESSAGE REPORTS
// ============================================

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'inappropriate_content'
  | 'violence'
  | 'hate_speech'
  | 'fake_news'
  | 'other';

export interface MessageReport {
  id: string;
  message_id: string;
  reported_by: string;
  reason: ReportReason;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// Report a message
export const reportMessage = async (
  messageId: string,
  reportedBy: string,
  reason: ReportReason,
  description?: string
): Promise<MessageReport> => {
  // Check if user already reported this message
  const { data: existingReport } = await supabase
    .from('message_reports')
    .select('id')
    .eq('message_id', messageId)
    .eq('reported_by', reportedBy)
    .single();

  if (existingReport) {
    throw new Error('Bạn đã báo cáo tin nhắn này rồi');
  }

  const { data, error } = await supabase
    .from('message_reports')
    .insert({
      message_id: messageId,
      reported_by: reportedBy,
      reason,
      description: description || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get reports by user
export const getUserReports = async (
  userId: string
): Promise<MessageReport[]> => {
  const { data, error } = await supabase
    .from('message_reports')
    .select('*')
    .eq('reported_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// ============================================
// CONVERSATION REPORTS
// ============================================

export interface ConversationReport {
  id: string;
  conversation_id: string;
  reported_by: string;
  reason: ReportReason;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// Report a conversation (group only)
export const reportConversation = async (
  conversationId: string,
  reportedBy: string,
  reason: ReportReason,
  description?: string
): Promise<ConversationReport> => {
  // Verify it's a group conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('type')
    .eq('id', conversationId)
    .single();

  if (convError) throw convError;
  if (conversation?.type !== 'group') {
    throw new Error('Chỉ có thể báo cáo cuộc trò chuyện nhóm');
  }

  // Verify user is a participant
  const { data: participant, error: participantError } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', reportedBy)
    .is('left_at', null)
    .maybeSingle();

  if (participantError) throw participantError;
  if (!participant) {
    throw new Error('Bạn phải là thành viên của nhóm để báo cáo');
  }

  // Check if user already reported this conversation
  const { data: existingReport } = await supabase
    .from('conversation_reports')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('reported_by', reportedBy)
    .single();

  if (existingReport) {
    throw new Error('Bạn đã báo cáo cuộc trò chuyện này rồi');
  }

  const { data, error } = await supabase
    .from('conversation_reports')
    .insert({
      conversation_id: conversationId,
      reported_by: reportedBy,
      reason,
      description: description || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get conversation reports by user
export const getUserConversationReports = async (
  userId: string
): Promise<ConversationReport[]> => {
  const { data, error } = await supabase
    .from('conversation_reports')
    .select('*')
    .eq('reported_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
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

  console.log(
    `🔍 sendTypingIndicator: isTyping=${isTyping}, lastState=${lastState}, pending=${isPending}`
  );

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
  channel
    .send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: userId, is_typing: isTyping }
    })
    .then(() => {
      console.log(`✅ Sent: ${isTyping ? 'START ▶️' : 'STOP ⏹️'}`);
      pendingTyping.delete(key);
    })
    .catch((error: any) => {
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
        console.log('📥 INSERT event received:', {
          messageId: payload.new.id,
          conversationId: payload.new.conversation_id,
          threadId: payload.new.thread_id,
          senderId: payload.new.sender_id
        });

        // Filter out thread messages manually
        if (payload.new.thread_id !== null) {
          console.log('⏭️ Skipping thread message:', payload.new.id);
          return;
        }

        // Double check conversation_id
        if (payload.new.conversation_id !== conversationId) {
          console.warn('⚠️ Message conversation_id mismatch:', payload.new.conversation_id, 'expected:', conversationId);
          return;
        }

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
          deleted_for_me: false, // New messages are not deleted
          mentions: [] // Initialize mentions array
        };

        console.log('📨 Realtime message received:', fullMessage.id);
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
        // Filter out thread messages manually
        if (payload.new.thread_id !== null || payload.new.conversation_id !== conversationId) {
          return;
        }

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
      (payload) => {
        // Filter out thread messages manually
        if (payload.old.thread_id !== null || payload.old.conversation_id !== conversationId) {
          return;
        }
        onDelete(payload.old as Message);
      }
    )
    .subscribe((status, err) => {
      console.log('📡 Messages subscription status:', status, 'for conversation:', conversationId);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to messages for conversation:', conversationId);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error for conversation:', conversationId, err);
      } else if (status === 'TIMED_OUT') {
        console.error('⏱️ Subscription timed out for conversation:', conversationId);
      } else if (status === 'CLOSED') {
        console.warn('🔒 Subscription closed for conversation:', conversationId);
      }
    });

  return () => {
    console.log('🔌 Unsubscribing from messages:', conversationId);
    supabase.removeChannel(channel);
  };
};

// Subscribe to read receipts for a conversation
export const subscribeReadReceipts = (
  conversationId: string,
  onInsert: (receipt: ReadReceipt) => void,
  onUpdate: (receipt: ReadReceipt) => void
) => {
  // Get all message IDs in this conversation (for filtering)
  // We'll filter by messages that belong to this conversation and have no thread_id
  const channel = supabase
    .channel(`read_receipts:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'read_receipts',
        filter: `message_id=in.(SELECT id FROM messages WHERE conversation_id=eq.${conversationId} AND thread_id IS NULL)`
      },
      (payload) => {
        onInsert(payload.new as ReadReceipt);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'read_receipts',
        filter: `message_id=in.(SELECT id FROM messages WHERE conversation_id=eq.${conversationId} AND thread_id IS NULL)`
      },
      (payload) => {
        onUpdate(payload.new as ReadReceipt);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Subscribe to read receipts for a thread
export const subscribeThreadReadReceipts = (
  threadId: string,
  onInsert: (receipt: ReadReceipt) => void,
  onUpdate: (receipt: ReadReceipt) => void
) => {
  const channel = supabase
    .channel(`thread_read_receipts:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'read_receipts',
        filter: `message_id=in.(SELECT id FROM messages WHERE thread_id=eq.${threadId})`
      },
      (payload) => {
        onInsert(payload.new as ReadReceipt);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'read_receipts',
        filter: `message_id=in.(SELECT id FROM messages WHERE thread_id=eq.${threadId})`
      },
      (payload) => {
        onUpdate(payload.new as ReadReceipt);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Subscribe to reactions
export const subscribeReactions = (
  conversationId: string,
  onInsert: (reaction: {
    message_id: string;
    reaction: MessageReaction & { user: any };
  }) => void,
  onDelete: (reaction: {
    message_id: string;
    user_id: string;
    emoji: string;
  }) => void
) => {
  const channel = supabase
    .channel(`reactions:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'message_reactions'
      },
      async (payload) => {
        const reaction = payload.new as MessageReaction;

        // Fetch message to check if it belongs to this conversation
        const { data: message } = await supabase
          .from('messages')
          .select('conversation_id')
          .eq('id', reaction.message_id)
          .single();

        // Only process if message belongs to this conversation
        if (!message || message.conversation_id !== conversationId) {
          return;
        }

        // Fetch user details
        const { data: user } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', reaction.user_id)
          .single();

        onInsert({
          message_id: reaction.message_id,
          reaction: {
            ...reaction,
            user: user || null
          }
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'message_reactions'
      },
      async (payload) => {
        const reaction = payload.old as MessageReaction;

        // Fetch message to check if it belongs to this conversation
        const { data: message } = await supabase
          .from('messages')
          .select('conversation_id')
          .eq('id', reaction.message_id)
          .single();

        // Only process if message belongs to this conversation
        if (!message || message.conversation_id !== conversationId) {
          return;
        }

        onDelete({
          message_id: reaction.message_id,
          user_id: reaction.user_id,
          emoji: reaction.emoji
        });
      }
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
  // Create conversation (chat_enabled defaults to false)
  const { data: newConvo, error: convoError } = await supabase
    .from('conversations')
    .insert({
      type: 'group',
      title,
      photo_url: photoUrl || 'default-image.png',
      created_by: creatorId,
      chat_enabled: false // Mặc định tắt chat, chỉ admin mới có thể bật
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

// Toggle chat enabled status (only admins)
export const toggleChatEnabled = async (
  conversationId: string,
  adminId: string,
  enabled: boolean
): Promise<void> => {
  // Verify user is admin
  const { data: participant, error: participantError } = await supabase
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', adminId)
    .is('left_at', null)
    .single();

  if (participantError || !participant || participant.role !== 'admin') {
    throw new Error('Chỉ admin mới có quyền bật/tắt chat');
  }

  // Verify it's a group conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('type')
    .eq('id', conversationId)
    .single();

  if (convError) throw convError;
  if (conversation?.type !== 'group') {
    throw new Error('Chỉ có thể bật/tắt chat cho nhóm');
  }

  // Update chat_enabled
  const { error } = await supabase
    .from('conversations')
    .update({ chat_enabled: enabled })
    .eq('id', conversationId);

  if (error) throw error;

  // Create system message
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', adminId)
    .single();

  const adminName = adminProfile?.display_name || 'Admin';
  const message = enabled
    ? `${adminName} đã bật chế độ chỉ admin mới được chat`
    : `${adminName} đã tắt chế độ chỉ admin mới được chat`;

  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: adminId,
    type: 'system',
    content_text: message
  });
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
  if (!userIds || userIds.length === 0) {
    throw new Error('Không có thành viên nào để thêm');
  }

  // Check existing participants (both active and inactive)
  const { data: existingParticipants, error: checkError } = await supabase
    .from('conversation_participants')
    .select('user_id, left_at')
    .eq('conversation_id', conversationId)
    .in('user_id', userIds);

  if (checkError) throw checkError;

  const existingUserIds = new Set(
    existingParticipants?.map((p) => p.user_id) || []
  );
  const leftUserIds = new Set(
    existingParticipants
      ?.filter((p) => p.left_at !== null)
      .map((p) => p.user_id) || []
  );

  // Separate new members and members who left (need to rejoin)
  const newMemberIds: string[] = [];
  const rejoinMemberIds: string[] = [];

  userIds.forEach((userId) => {
    if (!existingUserIds.has(userId)) {
      newMemberIds.push(userId);
    } else if (leftUserIds.has(userId)) {
      rejoinMemberIds.push(userId);
    }
  });

  // Rejoin members who left (update left_at to null)
  if (rejoinMemberIds.length > 0) {
    const { error: rejoinError } = await supabase
      .from('conversation_participants')
      .update({ left_at: null })
      .eq('conversation_id', conversationId)
      .in('user_id', rejoinMemberIds);

    if (rejoinError) throw rejoinError;
  }

  // Add new members
  if (newMemberIds.length > 0) {
    const participants = newMemberIds.map((userId) => ({
      conversation_id: conversationId,
      user_id: userId,
      role: 'member' as const
    }));

    const { error: insertError } = await supabase
      .from('conversation_participants')
      .insert(participants);

    if (insertError) throw insertError;
  }

  // Get all added member IDs (both new and rejoined)
  const allAddedMemberIds = [...newMemberIds, ...rejoinMemberIds];

  if (allAddedMemberIds.length === 0) {
    throw new Error('Tất cả người dùng đã là thành viên của nhóm');
  }

  // Create system messages for each added member
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', allAddedMemberIds);

  if (profiles && profiles.length > 0) {
    const messages = profiles.map((profile) => ({
      conversation_id: conversationId,
      sender_id: addedBy,
      type: 'system' as const,
      content_text: `${profile.display_name} đã được thêm vào nhóm`
    }));

    const { error: msgError } = await supabase.from('messages').insert(messages);
    if (msgError) {
      console.error('Error creating system messages:', msgError);
      // Don't throw, just log - members were added successfully
    }
  }
};

// Remove member from group
export const removeGroupMember = async (
  conversationId: string,
  userId: string,
  removedBy: string // ID của admin thực hiện xóa
): Promise<void> => {
  // Update left_at
  const { error } = await supabase
    .from('conversation_participants')
    .update({ left_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);

  if (error) throw error;

  // Get member và admin names
  const [memberResult, adminResult] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', userId).single(),
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', removedBy)
      .single()
  ]);

  const memberName = memberResult.data?.display_name || 'Thành viên';
  const adminName = adminResult.data?.display_name || 'Admin';

  // Create system message
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: removedBy,
    type: 'system',
    content_text: `${memberName} đã bị ${adminName} xóa khỏi nhóm`
  });
};

// Transfer admin role to another member
export const transferAdminRole = async (
  conversationId: string,
  currentAdminId: string,
  newAdminId: string
): Promise<void> => {
  // Check if current user is admin
  const { data: currentAdmin, error: adminError } = await supabase
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', currentAdminId)
    .is('left_at', null)
    .single();

  if (adminError || !currentAdmin || currentAdmin.role !== 'admin') {
    throw new Error('Chỉ admin mới có quyền chuyển quyền admin');
  }

  // Check if new admin is a member
  const { data: newAdmin, error: memberError } = await supabase
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', newAdminId)
    .is('left_at', null)
    .single();

  if (memberError || !newAdmin) {
    throw new Error('Thành viên không tồn tại trong nhóm');
  }

  // Transfer admin role
  const { error: updateError1 } = await supabase
    .from('conversation_participants')
    .update({ role: 'member' })
    .eq('conversation_id', conversationId)
    .eq('user_id', currentAdminId);

  if (updateError1) throw updateError1;

  const { error: updateError2 } = await supabase
    .from('conversation_participants')
    .update({ role: 'admin' })
    .eq('conversation_id', conversationId)
    .eq('user_id', newAdminId);

  if (updateError2) throw updateError2;

  // Create system message
  const [currentAdminProfile, newAdminProfile] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', currentAdminId)
      .single(),
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', newAdminId)
      .single()
  ]);

  const currentName = currentAdminProfile.data?.display_name || 'Admin';
  const newName = newAdminProfile.data?.display_name || 'Thành viên';

  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: currentAdminId,
    type: 'system',
    content_text: `${currentName} đã chuyển quyền admin cho ${newName}`
  });
};

// Leave group
export const leaveGroup = async (
  conversationId: string,
  userId: string
): Promise<{ isLastAdmin: boolean; adminCount: number }> => {
  // Check if user is admin and count remaining admins
  const { data: userParticipant } = await supabase
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .is('left_at', null)
    .single();

  const isAdmin = userParticipant?.role === 'admin';

  if (isAdmin) {
    // Count remaining admins (excluding current user)
    const { data: admins, error: adminError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .eq('role', 'admin')
      .is('left_at', null);

    if (adminError) throw adminError;

    const adminCount = admins?.filter((a) => a.user_id !== userId).length || 0;

    if (adminCount === 0) {
      // This is the last admin
      return { isLastAdmin: true, adminCount: 0 };
    }
  }

  // Proceed with leaving
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

  return { isLastAdmin: false, adminCount: 0 };
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

// Delete group (soft delete - only admin)
export const deleteGroup = async (
  conversationId: string,
  adminId: string
): Promise<void> => {
  // Verify user is admin
  const { data: participant, error: checkError } = await supabase
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', adminId)
    .is('left_at', null)
    .single();

  if (checkError) throw checkError;
  if (participant?.role !== 'admin') {
    throw new Error('Chỉ admin mới có thể xóa nhóm');
  }

  // Verify it's a group conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('type')
    .eq('id', conversationId)
    .single();

  if (convError) throw convError;
  if (conversation?.type !== 'group') {
    throw new Error('Chỉ có thể xóa nhóm, không thể xóa cuộc trò chuyện 1-1');
  }

  // Soft delete: update is_deleted = true
  const { error: updateError } = await supabase
    .from('conversations')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (updateError) throw updateError;

  // Create system message
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', adminId)
    .single();

  if (profile) {
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: adminId,
      type: 'system',
      content_text: `${profile.display_name} đã xóa nhóm`
    });
  }
};

// ============================================
// CONVERSATION BACKGROUND
// ============================================

// Update conversation background
export const updateConversationBackground = async (
  conversationId: string,
  backgroundType: 'color' | 'gradient' | 'image',
  backgroundValue: string
): Promise<void> => {
  const { error } = await supabase
    .from('conversations')
    .update({
      background_type: backgroundType,
      background_value: backgroundValue,
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId);

  if (error) throw error;
};

export { supabase };

// ============================================
// PINNED MESSAGES
// ============================================

export type PinnedMessage = {
  id: string;
  conversation_id: string;
  message_id: string;
  pinned_by: string;
  created_at: string;
  message?: Pick<
    MessageWithDetails,
    'id' | 'content_text' | 'sender' | 'created_at' | 'type'
  >;
};

// Get pinned messages for a conversation (latest first, max 3)
export const getPinnedMessages = async (
  conversationId: string
): Promise<PinnedMessage[]> => {
  // Fetch pinned rows
  const { data, error } = await supabase
    .from('pinned_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) throw error;
  const pins = data || [];

  if (pins.length === 0) return [];

  // Fetch messages for these pins
  const messageIds = pins.map((p) => p.message_id);
  const { data: msgs } = await supabase
    .from('messages')
    .select(
      `
      id, content_text, type, sender_id, created_at,
      sender:profiles!messages_sender_id_fkey(*)
    `
    )
    .in('id', messageIds);

  const byId = new Map(
    (msgs || []).map((m) => [m.id, m as unknown as PinnedMessage['message']])
  );

  return pins.map((p) => ({
    ...p,
    message: byId.get(p.message_id)
  }));
};

// Pin a message (enforced max 3 by trigger)
export const pinMessage = async (
  conversationId: string,
  messageId: string,
  userId: string
): Promise<void> => {
  // Optional client-side guard
  const current = await getPinnedMessages(conversationId);
  if (current.find((p) => p.message_id === messageId)) return; // already pinned
  if (current.length >= 3) {
    throw new Error('Tối đa ghim 3 tin nhắn cho mỗi cuộc trò chuyện');
  }

  const { error } = await supabase.from('pinned_messages').insert({
    conversation_id: conversationId,
    message_id: messageId,
    pinned_by: userId
  });

  if (error) throw error;
};

// Unpin by messageId
export const unpinMessage = async (
  conversationId: string,
  messageId: string
): Promise<void> => {
  const { error } = await supabase
    .from('pinned_messages')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('message_id', messageId);

  if (error) throw error;
};

// Subscribe to pinned messages changes
export const subscribePinnedMessages = (
  conversationId: string,
  onChange: () => void
) => {
  const channel = supabase
    .channel(`pins:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pinned_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// ============================================
// POLLS
// ============================================

export type Poll = {
  id: string;
  conversation_id: string;
  message_id: string;
  question: string;
  multiple: boolean;
  created_by: string;
  created_at: string;
};

export type PollOption = {
  id: string;
  poll_id: string;
  option_text: string;
  idx: number;
  votes_count?: number;
};

export type PollWithOptions = Poll & {
  options: (PollOption & { votes_count: number })[];
  my_votes?: string[]; // option_ids
  allowed_participants?: string[]; // user_ids who can vote (empty = all can vote)
  can_vote?: boolean; // whether current user can vote
};

export const createPoll = async (
  conversationId: string,
  creatorId: string,
  question: string,
  options: string[],
  multiple: boolean,
  participantIds?: string[] // Optional: if provided, only these users can vote
): Promise<{ message: Message; poll: PollWithOptions }> => {
  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: creatorId,
      type: 'poll',
      content_text: question
    })
    .select()
    .single();
  if (msgErr) throw msgErr;

  const { data: poll, error: pollErr } = await supabase
    .from('polls')
    .insert({
      conversation_id: conversationId,
      message_id: msg.id,
      question,
      multiple,
      created_by: creatorId
    })
    .select()
    .single();
  if (pollErr) throw pollErr;

  const optionRows = options
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t, i) => ({
      poll_id: poll.id,
      option_text: t,
      idx: i
    }));
  if (optionRows.length < 2) {
    throw new Error('Cần ít nhất 2 lựa chọn');
  }
  const { error: optErr } = await supabase
    .from('poll_options')
    .insert(optionRows);
  if (optErr) throw optErr;

  // Add poll participants if specified
  if (participantIds && participantIds.length > 0) {
    const participantRows = participantIds.map((userId) => ({
      poll_id: poll.id,
      user_id: userId
    }));
    const { error: participantErr } = await supabase
      .from('poll_participants')
      .insert(participantRows);
    if (participantErr) throw participantErr;
  }

  await supabase
    .from('conversations')
    .update({ last_message_id: msg.id, updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  const full = await getPollByMessage(msg.id, creatorId);
  return { message: msg, poll: full };
};

export const getPollByMessage = async (
  messageId: string,
  currentUserId?: string
): Promise<PollWithOptions> => {
  const { data: poll, error } = await supabase
    .from('polls')
    .select('*')
    .eq('message_id', messageId)
    .single();
  if (error || !poll) throw error || new Error('Poll not found');

  const [{ data: options }, { data: myVotes }, { data: allVotes }, { data: participants }] =
    await Promise.all([
      supabase
        .from('poll_options')
        .select('*')
        .eq('poll_id', poll.id)
        .order('idx', { ascending: true }),
      currentUserId
        ? supabase
          .from('poll_votes')
          .select('option_id')
          .eq('poll_id', poll.id)
          .eq('user_id', currentUserId)
        : Promise.resolve({ data: [] as any } as any),
      supabase.from('poll_votes').select('option_id').eq('poll_id', poll.id),
      supabase
        .from('poll_participants')
        .select('user_id')
        .eq('poll_id', poll.id)
    ]);

  const countByOption = new Map<string, number>();
  (allVotes || []).forEach((r: any) => {
    const k = r.option_id as string;
    countByOption.set(k, (countByOption.get(k) || 0) + 1);
  });

  const allowedParticipants = (participants || []).map((p: any) => p.user_id);
  const canVote = !currentUserId
    ? false
    : allowedParticipants.length === 0
      ? true
      : allowedParticipants.includes(currentUserId);

  return {
    ...(poll as Poll),
    options: (options || []).map((o) => ({
      ...o,
      votes_count: countByOption.get(o.id) || 0
    })),
    my_votes: (myVotes || []).map((v: any) => v.option_id),
    allowed_participants: allowedParticipants,
    can_vote: canVote
  };
};

export const votePoll = async (
  pollId: string,
  optionId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('poll_votes')
    .insert({ poll_id: pollId, option_id: optionId, user_id: userId });
  if (error) throw error;
};

export const unvotePoll = async (
  pollId: string,
  optionId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('poll_votes')
    .delete()
    .eq('poll_id', pollId)
    .eq('option_id', optionId)
    .eq('user_id', userId);
  if (error) throw error;
};

export const subscribePollVotes = (
  conversationId: string,
  onChange: (payload: { poll_id: string }) => void
) => {
  const channel = supabase
    .channel(`polls:${conversationId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'poll_votes' },
      async (payload) => {
        const pollId =
          (payload.new as any)?.poll_id || (payload.old as any)?.poll_id;
        if (!pollId) return;
        const { data: poll } = await supabase
          .from('polls')
          .select('conversation_id')
          .eq('id', pollId)
          .single();
        if (poll?.conversation_id === conversationId) {
          onChange({ poll_id: pollId });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// More efficient subscription for a specific poll id
export const subscribePollVotesForPoll = (
  pollId: string,
  onChange: () => void
) => {
  const channel = supabase
    .channel(`poll:${pollId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'poll_votes',
        filter: `poll_id=eq.${pollId}`
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// ============================================
// SEARCH CONVERSATIONS (direct + group)
// ============================================

export type ConversationSearchResult = {
  id: string;
  type: 'direct' | 'group';
  title: string;
  photo_url: string | null;
  other_participant?: {
    id: string;
    display_name: string;
    username: string | null;
    avatar_url: string | null;
    status: Database['public']['Tables']['profiles']['Row']['status'] | null;
  };
  last_message_preview?: string | null;
};

export const searchConversations = async (
  userId: string,
  term: string
): Promise<ConversationSearchResult[]> => {
  const query = term.trim().toLowerCase();
  if (query.length < 2) return [];

  // 1) Load all conversations for user (cached util functions)
  const all = await getConversations(userId);

  // 2) If searching email, get matching profile ids from auth.users via RPC
  let emailMatchedIds = new Set<string>();
  if (query.includes('@')) {
    const rpcClient = supabase as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message?: string } | null }>;
    };
    const { data, error } = await rpcClient.rpc('search_users_by_email', {
      _term: term,
      _current_user_id: userId
    });
    if (!error && data) {
      const profiles =
        data as Database['public']['Tables']['profiles']['Row'][];
      emailMatchedIds = new Set(profiles.map((p) => p.id));
    }
  }

  // 3) Filter conversations
  const results: ConversationSearchResult[] = [];
  for (const convo of all) {
    if (convo.type === 'group') {
      const title = (convo.title || '').toLowerCase();
      if (title.includes(query)) {
        results.push({
          id: convo.id,
          type: 'group',
          title: convo.title || 'Nhóm',
          photo_url: convo.photo_url || null,
          last_message_preview: convo.last_message?.content_text || null
        });
      }
    } else {
      // direct: find the other participant
      const other = (convo.participants || []).find(
        (p) => p.user_id !== userId
      )?.profile;
      if (!other) continue;
      const dn = (other.display_name || '').toLowerCase();
      const un = (other as any).username
        ? String((other as any).username).toLowerCase()
        : '';
      const match =
        dn.includes(query) ||
        (un && un.includes(query)) ||
        (emailMatchedIds.size > 0 && emailMatchedIds.has(other.id));
      if (match) {
        results.push({
          id: convo.id,
          type: 'direct',
          title: other.display_name || 'Direct',
          photo_url: other.avatar_url || null,
          other_participant: {
            id: other.id,
            display_name: other.display_name || '',
            username: (other as any).username || null,
            avatar_url: other.avatar_url,
            status: other.status || null
          },
          last_message_preview: convo.last_message?.content_text || null
        });
      }
    }
  }

  // Optional: limit results
  return results.slice(0, 20);
};

// Start chat with any user (allows messaging strangers)
// Uses RPC function to get or create direct conversation
export const startChatWithUser = async (
  userId: string
): Promise<Conversation> => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  // Check if blocked (either direction)
  const { data: blockData } = await supabase
    .from('blocks')
    .select('id')
    .or(
      `and(blocker_id.eq.${currentUserId},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${currentUserId})`
    )
    .maybeSingle();

  if (blockData) {
    throw new Error('Bạn không thể nhắn tin với người dùng này do đã bị chặn');
  }

  const { data, error } = await supabase.rpc(
    'get_or_create_direct_conversation',
    {
      _user_id: userId
    }
  );

  if (error) {
    console.error('Error starting chat with user:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Failed to start chat');
  }

  return data[0];
};

// Search users by username, display name, or email
export const searchUsers = async (
  query: string,
  currentUserId: string
): Promise<
  Array<{
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    status: string;
  }>
> => {
  if (query.length < 2) {
    return [];
  }

  const term = query.trim();
  const searchTerm = `%${term}%`;

  // 1) Profile search by username/display_name
  const { data: byProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, status')
    .or(`username.ilike.${searchTerm},display_name.ilike.${searchTerm}`)
    .neq('id', currentUserId)
    .eq('is_disabled', false)
    .limit(20);

  if (profileErr) {
    console.error('Error searching users by profile:', profileErr);
    throw profileErr;
  }

  // 2) Email search via SQL function (auth.users)
  let byEmail: Array<{
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    status: string;
  }> = [];

  const rpcClient = supabase as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: { message?: string } | null }>;
  };

  const { data: emailData, error: emailErr } = await rpcClient.rpc(
    'search_users_by_email',
    {
      _term: term,
      _current_user_id: currentUserId
    }
  );

  if (!emailErr && emailData) {
    // Map email results to the expected format
    byEmail = (emailData as Array<{
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      status: string | null;
    }>).map((p) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      avatar_url: p.avatar_url || '',
      status: p.status || ''
    }));
  } else if (emailErr) {
    console.warn('Email search RPC error:', emailErr.message);
  }

  // Combine unique by id, prioritize profile search order
  const map = new Map<string, {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    status: string;
  }>();

  (byProfile || []).forEach((p) => map.set(p.id, p));
  byEmail.forEach((p) => {
    if (!map.has(p.id)) map.set(p.id, p);
  });

  return Array.from(map.values());
};

// ============================================
// THREADS (CHỦ ĐỀ)
// ============================================

// Subscribe to threads in a conversation
export const subscribeThreads = (
  conversationId: string,
  onInsert: (thread: ThreadWithDetails) => void,
  onUpdate: (thread: ThreadWithDetails) => void,
  onDelete: (threadId: string) => void
) => {
  const channel = supabase
    .channel(`threads:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'threads',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        const threadId = payload.new.id;

        // Fetch full thread details
        const { data: thread } = await supabase
          .from('threads')
          .select(
            `
            *,
            creator:profiles!threads_created_by_fkey(*),
            root_message:messages!threads_root_message_id_fkey(
              id,
              content_text,
              type,
              sender_id,
              created_at,
              sender:profiles!messages_sender_id_fkey(*)
            ),
            last_message:messages!threads_last_message_id_fkey(
              id,
              content_text,
              type,
              sender_id,
              created_at,
              sender:profiles!messages_sender_id_fkey(*)
            )
          `
          )
          .eq('id', threadId)
          .single();

        if (thread) {
          onInsert({
            ...thread,
            is_joined: false,
            last_read_at: null
          } as ThreadWithDetails);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'threads',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        const threadId = payload.new.id;

        // Fetch full thread details
        const { data: thread } = await supabase
          .from('threads')
          .select(
            `
            *,
            creator:profiles!threads_created_by_fkey(*),
            root_message:messages!threads_root_message_id_fkey(
              id,
              content_text,
              type,
              sender_id,
              created_at,
              sender:profiles!messages_sender_id_fkey(*)
            ),
            last_message:messages!threads_last_message_id_fkey(
              id,
              content_text,
              type,
              sender_id,
              created_at,
              sender:profiles!messages_sender_id_fkey(*)
            )
          `
          )
          .eq('id', threadId)
          .single();

        if (thread) {
          onUpdate({
            ...thread,
            is_joined: false, // Will be updated by query
            last_read_at: null
          } as ThreadWithDetails);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'threads',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        onDelete(payload.old.id);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Subscribe to reactions in thread messages
export const subscribeThreadReactions = (
  threadId: string,
  onInsert: (reaction: {
    message_id: string;
    reaction: MessageReaction & { user: any };
  }) => void,
  onDelete: (reaction: {
    message_id: string;
    user_id: string;
    emoji: string;
  }) => void
) => {
  const channel = supabase
    .channel(`thread_reactions:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'message_reactions'
      },
      async (payload) => {
        const reaction = payload.new as MessageReaction;

        // Fetch message to check if it belongs to this thread
        const { data: message } = await supabase
          .from('messages')
          .select('thread_id')
          .eq('id', reaction.message_id)
          .single();

        // Only process if message belongs to this thread
        if (!message || message.thread_id !== threadId) {
          return;
        }

        // Fetch user details
        const { data: user } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', reaction.user_id)
          .single();

        onInsert({
          message_id: reaction.message_id,
          reaction: {
            ...reaction,
            user: user || null
          }
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'message_reactions'
      },
      async (payload) => {
        const reaction = payload.old as MessageReaction;

        // Fetch message to check if it belongs to this thread
        const { data: message } = await supabase
          .from('messages')
          .select('thread_id')
          .eq('id', reaction.message_id)
          .single();

        // Only process if message belongs to this thread
        if (!message || message.thread_id !== threadId) {
          return;
        }

        onDelete({
          message_id: reaction.message_id,
          user_id: reaction.user_id,
          emoji: reaction.emoji
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Subscribe to messages in a thread
export const subscribeThreadMessages = (
  threadId: string,
  onInsert: (message: MessageWithDetails) => void,
  onUpdate: (message: MessageWithDetails) => void,
  onDelete: (message: Message) => void
) => {
  const channel = supabase
    .channel(`thread_messages:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${threadId}`
      },
      async (payload) => {
        const messageId = payload.new.id;

        // Fetch full message details (similar to subscribeMessages)
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

        // Fetch reply_to if any
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

        // Fetch mentions
        const { data: mentions } = await supabase
          .from('message_mentions')
          .select(
            `
            mentioned_user_id,
            user:profiles!message_mentions_mentioned_user_id_fkey(*)
          `
          )
          .eq('message_id', messageId);

        const fullMessage = {
          ...message,
          reply_to: replyTo,
          reactions: reactions || [],
          read_receipts: readReceipts || [],
          mentions: mentions || [],
          deleted_for_me: false
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
        filter: `thread_id=eq.${threadId}`
      },
      async (payload) => {
        const messageId = payload.new.id;

        // Fetch full message details
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

        // Fetch reply_to, reactions, read_receipts, mentions
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

        const { data: mentions } = await supabase
          .from('message_mentions')
          .select(
            `
            mentioned_user_id,
            user:profiles!message_mentions_mentioned_user_id_fkey(*)
          `
          )
          .eq('message_id', messageId);

        const fullMessage = {
          ...message,
          reply_to: replyTo,
          reactions: reactions || [],
          read_receipts: readReceipts || [],
          mentions: mentions || [],
          deleted_for_me: false
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
        filter: `thread_id=eq.${threadId}`
      },
      (payload) => onDelete(payload.old as Message)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Subscribe to thread participants changes
export const subscribeThreadParticipants = (
  threadId: string,
  onInsert: (participant: ThreadParticipant) => void,
  onDelete: (userId: string) => void
) => {
  const channel = supabase
    .channel(`thread_participants:${threadId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'thread_participants',
        filter: `thread_id=eq.${threadId}`
      },
      async (payload) => {
        const participant = payload.new;

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', participant.user_id)
          .single();

        onInsert({
          ...participant,
          profile: profile || undefined
        } as ThreadParticipant);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'thread_participants',
        filter: `thread_id=eq.${threadId}`
      },
      (payload) => {
        onDelete(payload.old.user_id);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export interface Thread {
  id: string;
  conversation_id: string;
  title: string;
  description: string | null;
  root_message_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_closed: boolean;
  closed_by: string | null;
  closed_at: string | null;
  last_message_id: string | null;
  message_count: number;
  participant_count: number;
}

export interface ThreadWithDetails extends Thread {
  creator: Database['public']['Tables']['profiles']['Row'];
  root_message?: MessageWithDetails;
  last_message?: MessageWithDetails;
  is_joined?: boolean; // Whether current user has joined this thread
  last_read_at?: string | null; // Current user's last read timestamp
}

export interface ThreadParticipant {
  thread_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
  profile?: Database['public']['Tables']['profiles']['Row'];
}

// Create a new thread
export const createThread = async ({
  conversationId,
  title,
  description,
  rootMessageId,
  createdBy
}: {
  conversationId: string;
  title: string;
  description?: string;
  rootMessageId?: string;
  createdBy: string;
}): Promise<Thread> => {
  // Verify user is a participant in the conversation
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', createdBy)
    .is('left_at', null)
    .maybeSingle();

  if (!participant) {
    throw new Error('Bạn phải là thành viên của đoạn chat để tạo chủ đề');
  }

  // Verify root message exists and belongs to conversation (if provided)
  if (rootMessageId) {
    const { data: rootMessage } = await supabase
      .from('messages')
      .select('id, conversation_id')
      .eq('id', rootMessageId)
      .eq('conversation_id', conversationId)
      .maybeSingle();

    if (!rootMessage) {
      throw new Error('Tin nhắn gốc không tồn tại hoặc không thuộc đoạn chat này');
    }
  }

  // Create thread
  const { data: thread, error } = await supabase
    .from('threads')
    .insert({
      conversation_id: conversationId,
      title,
      description: description || null,
      root_message_id: rootMessageId || null,
      created_by: createdBy
    })
    .select()
    .single();

  if (error) throw error;

  // Auto-join creator to thread
  await supabase.from('thread_participants').insert({
    thread_id: thread.id,
    user_id: createdBy
  });

  return thread;
};

// Get threads for a conversation
export const getThreads = async (
  conversationId: string,
  currentUserId: string,
  options?: {
    sortBy?: 'updated_at' | 'created_at' | 'message_count';
    order?: 'asc' | 'desc';
    filter?: 'all' | 'active' | 'closed' | 'pinned' | 'joined';
  }
): Promise<ThreadWithDetails[]> => {
  const {
    sortBy = 'updated_at',
    order = 'desc',
    filter = 'all'
  } = options || {};

  let query = supabase
    .from('threads')
    .select(
      `
      *,
      creator:profiles!threads_created_by_fkey(*),
      root_message:messages!threads_root_message_id_fkey(
        id,
        content_text,
        type,
        sender_id,
        created_at,
        sender:profiles!messages_sender_id_fkey(*)
      ),
      last_message:messages!threads_last_message_id_fkey(
        id,
        content_text,
        type,
        sender_id,
        created_at,
        sender:profiles!messages_sender_id_fkey(*)
      )
    `
    )
    .eq('conversation_id', conversationId);

  // Apply filters
  if (filter === 'active') {
    query = query.eq('is_closed', false);
  } else if (filter === 'closed') {
    query = query.eq('is_closed', true);
  } else if (filter === 'pinned') {
    query = query.eq('is_pinned', true);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: order === 'asc' });

  const { data: threads, error } = await query;

  if (error) throw error;
  if (!threads) return [];

  // Get joined status and last_read_at for current user
  const threadIds = threads.map((t) => t.id);
  const { data: participants } = await supabase
    .from('thread_participants')
    .select('thread_id, last_read_at')
    .eq('user_id', currentUserId)
    .in('thread_id', threadIds);

  const participantMap = new Map(
    participants?.map((p) => [p.thread_id, p]) || []
  );

  // Filter by 'joined' if needed
  let filteredThreads = threads;
  if (filter === 'joined') {
    filteredThreads = threads.filter((t) => participantMap.has(t.id));
  }

  // Add is_joined and last_read_at
  return filteredThreads.map((thread) => {
    const participant = participantMap.get(thread.id);
    return {
      ...thread,
      is_joined: !!participant,
      last_read_at: participant?.last_read_at || null
    };
  });
};

// Join a thread
export const joinThread = async (
  threadId: string,
  userId: string
): Promise<void> => {
  // Verify thread exists and is not closed
  const { data: thread } = await supabase
    .from('threads')
    .select('id, is_closed, conversation_id')
    .eq('id', threadId)
    .maybeSingle();

  if (!thread) {
    throw new Error('Chủ đề không tồn tại');
  }

  if (thread.is_closed) {
    throw new Error('Chủ đề đã bị đóng, không thể tham gia');
  }

  // Verify user is a participant in the conversation
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', thread.conversation_id)
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle();

  if (!participant) {
    throw new Error('Bạn phải là thành viên của đoạn chat để tham gia chủ đề');
  }

  // Insert or update participation
  const { error } = await supabase.from('thread_participants').upsert(
    {
      thread_id: threadId,
      user_id: userId,
      joined_at: new Date().toISOString()
    },
    {
      onConflict: 'thread_id,user_id',
      ignoreDuplicates: false
    }
  );

  if (error) throw error;
};

// Leave a thread
export const leaveThread = async (
  threadId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('thread_participants')
    .delete()
    .eq('thread_id', threadId)
    .eq('user_id', userId);

  if (error) throw error;
};

// Get messages in a thread
export const getThreadMessages = async (
  threadId: string,
  limit: number = 50,
  before?: string,
  currentUserId?: string
): Promise<MessageWithDetails[]> => {
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
      location_latitude,
      location_longitude,
      location_address,
      location_display_mode,
      is_forwarded,
      forwarded_from_user_id,
      forwarded_from_user:profiles!messages_forwarded_from_user_id_fkey(*),
      mentions:message_mentions(
        mentioned_user_id,
        user:profiles!message_mentions_mentioned_user_id_fkey(*)
      ),
      sender:profiles!messages_sender_id_fkey(*),
      attachments(*)
    `
    )
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) query = query.lt('created_at', before);

  const { data: messages, error } = await query;
  if (error) throw error;
  if (!messages || messages.length === 0) return [];

  // Mark deleted messages
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

  // Get reply_to messages
  const replyToIds = messages
    .map((m) => m.reply_to_id)
    .filter((id): id is string => !!id);
  const replyToMap = new Map<string, any>();

  if (replyToIds.length > 0) {
    const { data: replyMessages } = await supabase
      .from('messages')
      .select(
        `
        id,
        content_text,
        type,
        sender_id,
        created_at,
        sender:profiles!messages_sender_id_fkey(*)
      `
      )
      .in('id', replyToIds);

    replyMessages?.forEach((msg) => {
      replyToMap.set(msg.id, msg);
    });
  }

  // Get reactions
  const messageIds = messages.map((m) => m.id);
  const { data: reactions } = await supabase
    .from('message_reactions')
    .select(
      `
      message_id,
      user_id,
      emoji,
      user:profiles!message_reactions_user_id_fkey(*)
    `
    )
    .in('message_id', messageIds);

  const reactionsMap = new Map<string, any[]>();
  reactions?.forEach((reaction) => {
    if (!reactionsMap.has(reaction.message_id)) {
      reactionsMap.set(reaction.message_id, []);
    }
    reactionsMap.get(reaction.message_id)?.push(reaction);
  });

  // Get read receipts
  const { data: readReceipts } = await supabase
    .from('read_receipts')
    .select('message_id, user_id, read_at')
    .in('message_id', messageIds);

  const readReceiptsMap = new Map<string, any[]>();
  readReceipts?.forEach((receipt) => {
    if (!readReceiptsMap.has(receipt.message_id)) {
      readReceiptsMap.set(receipt.message_id, []);
    }
    readReceiptsMap.get(receipt.message_id)?.push(receipt);
  });

  // Combine all data
  return messages.map((msg) => ({
    ...msg,
    deleted_for_me: deletedMessageIds.has(msg.id),
    reply_to: msg.reply_to_id ? replyToMap.get(msg.reply_to_id) : undefined,
    reactions: reactionsMap.get(msg.id) || [],
    read_receipts: readReceiptsMap.get(msg.id) || [],
    mentions: msg.mentions || []
  })) as MessageWithDetails[];
};

// Send message to thread
export const sendThreadMessage = async (
  threadId: string,
  conversationId: string,
  senderId: string,
  content: string,
  replyToId?: string,
  mentionedUserIds?: string[]
): Promise<Message> => {
  // Verify thread exists and is not closed
  const { data: thread } = await supabase
    .from('threads')
    .select('id, is_closed')
    .eq('id', threadId)
    .maybeSingle();

  if (!thread) {
    throw new Error('Chủ đề không tồn tại');
  }

  if (thread.is_closed) {
    throw new Error('Chủ đề đã bị đóng, không thể gửi tin nhắn mới');
  }

  // Verify user has joined the thread
  const { data: participant } = await supabase
    .from('thread_participants')
    .select('user_id')
    .eq('thread_id', threadId)
    .eq('user_id', senderId)
    .maybeSingle();

  if (!participant) {
    throw new Error('Bạn cần tham gia chủ đề trước khi gửi tin nhắn');
  }

  // Check if message can be sent (block strangers check)
  await checkCanSendMessage(conversationId, senderId);

  // Create message with thread_id
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      thread_id: threadId,
      sender_id: senderId,
      type: 'text',
      content_text: content,
      reply_to_id: replyToId
    })
    .select()
    .single();

  if (error) throw error;

  // Insert mentions if any
  if (mentionedUserIds && mentionedUserIds.length > 0) {
    const rows = mentionedUserIds.map((uid) => ({
      message_id: data.id,
      mentioned_user_id: uid
    }));
    const { error: mentionErr } = await supabase
      .from('message_mentions')
      .insert(rows);
    if (mentionErr) console.error('Insert mentions error:', mentionErr);
  }

  // Update thread's last_message_id and updated_at
  await supabase
    .from('threads')
    .update({
      last_message_id: data.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', threadId);

  return data;
};

// Pin/Unpin thread
export const toggleThreadPin = async (
  threadId: string,
  userId: string,
  isPinned: boolean
): Promise<void> => {
  // Verify user is the creator or admin
  const { data: thread } = await supabase
    .from('threads')
    .select('id, created_by, conversation_id')
    .eq('id', threadId)
    .maybeSingle();

  if (!thread) {
    throw new Error('Chủ đề không tồn tại');
  }

  // Check if user is creator
  if (thread.created_by === userId) {
    const { error } = await supabase
      .from('threads')
      .update({ is_pinned: isPinned })
      .eq('id', threadId);

    if (error) throw error;
    return;
  }

  // Check if user is admin in group conversation
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', thread.conversation_id)
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle();

  if (participant?.role === 'admin') {
    const { error } = await supabase
      .from('threads')
      .update({ is_pinned: isPinned })
      .eq('id', threadId);

    if (error) throw error;
    return;
  }

  throw new Error('Bạn không có quyền ghim/bỏ ghim chủ đề này');
};

// Close/Reopen thread
export const toggleThreadClose = async (
  threadId: string,
  userId: string,
  isClosed: boolean
): Promise<void> => {
  // Verify user is admin or creator
  const { data: thread } = await supabase
    .from('threads')
    .select('id, created_by, conversation_id')
    .eq('id', threadId)
    .maybeSingle();

  if (!thread) {
    throw new Error('Chủ đề không tồn tại');
  }

  // Check if user is creator
  if (thread.created_by === userId) {
    const updateData: any = { is_closed: isClosed };
    if (isClosed) {
      updateData.closed_by = userId;
      updateData.closed_at = new Date().toISOString();
    } else {
      updateData.closed_by = null;
      updateData.closed_at = null;
    }

    const { error } = await supabase
      .from('threads')
      .update(updateData)
      .eq('id', threadId);

    if (error) throw error;
    return;
  }

  // Check if user is admin in group conversation
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', thread.conversation_id)
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle();

  if (participant?.role === 'admin') {
    const updateData: any = { is_closed: isClosed };
    if (isClosed) {
      updateData.closed_by = userId;
      updateData.closed_at = new Date().toISOString();
    } else {
      updateData.closed_by = null;
      updateData.closed_at = null;
    }

    const { error } = await supabase
      .from('threads')
      .update(updateData)
      .eq('id', threadId);

    if (error) throw error;
    return;
  }

  throw new Error('Bạn không có quyền đóng/mở chủ đề này');
};

// Update last_read_at for thread
export const markThreadAsRead = async (
  threadId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from('thread_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('thread_id', threadId)
    .eq('user_id', userId);

  if (error) throw error;
};

// Mark thread messages as read (creates read receipts)
export const markThreadMessagesAsRead = async (
  threadId: string,
  userId: string,
  messageIds: string[]
): Promise<void> => {
  // Update last_read_at in thread_participants
  const { error: updateError } = await supabase
    .from('thread_participants')
    .update({
      last_read_at: new Date().toISOString()
    })
    .eq('thread_id', threadId)
    .eq('user_id', userId);

  if (updateError) throw updateError;

  // Insert read receipts for thread messages
  const receipts = messageIds.map((messageId) => ({
    message_id: messageId,
    user_id: userId
  }));

  const { error: receiptsError } = await supabase
    .from('read_receipts')
    .upsert(receipts, { onConflict: 'message_id,user_id' });

  if (receiptsError) throw receiptsError;
};

// Get thread participants
export const getThreadParticipants = async (
  threadId: string
): Promise<ThreadParticipant[]> => {
  const { data, error } = await supabase
    .from('thread_participants')
    .select(
      `
      *,
      profile:profiles!thread_participants_user_id_fkey(*)
    `
    )
    .eq('thread_id', threadId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

// ============================================
// CHAT SUMMARY
// ============================================

export interface ChatSummary {
  totalMessages: number;
  totalParticipants: number;
  messagesByUser: Array<{
    userId: string;
    userName: string;
    avatar: string;
    count: number;
  }>;
  messagesByType: {
    text: number;
    image: number;
    video: number;
    file: number;
    audio: number;
    location: number;
    poll: number;
  };
  mostActiveHour: number;
  timeRange: {
    from: string;
    to: string;
  };
  topKeywords: string[];
}

// Get location messages from conversation
export const getLocationMessages = async (
  conversationId: string,
  hours: number = 24
): Promise<Array<{
  id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  createdAt: string;
}>> => {
  const since = new Date();
  since.setHours(since.getHours() - hours);

  const { data, error } = await supabase
    .from('messages')
    .select(
      `
      id,
      location_latitude,
      location_longitude,
      location_address,
      created_at,
      sender_id,
      sender:profiles!messages_sender_id_fkey(display_name, avatar_url)
    `
    )
    .eq('conversation_id', conversationId)
    .gte('created_at', since.toISOString())
    .not('location_latitude', 'is', null)
    .not('location_longitude', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching location messages:', error);
    throw error;
  }

  console.log('📍 Raw location messages from DB:', data?.length || 0, 'items');
  data?.forEach((msg: any) => {
    console.log('  -', msg.id, ':', msg.location_latitude, msg.location_longitude, msg.location_address);
  });

  return (data || []).map((msg: any) => ({
    id: msg.id,
    latitude: msg.location_latitude,
    longitude: msg.location_longitude,
    address: msg.location_address,
    senderId: msg.sender_id,
    senderName: msg.sender?.display_name || 'Unknown',
    senderAvatar: msg.sender?.avatar_url || '',
    createdAt: msg.created_at
  }));
};

export const getChatSummary24h = async (
  conversationId: string
): Promise<ChatSummary> => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Get messages from last 24 hours
  const { data: messages, error } = await supabase
    .from('messages')
    .select(
      `
      id,
      content_text,
      type,
      created_at,
      sender_id,
      sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)
    `
    )
    .eq('conversation_id', conversationId)
    .gte('created_at', yesterday.toISOString())
    .is('recalled_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const messagesData = messages || [];

  // Calculate statistics
  const totalMessages = messagesData.length;

  // Count messages by user
  const userMessageCount = new Map<string, { name: string; avatar: string; count: number }>();
  messagesData.forEach((msg: any) => {
    const userId = msg.sender_id;
    const userName = msg.sender?.display_name || 'Unknown';
    const avatar = msg.sender?.avatar_url || '';

    if (userMessageCount.has(userId)) {
      userMessageCount.get(userId)!.count++;
    } else {
      userMessageCount.set(userId, { name: userName, avatar, count: 1 });
    }
  });

  const messagesByUser = Array.from(userMessageCount.entries())
    .map(([userId, data]) => ({
      userId,
      userName: data.name,
      avatar: data.avatar,
      count: data.count
    }))
    .sort((a, b) => b.count - a.count);

  // Count messages by type
  const messagesByType = {
    text: 0,
    image: 0,
    video: 0,
    file: 0,
    audio: 0,
    location: 0,
    poll: 0
  };

  messagesData.forEach((msg: any) => {
    const type = msg.type as keyof typeof messagesByType;
    if (type in messagesByType) {
      messagesByType[type]++;
    }
  });

  // Find most active hour
  const hourCounts = new Map<number, number>();
  messagesData.forEach((msg: any) => {
    const hour = new Date(msg.created_at).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });

  let mostActiveHour = 0;
  let maxCount = 0;
  hourCounts.forEach((count, hour) => {
    if (count > maxCount) {
      maxCount = count;
      mostActiveHour = hour;
    }
  });

  // Extract top keywords from text messages
  const allText = messagesData
    .filter((msg: any) => msg.type === 'text' && msg.content_text)
    .map((msg: any) => msg.content_text)
    .join(' ');

  const words = allText
    .toLowerCase()
    .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3); // Only words with more than 3 characters

  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  const topKeywords = Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  return {
    totalMessages,
    totalParticipants: messagesByUser.length,
    messagesByUser,
    messagesByType,
    mostActiveHour,
    timeRange: {
      from: yesterday.toISOString(),
      to: now.toISOString()
    },
    topKeywords
  };
};

// Get all messages from a conversation (for AI context)
export const getAllMessagesForAI = async (
  conversationId: string
): Promise<Array<{
  id: string;
  content_text: string | null;
  type: string;
  created_at: string;
  sender: {
    display_name: string;
    id: string;
  };
  attachments?: Array<{
    file_name: string;
    file_size: number;
    mime_type: string;
  }>;
}>> => {
  const { data: messages, error } = await supabase
    .from('messages')
    .select(
      `
      id,
      content_text,
      type,
      created_at,
      sender:profiles!messages_sender_id_fkey(id, display_name),
      attachments(storage_path, byte_size, mime_type)
    `
    )
    .eq('conversation_id', conversationId)
    .is('thread_id', null)
    .is('recalled_at', null)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (messages || []).map((msg: any) => ({
    id: msg.id,
    content_text: msg.content_text,
    type: msg.type,
    created_at: msg.created_at,
    sender: {
      display_name: msg.sender?.display_name || 'Unknown',
      id: msg.sender?.id || ''
    },
    attachments: (msg.attachments || []).map((att: any) => {
      // Extract file name from storage_path
      // storage_path format: "attachments/conversationId/timestamp_random.ext"
      const fileName = att.storage_path?.split('/').pop() || 'unknown';
      // Remove timestamp prefix if exists (format: timestamp_random.ext)
      const cleanFileName = fileName.replace(/^\d+_[a-z0-9]+\./, '') || fileName;

      return {
        file_name: cleanFileName,
        file_size: att.byte_size || 0,
        mime_type: att.mime_type || 'unknown'
      };
    })
  }));
};

// Ask AI about chat history
export const askAIAboutChat = async (
  conversationId: string,
  question: string
): Promise<string> => {
  // Get all messages for context
  const messages = await getAllMessagesForAI(conversationId);

  // Format messages for AI context
  const chatHistory = messages
    .map((msg) => {
      const timestamp = new Date(msg.created_at).toLocaleString('vi-VN');
      let content = `[${timestamp}] ${msg.sender.display_name}: `;

      if (msg.type === 'text' && msg.content_text) {
        content += msg.content_text;
      } else if (msg.type === 'image') {
        content += '[Ảnh]';
      } else if (msg.type === 'video') {
        content += '[Video]';
      } else if (msg.type === 'file' && msg.attachments?.length > 0) {
        const fileNames = msg.attachments.map(a => a.file_name).join(', ');
        content += `[File: ${fileNames}]`;
      } else if (msg.type === 'audio') {
        content += '[Audio]';
      } else if (msg.type === 'location') {
        content += '[Vị trí]';
      } else if (msg.type === 'poll') {
        content += '[Bình chọn]';
      } else {
        content += `[${msg.type}]`;
      }

      return content;
    })
    .join('\n');

  // Try to call AI API
  // Option 1: Use Supabase Edge Function (preferred for production)
  // Skip this if OpenAI API key is available (to avoid unnecessary CORS errors)
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!openaiApiKey) {
    // Only try Edge Function if no OpenAI key is configured
    try {
      const { data, error } = await supabase.functions.invoke('ask-ai-about-chat', {
        body: {
          question,
          chatHistory,
          conversationId
        }
      });

      if (!error && data?.answer) {
        return data.answer;
      }

      if (error) {
        console.warn('Edge function error:', error);
        // If it's a CORS or function not found error, continue to fallback
        if (
          error.message?.includes('CORS') ||
          error.message?.includes('404') ||
          error.message?.includes('does not exist') ||
          error.message?.includes('Failed to send a request') ||
          error.name === 'FunctionsFetchError'
        ) {
          console.warn('Edge function not available, trying direct API call');
        } else {
          throw error;
        }
      }
    } catch (edgeFunctionError: any) {
      // Only continue to fallback if it's a CORS/404/network error
      if (
        edgeFunctionError?.message?.includes('CORS') ||
        edgeFunctionError?.message?.includes('404') ||
        edgeFunctionError?.message?.includes('does not exist') ||
        edgeFunctionError?.message?.includes('Failed to send a request') ||
        edgeFunctionError?.name === 'FunctionsFetchError' ||
        edgeFunctionError?.code === 'FUNCTION_NOT_FOUND'
      ) {
        console.warn('Edge function not available, trying direct API call:', edgeFunctionError);
      } else {
        // Re-throw other errors
        throw edgeFunctionError;
      }
    }
  }

  // Option 2: Direct API call (Groq or OpenAI)
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;

  const apiKey = groqApiKey || openaiApiKey;
  const apiUrl = groqApiKey
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  const model = groqApiKey ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

  if (apiKey) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: `Bạn là một trợ lý AI thông minh giúp người dùng tìm thông tin trong lịch sử cuộc trò chuyện. 
Hãy trả lời câu hỏi dựa trên lịch sử chat được cung cấp. 
Nếu không tìm thấy thông tin, hãy nói rõ ràng là không có thông tin trong lịch sử chat.
Trả lời bằng tiếng Việt, ngắn gọn và chính xác.`
            },
            {
              role: 'user',
              content: `Lịch sử cuộc trò chuyện:\n\n${chatHistory}\n\nCâu hỏi: ${question}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429) {
          throw new Error('Đã vượt quá giới hạn API. Vui lòng thử lại sau vài phút.');
        } else if (response.status === 401) {
          throw new Error('API key không hợp lệ. Vui lòng kiểm tra lại cấu hình.');
        } else if (response.status === 403) {
          throw new Error('Không có quyền truy cập API. Vui lòng kiểm tra tài khoản.');
        } else {
          throw new Error(`Lỗi API: ${errorData.error?.message || response.statusText}`);
        }
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Không thể tạo câu trả lời.';
    } catch (apiError: any) {
      console.error('AI API error:', apiError);

      // If it's already a formatted error message, throw it
      if (apiError.message && !apiError.message.includes('Failed to fetch')) {
        throw apiError;
      }

      // Otherwise, provide a generic error
      throw new Error('Không thể kết nối với AI. Vui lòng kiểm tra kết nối mạng và cấu hình API key.');
    }
  }

  // If neither method works
  throw new Error(
    'AI service chưa được cấu hình. Vui lòng thêm VITE_GROQ_API_KEY hoặc VITE_OPENAI_API_KEY vào file .env'
  );
};

// AI Summary Response Type
export interface AIConversationSummary {
  summary: string;
  highlights: string[];
  topics: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

// Get AI-powered conversation summary
export const getAIConversationSummary = async (
  conversationId: string,
  timeRange: '24h' | '7d' | '30d' | 'all' = '24h'
): Promise<AIConversationSummary> => {
  // Calculate time filter
  const now = new Date();
  let since: Date | null = null;

  switch (timeRange) {
    case '24h':
      since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      since = null;
      break;
  }

  // Get messages for context
  let query = supabase
    .from('messages')
    .select(`
      id,
      content_text,
      type,
      created_at,
      sender:profiles!messages_sender_id_fkey(id, display_name),
      attachments(storage_path, byte_size, mime_type)
    `)
    .eq('conversation_id', conversationId)
    .is('thread_id', null)
    .is('recalled_at', null)
    .order('created_at', { ascending: true });

  if (since) {
    query = query.gte('created_at', since.toISOString());
  }

  const { data: messages, error } = await query;

  if (error) throw error;

  if (!messages || messages.length === 0) {
    return {
      summary: 'Không có tin nhắn nào trong khoảng thời gian này.',
      highlights: [],
      topics: [],
      actionItems: [],
      sentiment: 'neutral'
    };
  }

  // Format messages for AI context
  const chatHistory = messages
    .map((msg: any) => {
      const timestamp = new Date(msg.created_at).toLocaleString('vi-VN');
      let content = `[${timestamp}] ${msg.sender?.display_name || 'Unknown'}: `;

      if (msg.type === 'text' && msg.content_text) {
        content += msg.content_text;
      } else if (msg.type === 'image') {
        content += '[Ảnh]';
      } else if (msg.type === 'video') {
        content += '[Video]';
      } else if (msg.type === 'file' && msg.attachments?.length > 0) {
        const fileNames = msg.attachments.map((a: any) => a.storage_path?.split('/').pop()).join(', ');
        content += `[File: ${fileNames}]`;
      } else if (msg.type === 'audio') {
        content += '[Audio]';
      } else if (msg.type === 'location') {
        content += '[Vị trí]';
      } else if (msg.type === 'poll') {
        content += '[Bình chọn]';
      } else {
        content += `[${msg.type}]`;
      }

      return content;
    })
    .join('\n');

  // Call AI API (Groq or OpenAI)
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;

  const apiKey = groqApiKey || openaiApiKey;

  if (!apiKey) {
    throw new Error('VITE_GROQ_API_KEY hoặc VITE_OPENAI_API_KEY chưa được cấu hình trong file .env');
  }

  const apiUrl = groqApiKey
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

  // Use Llama 3 for Groq (fast & good), GPT-4o-mini for OpenAI
  const model = groqApiKey ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

  const systemPrompt = `Bạn là một trợ lý AI chuyên tóm tắt cuộc trò chuyện. Nhiệm vụ của bạn là phân tích lịch sử chat và trả về một bản tóm tắt có cấu trúc.

Hãy trả về một JSON object với cấu trúc sau:
{
  "summary": "Tóm tắt ngắn gọn nội dung chính của cuộc trò chuyện (2-3 câu)",
  "highlights": ["Điểm nổi bật 1", "Điểm nổi bật 2", ...], // Tối đa 5 điểm
  "topics": ["Chủ đề 1", "Chủ đề 2", ...], // Các chủ đề được thảo luận
  "actionItems": ["Việc cần làm 1", "Việc cần làm 2", ...], // Các công việc, lịch hẹn được nhắc đến (nếu có)
  "sentiment": "positive" | "neutral" | "negative" // Tông giọng chung của cuộc hội thoại
}

Lưu ý:
- Trả lời bằng tiếng Việt
- Nếu không có action items, trả về mảng rỗng
- Highlight chỉ những thông tin quan trọng
- Topics nên ngắn gọn, mỗi topic là 1-3 từ
- Quan trọng: CHỈ TRẢ VỀ JSON, không thêm bất kỳ văn bản nào khác.`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Lịch sử cuộc trò chuyện:\n\n${chatHistory}` }
        ],
        temperature: 0.5,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 429) {
        throw new Error('Đã vượt quá giới hạn API. Vui lòng thử lại sau vài phút.');
      } else if (response.status === 401) {
        throw new Error('API key không hợp lệ. Vui lòng kiểm tra lại cấu hình.');
      } else {
        throw new Error(`Lỗi API: ${errorData.error?.message || response.statusText}`);
      }
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Không nhận được phản hồi từ AI');
    }

    const result = JSON.parse(content);

    return {
      summary: result.summary || 'Không thể tóm tắt cuộc trò chuyện.',
      highlights: result.highlights || [],
      topics: result.topics || [],
      actionItems: result.actionItems || [],
      sentiment: result.sentiment || 'neutral'
    };
  } catch (err: any) {
    console.error('AI Summary error:', err);

    if (err.message?.includes('JSON')) {
      throw new Error('Lỗi xử lý phản hồi từ AI. Vui lòng thử lại.');
    }

    throw err;
  }
};

// General Chat with Zappy AI
export const chatWithZappyAI = async (
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> => {
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;

  const apiKey = groqApiKey || openaiApiKey;

  if (!apiKey) {
    throw new Error('Chưa cấu hình API Key. Vui lòng thêm VITE_GROQ_API_KEY hoặc VITE_OPENAI_API_KEY vào .env');
  }

  const apiUrl = groqApiKey
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';

  const model = groqApiKey ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

  const systemPrompt = `Bạn là Zappy AI, một trợ lý ảo thông minh, thân thiện và hài hước của ứng dụng nhắn tin Zappy.
Hãy trò chuyện với người dùng một cách tự nhiên, vui vẻ và hữu ích.
Luôn trả lời bằng tiếng Việt.
Bạn có thể trả lời các câu hỏi, đưa ra lời khuyên, hoặc chỉ đơn giản là trò chuyện phiếm.
Đừng quá cứng nhắc như robot.`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message }
        ],
        temperature: 0.8, // Slightly higher creativity for casual chat
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 429) {
        throw new Error('Đã vượt quá giới hạn API. Vui lòng thử lại sau vài phút.');
      } else {
        throw new Error(`Lỗi API: ${errorData.error?.message || response.statusText}`);
      }
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Xin lỗi, tôi không nghĩ ra câu trả lời.';
  } catch (error: any) {
    console.error('Zappy AI Chat error:', error);
    throw error;
  }
};
