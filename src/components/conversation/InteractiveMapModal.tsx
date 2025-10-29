import { X, ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface InteractiveMapModalProps {
  latitude: number;
  longitude: number;
  address?: string | null;
  onClose: () => void;
}

export function InteractiveMapModal({
  latitude,
  longitude,
  address,
  onClose
}: InteractiveMapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS and initialize map
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      if (mapRef.current && (window as any).L) {
        const L = (window as any).L;
        
        // Initialize map
        const map = L.map(mapRef.current).setView([latitude, longitude], 15);

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add marker
        const marker = L.marker([latitude, longitude]).addTo(map);
        
        if (address) {
          marker.bindPopup(address).openPopup();
        }

        // Cleanup
        return () => {
          map.remove();
        };
      }
    };
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [latitude, longitude, address]);

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Vị trí được chia sẻ
            </h3>
            {address && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {address}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0 rounded-b-lg" />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Tọa độ: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Mở trong Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}

