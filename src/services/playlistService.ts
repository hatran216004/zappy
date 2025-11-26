// Shared Playlist Service - "Playlist Cùng Nghe"

import { supabase } from '@/lib/supabase';
import {
  SharedPlaylist,
  PlaylistTrack,
  PlaylistSyncEvent,
  PlaylistWithTracks,
  SyncEventData,
  LocalAudioFile,
  RealtimeSyncData
} from '@/types/playlist';

// ============================================
// PLAYLIST MANAGEMENT
// ============================================

/**
 * Create or get shared playlist for conversation
 */
export const getOrCreateSharedPlaylist = async (conversationId: string): Promise<SharedPlaylist> => {
  // Try to get existing playlist
  const { data: existing } = await supabase
    .from('shared_playlists')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('is_active', true)
    .single();

  if (existing) {
    return existing;
  }

  // Create new playlist
  const { data: newPlaylist, error } = await supabase
    .from('shared_playlists')
    .insert({
      conversation_id: conversationId,
      created_by: (await supabase.auth.getUser()).data.user?.id!
    })
    .select()
    .single();

  if (error) throw error;
  return newPlaylist;
};

/**
 * Get playlist with tracks
 */
export const getPlaylistWithTracks = async (conversationId: string): Promise<PlaylistWithTracks | null> => {
  const { data: playlist } = await supabase
    .from('shared_playlists')
    .select(`
      *,
      tracks:playlist_tracks(
        *,
        added_by_profile:profiles!playlist_tracks_added_by_fkey(
          id,
          display_name,
          avatar_url
        )
      )
    `)
    .eq('conversation_id', conversationId)
    .eq('is_active', true)
    .single();

  if (!playlist) return null;

  // Sort tracks by position
  const sortedTracks = playlist.tracks.sort((a: any, b: any) => a.position - b.position);
  
  // Find current track
  const currentTrack = playlist.current_track_id 
    ? sortedTracks.find((t: any) => t.id === playlist.current_track_id)
    : null;

  return {
    ...playlist,
    tracks: sortedTracks,
    current_track: currentTrack
  };
};

/**
 * Update playlist state (play/pause/seek)
 */
export const updatePlaylistState = async (
  playlistId: string,
  updates: {
    is_playing?: boolean;
    current_track_id?: string | null;
    current_position_ms?: number;
  }
): Promise<void> => {
  console.log('💾 updatePlaylistState called', { playlistId, updates });
  
  const { data, error } = await supabase
    .from('shared_playlists')
    .update({
      ...updates,
      last_sync_at: new Date().toISOString()
    })
    .eq('id', playlistId)
    .select(); // Add select to get the updated data

  if (error) {
    console.error('❌ updatePlaylistState failed', error);
    throw error;
  }
  
  console.log('✅ updatePlaylistState success', data);
};

// ============================================
// TRACK MANAGEMENT
// ============================================

/**
 * Add track to playlist
 */
export const addTrackToPlaylist = async (
  playlistId: string,
  track: Omit<PlaylistTrack, 'id' | 'playlist_id' | 'added_by' | 'added_at' | 'position'>
): Promise<PlaylistTrack> => {
  console.log('🎵 addTrackToPlaylist called:', {
    playlistId,
    track: {
      title: track.title,
      source_type: track.source_type,
      source_url: track.source_url?.substring(0, 50) + '...'
    }
  });
  
  // Get current user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    console.error('❌ addTrackToPlaylist: User not authenticated:', userError);
    throw new Error('User not authenticated');
  }
  
  // Get next position
  const { data: lastTrack } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const nextPosition = (lastTrack?.position || 0) + 1;
  
  console.log('🎵 addTrackToPlaylist: Next position:', nextPosition);

  const { data: newTrack, error } = await supabase
    .from('playlist_tracks')
    .insert({
      ...track,
      playlist_id: playlistId,
      added_by: userData.user.id,
      position: nextPosition
    })
    .select()
    .single();

  if (error) {
    console.error('❌ addTrackToPlaylist: Database error:', error);
    throw error;
  }

  // Create sync event
  await createSyncEvent(playlistId, 'add_track', { track: newTrack });

  return newTrack;
};

