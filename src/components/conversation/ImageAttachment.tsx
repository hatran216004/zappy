import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ImageAttachmentProps {
  src: string;
  alt?: string;
  isOwn?: boolean;
}

export const ImageAttachment: React.FC<ImageAttachmentProps> = ({
  src,
  alt = 'Image',
  isOwn = false
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);
  const [error, setError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Không thể tải ảnh
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="relative max-w-sm">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Image */}
        <img
          src={src}
          alt={alt}
          className={`rounded-lg cursor-pointer hover:opacity-95 transition-opacity max-w-full h-auto ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ maxHeight: '400px', objectFit: 'cover' }}
          onClick={() => setShowLightbox(true)}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

