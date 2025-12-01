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
        {playlist && playlist.tracks.length > 0 ? (
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[2fr_3fr] overflow-hidden">
            {/* Track List */}
            <div className="flex-1 lg:flex-none overflow-y-auto lg:border-r border-gray-200 dark:border-gray-700">
              <PlaylistTrackList
                tracks={playlist.tracks}
                onTrackSelect={(trackId) => play(trackId)}
                onTrackRemove={removeTrack}
                onTrackReorder={reorderTrack}
              />
            </div>

            {/* Audio Player Area */}
            {currentTrack ? (
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
            ) : (
              <div className="hidden lg:flex flex-1 lg:flex-none p-6 lg:p-8 flex-col items-center justify-center text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-0">
                <div className="max-w-sm">
                  <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-6 shadow-xl border-2 border-dashed border-blue-300 dark:border-gray-600">
                    <div className="text-center">
                      <Music className="w-16 h-16 text-blue-400 dark:text-blue-500 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Sẵn sàng phát
                      </p>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Chọn bài hát để phát
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                    Click vào bài hát bên trái để bắt đầu nghe nhạc cùng nhau
                  </p>
                  <button
                    onClick={() => {
                      console.log(
                        '🎵 SIMPLE Play button clicked',
                        playlist.tracks[0]
                      );
                      play(playlist.tracks[0].id);
                    }}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Play className="w-5 h-5" />
                    <span>Phát bài đầu tiên</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-500 dark:text-gray-400">Đang tải playlist...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-red-500">
                  <p>Lỗi: {error}</p>
                  <button
                    onClick={initializePlaylist}
                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full w-full px-4 py-12">
                <div className="text-center max-w-lg">
                  <div className="mb-8 flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
                      <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-full p-10 shadow-2xl">
                        <Music className="w-20 h-20 text-blue-500 dark:text-blue-400 mx-auto" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Playlist trống
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
                    Thêm nhạc để bắt đầu nghe cùng nhau với bạn bè!
                  </p>
                  <button
                    onClick={() => setShowAddTrackModal(true)}
                    className="inline-flex items-center space-x-3 px-8 py-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-semibold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                  >
                    <Plus className="w-6 h-6" />
                    <span>Thêm bài hát đầu tiên</span>
                  </button>
                </div>
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
