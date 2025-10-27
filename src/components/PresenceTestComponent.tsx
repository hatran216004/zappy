import React, { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useRealtimeFriendStatus } from "@/hooks/useRealtimeFriendStatus";
import { useUserStatus } from "@/hooks/usePresence";

/**
 * Component test để kiểm tra hệ thống presence
 * Hiển thị trạng thái realtime của user hiện tại và bạn bè
 */
const PresenceTestComponent: React.FC = () => {
  const { user, isAuthenticated } = useUser();
  const [friendIds, setFriendIds] = useState<string[]>([]);

  // Hook để lấy trạng thái của user hiện tại
  const {
    isOnline,
    text: statusText,
    color: statusColor,
  } = useUserStatus(user?.id || "");

  // Hook để lấy trạng thái bạn bè
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

  // Load danh sách bạn bè (giả lập)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Giả lập danh sách bạn bè - thay bằng logic thực tế
      const mockFriendIds = ["friend1", "friend2", "friend3"];
      setFriendIds(mockFriendIds);
    }
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
        <p>Vui lòng đăng nhập để xem trạng thái presence</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Presence System Test</h1>

      {/* Current User Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Trạng Thái Của Tôi</h2>

        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full ${statusColor}`} />
          <div>
            <p className="font-medium">
              {user?.display_name || "User"}
              <span className="ml-2 text-sm text-gray-600">
                ({isOnline ? "Đang hoạt động" : "Ngoại tuyến"})
              </span>
            </p>
            <p className="text-sm text-gray-500">{statusText}</p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Trạng Thái Kết Nối</h2>

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

        {error && (
          <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <p className="text-sm">Lỗi: {error.message}</p>
          </div>
        )}
      </div>

      {/* Friends Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">
          Trạng Thái Bạn Bè ({friendStatuses.length})
        </h2>

        {friendStatuses.length === 0 ? (
          <p className="text-gray-500">Không có bạn bè nào</p>
        ) : (
          <div className="space-y-3">
            {friendStatuses.map((friend) => {
              const isOnline = isFriendOnline(friend.id);
              const statusColor = getStatusColor(friend.id);
              const lastSeenText = formatLastSeen(friend.id);

              return (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {friend.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusColor}`}
                      />
                    </div>

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
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
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

      {/* Debug Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Debug Info</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• User ID: {user?.id}</p>
          <p>• Friend IDs: {friendIds.join(", ")}</p>
          <p>• Realtime Connected: {isConnected ? "Yes" : "No"}</p>
          <p>• Current Status: {isOnline ? "Online" : "Offline"}</p>
        </div>
      </div>
    </div>
  );
};

export default PresenceTestComponent;
