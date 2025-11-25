import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, Video, Users } from 'lucide-react';
import { getConversation, type ConversationWithDetails } from '@/services/chatService';
import { UserAvatar } from '@/components/UserAvatar';

interface SelectCallParticipantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  currentUserId: string;
  isVideo: boolean;
  onStartCall: (participantIds: string[]) => void;
}

export function SelectCallParticipantsModal({
  open,
  onOpenChange,
  conversationId,
  currentUserId,
  isVideo,
  onStartCall
}: SelectCallParticipantsModalProps) {
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch conversation details to get participants
  useEffect(() => {
    if (open && conversationId) {
      setLoading(true);
      getConversation(conversationId)
        .then((conv) => {
          setConversation(conv);
          // Auto-select all participants except current user by default
          const allParticipants = new Set(
            conv.participants
              .filter((p) => p.user_id !== currentUserId)
              .map((p) => p.user_id)
          );
          setSelectedParticipants(allParticipants);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, conversationId, currentUserId]);

  const toggleParticipant = (participantId: string) => {
    setSelectedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(participantId)) {
        next.delete(participantId);
      } else {
        next.add(participantId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!conversation) return;
    
    const allOthers = conversation.participants
      .filter((p) => p.user_id !== currentUserId)
      .map((p) => p.user_id);
    
    if (selectedParticipants.size === allOthers.length) {
      // Deselect all
      setSelectedParticipants(new Set());
    } else {
      // Select all
      setSelectedParticipants(new Set(allOthers));
    }
  };

  const handleStartCall = () => {
    if (selectedParticipants.size === 0) {
      return;
    }
    
    // Include current user in the participants list
    const participantIds = [currentUserId, ...Array.from(selectedParticipants)];
    onStartCall(participantIds);
    onOpenChange(false);
  };

  if (!conversation) return null;

  const otherParticipants = conversation.participants.filter(
    (p) => p.user_id !== currentUserId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isVideo ? <Video className="size-5" /> : <Phone className="size-5" />}
            Chọn thành viên tham gia cuộc gọi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4 text-gray-500">Đang tải...</div>
          ) : (
            <>
              {/* Summary */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="size-4" />
                  <span className="font-medium">
                    {selectedParticipants.size + 1} người sẽ tham gia
                  </span>
                  <span className="text-gray-500">
                    (bao gồm bạn)
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleSelectAll}
                  className="text-xs"
                >
                  {selectedParticipants.size === otherParticipants.length
                    ? 'Bỏ chọn tất cả'
                    : 'Chọn tất cả'}
                </Button>
              </div>

              {/* Current user (always included) */}
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className="cursor-not-allowed"
                  />
                  <UserAvatar
                    avatarUrl={
                      conversation.participants.find((p) => p.user_id === currentUserId)
                        ?.profile.avatar_url || null
                    }
                    displayName={
                      conversation.participants.find((p) => p.user_id === currentUserId)
                        ?.profile.display_name || 'Bạn'
                    }
                    size="md"
                    showStatus={false}
                  />
                  <div className="flex-1">
                    <div className="font-medium">
                      {conversation.participants.find((p) => p.user_id === currentUserId)
                        ?.profile.display_name || 'Bạn'}{' '}
                      <span className="text-xs text-gray-500">(Bạn)</span>
                    </div>
                    {conversation.participants.find((p) => p.user_id === currentUserId)
                      ?.role === 'admin' && (
                      <span className="text-xs text-blue-500">Admin</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">Luôn tham gia</span>
                </label>
              </div>

              {/* Other participants */}
              {otherParticipants.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Thành viên khác:
                  </p>
                  {otherParticipants.map((participant) => (
                    <label
                      key={participant.user_id}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedParticipants.has(participant.user_id)}
                        onChange={() => toggleParticipant(participant.user_id)}
                        className="cursor-pointer"
                      />
                      <UserAvatar
                        avatarUrl={participant.profile.avatar_url || null}
                        displayName={participant.profile.display_name}
                        size="md"
                        showStatus={false}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{participant.profile.display_name}</div>
                        {participant.role === 'admin' && (
                          <span className="text-xs text-blue-500">Admin</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Chỉ có bạn trong nhóm
                </p>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleStartCall}
              disabled={selectedParticipants.size === 0 || loading}
              className="gap-2"
            >
              {isVideo ? <Video className="size-4" /> : <Phone className="size-4" />}
              Gọi {selectedParticipants.size > 0 && `(${selectedParticipants.size + 1})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

