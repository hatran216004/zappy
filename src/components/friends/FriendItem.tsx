import { useState } from 'react';

interface FriendItemProps {
  friend: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string;
    status: string; // 'online' | 'offline' ...
  };
  onRemove: () => void;
}

export default function FriendItem({ friend, onRemove }: FriendItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <li className="relative">
      {/* Row */}
      <div
        className="group flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-accent/50 transition-colors"
        role="button"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={friend.avatar_url || '/default-avatar.png'}
            alt={friend.display_name}
            className="w-12 h-12 rounded-full object-cover"
          />
          {friend.status === 'online' && (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card
                         bg-[oklch(0.79_0.14_145)]"
              title="Online"
            />
          )}
        </div>

        {/* Texts */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm sm:text-[15px] font-medium text-foreground truncate">
              {friend.display_name}
            </p>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            @{friend.username}
          </p>
        </div>

        {/* Quick actions (show on hover like Zalo) */}
        <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="h-8 px-3 text-sm rounded-full bg-primary text-primary-foreground hover:opacity-90"
            title="Nhắn tin"
          >
            Nhắn tin
          </button>
        </div>

        {/* Kebab */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu((v) => !v);
          }}
          className="ml-1 p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-accent"
          aria-label="Mở menu"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8a2 2 0 100-4 2 2 0 000 4Zm0 6a2 2 0 100-4 2 2 0 000 4Zm0 6a2 2 0 100-4 2 2 0 000 4Z" />
          </svg>
        </button>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <div
          className="absolute top-12 right-3 sm:right-4 bg-card text-foreground border border-border rounded-lg shadow-md z-10 min-w-[180px]"
          onMouseLeave={() => setShowMenu(false)}
        >
          <button
            onClick={() => setShowMenu(false)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent/50"
          >
            Nhắn tin
          </button>
          <button
            onClick={() => setShowMenu(false)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent/50"
          >
            Trang cá nhân
          </button>
          <div className="my-1 h-px bg-border" />
          <button
            onClick={() => {
              onRemove();
              setShowMenu(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent/50"
          >
            Xóa bạn bè
          </button>
        </div>
      )}
    </li>
  );
}
