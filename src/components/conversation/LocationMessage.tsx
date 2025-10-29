import { MapPin, ExternalLink, Map } from 'lucide-react';
import { useState } from 'react';
import { InteractiveMapModal } from './InteractiveMapModal';

interface LocationMessageProps {
  latitude: number;
  longitude: number;
  address?: string | null;
  displayMode?: 'interactive' | 'static' | null;
}

export function LocationMessage({ latitude, longitude, address, displayMode = 'interactive' }: LocationMessageProps) {
  const [showMapModal, setShowMapModal] = useState(false);
  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  // Interactive mode - Show map in modal
  if (displayMode === 'interactive') {
    return (
      <>
        <div 
          onClick={() => setShowMapModal(true)}
          className="max-w-xs rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
        >
          {/* Map preview */}
          <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Map className="w-16 h-16 text-white drop-shadow-lg mx-auto mb-2" />
                <p className="text-white text-sm font-medium">Click để xem bản đồ</p>
              </div>
            </div>
          </div>

          {/* Location info */}
          <div className="p-3 space-y-2">
            {address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-900 dark:text-white font-medium line-clamp-2">
                  {address}
                </p>
              </div>
            )}

            <div className="text-xs text-gray-500 dark:text-gray-400">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </div>
          </div>
        </div>

        {/* Interactive Map Modal */}
        {showMapModal && (
          <InteractiveMapModal
            latitude={latitude}
            longitude={longitude}
            address={address}
            onClose={() => setShowMapModal(false)}
          />
        )}
      </>
    );
  }

  // Static mode - Show preview + Google Maps link
  return (
    <div className="max-w-xs rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      {/* Map preview - fallback to simple design */}
      <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="w-16 h-16 text-white drop-shadow-lg" />
        </div>
      </div>

      {/* Location info */}
      <div className="p-3 space-y-2">
        {address && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-900 dark:text-white font-medium line-clamp-2">
              {address}
            </p>
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400">
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </div>

        {/* Open in Maps button */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Mở trong Google Maps
        </a>
      </div>
    </div>
  );
}

