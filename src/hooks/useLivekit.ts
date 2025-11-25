import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioTrack,
  LocalParticipant,
  Participant,
  RemoteParticipant,
  Room,
  RoomEvent,
  RoomOptions,
  createLocalVideoTrack,
  Track,
} from 'livekit-client';

type UseLivekitOptions = {
  autoMic?: boolean;
  autoCamera?: boolean;
};

export function useLivekitRoom(options?: UseLivekitOptions) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<LocalParticipant | null>(null);
  const audioEls = useRef<Map<string, HTMLAudioElement>>(new Map());

  const roomOptions: RoomOptions = useMemo(
    () => ({
      adaptiveStream: true,
      dynacast: true,
      stopLocalTrackOnUnpublish: true,
    }),
    []
  );

  const cleanupAudio = () => {
    audioEls.current.forEach((el) => {
      try {
        el.pause();
        el.srcObject = null;
      } catch {}
    });
    audioEls.current.clear();
  };

  const updateParticipants = useCallback((room: Room) => {
    const remotes = Array.from(room.remoteParticipants.values());
    // Sort by speaking status and audio level
    remotes.sort((a, b) => {
      if (a.isSpeaking && b.isSpeaking) {
        return (b.audioLevel || 0) - (a.audioLevel || 0);
      }
      if (a.isSpeaking !== b.isSpeaking) {
        return a.isSpeaking ? -1 : 1;
      }
      return 0;
    });
    setRemoteParticipants(remotes);
    setLocalParticipant(room.localParticipant as LocalParticipant);
  }, []);

  const handleTrackSubscribed = useCallback(
    (track: AudioTrack | any, publication: any, participant: RemoteParticipant | Participant) => {
      if (track.kind === 'audio') {
        const id = `${participant.sid}-${track.sid || 'audio'}`;
        let audio = audioEls.current.get(id);
        if (!audio) {
          audio = new Audio();
          audio.autoplay = true;
          audio.playsInline = true;
          audio.controls = false;
          audio.muted = false;
          audioEls.current.set(id, audio);
        }
        track.attach(audio);
        // Attempt autoplay; may require a user gesture depending on browser policy
        audio.play().catch(() => {
          // ignored; UI interactions will kick it
        });
      } else if (track.kind === 'video' && !publication.isScreenShare) {
        // Video track subscribed - update participants to trigger re-render
        console.log('📹 Video track subscribed from remote participant:', participant.identity);
        // Note: updateParticipants will be called through room events
      }
    },
    []
  );

  const handleParticipantConnected = useCallback((participant: RemoteParticipant, room: Room) => {
    console.log('👤 Participant connected:', participant.identity);
    updateParticipants(room);
  }, [updateParticipants]);

  const handleParticipantDisconnected = useCallback((participant: RemoteParticipant, room: Room) => {
    console.log('👋 Participant disconnected:', participant.identity);
    // Clean up dangling audio when participants leave
    cleanupAudio();
    updateParticipants(room);
  }, [updateParticipants]);

  const handleTrackMuted = useCallback(() => {
    // Force re-render when tracks are muted/unmuted
    if (room) {
      updateParticipants(room);
    }
  }, [room, updateParticipants]);

  const connect = useCallback(
    async (url: string, token: string, { mic, camera }: { mic: boolean; camera: boolean }) => {
      if (!url || !token) throw new Error('Missing LiveKit url or token');
      // Disconnect previous
      if (room) {
        await room.disconnect();
        setIsConnected(false);
        setMicEnabled(false);
        setCameraEnabled(false);
        cleanupAudio();
      }
      const r = new Room({ ...roomOptions });
      r
        .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          handleTrackSubscribed(track, publication, participant);
          // Update participants when video track is subscribed
          if (track.kind === 'video' && !publication.isScreenShare) {
            updateParticipants(r);
          }
        })
        .on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) =>
          handleParticipantConnected(participant, r)
        )
        .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) =>
          handleParticipantDisconnected(participant, r)
        )
        .on(RoomEvent.TrackMuted, handleTrackMuted)
        .on(RoomEvent.TrackUnmuted, handleTrackMuted)
        .on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
          console.log('📹 Track unsubscribed:', track.kind, 'from', participant.identity);
          if (track.kind === 'video' && !publication.isScreenShare) {
            // Update participants when video track is unsubscribed
            updateParticipants(r);
          }
        })
        .on(RoomEvent.LocalTrackPublished, (publication, participant) => {
          console.log('📹 Local track published:', publication.kind);
          handleTrackMuted();
          // Update camera state when video track is published
          if (publication.kind === 'video' && !publication.isScreenShare) {
            setCameraEnabled(true);
          }
        })
        .on(RoomEvent.LocalTrackUnpublished, (publication, participant) => {
          console.log('📹 Local track unpublished:', publication.kind);
          handleTrackMuted();
          // Update camera state when video track is unpublished
          if (publication.kind === 'video' && !publication.isScreenShare) {
            setCameraEnabled(false);
          }
        })
        .on(RoomEvent.TrackPublished, (publication, participant) => {
          // Remote participant published a track
          if (publication.kind === 'video' && !publication.isScreenShare && participant instanceof RemoteParticipant) {
            console.log('📹 Remote participant published video track:', participant.identity);
            // Subscribe to the video track automatically
            const remotePub = publication as any;
            if (remotePub.setSubscribed && !remotePub.isSubscribed) {
              remotePub.setSubscribed(true);
            }
            // Update participants to trigger re-render
            updateParticipants(r);
          }
        })
        .on(RoomEvent.TrackUnpublished, (publication, participant) => {
          // Remote participant unpublished a track
          if (publication.kind === 'video' && !publication.isScreenShare) {
            console.log('📹 Remote participant unpublished video track:', participant.identity);
            // Update participants to trigger re-render
            updateParticipants(r);
          }
        })
        .on(RoomEvent.ActiveSpeakersChanged, () => updateParticipants(r))
        .on(RoomEvent.Connected, () => {
          console.log('🔗 Room connected, updating participants...');
          // Wait a bit for participants to be synced
          setTimeout(() => {
            updateParticipants(r);
            console.log('👥 Remote participants:', r.remoteParticipants.size);
          }, 500);
        });

      await r.connect(url, token);
      setRoom(r);
      setIsConnected(true);

      // Enable local tracks
      const local = r.localParticipant as LocalParticipant;
      if (mic ?? options?.autoMic ?? true) {
        await local.setMicrophoneEnabled(true);
        setMicEnabled(true);
      }
      if (camera ?? options?.autoCamera ?? false) {
        await local.setCameraEnabled(true);
        setCameraEnabled(true);
      }
      
      // Update participants list immediately
      updateParticipants(r);
      console.log('🎬 Initial participants update, remotes:', r.remoteParticipants.size);
      
      return r;
    },
    [handleParticipantConnected, handleParticipantDisconnected, handleTrackMuted, handleTrackSubscribed, options?.autoCamera, options?.autoMic, room, roomOptions, updateParticipants]
  );

  const disconnect = useCallback(async () => {
    if (!room) return;
    try {
      await room.disconnect();
    } finally {
      setIsConnected(false);
      setMicEnabled(false);
      setCameraEnabled(false);
      cleanupAudio();
      setRoom(null);
    }
  }, [room]);

  const toggleMic = useCallback(async () => {
    if (!room) return;
    const local = room.localParticipant as LocalParticipant;
    const next = !(local.isMicrophoneEnabled?.() ?? micEnabled);
    await local.setMicrophoneEnabled(next);
    setMicEnabled(next);
  }, [micEnabled, room]);

  const toggleCamera = useCallback(async () => {
    console.log('📹 toggleCamera called', { 
      hasRoom: !!room, 
      cameraEnabled,
      roomState: room?.state,
      hasLocalParticipant: !!room?.localParticipant
    });
    
    if (!room) {
      console.warn('⚠️ Cannot toggle camera: room not connected');
      return;
    }
    
    const local = room.localParticipant as LocalParticipant;
    if (!local) {
      console.warn('⚠️ Cannot toggle camera: local participant not found');
      return;
    }
    
    // Check current camera state by looking at video track publications
    // A camera is enabled if there's at least one video track that's not a screen share and is not muted
    const hasVideoTrack = Array.from(local.videoTrackPublications.values()).some(
      (pub) => pub.kind === 'video' && !pub.isScreenShare && pub.track && !pub.track.isMuted
    );
    
    // Use the actual video track state as source of truth, not the cameraEnabled state
    // This ensures we always toggle from the actual current state
    const current = hasVideoTrack;
    const next = !current;
    
    console.log('📹 Local participant check:', {
      exists: !!local,
      hasSetCameraEnabled: typeof local?.setCameraEnabled === 'function',
      videoTracks: local.videoTrackPublications.size,
      hasVideoTrack,
      cameraEnabledState: cameraEnabled,
      currentState: current,
      nextState: next
    });
    
    try {
      console.log(`📹 Toggling camera: ${current ? 'OFF' : 'ON'}`, {
        current,
        next,
        localParticipantExists: !!local,
        videoTracks: local.videoTrackPublications.size
      });
      
      // Use setCameraEnabled method
      await local.setCameraEnabled(next);
      
      // Wait a bit for the state to update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verify the state by checking video tracks again
      const newHasVideoTrack = Array.from(local.videoTrackPublications.values()).some(
        (pub) => pub.kind === 'video' && !pub.isScreenShare && pub.track && !pub.track.isMuted
      );
      
      console.log('📹 Camera state after toggle:', {
        expected: next,
        actual: newHasVideoTrack,
        videoTracks: local.videoTrackPublications.size
      });
      
      // Update state based on actual video tracks
      setCameraEnabled(newHasVideoTrack);
      console.log(`✅ Camera ${newHasVideoTrack ? 'enabled' : 'disabled'} successfully`);
      
      // Update participants to reflect camera state change
      updateParticipants(room);
    } catch (error) {
      console.error('❌ Error toggling camera:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      // Revert state on error - check actual state
      const actualHasVideoTrack = Array.from(local.videoTrackPublications.values()).some(
        (pub) => pub.kind === 'video' && !pub.isScreenShare && pub.track && !pub.track.isMuted
      );
      setCameraEnabled(actualHasVideoTrack);
    }
  }, [room, updateParticipants]);

  useEffect(() => {
    return () => {
      // On unmount, disconnect
      if (room) {
        room.disconnect();
      }
      cleanupAudio();
    };
  }, [room]);

  return {
    room,
    isConnected,
    micEnabled,
    cameraEnabled,
    remoteParticipants,
    localParticipant,
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
  };
}


