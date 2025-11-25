import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'conversation_order_';

/**
 * Hook to manage conversation order for a user
 * Stores order in localStorage
 */
export function useConversationOrder(userId: string) {
  const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;

  // Load order from localStorage
  const loadOrder = useCallback((): string[] => {
    if (!userId) return [];
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, [userId, storageKey]);

  const [order, setOrder] = useState<string[]>(loadOrder);

  // Save order to localStorage
  const saveOrder = useCallback(
    (newOrder: string[]) => {
      if (!userId) return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(newOrder));
        setOrder(newOrder);
      } catch (error) {
        console.error('Error saving conversation order:', error);
      }
    },
    [userId, storageKey]
  );

  // Update order when userId changes
  useEffect(() => {
    setOrder(loadOrder());
  }, [userId, loadOrder]);

  // Reorder conversations
  const reorderConversations = useCallback(
    (conversationIds: string[], activeId: string, overId: string) => {
      const oldIndex = conversationIds.indexOf(activeId);
      const newIndex = conversationIds.indexOf(overId);

      if (oldIndex === -1 || newIndex === -1) return conversationIds;

      const newOrder = [...conversationIds];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);

      // Save to localStorage
      saveOrder(newOrder);

      return newOrder;
    },
    [saveOrder]
  );

  // Get sorted conversations based on saved order
  const sortConversations = useCallback(
    <T extends { id: string; updated_at?: string | null; created_at?: string }>(
      conversations: T[]
    ): T[] => {
      if (!order.length) return conversations;

      // Create a map for quick lookup
      const conversationMap = new Map(conversations.map((c) => [c.id, c]));

      // Sort by saved order, then by updated_at for new conversations
      const sorted: T[] = [];
      const added = new Set<string>();

      // Add conversations in saved order
      for (const id of order) {
        const conv = conversationMap.get(id);
        if (conv) {
          sorted.push(conv);
          added.add(id);
        }
      }

      // Add new conversations (not in saved order) sorted by updated_at
      const newConversations = conversations
        .filter((c) => !added.has(c.id))
        .sort((a, b) => {
          const aTime = new Date(
            (a as any).updated_at || (a as any).created_at || 0
          ).getTime();
          const bTime = new Date(
            (b as any).updated_at || (b as any).created_at || 0
          ).getTime();
          return bTime - aTime; // Newest first
        });

      return [...sorted, ...newConversations];
    },
    [order]
  );

  return {
    order,
    reorderConversations,
    sortConversations,
    saveOrder
  };
}