/**
 * Remove track from playlist
 */
export const removeTrackFromPlaylist = async (trackId: string): Promise<void> => {
  // Get track info first
  const { data: track } = await supabase
    .from('playlist_tracks')
    .select('playlist_id, position')
    .eq('id', trackId)
    .single();

  if (!track) throw new Error('Track not found');

  // Delete track
  const { error } = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('id', trackId);

  if (error) throw error;

  // Reorder remaining tracks - get all tracks after deleted position
  const { data: tracksToUpdate } = await supabase
    .from('playlist_tracks')
    .select('id, position')
    .eq('playlist_id', track.playlist_id)
    .gt('position', track.position)
    .order('position');

  // Update each track position using batch update
  if (tracksToUpdate && tracksToUpdate.length > 0) {
    const updates = tracksToUpdate.map(trackToUpdate => ({
      id: trackToUpdate.id,
      newPosition: trackToUpdate.position - 1
    }));
    
    await batchUpdateTrackPositions(track.playlist_id, updates);
  }

  // Create sync event
  await createSyncEvent(track.playlist_id, 'remove_track', { track_id: trackId });
};

/**
 * Reorder tracks in playlist
 */
export const reorderTracks = async (
  playlistId: string,
  trackId: string,
  newPosition: number
): Promise<void> => {
  const { data: track } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('id', trackId)
    .single();

  if (!track) throw new Error('Track not found');

  const oldPosition = track.position;
  
  if (oldPosition === newPosition) return;

  // Update positions
  if (oldPosition < newPosition) {
    // Moving down: shift tracks up
    const { data: tracksToShift } = await supabase
      .from('playlist_tracks')
      .select('id, position')
      .eq('playlist_id', playlistId)
      .gt('position', oldPosition)
      .lte('position', newPosition)
      .order('position');

    if (tracksToShift) {
      const updates = tracksToShift.map(track => ({
        id: track.id,
        newPosition: track.position - 1
      }));
      await batchUpdateTrackPositions(playlistId, updates);
    }
  } else {
    // Moving up: shift tracks down
    const { data: tracksToShift } = await supabase
      .from('playlist_tracks')
      .select('id, position')
      .eq('playlist_id', playlistId)
      .gte('position', newPosition)
      .lt('position', oldPosition)
      .order('position');

    if (tracksToShift) {
      const updates = tracksToShift.map(track => ({
        id: track.id,
        newPosition: track.position + 1
      }));
      await batchUpdateTrackPositions(playlistId, updates);
    }
  }

  // Update target track position
  await supabase
    .from('playlist_tracks')
    .update({ position: newPosition })
    .eq('id', trackId);

  // Create sync event
  await createSyncEvent(playlistId, 'reorder', {
    track_id: trackId,
    from_position: oldPosition,
    to_position: newPosition
  });
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Batch update track positions for better performance
 */
const batchUpdateTrackPositions = async (
  playlistId: string,
  updates: { id: string; newPosition: number }[]
): Promise<void> => {
  // For better performance, we could use a single RPC call
  // But for now, we'll batch the updates in smaller chunks
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    
    // Execute batch updates in parallel
    await Promise.all(
      batch.map(({ id, newPosition }) =>
        supabase
          .from('playlist_tracks')
          .update({ position: newPosition })
          .eq('id', id)
      )
    );
  }
};

// ============================================
// SYNC EVENTS
// ============================================

/**
 * Create sync event for realtime coordination
 */
