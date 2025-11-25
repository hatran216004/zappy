// components/call/ParticipantView.tsx
import { useEffect, useRef } from 'react';
import { Participant, Track, RemoteTrackPublication, LocalTrackPublication } from 'livekit-client';
import { UserAvatar } from '@/components/UserAvatar';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParticipantViewProps {
  participant: Participant;
  displayName?: string;
  avatarUrl?: string;
  className?: string;
  isLocal?: boolean;
  showStats?: boolean;
}

export function ParticipantView({
  participant,
  displayName,
  avatarUrl,
  className,
  isLocal = false,
  showStats = false,
}: ParticipantViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Attach video track
  useEffect(() => {
    if (!videoRef.current) return;

    const videoPublication = Array.from(participant.videoTrackPublications.values()).find(
      (pub) => pub.kind === Track.Kind.Video && !pub.isScreenShare
    );

    if (!videoPublication) {
      // No video track, detach any existing track
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    const track = (videoPublication as RemoteTrackPublication | LocalTrackPublication).track;
    if (track) {
      console.log('📹 Attaching video track:', {
        participant: participant.identity,
        trackId: track.sid,
        isMuted: track.isMuted,
        isSubscribed: videoPublication.isSubscribed
      });
      
      // Subscribe to the track if it's a remote track and not subscribed
      if (!isLocal && videoPublication instanceof RemoteTrackPublication && !videoPublication.isSubscribed) {
        console.log('📹 Subscribing to remote video track:', participant.identity);
        videoPublication.setSubscribed(true);
      }
      
      // Attach track if available and not muted
      if (track && !track.isMuted) {
        track.attach(videoRef.current);
      }
      
      // Listen for track state changes
      const handleTrackMuted = () => {
        if (!videoRef.current) return;
        if (track.isMuted) {
          track.detach(videoRef.current);
        } else {
          track.attach(videoRef.current);
        }
      };
      
      // Listen for subscription changes (for remote tracks)
      const handleSubscriptionChanged = () => {
        if (!videoRef.current || isLocal) return;
        if (videoPublication instanceof RemoteTrackPublication) {
          if (videoPublication.isSubscribed && videoPublication.track && !videoPublication.track.isMuted) {
            console.log('📹 Video track subscribed, attaching:', participant.identity);
            videoPublication.track.attach(videoRef.current);
          } else if (!videoPublication.isSubscribed) {
            if (videoRef.current.srcObject) {
              videoRef.current.srcObject = null;
            }
          }
        }
      };
      
      track.on('muted', handleTrackMuted);
      track.on('unmuted', handleTrackMuted);
      
      if (videoPublication instanceof RemoteTrackPublication) {
        videoPublication.on('subscribed', handleSubscriptionChanged);
        videoPublication.on('unsubscribed', handleSubscriptionChanged);
      }
      
      return () => {
        track.off('muted', handleTrackMuted);
        track.off('unmuted', handleTrackMuted);
        if (videoPublication instanceof RemoteTrackPublication) {
          videoPublication.off('subscribed', handleSubscriptionChanged);
          videoPublication.off('unsubscribed', handleSubscriptionChanged);
        }
        track.detach(videoRef.current!);
      };
    }
  }, [participant, isLocal]);

  // Attach audio track (only for remote participants)
  useEffect(() => {
    if (isLocal || !audioRef.current) return;

    const audioPublication = Array.from(participant.audioTrackPublications.values()).find(
      (pub) => pub.kind === Track.Kind.Audio
    );

    if (!audioPublication) return;

    const track = (audioPublication as RemoteTrackPublication).track;
    if (track && !track.isMuted) {
      track.attach(audioRef.current);
      
      return () => {
        track.detach(audioRef.current!);
      };
    }
  }, [participant, isLocal]);

  // Check if participant has an active video track (more reliable than isCameraEnabled)
  const hasVideoTrack = Array.from(participant.videoTrackPublications.values()).some(
    (pub) => pub.kind === Track.Kind.Video && !pub.isScreenShare && pub.track && !pub.track.isMuted
  );
  const hasVideo = hasVideoTrack || participant.isCameraEnabled;
  const isMicEnabled = participant.isMicrophoneEnabled;
  const isSpeaking = participant.isSpeaking;

  return (
    <div className={cn('relative bg-gray-900 rounded-lg overflow-hidden min-w-0 min-h-0', className)}>
      {/* Video element */}
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Mute local video to prevent echo
          className="w-full h-full object-contain bg-black"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <UserAvatar
            avatarUrl={avatarUrl}
            displayName={displayName || participant.identity}
            size="xl"
            showStatus={false}
            className="w-20 h-20"
          />
        </div>
      )}

      {/* Audio element (hidden, only for remote participants) */}
      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}

      {/* Participant info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium truncate">
              {displayName || participant.identity}
              {isLocal && ' (You)'}
            </span>
            {!isMicEnabled && (
              <MicOff className="h-4 w-4 text-red-500" />
            )}
            {isMicEnabled && isSpeaking && (
              <Mic className="h-4 w-4 text-green-500 animate-pulse" />
            )}
          </div>

          {/* Connection quality indicator */}
          {showStats && (
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  participant.connectionQuality === 'excellent' && 'bg-green-500',
                  participant.connectionQuality === 'good' && 'bg-yellow-500',
                  participant.connectionQuality === 'poor' && 'bg-red-500'
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Speaking indicator border */}
      {isSpeaking && (
        <div className="absolute inset-0 border-4 border-green-500 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}

