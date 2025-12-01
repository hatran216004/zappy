import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/hooks/useProfile';
import { useOnboarding } from '@/hooks/useOnboarding';
import toast from 'react-hot-toast';
import { Settings, BookOpen } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

interface ProfileWithPrivacy {
  block_messages_from_strangers?: boolean;
  is_private?: boolean;
}

export function SettingsModal({ open, onClose, userId }: SettingsModalProps) {
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { data: profile, refetch } = useProfile(userId);
  const { restartTour } = useOnboarding(userId);

  const [blockStrangers, setBlockStrangers] = useState(
    (profile as ProfileWithPrivacy)?.block_messages_from_strangers || false
  );
  const [isPrivate, setIsPrivate] = useState(
    (profile as ProfileWithPrivacy)?.is_private || false
  );

  // Update local state when profile changes
  useEffect(() => {
    if (profile) {
      const profileWithPrivacy = profile as ProfileWithPrivacy;
      setBlockStrangers(
        profileWithPrivacy.block_messages_from_strangers || false
      );
      setIsPrivate(profileWithPrivacy.is_private || false);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          block_messages_from_strangers: blockStrangers,
          is_private: isPrivate
        } as Record<string, unknown>)
        .eq('id', userId);

      if (error) throw error;

      // Invalidate profile query
      queryClient.invalidateQueries({
        queryKey: ['profile', userId]
      });

      // Refetch profile
      await refetch();

      toast.success('Đã lưu cài đặt');
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Không thể lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cài đặt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Block messages from strangers */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="block-strangers"
                className="text-base font-medium"
              >
                Chặn tin nhắn từ người lạ
              </Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Khi bật, bạn sẽ không nhận được tin nhắn từ những người chưa kết
                bạn
              </p>
            </div>
            <Switch
              id="block-strangers"
              checked={blockStrangers}
              onCheckedChange={setBlockStrangers}
            />
          </div>

          {/* Privacy mode */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="privacy-mode" className="text-base font-medium">
                Chế độ riêng tư
              </Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Khi bật, bạn sẽ vào chế độ riêng tư, không thể nhận được lời mời
                kết bạn từ người khác và tag
              </p>
            </div>
            <Switch
              id="privacy-mode"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>

          {/* Xem lại hướng dẫn */}
          <div className="flex items-center justify-between space-x-4 pt-2 border-t">
            <div className="flex-1 space-y-1">
              <Label className="text-base font-medium">Hướng dẫn sử dụng</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Xem lại tour hướng dẫn để khám phá các tính năng của hệ thống
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                restartTour();
                onClose();
                toast.success('Đã khởi động lại hướng dẫn');
              }}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Xem lại hướng dẫn
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
