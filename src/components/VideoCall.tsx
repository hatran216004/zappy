import {
  X,
  PhoneOff,
  PhoneIncoming,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/stores/user';
import { CallInfo, CallParticipant } from '@/services/callService';
import { UserAvatar } from './UserAvatar';
import { ParticipantView } from './call/ParticipantView';
import { LocalParticipant, RemoteParticipant } from 'livekit-client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface VideoCallProps {
  callInfo: CallInfo;
  participant: CallParticipant;
  onEndCall: () => void;
  status?: 'incoming' | 'connected';
  onAcceptCall?: () => void;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  micEnabled?: boolean;
  cameraEnabled?: boolean;
  remoteParticipants?: RemoteParticipant[];
  localParticipant?: LocalParticipant | null;
  isConnected?: boolean;
}

export default function VideoCall({
  callInfo,
  participant: _participant, // eslint-disable-line @typescript-eslint/no-unused-vars
  onEndCall,
  status = 'connected',
  onAcceptCall,
  onToggleMic,
  onToggleCamera,
  micEnabled,
  cameraEnabled,
  remoteParticipants = [],
  localParticipant,
  isConnected = false
}: VideoCallProps) {
  const { user } = useAuth();
  const isVideoCall = callInfo.is_video_enabled;

  // Map to store participant profiles (userId -> { display_name, avatar_url })
  const [participantProfiles, setParticipantProfiles] = useState<
    Record<string, { display_name: string; avatar_url: string | null }>
  >({});

  // Fetch profiles for remote participants
  useEffect(() => {
    if (remoteParticipants.length === 0) return;

    const fetchProfiles = async () => {
      const userIds = remoteParticipants.map((p) => p.identity).filter(Boolean);
      if (userIds.length === 0) return;

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (error) {
        console.error('Error fetching participant profiles:', error);
        return;
      }

      const profilesMap: Record<
        string,
        { display_name: string; avatar_url: string | null }
      > = {};
      profiles?.forEach((profile) => {
        profilesMap[profile.id] = {
          display_name: profile.display_name || 'User',
          avatar_url: profile.avatar_url
        };
      });

      setParticipantProfiles(profilesMap);
    };

    fetchProfiles();
  }, [remoteParticipants]);

  // Get the first remote participant to show in main view
  const mainRemoteParticipant = remoteParticipants[0];

  // Debug logging
  console.log('📹 VideoCall render:', {
    status,
    remoteParticipantsCount: remoteParticipants.length,
    hasMainRemote: !!mainRemoteParticipant,
    hasLocal: !!localParticipant,
    remoteIdentities: remoteParticipants.map((p) => p.identity),
    hasToggleCamera: !!onToggleCamera,
    cameraEnabled,
    micEnabled
  });

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 flex items-center justify-between bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {remoteParticipants.length > 0 ? (
            // Show first remote participant info in header
            (() => {
              const firstRemote = remoteParticipants[0];
              const userId = firstRemote.identity;
              const profile = participantProfiles[userId] || {
                display_name: callInfo.display_name,
                avatar_url: callInfo.photo_url || callInfo.avatar_url
              };
              return (
                <>
                  <UserAvatar
                    avatarUrl={profile.avatar_url}
                    displayName={profile.display_name}
                    size="md"
                    showStatus={false}
                  />
                  <div>
                    <h3 className="text-white font-semibold">
                      {profile.display_name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {status === 'incoming'
                        ? 'Cuộc gọi đến'
                        : cameraEnabled || isVideoCall
                        ? 'Cuộc gọi video'
                        : 'Cuộc gọi thoại'}
                    </p>
                  </div>
                </>
              );
            })()
          ) : (
            // Show call info (for group calls or when no participants yet)
            <>
              <UserAvatar
                avatarUrl={callInfo.photo_url || callInfo.avatar_url}
                displayName={callInfo.display_name}
                size="md"
                showStatus={false}
              />
              <div>
                <h3 className="text-white font-semibold">
                  {callInfo.display_name}
                </h3>
                <p className="text-gray-400 text-sm">
                  {status === 'incoming'
                    ? 'Cuộc gọi đến'
                    : cameraEnabled || isVideoCall
                    ? 'Cuộc gọi video'
                    : 'Cuộc gọi thoại'}
                </p>
              </div>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEndCall}
          className="text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center relative p-4 min-h-0 overflow-hidden">
        {status === 'connected' &&
        (remoteParticipants.length > 0 ||
          (localParticipant && cameraEnabled)) ? (
          /* Grid layout for multiple participants */
          <div
            className="w-full h-full grid gap-2 max-w-full max-h-full"
            style={{
              gridTemplateColumns: (() => {
                const totalParticipants =
                  remoteParticipants.length +
                  (localParticipant && cameraEnabled ? 1 : 0);
                if (totalParticipants === 1) return '1fr';
                if (totalParticipants === 2) return '1fr 1fr';
                if (totalParticipants === 3) return '1fr 1fr';
                if (totalParticipants === 4) return '1fr 1fr';
                if (totalParticipants <= 6) return 'repeat(3, 1fr)';
                return 'repeat(3, 1fr)';
              })(),
              gridTemplateRows: (() => {
                const totalParticipants =
                  remoteParticipants.length +
                  (localParticipant && cameraEnabled ? 1 : 0);
                if (totalParticipants === 1) return '1fr';
                if (totalParticipants === 2) return '1fr';
                if (totalParticipants === 3) return '1fr 1fr';
                if (totalParticipants === 4) return '1fr 1fr';
                if (totalParticipants <= 6) return '1fr 1fr';
                return 'repeat(3, 1fr)';
              })()
            }}
          >
            {remoteParticipants.map((participant) => {
              const userId = participant.identity;
              const profile = participantProfiles[userId] || {
                display_name: 'User',
                avatar_url: null
              };
              return (
                <ParticipantView
                  key={participant.sid}
                  participant={participant}
                  displayName={profile.display_name}
                  avatarUrl={profile.avatar_url || undefined}
                  className="w-full h-full aspect-video"
                  showStats
                />
              );
            })}

            {/* Local participant in grid - only show if camera is enabled */}
            {localParticipant && cameraEnabled && (
              <ParticipantView
                participant={localParticipant}
                displayName={user?.user_metadata?.display_name || 'You'}
                avatarUrl={user?.user_metadata?.avatar_url || null}
                className="w-full h-full aspect-video"
                isLocal
              />
            )}
          </div>
        ) : status === 'connected' && localParticipant && !cameraEnabled ? (
          /* Connected but camera off - show avatar with hint */
          <div className="flex flex-col items-center gap-4">
            {remoteParticipants.length > 0 ? (
              (() => {
                const firstRemote = remoteParticipants[0];
                const userId = firstRemote.identity;
                const profile = participantProfiles[userId] || {
                  display_name: callInfo.display_name,
                  avatar_url: callInfo.photo_url || callInfo.avatar_url
                };
                return (
                  <>
                    <UserAvatar
                      avatarUrl={profile.avatar_url}
                      displayName={profile.display_name}
                      size="xl"
                      showStatus={false}
                      className="w-32 h-32"
                    />
                    <h2 className="text-white text-2xl font-semibold">
                      {profile.display_name}
                    </h2>
                  </>
                );
              })()
            ) : (
              <>
                <UserAvatar
                  avatarUrl={callInfo.photo_url || callInfo.avatar_url}
                  displayName={callInfo.display_name}
                  size="xl"
                  showStatus={false}
                  className="w-32 h-32"
                />
                <h2 className="text-white text-2xl font-semibold">
                  {callInfo.display_name}
                </h2>
              </>
            )}
            <p className="text-gray-400">Đang chờ người khác tham gia...</p>
            <p className="text-gray-500 text-sm">
              Bạn có thể bật camera để người khác thấy bạn
            </p>
          </div>
        ) : (
          /* Waiting state (incoming or not connected) */
          <div className="flex flex-col items-center gap-4">
            <UserAvatar
              avatarUrl={callInfo.photo_url || callInfo.avatar_url}
              displayName={callInfo.display_name}
              size="xl"
              showStatus={false}
              className="w-32 h-32"
            />
            <h2 className="text-white text-2xl font-semibold">
              {callInfo.display_name}
            </h2>
            <p className="text-gray-400">
              {status === 'incoming'
                ? 'Cuộc gọi đến...'
                : 'Đang chờ người khác tham gia...'}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 p-6 flex justify-center bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Accept (incoming) */}
          {status === 'incoming' && (
            <Button
              variant="secondary"
              size="icon"
              onClick={onAcceptCall}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <PhoneIncoming className="h-6 w-6" />
            </Button>
          )}

          {/* Mute/Unmute */}
          {status === 'connected' && (
            <Button
              variant="secondary"
              size="icon"
              onClick={onToggleMic}
              className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600"
            >
              {micEnabled ? (
                <Mic className="h-6 w-6" />
              ) : (
                <MicOff className="h-6 w-6" />
              )}
            </Button>
          )}

          {/* Camera Toggle - Only show when room is connected and ready */}
          {status === 'connected' &&
            onToggleCamera &&
            isConnected &&
            localParticipant && (
              <Button
                variant="secondary"
                size="icon"
                onClick={() => {
                  console.log(
                    '📹 Camera button clicked, current state:',
                    cameraEnabled,
                    'isConnected:',
                    isConnected
                  );
                  if (onToggleCamera) {
                    onToggleCamera();
                  } else {
                    console.warn('⚠️ onToggleCamera is not defined');
                  }
                }}
                className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600"
                title={cameraEnabled ? 'Tắt camera' : 'Bật camera'}
              >
                {cameraEnabled ? (
                  <VideoIcon className="h-6 w-6" />
                ) : (
                  <VideoOff className="h-6 w-6" />
                )}
              </Button>
            )}

          {/* End Call */}
          <Button
            variant="destructive"
            size="icon"
            onClick={onEndCall}
            className="w-14 h-14 rounded-full"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
