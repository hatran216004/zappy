import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createGroupConversation } from '@/services/chatService';
import { useFriends } from '@/hooks/useFriends';
import { supabaseUrl } from '@/lib/supabase';
import { useNavigate } from 'react-router';

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  open,
  onOpenChange,
  userId
}) => {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: friends = [] } = useFriends();
  const navigate = useNavigate();

  const filteredFriends = friends.filter(
    (friend) =>
      friend.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMember = (friendId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedMembers(newSelected);
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      alert('Vui lòng nhập tên nhóm');
      return;
    }

    if (selectedMembers.size === 0) {
      alert('Vui lòng chọn ít nhất 1 thành viên');
      return;
    }

    setIsCreating(true);
    try {
      const memberIds = Array.from(selectedMembers);
      const conversationId = await createGroupConversation(
        groupName.trim(),
        memberIds,
        userId
      );

      // Reset form
      setGroupName('');
      setSelectedMembers(new Set());
      setSearchQuery('');
      onOpenChange(false);

      // Navigate to the new group chat
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Lỗi khi tạo nhóm. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setGroupName('');
      setSelectedMembers(new Set());
      setSearchQuery('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo nhóm mới</DialogTitle>
          <DialogDescription>
            Tạo nhóm chat với bạn bè của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="groupName">Tên nhóm</Label>
            <Input
              id="groupName"
              placeholder="Nhập tên nhóm..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          {/* Member Selection */}
          <div className="space-y-2">
            <Label>
              Thành viên ({selectedMembers.size} đã chọn)
            </Label>
            
            {/* Search */}
            <Input
              placeholder="Tìm bạn bè..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isCreating}
            />

            {/* Friends List */}
            <ScrollArea className="h-[300px] border rounded-md p-2">
              {filteredFriends.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {searchQuery
                    ? 'Không tìm thấy bạn bè'
                    : 'Bạn chưa có bạn bè nào'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                        selectedMembers.has(friend.id)
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'hover:bg-gray-100 border-2 border-transparent'
                      }`}
                      onClick={() => !isCreating && toggleMember(friend.id)}
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
                      <img
                        src={`${supabaseUrl}/${friend.avatar_url}`}
                        alt={friend.display_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{friend.display_name}</div>
                        <div className="text-sm text-gray-500">
                          @{friend.username}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
          >
            Hủy
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? 'Đang tạo...' : 'Tạo nhóm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

