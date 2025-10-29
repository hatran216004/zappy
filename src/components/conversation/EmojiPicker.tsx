import React, { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isOwn?: boolean;
}

// Commonly used emojis for quick reactions
const QUICK_EMOJIS = [
  '👍', '❤️', '😂', '😮', '😢', '😡',
  '🔥', '👏', '🎉', '✨', '💯', '🙏'
];

// Emoji categories
const EMOJI_CATEGORIES = {
  'Smileys': [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
    '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
    '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
    '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨'
  ],
  'Gestures': [
    '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️',
    '🤟', '🤘', '👌', '🤏', '👈', '👉', '👆', '👇',
    '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌'
  ],
  'Hearts': [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
    '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
    '💘', '💝', '💟', '♥️'
  ],
  'Symbols': [
    '✨', '💫', '⭐', '🌟', '💥', '💢', '💯', '🔥',
    '⚡', '💨', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇'
  ]
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  isOwn = false
}) => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Smileys');
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          type="button"
          aria-label="Thêm reaction"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Smile className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isOwn ? 'end' : 'start'}
        className="w-[320px] p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          {/* Quick reactions */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Quick Reactions</p>
            <div className="grid grid-cols-6 gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-2xl p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Category tabs */}
          <div className="border-t pt-3">
            <div className="flex gap-1 mb-2">
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeCategory === category
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Emoji grid for selected category */}
            <div className="grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto">
              {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-xl p-1.5 hover:bg-gray-100 rounded transition-colors"
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

