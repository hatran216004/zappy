import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';
import { TooltipBtn } from '../TooltipBtn';
import { FriendSearch } from '../friends/FriendSearch';

export default function AddFriendModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <TooltipBtn icon={UserPlus} label="Thêm bạn" />
      </DialogTrigger>

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
