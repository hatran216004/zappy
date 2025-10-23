/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  getConversations,
  getConversation,
  getMessages,
  getOrCreateDirectConversation,
  sendTextMessage,
  sendFileMessage,
  editMessage,
  recallMessage,
  addReaction,
  removeReaction,
  markMessagesAsRead,
  sendTypingIndicator,
  subscribeConversations,
  subscribeMessages,
  subscribeReactions,
  subscribeTyping,
  // type ConversationWithDetails,
  // type MessageWithDetails,
  type Message
} from '../services/chatService';

// Keys cho query cache
export const chatKeys = {
  all: ['chat'] as const,
  conversations: (userId: string) =>
    [...chatKeys.all, 'conversations', userId] as const,
  conversation: (conversationId: string) =>
    [...chatKeys.all, 'conversation', conversationId] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, 'messages', conversationId] as const
};

// ============================================
// CONVERSATIONS
// ============================================

// Hook lấy danh sách conversations
export const useConversations = (userId: string) => {
  return useQuery({
    queryKey: chatKeys.conversations(userId),
    queryFn: () => getConversations(userId),
    staleTime: 30000
  });
};

// Hook lấy thông tin conversation
export const useConversation = (conversationId: string) => {
  return useQuery({
    queryKey: chatKeys.conversation(conversationId),
    queryFn: () => getConversation(conversationId),
    staleTime: 60000
  });
};

// Hook tạo hoặc lấy direct conversation
export const useGetOrCreateDirectConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      currentUserId,
      otherUserId
    }: {
      currentUserId: string;
      otherUserId: string;
    }) => getOrCreateDirectConversation(currentUserId, otherUserId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(variables.currentUserId)
      });
    }
  });
};

// Hook subscribe conversations realtime
export const useConversationsRealtime = (userId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeConversations(userId, () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(userId)
      });
    });

    return () => {
      unsubscribe();
    };
  }, [userId, queryClient]);
};

// ============================================
// MESSAGES
// ============================================

// Hook lấy messages với infinite scroll
export const useMessages = (conversationId: string) => {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: ({ pageParam }) => getMessages(conversationId, 50, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      return lastPage[0].created_at;
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 30000
  });
};

// Hook gửi text message - BỎ OPTIMISTIC UPDATE
export const useSendTextMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      senderId,
      content,
      replyToId
    }: {
      conversationId: string;
      senderId: string;
      content: string;
      replyToId?: string;
    }) => sendTextMessage(conversationId, senderId, content, replyToId),

    // Không có onMutate nữa - để realtime xử lý hết

    onSuccess: (_, variables) => {
      // Chỉ invalidate conversations
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(variables.senderId)
      });
    }
  });
};

// Hook gửi file message
export const useSendFileMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      senderId,
      file,
      type
    }: {
      conversationId: string;
      senderId: string;
      file: File;
      type: 'image' | 'video' | 'file' | 'audio';
    }) => sendFileMessage(conversationId, senderId, file, type),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(variables.conversationId)
      });
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(variables.senderId)
      });
    }
  });
};

// Hook edit message
export const useEditMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      content
    }: {
      messageId: string;
      content: string;
    }) => editMessage(messageId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.all
      });
    }
  });
};

// Hook recall message
export const useRecallMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => recallMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.all
      });
    }
  });
};

// Hook subscribe messages realtime - ĐƠN GIẢN
export const useMessagesRealtime = (
  conversationId: string,
  currentUserId: string
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeMessages(
      conversationId,
      // On Insert - thêm message mới vào cache
      (newMessage: Message) => {
        queryClient.setQueryData(
          chatKeys.messages(conversationId),
          (old: any) => {
            if (!old) return old;

            // Check if message already exists
            const exists = old.pages.some((page: any[]) =>
              page.some((msg: any) => msg.id === newMessage.id)
            );

            if (exists) return old; // Đã có rồi thì bỏ qua

            // Add new message to the last page
            return {
              ...old,
              pages: old.pages.map((page: any[], index: number) =>
                index === old.pages.length - 1 ? [...page, newMessage] : page
              )
            };
          }
        );

        // Invalidate conversations để update last_message
        queryClient.invalidateQueries({
          queryKey: chatKeys.conversations(currentUserId)
        });
      },

      // On Update - update message trong cache
      (updatedMessage: Message) => {
        queryClient.setQueryData(
          chatKeys.messages(conversationId),
          (old: any) => {
            if (!old) return old;

            return {
              ...old,
              pages: old.pages.map((page: any[]) =>
                page.map((msg: any) =>
                  msg.id === updatedMessage.id
                    ? { ...msg, ...updatedMessage }
                    : msg
                )
              )
            };
          }
        );
      },

      // On Delete - remove message from cache
      (deletedMessage: Message) => {
        queryClient.setQueryData(
          chatKeys.messages(conversationId),
          (old: any) => {
            if (!old) return old;

            return {
              ...old,
              pages: old.pages.map((page: any[]) =>
                page.filter((msg: any) => msg.id !== deletedMessage.id)
              )
            };
          }
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId, currentUserId, queryClient]);
};

// ============================================
// REACTIONS
// ============================================

// Hook add reaction
export const useAddReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      userId,
      emoji
    }: {
      messageId: string;
      userId: string;
      emoji: string;
    }) => addReaction(messageId, userId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.all
      });
    }
  });
};

// Hook remove reaction
export const useRemoveReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      userId,
      emoji
    }: {
      messageId: string;
      userId: string;
      emoji: string;
    }) => removeReaction(messageId, userId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.all
      });
    }
  });
};

// Hook subscribe reactions realtime
export const useReactionsRealtime = (conversationId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeReactions(conversationId, () => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(conversationId)
      });
    });

    return () => {
      unsubscribe();
    };
  }, [conversationId, queryClient]);
};

// ============================================
// READ RECEIPTS
// ============================================

// Hook mark messages as read
export const useMarkMessagesAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      userId,
      messageIds
    }: {
      conversationId: string;
      userId: string;
      messageIds: string[];
    }) => markMessagesAsRead(conversationId, userId, messageIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(variables.userId)
      });
    }
  });
};

// ============================================
// TYPING INDICATOR
// ============================================

// Hook typing indicator
export const useTypingIndicator = (conversationId: string, userId: string) => {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = subscribeTyping(
      conversationId,
      (typingUserId, isTyping) => {
        if (typingUserId === userId) return; // Ignore own typing

        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(typingUserId);
          } else {
            newSet.delete(typingUserId);
          }
          return newSet;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId, userId]);

  const sendTyping = (isTyping: boolean) => {
    sendTypingIndicator(conversationId, userId, isTyping);
  };

  return {
    typingUsers: Array.from(typingUsers),
    sendTyping
  };
};
