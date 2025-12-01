import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';
import { FriendSearch } from '../friends/FriendSearch';

interface AddFriendModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function AddFriendModal({ 
  open, 
  onOpenChange, 
  trigger 
}: AddFriendModalProps = {}) {
  const defaultTrigger = (
    <button
      type="button"
      aria-label="Thêm bạn"
      className="
        discord-icon-btn
        text-gray-600 hover:text-gray-900
        dark:text-[#B5BAC1] dark:hover:text-white
      "
    >
      <UserPlus className="w-5 h-5" />
    </button>
  );

  // Check if it's controlled mode (both open and onOpenChange are provided)
  const isControlled = open !== undefined && onOpenChange !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-[15px] font-semibold">
            Thêm bạn
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[78vh] overflow-y-auto">
          <FriendSearch />
        </div>
      </DialogContent>
    </Dialog>
  );
}
