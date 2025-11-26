// Simplified Audio Player Hook - No complex Promise logic
import { useState, useEffect, useRef, useCallback } from 'react';
import { PlaylistTrack, PlayerControls } from '@/types/playlist';
import { YouTubePlayerRef } from '@/components/playlist/YouTubePlayer';

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
  syncToPosition: (position: number, serverTimestamp: number) => void;
  playerType: 'audio' | 'youtube';
  youtubePlayerRef: React.RefObject<YouTubePlayerRef>;
}

export const useAudioPlayer = (options: UseAudioPlayerOptions = {}): UseAudioPlayerReturn => {
  const { onTimeUpdate, onEnded, onError, onLoadStart, onCanPlay } = options;

  // Player refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const youtubePlayerRef = useRef<YouTubePlayerRef>(null);
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTrack, setCurrentTrack] = useState<PlaylistTrack | null>(null);
  const [playerType, setPlayerType] = useState<'audio' | 'youtube'>('audio');

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    // NO crossOrigin - causes CORS issues with Supabase
    
    audioRef.current = audio;
    
    // Simple event handlers
    const handleCanPlay = () => {
      console.log('✅ Audio ready to play');
      setIsReady(true);
      setIsLoading(false);
      onCanPlay?.();
    };
    
    const handleError = () => {
      console.error('❌ Audio error');
      setError('Failed to load audio');
      setIsLoading(false);
      onError?.('Failed to load audio');
    };
    
    const handleLoadStart = () => {
      console.log('🔊 Audio loading started');
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

  // Load track - SIMPLE VERSION
  const loadTrack = useCallback(async (track: PlaylistTrack): Promise<void> => {
    console.log('🎵 Loading track:', track.title);
    
    setCurrentTrack(track);
    setError(null);
    setIsLoading(true);
    setIsReady(false);
    
    if (track.source_type === 'youtube') {
      setPlayerType('youtube');
      setIsReady(true);
      setIsLoading(false);
    } else if (track.source_type === 'local') {
      setPlayerType('audio');
      
      if (audioRef.current && track.source_url) {
        console.log('🔊 Setting audio src:', track.source_url);
        audioRef.current.src = track.source_url;
        audioRef.current.load();
        // isReady will be set by canplay event
      }
    }
  }, []);

  // Player controls - SIMPLE VERSION
  const play = useCallback(() => {
    console.log('🎵 Play called');
    
    if (playerType === 'youtube' && youtubePlayerRef.current) {
      youtubePlayerRef.current.play();
    } else if (playerType === 'audio' && audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('❌ Play failed:', err);
        setError('Failed to play audio');
      });
    }
  }, [playerType]);

  const pause = useCallback(() => {
    console.log('⏸️ Pause called');
    
    if (playerType === 'youtube' && youtubePlayerRef.current) {
      youtubePlayerRef.current.pause();
    } else if (playerType === 'audio' && audioRef.current) {
      audioRef.current.pause();
    }
  }, [playerType]);

  const seek = useCallback((position: number) => {
    const seekTime = position / 1000;
    
    if (playerType === 'youtube' && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(seekTime);
    } else if (playerType === 'audio' && audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  }, [playerType]);

  const setVolume = useCallback((vol: number) => {
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  }, []);

  const syncToPosition = useCallback((position: number, serverTimestamp: number) => {
    // Simple sync - just seek to position
    seek(position);
  }, [seek]);

  return {
    // State
    isLoading,
    isReady,
    error,
    currentTime,
    duration,
    volume,
    currentTrack,
    playerType,
    youtubePlayerRef,
    
    // Methods
    loadTrack,
    play,
    pause,
    seek,
    setVolume,
    syncToPosition
  };
};
