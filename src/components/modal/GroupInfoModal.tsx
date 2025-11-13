import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  updateGroupInfo,
  addGroupMembers,
  promoteToAdmin,
  leaveGroup,
  type ConversationWithDetails
} from '@/services/chatService';
import { useFriends } from '@/hooks/useFriends';
import { useRemoveGroupMember, useToggleChatEnabled } from '@/hooks/useChat';
import { supabase, supabaseUrl } from '@/lib/supabase';
import { useConfirm } from './ModalConfirm';
import { UserAvatar } from '../UserAvatar';
import {
  Crown,
  UserMinus,
  UserPlus,
  Edit2,
  Upload,
  LogOut,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/stores/user';
import toast from 'react-hot-toast';
import { TransferAdminModal } from './TransferAdminModal';
import { ReportConversationModal } from './ReportConversationModal';
import { twMerge } from 'tailwind-merge';

interface GroupInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: ConversationWithDetails;
  currentUserId: string;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  open,
  onOpenChange,
  conversation,
  currentUserId
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(conversation.title || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [showTransferAdminModal, setShowTransferAdminModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: friends = [] } = useFriends(user?.id as string);
  const removeGroupMemberMutation = useRemoveGroupMember();
  const toggleChatEnabledMutation = useToggleChatEnabled();

  // Get current user's role
  const currentUserParticipant = conversation.participants.find(
    (p) => p.user_id === currentUserId
  );
  const isAdmin = currentUserParticipant?.role === 'admin';

  // Filter friends not in group
  const nonMembers = friends.filter(
    (friend) => !conversation.participants.some((p) => p.user_id === friend.id)
  );

  const handleUpdateName = async () => {
    if (!groupName.trim() || !isAdmin) return;

    setIsUpdating(true);
    try {
      await updateGroupInfo(conversation.id, { title: groupName.trim() });
      setIsEditingName(false);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({
        queryKey: ['conversation', conversation.id]
      });
      toast.success('Đã cập nhật tên nhóm');
    } catch (error) {
      console.error('Error updating group name:', error);
      toast.error('Lỗi khi cập nhật tên nhóm');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    setIsUploading(true);
    const uploadToast = toast.loading('Đang tải ảnh lên...');

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `group-${conversation.id}-${Date.now()}.${fileExt}`;
      const filePath = `group-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update group photo
      await updateGroupInfo(conversation.id, { photo_url: filePath });

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({
        queryKey: ['conversation', conversation.id]
      });

      toast.success('Đã cập nhật ảnh nhóm', { id: uploadToast });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Lỗi khi upload ảnh', { id: uploadToast });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddMembers = async () => {
    if (selectedMembers.size === 0 || !isAdmin) return;

    setIsUpdating(true);
    try {
      await addGroupMembers(
        conversation.id,
        Array.from(selectedMembers),
        currentUserId
      );
      const addedCount = selectedMembers.size;
      setSelectedMembers(new Set());
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({
        queryKey: ['conversation', conversation.id]
      });
      toast.success(`Đã thêm ${addedCount} thành viên vào nhóm`);
    } catch (error) {
      console.error('Error adding members:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Lỗi khi thêm thành viên';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!isAdmin) return;

    const confirmed = await confirm({
      title: 'Xóa thành viên',
      description: `Bạn có chắc muốn xóa ${userName} khỏi nhóm?`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      destructive: true
    });

    if (!confirmed) return;

    try {
      await removeGroupMemberMutation.mutateAsync({
        conversationId: conversation.id,
        userId: userId,
        removedBy: currentUserId
      });
      toast.success(`Đã xóa ${userName} khỏi nhóm`);
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Lỗi khi xóa thành viên');
    }
  };

  const handlePromoteToAdmin = async (userId: string, userName: string) => {
    if (!isAdmin) return;

    const confirmed = await confirm({
      title: 'Phân quyền Admin',
      description: `Bạn có chắc muốn cấp quyền Admin cho ${userName}?`,
      confirmText: 'Cấp quyền',
      cancelText: 'Hủy'
    });

    if (!confirmed) return;

    try {
      await promoteToAdmin(conversation.id, userId);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({
        queryKey: ['conversation', conversation.id]
      });
      toast.success(`${userName} đã được cấp quyền Admin`);
    } catch (error) {
      console.error('Error promoting member:', error);
      toast.error('Lỗi khi phân quyền');
    }
  };

  const handleLeaveGroup = async () => {
    const confirmed = await confirm({
      title: 'Rời nhóm',
      description: 'Bạn có chắc muốn rời khỏi nhóm này?',
      confirmText: 'Rời nhóm',
      cancelText: 'Hủy',
      destructive: true
    });

    if (!confirmed) return;

    try {
      const result = await leaveGroup(conversation.id, currentUserId);

      // Check if user is last admin
      if (result.isLastAdmin) {
        // Show transfer admin modal
        setShowTransferAdminModal(true);
        return;
      }

      // Normal leave
      toast.success('Bạn đã rời khỏi nhóm');
      onOpenChange(false);
      setTimeout(() => {
        window.location.href = '/chat';
      }, 1000);
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Lỗi khi rời nhóm');
    }
  };

  const handleTransferAdminSuccess = async () => {
    // After transferring admin, automatically leave group
    try {
      await leaveGroup(conversation.id, currentUserId);
      toast.success('Đã chuyển quyền admin và rời khỏi nhóm');
      setShowTransferAdminModal(false);
      onOpenChange(false);
      setTimeout(() => {
        window.location.href = '/chat';
      }, 1000);
    } catch (error) {
      console.error('Error leaving group after transfer:', error);
      toast.error('Đã chuyển quyền admin nhưng không thể rời nhóm');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={twMerge('sm:max-w-[700px] max-h-[95vh]')}>
        <DialogHeader>
          <DialogTitle>Thông tin nhóm</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="members">
              Thành viên ({conversation.participants.length})
            </TabsTrigger>
            {isAdmin && <TabsTrigger value="add">Thêm thành viên</TabsTrigger>}
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6 mt-4">
            {/* Group Photo */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <img
                  src={`${supabaseUrl}/storage/v1/object/public/chat-attachments/${conversation.photo_url}`}
                  alt={conversation.title || 'Group'}
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
                {isAdmin && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50"
                    title="Đổi ảnh nhóm"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {isUploading && (
                <p className="text-sm text-gray-500">Đang tải ảnh lên...</p>
              )}
            </div>

            {/* Group Name */}
            <div className="space-y-2">
              <Label>Tên nhóm</Label>
              {isEditingName && isAdmin ? (
                <div className="flex gap-2">
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Nhập tên nhóm"
                    disabled={isUpdating}
                  />
                  <Button
                    onClick={handleUpdateName}
                    disabled={isUpdating || !groupName.trim()}
                    size="sm"
                  >
                    Lưu
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditingName(false);
                      setGroupName(conversation.title || '');
                    }}
                    disabled={isUpdating}
                    variant="outline"
                    size="sm"
                  >
                    Hủy
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{conversation.title}</span>
                  {isAdmin && (
                    <Button
                      onClick={() => setIsEditingName(true)}
                      variant="ghost"
                      size="sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Group Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Số thành viên
                </span>
                <span className="font-medium">
                  {conversation.participants.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Ngày tạo
                </span>
                <span className="font-medium">
                  {new Date(conversation.created_at).toLocaleDateString(
                    'vi-VN'
                  )}
                </span>
              </div>
              {/* Chat Enabled Toggle - Only for admins */}
              {isAdmin && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Chế độ chỉ admin chat
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {conversation.chat_enabled
                        ? 'Chỉ admin mới có thể gửi tin nhắn'
                        : 'Tất cả thành viên đều có thể chat'}
                    </span>
                  </div>
                  <Switch
                    checked={conversation.chat_enabled || false}
                    onCheckedChange={(enabled) => {
                      toggleChatEnabledMutation.mutate({
                        conversationId: conversation.id,
                        adminId: currentUserId,
                        enabled
                      });
                    }}
                    disabled={toggleChatEnabledMutation.isPending}
                  />
                </div>
              )}
            </div>

            {/* Report Group Button */}
            <Button
              onClick={() => setShowReportModal(true)}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Báo cáo nhóm
            </Button>

            {/* Leave Group Button */}
            <Button
              onClick={handleLeaveGroup}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Rời nhóm
            </Button>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {conversation.participants.map((participant) => {
                  const isCurrentUser = participant.user_id === currentUserId;
                  const isMemberAdmin = participant.role === 'admin';

                  return (
                    <div
                      key={participant.user_id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          avatarUrl={participant.profile.avatar_url}
                          displayName={participant.profile.display_name}
                          status={participant.profile.status}
                          size="sm"
                          showStatus={false}
                          className="w-10 h-10"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {participant.profile.display_name}
                              {isCurrentUser && ' (Bạn)'}
                            </span>
                            {isMemberAdmin && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {isMemberAdmin ? 'Quản trị viên' : 'Thành viên'}
                          </span>
                        </div>
                      </div>

                      {isAdmin && !isCurrentUser && (
                        <div className="flex gap-1">
                          {!isMemberAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handlePromoteToAdmin(
                                  participant.user_id,
                                  participant.profile.display_name
                                )
                              }
                              title="Cấp quyền Admin"
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleRemoveMember(
                                participant.user_id,
                                participant.profile.display_name
                              )
                            }
                            title="Xóa khỏi nhóm"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Add Members Tab */}
          {isAdmin && (
            <TabsContent value="add" className="mt-4">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Chọn bạn bè để thêm vào nhóm ({selectedMembers.size} đã chọn)
                </p>

                {nonMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Tất cả bạn bè đã ở trong nhóm
                  </div>
                ) : (
                  <>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {nonMembers.map((friend) => (
                          <div
                            key={friend.id}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                              selectedMembers.has(friend.id)
                                ? 'bg-primary/10 border-2 border-primary'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-2 border-transparent'
                            }`}
                            onClick={() => {
                              const newSelected = new Set(selectedMembers);
                              if (newSelected.has(friend.id)) {
                                newSelected.delete(friend.id);
                              } else {
                                newSelected.add(friend.id);
                              }
                              setSelectedMembers(newSelected);
                            }}
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                selectedMembers.has(friend.id)
                                  ? 'bg-primary border-primary'
                                  : 'border-gray-300'
                              }`}
                            >
                              {selectedMembers.has(friend.id) && (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <UserAvatar
                              avatarUrl={friend.avatar_url}
                              displayName={friend.display_name}
                              status={friend.status}
                              size="sm"
                              showStatus={false}
                            />
                            <div className="flex-1">
                              <div className="font-medium">
                                {friend.display_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                @{friend.username}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <Button
                      onClick={handleAddMembers}
                      disabled={selectedMembers.size === 0 || isUpdating}
                      className="w-full"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {isUpdating
                        ? 'Đang thêm...'
                        : `Thêm ${selectedMembers.size} thành viên`}
                    </Button>
                  </>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>

      <TransferAdminModal
        open={showTransferAdminModal}
        onClose={() => setShowTransferAdminModal(false)}
        conversationId={conversation.id}
        currentAdminId={currentUserId}
        onSuccess={handleTransferAdminSuccess}
      />

      {/* Report Conversation Modal */}
      <ReportConversationModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        conversationId={conversation.id}
        reportedBy={currentUserId}
        conversationName={conversation.title || undefined}
      />
    </Dialog>
  );
};
