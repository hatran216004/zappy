import React from "react";
import useRealtimeFriendStatus from "@/hooks/useRealtimeFriendStatus";
import { UserAvatar } from "./UserAvatar";

interface FriendStatusDemoProps {
  friendIds: string[];
}

/**
 * Component demo để minh họa cách sử dụng useRealtimeFriendStatus
 * Có thể sử dụng trong FriendsList hoặc ChatWindow
 */
const FriendStatusDemo: React.FC<FriendStatusDemoProps> = ({ friendIds }) => {
  const {
    friendStatuses,
    isConnected,
    error,
    isFriendOnline,
    formatLastSeen,
    getStatusColor,
  } = useRealtimeFriendStatus({
    friendIds,
    onStatusUpdate: (friendStatus) => {
      console.log("Friend status updated:", friendStatus);
    },
    onError: (error) => {
      console.error("Friend status error:", error);
    },
  });

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p>Lỗi kết nối trạng thái bạn bè: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm text-gray-600">
          {isConnected ? "Đã kết nối realtime" : "Đang kết nối..."}
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-gray-800">
          Trạng thái bạn bè ({friendStatuses.length})
        </h3>

        {friendStatuses.length === 0 ? (
          <p className="text-gray-500 text-sm">Không có bạn bè nào</p>
        ) : (
          <div className="space-y-2">
            {friendStatuses.map((friend) => {
              const isOnline = isFriendOnline(friend.id);
              const statusColor = getStatusColor(friend.id);
              const lastSeenText = formatLastSeen(friend.id);

              return (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      avatarUrl={friend.avatar_url}
                      displayName={friend.display_name}
                      status={friend.status}
                      size="sm"
                      showStatus={true}
                      className="w-10 h-10"
                    />

                    <div>
                      <p className="font-medium text-gray-900">
                        {friend.display_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        @{friend.username}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        isOnline
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                      {isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{lastSeenText}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendStatusDemo;
