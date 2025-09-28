import { Toaster } from 'react-hot-toast';

export default function CustomToast() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      toastOptions={{
        // Palette Zalo
        style: {
          borderRadius: '16px',
          padding: '10px 12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.06)'
        },
        success: {
          style: { background: '#EAF2FF', color: '#0B1A33' },
          iconTheme: { primary: '#0068FF', secondary: '#fff' }
        },
        error: {
          style: { background: '#FFEDEE', color: '#0B1A33' },
          iconTheme: { primary: '#FF3B30', secondary: '#fff' }
        },
        loading: {
          style: { background: '#F5F9FF', color: '#0B1A33' }
        }
      }}
    />
  );
}
