// YouTube Player Demo Component - For testing YouTube IFrame Player

import React, { useRef, useState } from 'react';
import { YouTubePlayer, YouTubePlayerRef } from './YouTubePlayer';
import { YouTubePlayerState } from '@/services/youtubeService';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';

export const YouTubePlayerDemo: React.FC = () => {
  const playerRef = useRef<YouTubePlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ'); // Rick Roll as default

  const popularVideos = [
    { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up' },
    { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito ft. Daddy Yankee' },
    { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE' },
    { id: 'fJ9rUzIMcZQ', title: 'Queen - Bohemian Rhapsody' },
    { id: 'JGwWNGJdvx8', title: 'Ed Sheeran - Shape of You' }
  ];

  const handlePlay = () => {
    if (playerRef.current) {
      playerRef.current.play();
    }
  };

  const handlePause = () => {
    if (playerRef.current) {
      playerRef.current.pause();
    }
  };

  const handleSeek = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
      setVolume(newVolume);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
        YouTube IFrame Player Demo
      </h2>

      {/* Video Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Chọn video:
        </label>
        <select
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {popularVideos.map((video) => (
            <option key={video.id} value={video.id}>
              {video.title}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Video ID Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Hoặc nhập Video ID:
        </label>
        <input
          type="text"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          placeholder="Ví dụ: dQw4w9WgXcQ"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* YouTube Player */}
      <div className="mb-6">
        <YouTubePlayer
          ref={playerRef}
          videoId={videoId}
          onReady={() => {
            console.log('YouTube Player ready!');
          }}
          onStateChange={(state) => {
            setIsPlaying(state === YouTubePlayerState.PLAYING);
            console.log('Player state changed:', state);
          }}
          onTimeUpdate={(currentTime, duration) => {
            setCurrentTime(currentTime);
            setDuration(duration);
          }}
          onError={(error) => {
            console.error('YouTube Player error:', error);
          }}
          className="w-full aspect-video rounded-lg overflow-hidden"
        />
      </div>

      {/* Custom Controls */}
      <div className="space-y-4">
        {/* Play/Pause Controls */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => handleSeek(Math.max(0, currentTime - 10))}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="w-12 h-12 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>

          <button
            onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-150"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-3">
          <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-gray-500 w-12">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>Video ID: {videoId}</p>
          <p>Status: {isPlaying ? 'Playing' : 'Paused'}</p>
          <p className="text-green-600">✅ Không cần API key - Chỉ cần IFrame Player!</p>
        </div>
      </div>
    </div>
  );
};