export const createSyncEvent = async (
  playlistId: string,
  eventType: PlaylistSyncEvent['event_type'],
  eventData?: SyncEventData
): Promise<PlaylistSyncEvent> => {
  console.log('📡 createSyncEvent called', { playlistId, eventType, eventData });
  
  const { data: event, error } = await supabase
    .from('playlist_sync_events')
    .insert({
      playlist_id: playlistId,
      user_id: (await supabase.auth.getUser()).data.user?.id!,
      event_type: eventType,
      event_data: eventData || null
    })
    .select()
    .single();

  if (error) {
    console.error('❌ createSyncEvent failed', error);
    throw error;
  }
  
  console.log('✅ createSyncEvent success', event);
  return event;
};

/**
 * Get recent sync events for playlist
 */
export const getRecentSyncEvents = async (
  playlistId: string,
  limit: number = 50
): Promise<PlaylistSyncEvent[]> => {
  const { data, error } = await supabase
    .from('playlist_sync_events')
    .select('*')
    .eq('playlist_id', playlistId)
    .order('server_timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

// ============================================
// PLAYER CONTROLS WITH SYNC
// ============================================

/**
 * Play track with sync
 */
export const playTrack = async (playlistId: string, trackId?: string): Promise<void> => {
  const updates: any = { is_playing: true };
  
  if (trackId) {
    updates.current_track_id = trackId;
    updates.current_position_ms = 0;
  }

  await updatePlaylistState(playlistId, updates);
  await createSyncEvent(playlistId, 'play', trackId ? { track_id: trackId } : undefined);
};

/**
 * Pause track with sync
 */
export const pauseTrack = async (playlistId: string, currentPosition: number): Promise<void> => {
  console.log('🔄 playlistService: pauseTrack called', { playlistId, currentPosition });
  
  try {
    console.log('📝 playlistService: Updating playlist state to paused...');
    await updatePlaylistState(playlistId, {
      is_playing: false,
      current_position_ms: currentPosition
    });
    console.log('✅ playlistService: Playlist state updated');
    
    console.log('📡 playlistService: Creating sync event...');
    await createSyncEvent(playlistId, 'pause', { position: currentPosition });
    console.log('✅ playlistService: Sync event created');
  } catch (error) {
    console.error('❌ playlistService: pauseTrack failed', error);
    throw error;
  }
};

/**
 * Seek to position with sync
 */
export const seekToPosition = async (playlistId: string, position: number): Promise<void> => {
  await updatePlaylistState(playlistId, { current_position_ms: position });
  await createSyncEvent(playlistId, 'seek', { position });
};

/**
 * Next track with sync
 */
export const nextTrack = async (playlistId: string): Promise<void> => {
  const playlist = await getPlaylistWithTracks(
    (await supabase.from('shared_playlists').select('conversation_id').eq('id', playlistId).single()).data?.conversation_id!
  );
  
  if (!playlist || !playlist.current_track_id) return;

  const currentIndex = playlist.tracks.findIndex(t => t.id === playlist.current_track_id);
  const nextIndex = (currentIndex + 1) % playlist.tracks.length;
  const nextTrackId = playlist.tracks[nextIndex]?.id;

  if (nextTrackId) {
    await updatePlaylistState(playlistId, {
      current_track_id: nextTrackId,
      current_position_ms: 0
    });
    await createSyncEvent(playlistId, 'next', { track_id: nextTrackId });
  }
};

/**
 * Previous track with sync
 */
export const previousTrack = async (playlistId: string): Promise<void> => {
  const playlist = await getPlaylistWithTracks(
    (await supabase.from('shared_playlists').select('conversation_id').eq('id', playlistId).single()).data?.conversation_id!
  );
  
  if (!playlist || !playlist.current_track_id) return;

  const currentIndex = playlist.tracks.findIndex(t => t.id === playlist.current_track_id);
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlist.tracks.length - 1;
  const prevTrackId = playlist.tracks[prevIndex]?.id;

  if (prevTrackId) {
    await updatePlaylistState(playlistId, {
      current_track_id: prevTrackId,
      current_position_ms: 0
    });
    await createSyncEvent(playlistId, 'prev', { track_id: prevTrackId });
  }
};

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to playlist state changes
 */
export const subscribeToPlaylistChanges = (
  conversationId: string,
  onPlaylistChange: (playlist: SharedPlaylist) => void,
  onTrackChange: (tracks: PlaylistTrack[]) => void
) => {
  const playlistChannel = supabase
    .channel(`playlist_${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shared_playlists',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => {
        if (payload.new) {
          onPlaylistChange(payload.new as SharedPlaylist);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'playlist_tracks'
      },
      async (payload) => {
        // Refetch tracks when any track changes
        const playlist = await getPlaylistWithTracks(conversationId);
        if (playlist) {
          onTrackChange(playlist.tracks);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(playlistChannel);
  };
};

/**
 * Subscribe to sync events for realtime coordination
 */
export const subscribeToSyncEvents = (
  playlistId: string,
  onSyncEvent: (event: PlaylistSyncEvent) => void
) => {
  console.log('📡 subscribeToSyncEvents: Setting up subscription for playlist', playlistId);
  
  const syncChannel = supabase
    .channel(`sync_${playlistId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'playlist_sync_events',
        filter: `playlist_id=eq.${playlistId}`
      },
      (payload) => {
        console.log('📨 subscribeToSyncEvents: Received realtime event', payload);
        if (payload.new) {
          onSyncEvent(payload.new as PlaylistSyncEvent);
        }
      }
    )
    .subscribe((status) => {
      console.log('📡 subscribeToSyncEvents: Subscription status', status);
    });

  return () => {
    console.log('🔌 subscribeToSyncEvents: Unsubscribing from playlist', playlistId);
    supabase.removeChannel(syncChannel);
  };
};

// ============================================
// YOUTUBE INTEGRATION
// ============================================

// YouTube functionality removed - only local audio supported

// ============================================
// LOCAL AUDIO SUPPORT
// ============================================

/**
 * Process local audio file
 */
export const processLocalAudioFile = (file: File): Promise<LocalAudioFile> => {
  console.log('🎵 processLocalAudioFile called:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });
  
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      console.log('✅ processLocalAudioFile: Metadata loaded', {
        duration: audio.duration,
        title: file.name.replace(/\.[^/.]+$/, '')
      });
      
      resolve({
        file,
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        duration: Math.round(audio.duration * 1000), // Convert to milliseconds and round to integer
        url
      });
    });

    audio.addEventListener('error', (e) => {
      console.error('❌ processLocalAudioFile: Audio error:', e);
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio file'));
    });

    audio.src = url;
    console.log('🎵 processLocalAudioFile: Audio src set, waiting for metadata...');
  });
};

