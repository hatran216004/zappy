import { useEffect } from 'react';
import AppRoutes from './components/AppRoutes';
import CustomToast from './components/CustomToast';
import ConfirmPopupProvider from './components/modal/ModalConfirm';
import useUser from './hooks/useUser';
import { useMentionNotifications } from './hooks/useMentionNotifications.tsx';
import { initializeModel } from './utils/mlContentFilter';

export default function App() {
  const { user } = useUser();
  useMentionNotifications(user?.id);

  // Khởi tạo ML model khi app load
  useEffect(() => {
    initializeModel().catch((error) => {
      console.warn('Failed to initialize ML model:', error);
    });
  }, []);

  return (
    <ConfirmPopupProvider>
      <AppRoutes />
      <CustomToast />
    </ConfirmPopupProvider>
  );
}
