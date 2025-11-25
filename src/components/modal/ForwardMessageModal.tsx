import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/UserAvatar';
import { forwardMessage } from '@/services/chatService';
import { useConversations } from '@/hooks/useChat';
import { chatKeys } from '@/hooks/useChat';
import toast from 'react-hot-toast';
import { Search, Send } from 'lucide-react';
import { getAvatarUrl, getGroupPhotoUrl } from '@/lib/supabase';

interface ForwardMessageModalProps {
  open: boolean;
  onClose: () => void;
  messageId: string;
  userId: string;
  currentConversationId: string;
}

export function ForwardMessageModal({
  open,
  onClose,
  messageId,
  userId,
  currentConversationId,
}: ForwardMessageModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [forwarding, setForwarding] = useState(false);

  const queryClient = useQueryClient();
  const { data: conversations = [] } = useConversations(userId);

  // Filter conversations (exclude current)
  const filteredConversations = conversations
    .filter((conv) => conv.id !== currentConversationId)
    .filter((conv) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        conv.title?.toLowerCase().includes(searchLower) ||
        conv.display_name?.toLowerCase().includes(searchLower)
      );
    });

  const handleForward = async () => {
    if (selected.length === 0) {
      toast.error('Vui lòng chọn ít nhất một cuộc trò chuyện');
      return;
    }

    setForwarding(true);
    try {
      for (const targetId of selected) {
        await forwardMessage({
          messageId,
          targetConversationId: targetId,
          senderId: userId,
        });
      }
      
      // Invalidate queries để UI tự động cập nhật
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(userId)
      });
      
      // Invalidate messages cho tất cả conversations đã forward
      selected.forEach(targetId => {
        queryClient.invalidateQueries({
          queryKey: chatKeys.messages(targetId)
        });
      });
      
      toast.success(`Đã chuyển tiếp đến ${selected.length} cuộc trò chuyện`);
      onClose();
      setSelected([]);
    } catch (error) {
      console.error('Forward error:', error);
      toast.error('Không thể chuyển tiếp tin nhắn');
    } finally {
      setForwarding(false);
    }
  };

  const toggleSelect = (convId: string) => {
    setSelected((prev) =>
      prev.includes(convId)
        ? prev.filter((id) => id !== convId)
        : [...prev, convId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chuyển tiếp tin nhắn</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm cuộc trò chuyện..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Conversations list */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {filteredConversations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Không tìm thấy cuộc trò chuyện
              </p>
            ) : (
              filteredConversations.map((conv) => {
                const isGroup = conv.type === 'group';
                const photoUrl = isGroup
                  ? getGroupPhotoUrl(conv.photo_url)
                  : getAvatarUrl(conv.photo_url);
                const displayName = isGroup ? conv.title : conv.display_name;
                const isSelected = selected.includes(conv.id);

                return (
                  <button
                    key={conv.id}
                    onClick={() => toggleSelect(conv.id)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg
                      hover:bg-gray-100 dark:hover:bg-gray-800
                      transition-colors text-left
                      ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                          : 'border-2 border-transparent'
                      }
                    `}
                  >
                    <UserAvatar
                      avatarUrl={photoUrl}
                      displayName={displayName || 'Unknown'}
                      size="md"
                      showStatus={false}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {displayName || 'Unknown'}
                      </p>
                      {isGroup && (
                        <p className="text-sm text-gray-500">
                          Nhóm • {conv.participants?.length || 0} thành viên
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-gray-500">
            Đã chọn: {selected.length}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={forwarding}>
              Hủy
            </Button>
            <Button
              onClick={handleForward}
              disabled={selected.length === 0 || forwarding}
            >
              <Send className="h-4 w-4 mr-2" />
              {forwarding ? 'Đang gửi...' : 'Chuyển tiếp'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

