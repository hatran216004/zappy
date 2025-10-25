import React, { useState } from "react";
import useUserStatusTracker from "@/hooks/useUserStatusTracker";
import useRealtimeFriendStatus from "@/hooks/useRealtimeFriendStatus";

/**
 * Example component minh họa cách sử dụng hệ thống presence
 * Có thể sử dụng trong development hoặc testing
 */
const PresenceExample: React.FC = () => {
  const [currentUserId] = useState("current-user-id"); // Thay bằng user ID thực tế
  const [friendIds] = useState(["friend1", "friend2", "friend3"]); // Thay bằng friend IDs thực tế

  // Hook quản lý trạng thái của user hiện tại
  const { setOnline, setOffline, isOnline } = useUserStatusTracker({
    userId: currentUserId,
    onStatusChange: (status) => {
      console.log(`My status changed to: ${status}`);
    },
    heartbeatInterval: 30000,
  });

  // Hook lắng nghe trạng thái bạn bè
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Presence System Demo</h1>

      {/* Current User Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Trạng Thái Của Tôi</h2>

        <div className="flex items-center gap-4">
          <div
            className={`w-4 h-4 rounded-full ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <span className="font-medium">
            {isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={setOnline}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Set Online
          </button>
          <button
            onClick={setOffline}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Set Offline
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Trạng Thái Kết Nối</h2>

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
        <h2 className="text-xl font-semibold mb-4">
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

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Hướng Dẫn Sử Dụng
        </h3>
        <ul className="text-blue-700 space-y-1 text-sm">
          <li>
            • Thay đổi <code>currentUserId</code> và <code>friendIds</code> bằng
            ID thực tế
          </li>
          <li>• Mở nhiều tab để test realtime updates</li>
          <li>• Đóng tab để test offline detection</li>
          <li>• Kiểm tra console logs để xem events</li>
        </ul>
      </div>
    </div>
  );
};

export default PresenceExample;
