import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioTrack,
  LocalParticipant,
  Participant,
  RemoteParticipant,
  Room,
  RoomEvent,
  RoomOptions,
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

  const handleTrackSubscribed = useCallback(
    (track: AudioTrack | any, _publication: any, participant: RemoteParticipant | Participant) => {
      if (track.kind !== 'audio') return;
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
    },
    []
  );

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
        .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
        .on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) =>
          handleParticipantConnected(participant, r)
        )
        .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) =>
          handleParticipantDisconnected(participant, r)
        )
        .on(RoomEvent.TrackMuted, handleTrackMuted)
        .on(RoomEvent.TrackUnmuted, handleTrackMuted)
        .on(RoomEvent.LocalTrackPublished, handleTrackMuted)
        .on(RoomEvent.LocalTrackUnpublished, handleTrackMuted)
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
    if (!room) return;
    const local = room.localParticipant as LocalParticipant;
    const next = !(local.isCameraEnabled?.() ?? cameraEnabled);
    await local.setCameraEnabled(next);
    setCameraEnabled(next);
  }, [cameraEnabled, room]);

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


