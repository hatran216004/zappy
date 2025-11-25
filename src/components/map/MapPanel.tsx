import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, X } from 'lucide-react';
import { getLocationMessages } from '@/services/chatService';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// Fix default icon issue with Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

interface MapPanelProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
  onMessageClick?: (messageId: string) => void;
}

export const MapPanel: React.FC<MapPanelProps> = ({
  conversationId,
  isOpen,
  onClose,
  onMessageClick
}) => {
  const [locations, setLocations] = useState<
    Array<{
      id: string;
      latitude: number;
      longitude: number;
      address: string | null;
      senderId: string;
      senderName: string;
      senderAvatar: string;
      createdAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🗺️ MapPanel effect:', { isOpen, conversationId });
    if (!isOpen || !conversationId) return;

    const loadLocations = async () => {
      try {
        setLoading(true);
        console.log('📍 Loading locations for:', conversationId);
        const data = await getLocationMessages(conversationId, 24);
        console.log('📍 Locations loaded:', data.length, 'items');
        setLocations(data);
      } catch (error) {
        console.error('❌ Error loading locations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, [conversationId, isOpen]);

  console.log('🗺️ MapPanel render:', { isOpen, locationCount: locations.length });

  if (!isOpen) return null;

  // Default center (Vietnam)
  const defaultCenter: [number, number] = [16.0544, 108.2022];
  const mapCenter: [number, number] =
    locations.length > 0
      ? [locations[0].latitude, locations[0].longitude]
      : defaultCenter;

  return (
    <div className="fixed right-0 top-[56px] bottom-0 w-96 bg-background border-l shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Bản đồ vị trí</h3>
          <span className="text-xs text-muted-foreground">
            ({locations.length} địa điểm)
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Đang tải...</div>
          </div>
        ) : locations.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              Chưa có vị trí nào được chia sẻ trong 24 giờ qua
            </p>
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((location) => (
              <Marker
                key={location.id}
                position={[location.latitude, location.longitude]}
                eventHandlers={{
                  click: () => {
                    if (onMessageClick) {
                      onMessageClick(location.id);
                    }
                  }
                }}
              >
                <Popup>
                  <div className="flex items-start gap-2 min-w-[200px]">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={location.senderAvatar} />
                      <AvatarFallback>
                        {location.senderName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{location.senderName}</p>
                      {location.address && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {location.address}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(location.createdAt), {
                          addSuffix: true,
                          locale: vi
                        })}
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

