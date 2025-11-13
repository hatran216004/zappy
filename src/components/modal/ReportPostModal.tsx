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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useReportPost } from '@/hooks/usePosts';
import type { ReportReason } from '@/services/postService';
import { AlertTriangle } from 'lucide-react';

interface ReportPostModalProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  reportedBy: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'spam',
    label: 'Spam',
    description: 'Bài viết spam, quảng cáo không mong muốn'
  },
  {
    value: 'harassment',
    label: 'Quấy rối',
    description: 'Bài viết quấy rối, đe dọa hoặc làm phiền'
  },
  {
    value: 'inappropriate_content',
    label: 'Nội dung không phù hợp',
    description: 'Nội dung không phù hợp, tục tĩu hoặc 18+'
  },
  {
    value: 'violence',
    label: 'Bạo lực',
    description: 'Nội dung bạo lực hoặc kích động bạo lực'
  },
  {
    value: 'hate_speech',
    label: 'Ngôn từ thù địch',
    description: 'Ngôn từ thù địch, phân biệt đối xử'
  },
  {
    value: 'fake_news',
    label: 'Tin giả',
    description: 'Thông tin sai lệch, tin giả'
  },
  {
    value: 'other',
    label: 'Khác',
    description: 'Lý do khác (vui lòng mô tả)'
  }
];

export function ReportPostModal({
  open,
  onClose,
  postId,
  reportedBy,
}: ReportPostModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const reportMutation = useReportPost();

  const handleSubmit = async () => {
    if (!selectedReason) {
      return;
    }

    try {
      await reportMutation.mutateAsync({
        postId,
        reportedBy,
        reason: selectedReason,
        description: description.trim() || undefined
      });
      onClose();
      // Reset form
      setSelectedReason(null);
      setDescription('');
    } catch (error) {
      // Error is handled by the hook
      console.error('Error reporting post:', error);
    }
  };

  const handleClose = () => {
    if (!reportMutation.isPending) {
      onClose();
      setSelectedReason(null);
      setDescription('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <DialogTitle>Báo cáo bài viết</DialogTitle>
          </div>
          <DialogDescription>
            Vui lòng chọn lý do báo cáo bài viết này. Chúng tôi sẽ xem xét và xử lý báo cáo của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Lý do báo cáo *</Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => setSelectedReason(reason.value)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    selectedReason === reason.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{reason.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{reason.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Mô tả thêm (tùy chọn)
            </Label>
            <Textarea
              id="description"
              placeholder="Cung cấp thêm thông tin chi tiết về vấn đề..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
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
            disabled={reportMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || reportMutation.isPending}
            variant="destructive"
          >
            {reportMutation.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

