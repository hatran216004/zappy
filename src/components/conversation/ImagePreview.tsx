import React from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  file: File;
  onSend: () => void;
  onCancel: () => void;
  isSending: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  file,
  onSend,
  onCancel,
  isSending
}) => {
  const [preview, setPreview] = React.useState<string>('');

  React.useEffect(() => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [file]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
        <h3 className="text-white font-medium">Gửi ảnh</h3>
        <button
          onClick={onCancel}
          disabled={isSending}
          className="text-white hover:text-gray-300 transition-colors disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Image Preview */}
      <div className="flex-1 flex items-center justify-center max-w-4xl w-full">
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        ) : (
          <div className="w-64 h-64 bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-white text-sm">
            <p className="font-medium">{file.name}</p>
            <p className="text-gray-300 text-xs">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          <Button
            onClick={onSend}
            disabled={isSending || !preview}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full flex items-center gap-2"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Gửi
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

