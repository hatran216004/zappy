import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useContactLabels,
  useCreateContactLabel,
  useUpdateContactLabel,
  useDeleteContactLabel
} from '@/hooks/useFriends';
import { Trash2, Edit2, Plus, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ContactLabel } from '@/services/friendServices';

interface ManageLabelsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

// Predefined colors
const LABEL_COLORS = [
  { value: 0, color: 'bg-gray-500', name: 'Xám' },
  { value: 1, color: 'bg-red-500', name: 'Đỏ' },
  { value: 2, color: 'bg-orange-500', name: 'Cam' },
  { value: 3, color: 'bg-yellow-500', name: 'Vàng' },
  { value: 4, color: 'bg-green-500', name: 'Xanh lá' },
  { value: 5, color: 'bg-blue-500', name: 'Xanh dương' },
  { value: 6, color: 'bg-purple-500', name: 'Tím' },
  { value: 7, color: 'bg-pink-500', name: 'Hồng' },
];

export const ManageLabelsModal: React.FC<ManageLabelsModalProps> = ({
  open,
  onOpenChange,
  userId
}) => {
  const { data: labels, isLoading } = useContactLabels(userId || ''); // Handle undefined
  const createLabelMutation = useCreateContactLabel();
  const updateLabelMutation = useUpdateContactLabel();
  const deleteLabelMutation = useDeleteContactLabel();

  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(0);
  const [editingLabel, setEditingLabel] = useState<ContactLabel | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(0);

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      toast.error('Vui lòng nhập tên nhãn');
      return;
    }

    try {
      await createLabelMutation.mutateAsync({
        userId,
        name: newLabelName.trim(),
        color: newLabelColor
      });
      toast.success('Tạo nhãn thành công');
      setNewLabelName('');
      setNewLabelColor(0);
    } catch (error) {
      console.error('Error creating label:', error);
      toast.error('Lỗi khi tạo nhãn');
    }
  };

  const handleStartEdit = (label: ContactLabel) => {
    setEditingLabel(label);
    setEditName(label.name);
    setEditColor(label.color);
  };

  const handleCancelEdit = () => {
    setEditingLabel(null);
    setEditName('');
    setEditColor(0);
  };

  const handleUpdateLabel = async () => {
    if (!editingLabel || !editName.trim()) {
      toast.error('Vui lòng nhập tên nhãn');
      return;
    }

    try {
      await updateLabelMutation.mutateAsync({
        labelId: editingLabel.id,
        name: editName.trim(),
        color: editColor,
        userId
      });
      toast.success('Cập nhật nhãn thành công');
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating label:', error);
      toast.error('Lỗi khi cập nhật nhãn');
    }
  };

  const handleDeleteLabel = async (label: ContactLabel) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa nhãn "${label.name}"? Nhãn sẽ bị xóa khỏi tất cả bạn bè.`
    );

    if (!confirmed) return;

    try {
      await deleteLabelMutation.mutateAsync({ labelId: label.id, userId });
      toast.success('Xóa nhãn thành công');
    } catch (error) {
      console.error('Error deleting label:', error);
      toast.error('Lỗi khi xóa nhãn');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quản lý nhãn phân loại</DialogTitle>
          <DialogDescription>
            Tạo, sửa hoặc xóa nhãn để phân loại bạn bè của bạn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new label */}
          <div className="space-y-3">
            <Label>Tạo nhãn mới</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tên nhãn..."
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateLabel();
                }}
                className="flex-1"
              />
              <Button
                onClick={handleCreateLabel}
                disabled={createLabelMutation.isPending || !newLabelName.trim()}
                size="icon"
              >
                <Plus className="size-4" />
              </Button>
            </div>

            {/* Color picker */}
            <div className="flex gap-2 flex-wrap">
              {LABEL_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setNewLabelColor(c.value)}
                  className={`w-8 h-8 rounded-full ${c.color} ${
                    newLabelColor === c.value
                      ? 'ring-2 ring-offset-2 ring-primary'
                      : 'opacity-70 hover:opacity-100'
                  } transition-all`}
                  title={c.name}
                  type="button"
                />
              ))}
            </div>
          </div>

          {/* Existing labels */}
          <div className="space-y-2">
            <Label>Nhãn hiện có ({labels?.length || 0})</Label>
            <ScrollArea className="h-64 rounded-lg border p-3">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Đang tải...
                </div>
              ) : !labels || labels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Chưa có nhãn nào
                </div>
              ) : (
                <div className="space-y-2">
                  {labels.map((label) => (
                    <div
                      key={label.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      {editingLabel?.id === label.id ? (
                        <>
                          {/* Edit mode */}
                          <div className="flex gap-2 flex-wrap mb-1">
                            {LABEL_COLORS.map((c) => (
                              <button
                                key={c.value}
                                onClick={() => setEditColor(c.value)}
                                className={`w-6 h-6 rounded-full ${c.color} ${
                                  editColor === c.value
                                    ? 'ring-2 ring-offset-1 ring-primary'
                                    : 'opacity-70'
                                } transition-all`}
                                type="button"
                              />
                            ))}
                          </div>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateLabel();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="flex-1"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleUpdateLabel}
                            disabled={updateLabelMutation.isPending}
                          >
                            <Check className="size-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleCancelEdit}
                          >
                            <X className="size-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          {/* View mode */}
                          <span
                            className={`w-4 h-4 rounded-full ${
                              LABEL_COLORS[label.color]?.color || 'bg-gray-500'
                            } flex-shrink-0`}
                          />
                          <span className="flex-1 font-medium">{label.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleStartEdit(label)}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteLabel(label)}
                            disabled={deleteLabelMutation.isPending}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

