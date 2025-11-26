// Types for Shared Playlist feature

export interface SharedPlaylist {
  id: string;
  conversation_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  current_track_id: string | null;
  current_position_ms: number;
  is_playing: boolean;
  last_sync_at: string;
  server_timestamp: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  added_by: string;
  title: string;
  artist: string | null;
  duration_ms: number | null;
  source_type: 'youtube' | 'local';
  source_url: string | null;
  source_id: string | null;
  thumbnail_url: string | null;
  added_at: string;
  position: number;
}

export interface PlaylistSyncEvent {
  id: string;
  playlist_id: string;
  user_id: string;
  event_type: 'play' | 'pause' | 'seek' | 'next' | 'prev' | 'add_track' | 'remove_track' | 'reorder';
  event_data: Record<string, any> | null;
  server_timestamp: string;
  created_at: string;
}

export interface PlaylistWithTracks extends SharedPlaylist {
  tracks: (PlaylistTrack & {
    added_by_profile: {
      id: string;
      display_name: string;
      avatar_url: string;
    };
  })[];
  current_track?: PlaylistTrack;
}

export interface PlaylistState {
  isPlaying: boolean;
  currentTrack: PlaylistTrack | null;
  currentPosition: number;
  tracks: PlaylistTrack[];
  serverTimestamp: number;
}

export interface SyncEventData {
  position?: number;
  track_id?: string;
  from_position?: number;
  to_position?: number;
  track?: Omit<PlaylistTrack, 'id' | 'playlist_id' | 'added_by' | 'added_at'>;
}

// YouTube API types
export interface YouTubeSearchResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: string;
  viewCount?: string;
}

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  channelTitle: string;
  duration: number; // in milliseconds
  thumbnailUrl: string;
  description?: string;
}

// Local audio file types
export interface LocalAudioFile {
  file: File;
  title: string;
  artist?: string;
  duration?: number;
  url: string; // Object URL for playback
}

// Player control types
export interface PlayerControls {
  play: () => void;
  pause: () => void;
  seek: (position: number) => void;
  next: () => void;
  previous: () => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

// Realtime sync types
export interface RealtimeSyncData {
  type: 'sync_state' | 'sync_event';
  playlist_id: string;
  user_id: string;
  timestamp: number;
  data: PlaylistState | PlaylistSyncEvent;
}
