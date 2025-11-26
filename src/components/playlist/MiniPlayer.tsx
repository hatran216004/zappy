import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Maximize2, 
  Minimize2,
  Volume2,
  X
} from 'lucide-react';
import { useSharedPlaylist } from '../../hooks/useSharedPlaylist';
import { useGlobalAudio } from '../../hooks/useGlobalAudio';
import { formatDuration } from '../../utils/date';

interface MiniPlayerProps {
  conversationId: string;
  onExpand?: () => void;
  onClose?: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ 
  conversationId, 
  onExpand,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  const {
    playlist,
    currentTrack,
    isPlaying,
    play,
    pause,
    next,
    previous,
    error,
    initializePlaylist
  } = useSharedPlaylist(conversationId);

  const globalAudio = useGlobalAudio();

  // Initialize playlist when MiniPlayer mounts
  React.useEffect(() => {
    if (!playlist && initializePlaylist) {
      console.log('🎵 MiniPlayer: Initializing playlist');
      initializePlaylist();
    }
  }, [playlist, initializePlaylist]);

  // Don't show mini player if not visible or no playlist
  if (!isVisible || !playlist) {
    return null;
  }

  const hasContent = playlist?.tracks && playlist.tracks.length > 0;

  const handlePlayPause = async () => {
    if (!currentTrack) return;
    
    // Sử dụng global audio để control
    if (currentTrack.source_type === 'local' && currentTrack.source_url) {
      if (globalAudio.currentTrack?.id === currentTrack.id && globalAudio.isPlaying) {
        // Pause global audio
        globalAudio.pauseAudio();
        await pause();
      } else if (globalAudio.currentTrack?.id === currentTrack.id && !globalAudio.isPlaying) {
        // Resume paused track
        globalAudio.resumeAudio();
        await play(currentTrack.id);
      } else {
        // Play new track globally
        globalAudio.playTrack(currentTrack);
        await play(currentTrack.id);
      }
    }
  };

  const handleNext = () => {
    // Dừng global audio
    globalAudio.stopAudio();
    next();
  };

  const handlePrevious = () => {
    // Dừng global audio
    globalAudio.stopAudio();
    previous();
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    onExpand?.();
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const currentTime = globalAudio.currentTime;
  const duration = globalAudio.duration;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${
      isExpanded ? 'w-80 h-36' : 'w-72 h-20'
    }`}>
      
      {/* Main Mini Player */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 cursor-pointer"
             onClick={(e) => {
               if (globalAudio.currentAudio) {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const clickX = e.clientX - rect.left;
                 const percentage = clickX / rect.width;
                 const newTime = percentage * duration;
                 globalAudio.seekTo(newTime);
               }
             }}>
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Player Content */}
        <div className="p-3">
          <div className="flex items-center space-x-3">
            {/* Track Info */}
            <div className="flex-1 min-w-0">
              {currentTrack ? (
                <>
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {currentTrack.title}
                  </div>
                  {currentTrack.artist && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {currentTrack.artist}
                    </div>
                  )}
                  {isExpanded && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDuration(currentTime)} / {formatDuration(duration)}
                    </div>
                  )}
                </>
              ) : playlist ? (
                <>
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {playlist.name || 'Playlist Cùng Nghe'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {hasContent ? `${playlist.tracks?.length || 0} bài hát` : 'Chưa có bài hát'}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Đang tải playlist...
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Vui lòng đợi
                  </div>
                </>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              {isExpanded && (
                <button
                  onClick={handlePrevious}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  disabled={!playlist?.tracks?.length}
                >
                  <SkipBack className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              )}

              <button
                onClick={handlePlayPause}
                className={`p-2 rounded-full text-white transition-all duration-200 ${
                  !currentTrack || currentTrack.source_type !== 'local'
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600 hover:scale-110 active:scale-95'
                }`}
                disabled={!currentTrack || currentTrack.source_type !== 'local'}
                title={!currentTrack ? 'Không có bài hát' : currentTrack.source_type !== 'local' ? 'Chỉ hỗ trợ local audio' : globalAudio.isPlaying ? 'Tạm dừng' : 'Phát'}
              >
                {globalAudio.currentTrack?.id === currentTrack?.id && globalAudio.isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>

              {isExpanded && (
                <button
                  onClick={handleNext}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  disabled={!playlist?.tracks?.length}
                >
                  <SkipForward className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              )}

              <button
                onClick={handleExpand}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                )}
              </button>

              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-3 space-y-2">
              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-gray-500" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={globalAudio.volume}
                  onChange={(e) => {
                    globalAudio.setVolume(parseFloat(e.target.value));
                  }}
                  className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <span className="text-xs text-gray-500 w-8">
                  {Math.round(globalAudio.volume * 100)}%
                </span>
              </div>

              {/* Playlist Info */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Playlist: {playlist?.name || 'Unknown'} • {playlist?.tracks?.length || 0} tracks
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs rounded border">
          {error}
        </div>
      )}
    </div>
  );
};

export default MiniPlayer;
