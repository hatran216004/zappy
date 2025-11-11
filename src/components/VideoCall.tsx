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
}

export default function VideoCall({
  callInfo,
  participant: _participant,
  onEndCall,
  status = 'connected',
  onAcceptCall,
  onToggleMic,
  onToggleCamera,
  micEnabled,
  cameraEnabled,
  remoteParticipants = [],
  localParticipant
}: VideoCallProps) {
  const { user } = useAuth();
  const isVideoCall = callInfo.is_video_enabled;

  // Get the first remote participant to show in main view
  const mainRemoteParticipant = remoteParticipants[0];

  // Debug logging
  console.log('📹 VideoCall render:', {
    status,
    remoteParticipantsCount: remoteParticipants.length,
    hasMainRemote: !!mainRemoteParticipant,
    hasLocal: !!localParticipant,
    remoteIdentities: remoteParticipants.map((p) => p.identity)
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3">
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
                  : isVideoCall
                  ? 'Cuộc gọi video'
                  : 'Cuộc gọi thoại'}
              </p>
            </div>
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
        <div className="flex-1 flex items-center justify-center relative p-4">
          {status === 'connected' && remoteParticipants.length > 0 ? (
            /* Grid layout for multiple participants */
            <div className={`
              w-full h-full grid gap-2
              ${remoteParticipants.length === 1 ? 'grid-cols-1' : 
                remoteParticipants.length === 2 ? 'grid-cols-2' :
                remoteParticipants.length <= 4 ? 'grid-cols-2 grid-rows-2' :
                remoteParticipants.length <= 6 ? 'grid-cols-3 grid-rows-2' :
                'grid-cols-3 grid-rows-3'}
            `}>
              {remoteParticipants.map((participant, index) => (
                <ParticipantView
                  key={participant.sid}
                  participant={participant}
                  displayName={`User ${index + 1}`}
                  avatarUrl={callInfo.photo_url || callInfo.avatar_url}
                  className="w-full h-full"
                  showStats
                />
              ))}
              
              {/* Local participant in grid */}
              {localParticipant && (
                <ParticipantView
                  participant={localParticipant}
                  displayName={user?.user_metadata?.display_name || 'You'}
                  avatarUrl={user?.user_metadata?.avatar_url}
                  className="w-full h-full"
                  isLocal
                />
              )}
            </div>
          ) : (
            /* Waiting state */
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
        <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center">
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

            {/* Camera Toggle (video call only) */}
            {isVideoCall && status === 'connected' && (
              <Button
                variant="secondary"
                size="icon"
                onClick={onToggleCamera}
                className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600"
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
    </div>
  );
}
