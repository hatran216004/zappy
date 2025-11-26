// Simplified Audio Player Hook - Local Audio Only
import { useState, useEffect, useRef, useCallback } from 'react';
import { PlaylistTrack, PlayerControls } from '@/types/playlist';

interface UseAudioPlayerOptions {
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
}

interface UseAudioPlayerReturn extends PlayerControls {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  currentTrack: PlaylistTrack | null;
  loadTrack: (track: PlaylistTrack) => Promise<void>;
  syncToPosition: (position: number) => void;
}

export const useAudioPlayer = (
  options: UseAudioPlayerOptions = {}
): UseAudioPlayerReturn => {
  const { onTimeUpdate, onEnded, onError, onLoadStart, onCanPlay } = options;

  // Player refs
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTrack, setCurrentTrack] = useState<PlaylistTrack | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    // NO crossOrigin - causes CORS issues with Supabase

    audioRef.current = audio;

    // Simple event handlers
    const handleCanPlay = () => {
      console.log('✅ Audio ready to play', {
        readyState: audio.readyState,
        networkState: audio.networkState,
        src: audio.src,
        duration: audio.duration
      });
      setIsReady(true);
      setIsLoading(false);
      onCanPlay?.();
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const error = target.error;
      console.error('❌ Audio error:', {
        error: error,
        code: error?.code,
        message: error?.message,
        src: target.src,
        readyState: target.readyState,
        networkState: target.networkState
      });
      setError('Failed to load audio');
      setIsLoading(false);
      onError?.('Failed to load audio');
    };

    const handleLoadStart = () => {
      console.log('🔊 Audio loading started', {
        src: audio.src,
        readyState: audio.readyState,
        networkState: audio.networkState
      });
      onLoadStart?.();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      onEnded?.();
    };

    // Add event listeners
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      // Cleanup
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.src = '';
    };
  }, [onTimeUpdate, onEnded, onError, onLoadStart, onCanPlay]);

  // Load track - LOCAL AUDIO ONLY
  const loadTrack = useCallback(async (track: PlaylistTrack): Promise<void> => {
    console.log('🎵 Loading local audio track:', track.title);

    setCurrentTrack(track);
    setError(null);

    if (track.source_type === 'local' && audioRef.current && track.source_url) {
      console.log('🔊 Setting audio src:', track.source_url);
      audioRef.current.src = track.source_url;
      setIsReady(true);
    } else {
      console.warn('⚠️ Only local audio tracks are supported');
      setError('Only local audio tracks are supported');
    }
  }, []);

  // Player controls - LOCAL AUDIO ONLY
  const play = useCallback(() => {
    console.log('🎵 Play called');

    if (audioRef.current) {
      console.log('🔊 Playing local audio');
      audioRef.current.play().catch((err) => {
        console.error('❌ Play failed:', err);
      });
    }
  }, []);

  const pause = useCallback(() => {
    console.log('⏸️ Pause called');

    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const seek = useCallback((position: number) => {
    const seekTime = position / 1000;

    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  }, []);

  const setVolumeLevel = useCallback((vol: number) => {
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  }, []);

  const syncToPosition = useCallback(
    (position: number) => {
      // Simple sync - just seek to position
      seek(position);
    },
    [seek]
  );

  // Additional PlayerControls methods
  const next = useCallback(() => {
    console.log('⏭️ Next called - not implemented for single audio player');
  }, []);

  const previous = useCallback(() => {
    console.log('⏮️ Previous called - not implemented for single audio player');
  }, []);

  const getCurrentTime = useCallback(() => {
    return audioRef.current?.currentTime || 0;
  }, []);

  const getDuration = useCallback(() => {
    return audioRef.current?.duration || 0;
  }, []);

  return {
    // State
    isLoading,
    isReady,
    error,
    currentTime,
    duration,
    volume,
    currentTrack,

    // Methods
    loadTrack,
    play,
    pause,
    seek,
    next,
    previous,
    setVolume: setVolumeLevel,
    getCurrentTime,
    getDuration,
    syncToPosition
  };
};
