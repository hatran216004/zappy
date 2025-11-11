// components/VideoCall.tsx
import { X, Phone, Video, PhoneOff, PhoneIncoming, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/stores/user';
import { CallInfo, CallParticipant } from '@/services/callService';
import { UserAvatar } from './UserAvatar';

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
}

export default function VideoCall({ callInfo, participant, onEndCall, status = 'connected', onAcceptCall, onToggleMic, onToggleCamera, micEnabled, cameraEnabled }: VideoCallProps) {
  const { user } = useAuth();
  const isVideoCall = callInfo.is_video_enabled;

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
              <h3 className="text-white font-semibold">{callInfo.display_name}</h3>
              <p className="text-gray-400 text-sm">
                {status === 'incoming' ? 'Cuộc gọi đến' : isVideoCall ? 'Cuộc gọi video' : 'Cuộc gọi thoại'}
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
        <div className="flex-1 flex items-center justify-center relative">
          {/* Remote video/avatar */}
          <div className="w-full h-full flex items-center justify-center">
            {isVideoCall ? (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                <UserAvatar 
                  avatarUrl={callInfo.photo_url || callInfo.avatar_url} 
                  displayName={callInfo.display_name}
                  size="xl"
                  showStatus={false}
                  className="w-32 h-32"
                />
                <p className="absolute bottom-4 text-white">Video call sẽ được tích hợp với LiveKit</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <UserAvatar 
                  avatarUrl={callInfo.photo_url || callInfo.avatar_url} 
                  displayName={callInfo.display_name}
                  size="xl"
                  showStatus={false}
                  className="w-32 h-32"
                />
                <h2 className="text-white text-2xl font-semibold">{callInfo.display_name}</h2>
              </div>
            )}
          </div>

          {/* Local video (placeholder) */}
          {isVideoCall && (
            <div className="absolute bottom-24 right-6 w-32 h-24 bg-gray-800 rounded-lg border-2 border-gray-600 flex items-center justify-center">
              <UserAvatar 
                avatarUrl={user?.user_metadata?.avatar_url || undefined} 
                displayName="You"
                size="sm"
                showStatus={false}
              />
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
                {micEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
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
                <Video className="h-6 w-6" />
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

