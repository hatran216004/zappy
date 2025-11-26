// Playlist Button Component for ChatWindow

import React from 'react';
import { Music, Users, Play, Pause } from 'lucide-react';

interface PlaylistButtonProps {
  onClick: () => void;
  hasActivePlaylist?: boolean;
  isPlaying?: boolean;
  trackCount?: number;
  className?: string;
}

export const PlaylistButton: React.FC<PlaylistButtonProps> = ({
  onClick,
  hasActivePlaylist = false,
  isPlaying = false,
  trackCount = 0,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
        hasActivePlaylist
          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
      } ${className}`}
      title="Playlist Cùng Nghe"
    >
      <div className="relative">
        <Music className="w-5 h-5" />
        
        {/* Active indicator */}
        {hasActivePlaylist && (
          <div className="absolute -top-1 -right-1">
            {isPlaying ? (
              <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </div>
            ) : (
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
            )}
          </div>
        )}
      </div>
      
      <span className="text-sm font-medium hidden sm:inline">
        {hasActivePlaylist ? 'Playlist' : 'Nghe cùng'}
      </span>
      
      {/* Track count badge */}
      {hasActivePlaylist && trackCount > 0 && (
        <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {trackCount}
        </span>
      )}
    </button>
  );
};
