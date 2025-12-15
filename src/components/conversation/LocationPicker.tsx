import { useState } from "react";
import { MapPin, Loader2, X, Map, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface LocationPickerProps {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
    displayMode: "interactive" | "static";
  }) => void;
  onClose: () => void;
}

export function LocationPicker({
  onLocationSelect,
  onClose,
}: LocationPickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"interactive" | "static">(
    "interactive"
  );

  const getCurrentLocation = (mode: "interactive" | "static") => {
    setSelectedMode(mode);
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị");
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Try to get address from reverse geocoding
          const address = await reverseGeocode(latitude, longitude);

          onLocationSelect({
            latitude,
            longitude,
            address:
              address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            displayMode: mode,
          });

          toast.success("Đã lấy vị trí hiện tại");
        } catch (error) {
          console.error("Geocoding error:", error);
          // Still send location even if geocoding fails
          onLocationSelect({
            latitude,
            longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            displayMode: mode,
          });
        } finally {
          setIsLoading(false);
          onClose();
        }
      },
      (error) => {
        setIsLoading(false);
        console.error("Geolocation error:", error);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Bạn đã từ chối quyền truy cập vị trí");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Không thể xác định vị trí");
            break;
          case error.TIMEOUT:
            toast.error("Hết thời gian chờ định vị");
            break;
          default:
            toast.error("Lỗi khi lấy vị trí");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Chia sẻ vị trí
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Chọn cách hiển thị vị trí của bạn:
          </p>

          {/* Option 1: Interactive Map */}
          <button
            onClick={() => getCurrentLocation("interactive")}
            disabled={isLoading}
            className="w-full p-4 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500 text-white">
                <Map className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {isLoading && selectedMode === "interactive" ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lấy vị trí...
                    </span>
                  ) : (
                    "Bản đồ tương tác (Khuyên dùng)"
                  )}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Người nhận xem trực tiếp trên bản đồ trong app
                </p>
              </div>
            </div>
          </button>

          {/* Option 2: Static Link */}
          <button
            onClick={() => getCurrentLocation("static")}
            disabled={isLoading}
            className="w-full p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-500 text-white">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {isLoading && selectedMode === "static" ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lấy vị trí...
                    </span>
                  ) : (
                    "Link Google Maps"
                  )}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Hiển thị preview + link mở Google Maps ở tab mới
                </p>
              </div>
            </div>
          </button>

          {/* Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p>• Trình duyệt sẽ yêu cầu quyền truy cập vị trí của bạn</p>
            <p>• Vị trí sẽ được chia sẻ dưới dạng tọa độ GPS chính xác</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reverse geocoding using Nominatim (free, no API key needed)
async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "Zappy Chat App",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    const data = await response.json();

    // Format address from components
    const address = data.display_name || null;
    return address;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}
