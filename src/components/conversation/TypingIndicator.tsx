// components/conversation/TypingIndicator.tsx
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarUrl } from '@/lib/supabase';

interface TypingIndicatorProps {
  userName?: string;
  avatarUrl?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  userName,
  avatarUrl
}) => {
  return (
    <div className="flex justify-start items-end gap-2 mb-2 animate-fade-in">
      {/* Avatar */}
      <Avatar className="w-8 h-8">
        <AvatarImage
          src={getAvatarUrl(avatarUrl) || undefined}
          alt={userName || 'User'}
        />
        <AvatarFallback className="bg-zinc-300 text-xs">
          {userName?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>

      {/* Typing bubble with animation */}
      <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-5 py-3 shadow-sm">
        <div className="flex gap-1 items-center justify-center h-4">
          <span
            className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
          />
          <span
            className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0.2s', animationDuration: '1.4s' }}
          />
          <span
            className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0.4s', animationDuration: '1.4s' }}
          />
        </div>
      </div>
    </div>
  );
};

