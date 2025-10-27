/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useChat.ts
import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery
} from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo } from 'react';
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
  searchMessages,
  getConversationMedia,
  getConversationFiles,
  getConversationLinks,
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

// Hook gửi text message với optimistic update
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

    // Optimistic update - thêm message ngay lập tức
    onMutate: async ({ conversationId, senderId, content, replyToId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: chatKeys.messages(conversationId)
      });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(
        chatKeys.messages(conversationId)
      );

      // Optimistically update to the new value
      queryClient.setQueryData(
        chatKeys.messages(conversationId),
        (old: any) => {
          if (!old) return old;

          const tempMessage = {
            id: `temp-${Date.now()}`,
            conversation_id: conversationId,
            sender_id: senderId,
            content_text: content,
            type: 'text',
            created_at: new Date().toISOString(),
            reply_to_id: replyToId,
            recalled_at: null,
            edited_at: null,
            sender: { id: senderId, display_name: 'You', avatar_url: '' },
            attachments: [],
            reactions: [],
            read_receipts: [],
            reply_to: null
          };

          return {
            ...old,
            pages: old.pages.map((page: any[], index: number) =>
              index === old.pages.length - 1 ? [...page, tempMessage] : page
            )
          };
        }
      );

      return { previousMessages };
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          chatKeys.messages(variables.conversationId),
          context.previousMessages
        );
      }
    },

    // Always refetch after error or success to sync with server
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(variables.conversationId)
      });
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

// Hook subscribe messages realtime - CẢI TIẾN ĐỂ MƯỢT MÀ HƠN
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

            // Check if message already exists (avoid duplicates)
            const allMessages = old.pages.flat();
            const exists = allMessages.some(
              (msg: any) => msg.id === newMessage.id
            );
            if (exists) return old;

            // Remove temporary messages (optimistic updates) before adding real message
            const updatedPages = old.pages.map((page: any[]) =>
              page.filter((msg: any) => !msg.id.startsWith('temp-'))
            );

            // Add new message to the last page
            return {
              ...old,
              pages: updatedPages.map((page: any[], index: number) =>
                index === updatedPages.length - 1 ? [...page, newMessage] : page
              )
            };
          }
        );

        // Chỉ invalidate conversations để update last_message
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
            // Chỉ update nếu user chưa có trong set
            if (!newSet.has(typingUserId)) {
              newSet.add(typingUserId);
              return newSet;
            }
          } else {
            // Chỉ update nếu user có trong set
            if (newSet.has(typingUserId)) {
              newSet.delete(typingUserId);
              return newSet;
            }
          }
          // Không có thay đổi, return prev để tránh re-render
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId, userId]);

  // Memoize sendTyping function để tránh re-create
  const sendTyping = useCallback((isTyping: boolean) => {
    sendTypingIndicator(conversationId, userId, isTyping);
  }, [conversationId, userId]);

  // Memoize typingUsers array
  const typingUsersArray = useMemo(() => Array.from(typingUsers), [typingUsers]);

  return {
    typingUsers: typingUsersArray,
    sendTyping
  };
};

// ============================================
// MESSAGE SEARCH
// ============================================

// Hook search messages
export const useSearchMessages = (conversationId: string, query: string) => {
  return useQuery({
    queryKey: ['search', conversationId, query],
    queryFn: () => searchMessages(conversationId, query),
    enabled: !!query && query.trim().length > 0,
    staleTime: 60000 // Cache for 1 minute
  });
};

// ============================================
// CONVERSATION MEDIA & FILES
// ============================================

// Hook lấy media từ conversation
export const useConversationMedia = (
  conversationId: string,
  type: 'image' | 'video' | 'both' = 'both'
) => {
  return useQuery({
    queryKey: ['conversation-media', conversationId, type],
    queryFn: () => getConversationMedia(conversationId, type),
    enabled: !!conversationId,
    staleTime: 60000
  });
};

// Hook lấy files từ conversation
export const useConversationFiles = (conversationId: string) => {
  return useQuery({
    queryKey: ['conversation-files', conversationId],
    queryFn: () => getConversationFiles(conversationId),
    enabled: !!conversationId,
    staleTime: 60000
  });
};

// Hook lấy links từ conversation
export const useConversationLinks = (conversationId: string) => {
  return useQuery({
    queryKey: ['conversation-links', conversationId],
    queryFn: () => getConversationLinks(conversationId),
    enabled: !!conversationId,
    staleTime: 60000
  });
};