/**
 * Add local audio track to playlist
 */
export const addLocalAudioTrack = async (
  playlistId: string,
  audioFile: LocalAudioFile
): Promise<PlaylistTrack> => {
  console.log('🎵 addLocalAudioTrack called:', {
    playlistId,
    audioFile: {
      title: audioFile.title,
      artist: audioFile.artist,
      duration: audioFile.duration,
      url: audioFile.url?.substring(0, 50) + '...',
      fileName: audioFile.file?.name
    }
  });
  
  // Upload file to Supabase Storage
  try {
    // Generate unique filename
    const fileExt = audioFile.file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `audio/${fileName}`;
    
    console.log('📤 Uploading file to Supabase Storage:', filePath);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('playlist-audio')
      .upload(filePath, audioFile.file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('playlist-audio')
      .getPublicUrl(filePath);
    
    const publicUrl = urlData.publicUrl;
    console.log('✅ File uploaded successfully:', publicUrl);
    
    const result = await addTrackToPlaylist(playlistId, {
      title: audioFile.title,
      artist: audioFile.artist || 'Unknown Artist',
      duration_ms: audioFile.duration || null,
      source_type: 'local',
      source_url: publicUrl,
      source_id: fileName,
      thumbnail_url: null
    });
    
    console.log('✅ addLocalAudioTrack success:', result.id);
    return result;
  } catch (error) {
    console.error('❌ addLocalAudioTrack failed:', error);
    throw error;
  }
};
