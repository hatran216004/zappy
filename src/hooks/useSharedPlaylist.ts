// Hook for Shared Playlist - "Playlist Cùng Nghe"

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SharedPlaylist,
  PlaylistTrack,
  PlaylistSyncEvent,
  PlaylistWithTracks,
  PlaylistState,
  LocalAudioFile
} from '@/types/playlist';
import {
  getOrCreateSharedPlaylist,
  getPlaylistWithTracks,
  subscribeToPlaylistChanges,
  subscribeToSyncEvents,
  playTrack,
  pauseTrack,
  seekToPosition,
  nextTrack,
  previousTrack,
  addLocalAudioTrack,
  removeTrackFromPlaylist,
  reorderTracks
} from '@/services/playlistService';

interface UseSharedPlaylistReturn {
  // State
  playlist: PlaylistWithTracks | null;
  isLoading: boolean;
  error: string | null;
  
  // Player state
  isPlaying: boolean;
  currentTrack: PlaylistTrack | null;
  currentPosition: number;
  serverTimestamp: number;
  
  // Actions
  initializePlaylist: () => Promise<void>;
  play: (trackId?: string) => Promise<void>;
  pause: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  
  // Track management
  addLocalAudio: (audioFile: LocalAudioFile) => Promise<void>;
  removeTrack: (trackId: string) => Promise<void>;
  reorderTrack: (trackId: string, newPosition: number) => Promise<void>;
  
  // Sync status
  isSynced: boolean;
  lastSyncTime: number;
}

