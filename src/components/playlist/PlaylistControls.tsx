// Playlist Player Controls Component

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Music,
  Youtube,
  HardDrive
} from 'lucide-react';
import { PlaylistTrack } from '@/types/playlist';
import { formatDuration } from '@/utils/date';
import { YouTubePlayer, YouTubePlayerRef } from './YouTubePlayer';
import { YouTubePlayerState } from '@/services/youtubeService';

interface PlaylistControlsProps {
  track: PlaylistTrack;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (position: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (volume: number) => void;
  youtubePlayerRef?: React.RefObject<YouTubePlayerRef>;
}

export const PlaylistControls: React.FC<PlaylistControlsProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  volume,
  isLoading,
  onPlay,
  onPause,
  onSeek,
  onNext,
  onPrevious,
  onVolumeChange,
  youtubePlayerRef
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayProgress = isDragging ? dragPosition : progress;

  const getSourceIcon = () => {
    switch (track.source_type) {
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-500" />;
      case 'local':
        return <HardDrive className="w-5 h-5 text-gray-500" />;
      default:
        return <Music className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updateProgress(e);
  };

  const handleProgressMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updateProgress(e as any);
    }
  };

  const handleProgressMouseUp = (e: MouseEvent) => {
    if (isDragging) {
      updateProgress(e as any);
      const newPosition = (dragPosition / 100) * duration;
      onSeek(newPosition);
      setIsDragging(false);
    }
  };

  const updateProgress = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setDragPosition(percentage);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleProgressMouseMove);
      document.addEventListener('mouseup', handleProgressMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleProgressMouseMove);
        document.removeEventListener('mouseup', handleProgressMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="space-y-4">
      {/* Track Info */}
      <div className="text-center">
        <div className="w-48 h-48 mx-auto rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 mb-4">
          {track.source_type === 'youtube' && track.source_id ? (
            <YouTubePlayer
              ref={youtubePlayerRef}
              videoId={track.source_id}
              onReady={() => console.log('YouTube player ready')}
              onStateChange={(state) => {
                // Handle state changes if needed
                if (state === YouTubePlayerState.ENDED) {
                  onNext();
                }
              }}
              onTimeUpdate={(currentTime, duration) => {
                // Time updates are handled by the parent component
              }}
              className="w-full h-full"
            />
          ) : track.thumbnail_url ? (
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
        
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
            {track.title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {track.artist || 'Unknown Artist'}
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            {getSourceIcon()}
            <span className="capitalize">{track.source_type}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div
          className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
          onMouseDown={handleProgressMouseDown}
        >
          <div
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-150"
            style={{ width: `${displayProgress}%` }}
          />
          <div
            className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-lg transition-opacity ${
              isDragging || displayProgress > 0 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ left: `calc(${displayProgress}% - 8px)` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatDuration(currentTime)}</span>
          <span>{duration > 0 ? formatDuration(duration) : '--:--'}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={onPrevious}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <SkipBack className="w-6 h-6" />
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={isLoading}
          className="w-12 h-12 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </button>

        <button
          onClick={onNext}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center justify-center space-x-3">
        <button
          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {volume === 0 ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>

        {showVolumeSlider && (
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-xs text-gray-500 w-8">
              {Math.round(volume * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Track Details */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Nguồn:</span>
            <span className="text-gray-900 dark:text-white capitalize">
              {track.source_type === 'youtube' ? 'YouTube' : 'Local File'}
            </span>
          </div>
          
          {track.duration_ms && (
            <div className="flex justify-between">
              <span className="text-gray-500">Thời lượng:</span>
              <span className="text-gray-900 dark:text-white">
                {formatDuration(track.duration_ms)}
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-500">Thêm lúc:</span>
            <span className="text-gray-900 dark:text-white">
              {new Date(track.added_at).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
