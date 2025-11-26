// Playlist Track List Component

import React, { useState } from 'react';
import {
  Play,
  Pause,
  MoreVertical,
  Trash2,
  GripVertical,
  Music,
  HardDrive,
  Clock
} from 'lucide-react';
import { PlaylistTrack } from '@/types/playlist';
import { formatDuration } from '@/utils/date';
import { useGlobalAudio } from '@/hooks/useGlobalAudio';

interface PlaylistTrackListProps {
  tracks: (PlaylistTrack & {
    added_by_profile: {
      id: string;
      display_name: string;
      avatar_url: string;
    };
  })[];
  onTrackSelect: (trackId: string) => void;
  onTrackRemove: (trackId: string) => void;
  onTrackReorder: (trackId: string, newPosition: number) => void;
}

interface TrackItemProps {
  track: PlaylistTrack & {
    added_by_profile: {
      id: string;
      display_name: string;
      avatar_url: string;
    };
  };
  onSelect: () => void;
  onRemove: () => void;
  onReorder: (newPosition: number) => void;
}

const TrackItem: React.FC<TrackItemProps> = ({ track, onSelect, onRemove }) => {
  const [showMenu, setShowMenu] = useState(false);
  const globalAudio = useGlobalAudio();

  // Check if this track is currently playing globally
  const isGloballyPlaying =
    globalAudio.currentTrack?.id === track.id && globalAudio.isPlaying;

  const getSourceIcon = () => {
    switch (track.source_type) {
      case 'local':
        return <HardDrive className="w-4 h-4 text-gray-500" />;
      default:
        return <Music className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleTrackClick = () => {
    // Chỉ xử lý local audio
    if (track.source_type === 'local' && track.source_url) {
      // Nếu đây là track đang phát globally, pause nó
      if (isGloballyPlaying) {
        console.log('⏸️ Pausing globally playing track');
        globalAudio.pauseAudio();
      } else if (
        globalAudio.currentTrack?.id === track.id &&
        !globalAudio.isPlaying
      ) {
        // Nếu đây là track đã pause, resume nó
        console.log('▶️ Resuming paused track:', track.title);
        globalAudio.resumeAudio();
      } else {
        // Phát track mới (sẽ tự động dừng track cũ)
        console.log('🎵 Playing new track:', track.title);
        globalAudio.playTrack(track);
      }

      // Cập nhật playlist state
      onSelect();
    }
  };

  return (
    <div
      className={`group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
        globalAudio.currentTrack?.id === track.id
          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
          : ''
      }`}
      onClick={handleTrackClick}
    >
      {/* Drag Handle */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Track Number / Play Button */}
      <div className="w-8 h-8 flex items-center justify-center">
        {isGloballyPlaying ? (
          <div className="w-4 h-4 flex items-center justify-center">
            <div className="flex space-x-1">
              <div className="w-1 h-4 bg-blue-500 animate-pulse"></div>
              <div
                className="w-1 h-4 bg-blue-500 animate-pulse"
                style={{ animationDelay: '0.2s' }}
              ></div>
              <div
                className="w-1 h-4 bg-blue-500 animate-pulse"
                style={{ animationDelay: '0.4s' }}
              ></div>
            </div>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Ngăn event bubble lên track click
              handleTrackClick();
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors group"
          >
            {/* Show pause icon on hover if this track is globally playing */}
            {globalAudio.currentTrack?.id === track.id &&
            globalAudio.isPlaying ? (
              <Pause className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
            ) : (
              <Play className="w-4 h-4 text-gray-500 group-hover:text-blue-500" />
            )}
          </button>
        )}
      </div>

      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
        {track.thumbnail_url ? (
          <img
            src={track.thumbnail_url}
            alt={track.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {getSourceIcon()}
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4
            className={`font-medium truncate ${
              globalAudio.currentTrack?.id === track.id
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {track.title}
          </h4>
          {getSourceIcon()}
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="truncate">{track.artist || 'Unknown Artist'}</span>
          {track.duration_ms && (
            <>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(track.duration_ms)}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
          <span>Thêm bởi {track.added_by_profile.display_name}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
              <button
                onClick={() => {
                  onRemove();
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa khỏi playlist</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const PlaylistTrackList: React.FC<PlaylistTrackListProps> = ({
  tracks,
  onTrackSelect,
  onTrackRemove,
  onTrackReorder
}) => {
  const [draggedTrack, setDraggedTrack] = useState<string | null>(null);
  const [, forceUpdate] = useState({});

  // Force re-render when tracks change for realtime updates
  React.useEffect(() => {
    forceUpdate({});
  }, [tracks.length]);

  const handleDragStart = (trackId: string) => {
    setDraggedTrack(trackId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetTrackId: string) => {
    e.preventDefault();

    if (!draggedTrack || draggedTrack === targetTrackId) {
      setDraggedTrack(null);
      return;
    }

    const draggedIndex = tracks.findIndex((t) => t.id === draggedTrack);
    const targetIndex = tracks.findIndex((t) => t.id === targetTrackId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      onTrackReorder(draggedTrack, targetIndex + 1); // Position is 1-based
    }

    setDraggedTrack(null);
  };

  if (tracks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Chưa có bài hát nào trong playlist</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Danh sách phát ({tracks.length} bài)
        </h3>
      </div>

      <div className="space-y-1">
        {tracks.map((track) => (
          <div
            key={track.id}
            draggable
            onDragStart={() => handleDragStart(track.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, track.id)}
            className={draggedTrack === track.id ? 'opacity-50' : ''}
          >
            <TrackItem
              track={track}
              onSelect={() => onTrackSelect(track.id)}
              onRemove={() => onTrackRemove(track.id)}
              onReorder={(newPosition) => onTrackReorder(track.id, newPosition)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
