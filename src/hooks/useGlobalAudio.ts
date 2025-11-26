// Global Audio Manager - Quản lý audio state toàn cục
import { useState, useEffect, createContext, useContext } from 'react';
import { PlaylistTrack } from '@/types/playlist';

interface GlobalAudioState {
  currentAudio: HTMLAudioElement | null;
  currentTrack: PlaylistTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

interface GlobalAudioActions {
  playTrack: (track: PlaylistTrack) => void;
  pauseAudio: () => void;
  resumeAudio: () => void;
  stopAudio: () => void;
  setVolume: (volume: number) => void;
  seekTo: (time: number) => void;
}

interface GlobalAudioContextType extends GlobalAudioState, GlobalAudioActions {}

const GlobalAudioContext = createContext<GlobalAudioContextType | null>(null);

// Singleton audio manager
class AudioManager {
  private static instance: AudioManager;
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<() => void> = new Set();
  private pausedPosition: number = 0; // Lưu vị trí pause
  
  private state: GlobalAudioState = {
    currentAudio: null,
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1
  };

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  getState(): GlobalAudioState {
    return { ...this.state };
  }

  playTrack(track: PlaylistTrack) {
    // Nếu đây là cùng track đã pause, resume từ vị trí cũ
    if (this.state.currentTrack?.id === track.id && this.audio && this.audio.paused) {
      console.log('🎵 Global: Resuming track from position:', this.pausedPosition);
      this.resumeAudio();
      return;
    }

    // Dừng audio hiện tại nếu khác track
    this.stopAudio();

    if (track.source_type === 'local' && track.source_url) {
      console.log('🎵 Global: Playing new track:', track.title);
      
      this.audio = new Audio(track.source_url);
      this.audio.volume = this.state.volume;
      
      // Restore position từ localStorage nếu có
      const savedPosition = this.getSavedPosition(track.id);
      
      // Event listeners
      this.audio.addEventListener('loadedmetadata', () => {
        this.state.duration = this.audio?.duration || 0;
        
        // Set position sau khi metadata loaded
        if (savedPosition > 0 && this.audio) {
          console.log('📍 Restoring position from localStorage:', savedPosition);
          this.audio.currentTime = savedPosition;
          this.pausedPosition = savedPosition;
        }
        
        this.notify();
      });
      
      this.audio.addEventListener('timeupdate', () => {
        this.state.currentTime = this.audio?.currentTime || 0;
        
        // Lưu position vào localStorage mỗi 2 giây
        if (this.state.currentTime > 0 && Math.floor(this.state.currentTime) % 2 === 0) {
          this.savePosition(track.id, this.state.currentTime);
        }
        
        this.notify();
      });
      
      this.audio.addEventListener('ended', () => {
        this.state.isPlaying = false;
        this.pausedPosition = 0;
        this.clearSavedPosition(track.id); // Clear khi kết thúc
        this.notify();
      });
      
      this.audio.addEventListener('play', () => {
        this.state.isPlaying = true;
        this.notify();
      });
      
      this.audio.addEventListener('pause', () => {
        this.state.isPlaying = false;
        this.pausedPosition = this.audio?.currentTime || 0;
        console.log('⏸️ Saved pause position:', this.pausedPosition);
        this.notify();
      });

      this.state.currentAudio = this.audio;
      this.state.currentTrack = track;
      
      this.audio.play().catch(err => {
        console.error('❌ Failed to play audio:', err);
      });
      
      this.notify();
    }
  }

  pauseAudio() {
    if (this.audio && !this.audio.paused) {
      console.log('⏸️ Global: Pausing audio');
      this.pausedPosition = this.audio.currentTime;
      this.audio.pause();
      
      // Lưu position vào localStorage khi pause
      if (this.state.currentTrack) {
        this.savePosition(this.state.currentTrack.id, this.pausedPosition);
      }
    }
  }

  resumeAudio() {
    if (this.audio && this.audio.paused) {
      console.log('▶️ Global: Resuming audio from position:', this.pausedPosition);
      
      // Restore position trước khi play
      if (this.pausedPosition > 0) {
        this.audio.currentTime = this.pausedPosition;
      }
      
      this.audio.play().catch(err => {
        console.error('❌ Failed to resume audio:', err);
      });
    }
  }

  stopAudio() {
    if (this.audio) {
      console.log('⏹️ Global: Stopping audio');
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
      this.state.currentAudio = null;
      this.state.currentTrack = null;
      this.state.isPlaying = false;
      this.state.currentTime = 0;
      this.state.duration = 0;
      this.pausedPosition = 0; // Reset pause position
      this.notify();
    }
  }

  setVolume(volume: number) {
    this.state.volume = volume;
    if (this.audio) {
      this.audio.volume = volume;
    }
    this.notify();
  }

  seekTo(time: number) {
    if (this.audio) {
      this.audio.currentTime = time;
      this.pausedPosition = time;
      
      // Lưu position khi seek
      if (this.state.currentTrack) {
        this.savePosition(this.state.currentTrack.id, time);
      }
    }
  }

  // LocalStorage methods cho position
  private savePosition(trackId: string, position: number) {
    try {
      const key = `audio_position_${trackId}`;
      localStorage.setItem(key, position.toString());
    } catch (error) {
      console.warn('Failed to save audio position to localStorage:', error);
    }
  }

  private getSavedPosition(trackId: string): number {
    try {
      const key = `audio_position_${trackId}`;
      const saved = localStorage.getItem(key);
      return saved ? parseFloat(saved) : 0;
    } catch (error) {
      console.warn('Failed to get audio position from localStorage:', error);
      return 0;
    }
  }

  private clearSavedPosition(trackId: string) {
    try {
      const key = `audio_position_${trackId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear audio position from localStorage:', error);
    }
  }
}

export const useGlobalAudio = (): GlobalAudioContextType => {
  const manager = AudioManager.getInstance();
  const [state, setState] = useState(manager.getState());

  useEffect(() => {
    const unsubscribe = manager.subscribe(() => {
      setState(manager.getState());
    });
    return unsubscribe;
  }, [manager]);

  return {
    ...state,
    playTrack: (track: PlaylistTrack) => manager.playTrack(track),
    pauseAudio: () => manager.pauseAudio(),
    resumeAudio: () => manager.resumeAudio(),
    stopAudio: () => manager.stopAudio(),
    setVolume: (volume: number) => manager.setVolume(volume),
    seekTo: (time: number) => manager.seekTo(time)
  };
};
