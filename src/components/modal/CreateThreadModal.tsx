import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateThread } from '@/hooks/useChat';
import { MessageSquare } from 'lucide-react';

interface CreateThreadModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  createdBy: string;
  rootMessageId?: string; // Optional: message that started the thread
  rootMessagePreview?: string; // Preview of root message
}

export function CreateThreadModal({
  open,
  onClose,
  conversationId,
  createdBy,
  rootMessageId,
  rootMessagePreview,
}: CreateThreadModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const createThreadMutation = useCreateThread();

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    try {
      await createThreadMutation.mutateAsync({
        conversationId,
        title: title.trim(),
        description: description.trim() || undefined,
        rootMessageId: rootMessageId || undefined,
        createdBy,
      });
      handleClose();
    } catch (error) {
      // Error is handled by the hook
      console.error('Error creating thread:', error);
    }
  };

  const handleClose = () => {
    if (!createThreadMutation.isPending) {
      setTitle('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Tạo chủ đề mới
          </DialogTitle>
          <DialogDescription>
            Tạo một chủ đề để trao đổi tập trung về một vấn đề cụ thể
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Root Message Preview */}
          {rootMessagePreview && (
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Tin nhắn gốc:
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {rootMessagePreview}
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Tên chủ đề <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ví dụ: Thiết kế màn hình Report, Bug thanh toán 12/11..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={createThreadMutation.isPending}
              maxLength={100}
            />
            <div className="text-xs text-gray-500 text-right">
              {title.length}/100
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả (tùy chọn)</Label>
            <Textarea
              id="description"
              placeholder="Ghi chú mục đích/chủ đề trao đổi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={createThreadMutation.isPending}
            />
            <div className="text-xs text-gray-500 text-right">
              {description.length}/500
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createThreadMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || createThreadMutation.isPending}
          >
            {createThreadMutation.isPending ? 'Đang tạo...' : 'Tạo chủ đề'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

