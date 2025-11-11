import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/UserAvatar';
import { transferAdminRole } from '@/services/chatService';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Loader2, Shield } from 'lucide-react';

interface TransferAdminModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  currentAdminId: string;
  onSuccess?: () => void;
}

export function TransferAdminModal({
  open,
  onClose,
  conversationId,
  currentAdminId,
  onSuccess,
}: TransferAdminModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);

  // Fetch group members (excluding current admin)
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['groupMembers', conversationId, currentAdminId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          role,
          profile:profiles!conversation_participants_user_id_fkey(
            id,
            display_name,
            avatar_url,
            username
          )
        `)
        .eq('conversation_id', conversationId)
        .is('left_at', null)
        .neq('user_id', currentAdminId)
        .order('role', { ascending: false }); // Admins first, then members

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const handleTransfer = async () => {
    if (!selectedMemberId) {
      toast.error('Vui lòng chọn thành viên');
      return;
    }

    setTransferring(true);
    try {
      await transferAdminRole(conversationId, currentAdminId, selectedMemberId);
      toast.success('Đã chuyển quyền admin thành công');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Transfer admin error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể chuyển quyền admin';
      toast.error(errorMessage);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            Chuyển quyền admin
          </DialogTitle>
          <DialogDescription>
            Bạn là admin cuối cùng trong nhóm. Vui lòng chọn một thành viên để chuyển quyền admin trước khi rời nhóm.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Shield className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">
                Không có thành viên nào
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Không thể rời nhóm khi không có thành viên khác
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member: any) => {
                const profile = member.profile;
                const isSelected = selectedMemberId === member.user_id;
                const isAdmin = member.role === 'admin';

                return (
                  <button
                    key={member.user_id}
                    onClick={() => setSelectedMemberId(member.user_id)}
                    disabled={isAdmin}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg
                      transition-colors text-left
                      border-2
                      ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                          : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                      ${isAdmin ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <UserAvatar
                      avatarUrl={profile?.avatar_url}
                      displayName={profile?.display_name || profile?.username || 'Unknown'}
                      size="md"
                      showStatus={false}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {profile?.display_name || profile?.username || 'Unknown'}
                        </p>
                        {isAdmin && (
                          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      {profile?.username && (
                        <p className="text-sm text-gray-500 truncate">
                          @{profile.username}
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
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={transferring}>
            Hủy
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedMemberId || transferring || members.length === 0}
          >
            {transferring ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang chuyển...
              </>
            ) : (
              'Chuyển quyền'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