export const useSharedPlaylist = (conversationId: string): UseSharedPlaylistReturn => {
  const [playlist, setPlaylist] = useState<PlaylistWithTracks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<PlaylistTrack | null>(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [serverTimestamp, setServerTimestamp] = useState(0);
  
  // Sync state
  const [isSynced, setIsSynced] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  
  // Refs for cleanup
  const playlistUnsubscribe = useRef<(() => void) | null>(null);
  const syncUnsubscribe = useRef<(() => void) | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize playlist
  const initializePlaylist = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get or create playlist
      const sharedPlaylist = await getOrCreateSharedPlaylist(conversationId);
      const playlistWithTracks = await getPlaylistWithTracks(conversationId);
      
      if (playlistWithTracks) {
        setPlaylist(playlistWithTracks);
        setIsPlaying(playlistWithTracks.is_playing);
        setCurrentTrack(playlistWithTracks.current_track || null);
        setCurrentPosition(playlistWithTracks.current_position_ms);
        setServerTimestamp(new Date(playlistWithTracks.server_timestamp).getTime());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize playlist');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Handle playlist changes from realtime
  const handlePlaylistChange = useCallback((updatedPlaylist: SharedPlaylist) => {
    setIsPlaying(updatedPlaylist.is_playing);
    setCurrentPosition(updatedPlaylist.current_position_ms);
    setServerTimestamp(new Date(updatedPlaylist.server_timestamp).getTime());
    setLastSyncTime(Date.now());
    
    // Update current track if changed
    if (playlist && updatedPlaylist.current_track_id !== playlist.current_track_id) {
      const newCurrentTrack = playlist.tracks.find(t => t.id === updatedPlaylist.current_track_id);
      setCurrentTrack(newCurrentTrack || null);
    }
    
    // Update playlist state
    setPlaylist(prev => prev ? { ...prev, ...updatedPlaylist } : null);
  }, [playlist]);

  // Handle track list changes from realtime
  const handleTrackChange = useCallback((tracks: PlaylistTrack[]) => {
    setPlaylist(prev => prev ? { ...prev, tracks } : null);
    setLastSyncTime(Date.now());
  }, []);

  // Handle sync events from other users
  const handleSyncEvent = useCallback((event: PlaylistSyncEvent) => {
    console.log('🔄 useSharedPlaylist: Sync event received:', event);
    
    // Don't process our own events
    const currentUserId = 'current_user_id'; // Get from auth context
    if (event.user_id === currentUserId) {
      console.log('⏭️ useSharedPlaylist: Ignoring own event');
      return;
    }

    setLastSyncTime(Date.now());
    
    // Reset sync status temporarily
    setIsSynced(false);
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      setIsSynced(true);
    }, 1000);

    // Handle different event types
    switch (event.event_type) {
      case 'play':
        setIsPlaying(true);
        if (event.event_data?.track_id) {
          const track = playlist?.tracks.find(t => t.id === event.event_data?.track_id);
          if (track) setCurrentTrack(track);
          setCurrentPosition(0);
        }
        break;
        
      case 'pause':
        setIsPlaying(false);
        if (event.event_data?.position !== undefined) {
          setCurrentPosition(event.event_data.position);
        }
        break;
        
      case 'seek':
        if (event.event_data?.position !== undefined) {
          setCurrentPosition(event.event_data.position);
        }
        break;
        
      case 'next':
      case 'prev':
        if (event.event_data?.track_id) {
          const track = playlist?.tracks.find(t => t.id === event.event_data?.track_id);
          if (track) {
            setCurrentTrack(track);
            setCurrentPosition(0);
          }
        }
        break;
    }
  }, [playlist]);

  // Player control functions
  const play = useCallback(async (trackId?: string) => {
    if (!playlist) return;
    
    try {
      console.log('🎵 useSharedPlaylist: Calling playTrack', { playlistId: playlist.id, trackId });
      await playTrack(playlist.id, trackId);
      console.log('✅ useSharedPlaylist: playTrack completed');
    } catch (err) {
      console.error('❌ useSharedPlaylist: playTrack failed', err);
      setError(err instanceof Error ? err.message : 'Failed to play track');
    }
  }, [playlist]);

  const pause = useCallback(async () => {
    if (!playlist) return;
    
    try {
      console.log('⏸️ useSharedPlaylist: Calling pauseTrack', { playlistId: playlist.id, currentPosition });
      await pauseTrack(playlist.id, currentPosition);
      console.log('✅ useSharedPlaylist: pauseTrack completed');
    } catch (err) {
      console.error('❌ useSharedPlaylist: pauseTrack failed', err);
      setError(err instanceof Error ? err.message : 'Failed to pause track');
    }
  }, [playlist, currentPosition]);

  const seek = useCallback(async (position: number) => {
    if (!playlist) return;
    
    try {
      await seekToPosition(playlist.id, position);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seek');
    }
  }, [playlist]);

  const next = useCallback(async () => {
    if (!playlist) return;
    
    try {
      await nextTrack(playlist.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to go to next track');
    }
  }, [playlist]);

  const previous = useCallback(async () => {
    if (!playlist) return;
    
    try {
      await previousTrack(playlist.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to go to previous track');
    }
  }, [playlist]);

  // Track management functions - YouTube removed

  const addLocalAudio = useCallback(async (audioFile: LocalAudioFile) => {
    if (!playlist) return;
    
    try {
      await addLocalAudioTrack(playlist.id, audioFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add local audio');
    }
  }, [playlist]);

  const removeTrack = useCallback(async (trackId: string) => {
    try {
      await removeTrackFromPlaylist(trackId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove track');
    }
  }, []);

  const reorderTrack = useCallback(async (trackId: string, newPosition: number) => {
    if (!playlist) return;
    
    try {
      await reorderTracks(playlist.id, trackId, newPosition);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder track');
    }
  }, [playlist]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to playlist changes
    playlistUnsubscribe.current = subscribeToPlaylistChanges(
      conversationId,
      handlePlaylistChange,
      handleTrackChange
    );

    return () => {
      if (playlistUnsubscribe.current) {
        playlistUnsubscribe.current();
      }
    };
  }, [conversationId, handlePlaylistChange, handleTrackChange]);

  // Setup sync event subscription
  useEffect(() => {
    if (!playlist?.id) return;

    syncUnsubscribe.current = subscribeToSyncEvents(
      playlist.id,
      handleSyncEvent
    );

    return () => {
      if (syncUnsubscribe.current) {
        syncUnsubscribe.current();
      }
    };
  }, [playlist?.id, handleSyncEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    playlist,
    isLoading,
    error,
    
    // Player state
    isPlaying,
    currentTrack,
    currentPosition,
    serverTimestamp,
    
    // Actions
    initializePlaylist,
    play,
    pause,
    seek,
    next,
    previous,
    
    // Track management
    addLocalAudio,
    removeTrack,
    reorderTrack,
    
    // Sync status
    isSynced,
    lastSyncTime
  };
};
