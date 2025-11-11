import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { createPoll } from '@/services/chatService';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { chatKeys } from '@/hooks/useChat';

export function CreatePollModal({
  conversationId,
  userId,
  trigger
}: {
  conversationId: string;
  userId: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [multiple, setMultiple] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();

  const addOption = () => setOptions((prev) => [...prev, '']);
  const removeOption = (idx: number) =>
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  const updateOption = (idx: number, value: string) =>
    setOptions((prev) => prev.map((v, i) => (i === idx ? value : v)));

  const handleCreate = async () => {
    const cleanOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!question.trim() || cleanOptions.length < 2) {
      toast.error('Nhập câu hỏi và ít nhất 2 lựa chọn');
      return;
    }
    setSubmitting(true);
    try {
      // Optimistic add temporary poll message
      qc.setQueryData(chatKeys.messages(conversationId), (old: any) => {
        if (!old) return old;
        const temp = {
          id: `temp-poll-${Date.now()}`,
          conversation_id: conversationId,
          sender_id: userId,
          type: 'poll',
          content_text: question,
          created_at: new Date().toISOString(),
          sender: { id: userId, display_name: 'You', avatar_url: '' },
          attachments: [],
          reactions: [],
          read_receipts: [],
          reply_to: null
        };
        return {
          ...old,
          pages: old.pages.map((page: any[], index: number) =>
            index === old.pages.length - 1 ? [...page, temp] : page
          )
        };
      });

      await createPoll(conversationId, userId, question.trim(), cleanOptions, multiple);
      toast.success('Đã tạo bình chọn');
      setOpen(false);
      setQuestion('');
      setOptions(['', '']);
      setMultiple(false);

      // Invalidate to sync
      qc.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
    } catch (e: any) {
      toast.error(e?.message || 'Không thể tạo bình chọn');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" className="rounded-full" title="Tạo bình chọn">
            <PlusCircle className="size-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo bình chọn</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Câu hỏi</label>
            <input
              className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Bạn muốn hỏi gì?"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Lựa chọn</label>
              <Button size="sm" variant="secondary" onClick={addOption}>
                Thêm lựa chọn
              </Button>
            </div>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`Lựa chọn #${idx + 1}`}
                  />
                  {options.length > 2 && (
                    <Button size="sm" variant="destructive" onClick={() => removeOption(idx)}>Xóa</Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={multiple}
              onChange={(e) => setMultiple(e.target.checked)}
            />
            Cho phép chọn nhiều
          </label>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={submitting}>Tạo</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


