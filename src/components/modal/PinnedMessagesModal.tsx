import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { PinnedMessage } from '@/services/chatService';
import {
  getPinnedMessages,
  subscribePinnedMessages
} from '@/services/chatService';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface PinnedMessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  onUnpin: (messageId: string) => void;
  onJumpTo: (messageId: string) => void;
}

export function PinnedMessagesModal({
  open,
  onOpenChange,
  conversationId,
  onUnpin,
  onJumpTo
}: PinnedMessagesModalProps) {
  const [items, setItems] = useState<PinnedMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    setLoading(true);
    (async () => {
      try {
        const data = await getPinnedMessages(conversationId);
        if (isMounted) setItems(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    const unsub = subscribePinnedMessages(conversationId, async () => {
      const data = await getPinnedMessages(conversationId);
      setItems(data);
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, [open, conversationId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Các tin nhắn đã ghim</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {loading && <div className="text-sm text-gray-500">Đang tải...</div>}
          {!loading && items.length === 0 && (
            <div className="text-sm text-gray-500">Chưa có tin nhắn ghim</div>
          )}
          {!loading &&
            items.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div className="text-sm text-gray-700 dark:text-gray-200">
                  {p.message?.content_text || '(Tin nhắn)'}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {p.message?.sender?.display_name
                    ? `Bởi ${p.message.sender.display_name}`
                    : ''}
                  {p.message?.created_at
                    ? ` • ${format(new Date(p.message.created_at), 'HH:mm dd/MM/yyyy')}`
                    : ''}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      onOpenChange(false);
                      onJumpTo(p.message_id);
                    }}
                  >
                    Đi tới
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      // Optimistic remove from modal list
                      setItems((prev) => prev.filter((it) => it.message_id !== p.message_id));
                      onUnpin(p.message_id);
                    }}
                  >
                    Bỏ ghim
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}


