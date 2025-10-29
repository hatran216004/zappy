import { Search } from 'lucide-react';
import AddFriendModal from './modal/AddFriendModal';

export default function SearchBar() {
  return (
    <div
      className="
        flex items-center gap-2 px-3 py-2
        bg-white text-gray-900
        dark:bg-[#2B2D31] dark:text-[#F2F3F5]
      "
    >
      {/* Search input */}
      <div
        className="
          group flex items-center flex-1 gap-2
          rounded-lg px-3 h-9
          bg-gray-100 text-gray-900
          border border-transparent
          focus-within:border-[#5865F2] focus-within:ring-4 focus-within:ring-[#5865F2]/20
          dark:bg-[#1E1F22] dark:text-[#F2F3F5]
          dark:focus-within:border-[#5865F2] dark:focus-within:ring-[#5865F2]/25
          transition-colors
        "
      >
        <Search className="h-4 w-4 text-gray-400 dark:text-[#B5BAC1] shrink-0" />
        <input
          type="text"
          placeholder="Tìm kiếm"
          className="
            flex-1 bg-transparent text-sm leading-none
            placeholder:text-gray-500 dark:placeholder:text-[#B5BAC1]
            focus:outline-none
          "
        />
      </div>

      {/* right actions */}
      <div className="flex items-center gap-2">
        <AddFriendModal />
      </div>
    </div>
  );
}
