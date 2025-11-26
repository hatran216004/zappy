// Shared Playlist Panel - "Playlist Cùng Nghe"

import React, { useState, useEffect } from 'react';
import { Play, Plus, Music, Users } from 'lucide-react';
import { useSharedPlaylist } from '@/hooks/useSharedPlaylist';
import { PlaylistTrackList } from './PlaylistTrackList';
import { AddTrackModal } from './AddTrackModal';
import { SyncIndicator } from './SyncIndicator';

interface SharedPlaylistPanelProps {
  conversationId: string;
  isVisible: boolean;
  onClose: () => void;
}

export const SharedPlaylistPanel: React.FC<SharedPlaylistPanelProps> = ({
  conversationId,
  isVisible,
  onClose
}) => {
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);

  // Shared playlist hook
  const {
    playlist,
    isLoading,
    error,
    isPlaying,
    currentTrack,
    initializePlaylist,
    play,
    addLocalAudio,
    removeTrack,
    reorderTrack,
    isSynced,
    lastSyncTime
  } = useSharedPlaylist(conversationId);

  // Sync local state with playlist state
  useEffect(() => {
    setLocalIsPlaying(isPlaying);
  }, [isPlaying]);

  // Debug playlist state changes
  useEffect(() => {
    console.log('Playlist state changed:', {
      isPlaying,
      localIsPlaying,
      currentTrack: currentTrack?.id,
      currentTrackTitle: currentTrack?.title,
      playlistId: playlist?.id
    });
  }, [isPlaying, localIsPlaying, currentTrack, playlist]);

  // Initialize playlist on mount
  useEffect(() => {
    if (isVisible && conversationId) {
      initializePlaylist();
    }
  }, [isVisible, conversationId, initializePlaylist]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed overflow-hidden inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-7xl h-[90vh] sm:h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center space-x-3">
            <Music className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Playlist Cùng Nghe
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{playlist?.tracks.length || 0} bài hát</span>
                <SyncIndicator
                  isSynced={isSynced}
                  lastSyncTime={lastSyncTime}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddTrackModal(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm nhạc</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[2fr_3fr] overflow-y-auto">
          {/* Track List */}
          <div className="flex-1 lg:flex-none overflow-y-auto lg:border-r border-gray-200 dark:border-gray-700 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-500">Đang tải playlist...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-red-500">
                  <p>Lỗi: {error}</p>
                  <button
                    onClick={initializePlaylist}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            ) : playlist && playlist.tracks.length > 0 ? (
              <PlaylistTrackList
                tracks={playlist.tracks}
                onTrackSelect={(trackId) => play(trackId)}
                onTrackRemove={removeTrack}
                onTrackReorder={reorderTrack}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Playlist trống</p>
                  <p className="text-sm mb-4">
                    Thêm nhạc để bắt đầu nghe cùng nhau!
                  </p>
                  <button
                    onClick={() => setShowAddTrackModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Thêm bài hát đầu tiên
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Audio Player Area - Chỉ hiển thị thông tin track */}
          {currentTrack && (
            <div className="flex-1 lg:flex-none p-4 lg:p-6 flex flex-col bg-gray-50 dark:bg-gray-900 min-h-0">
              <div className="flex-1 flex flex-col max-w-full">
                <div className="w-full aspect-video rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4 shadow-lg">
                  <div className="text-center">
                    <Music className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Local Audio Track</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {currentTrack.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty Player State */}
        {!currentTrack && (
          <div className="w-96 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-full aspect-video rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-6 shadow-lg">
              <Music className="w-20 h-20 text-gray-400" />
            </div>

            {playlist && playlist.tracks.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Chọn bài hát để phát
                </h3>
                <p className="text-gray-500 mb-4">
                  Click vào bài hát bên trái để bắt đầu nghe
                </p>
                <button
                  onClick={() => {
                    console.log(
                      '🎵 SIMPLE Play button clicked',
                      playlist.tracks[0]
                    );
                    play(playlist.tracks[0].id);
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  <span>Phát bài đầu tiên</span>
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Playlist trống
                </h3>
                <p className="text-gray-500 mb-4">
                  Thêm bài hát để bắt đầu nghe cùng nhau
                </p>
                <button
                  onClick={() => setShowAddTrackModal(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Thêm bài hát</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Track Modal */}
      {showAddTrackModal && (
        <AddTrackModal
          onClose={() => setShowAddTrackModal(false)}
          onAddLocal={async (audioFile) => {
            await addLocalAudio(audioFile);
            setShowAddTrackModal(false);
          }}
        />
      )}
    </div>
  );
};
