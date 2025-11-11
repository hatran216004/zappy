import AppRoutes from './components/AppRoutes';
import CustomToast from './components/CustomToast';
import ConfirmPopupProvider from './components/modal/ModalConfirm';
import useUser from './hooks/useUser';
import { useMentionNotifications } from './hooks/useMentionNotifications.tsx';

export default function App() {
  const { user } = useUser();
  useMentionNotifications(user?.id);
  return (
    <ConfirmPopupProvider>
      <AppRoutes />
      <CustomToast />
    </ConfirmPopupProvider>
  );
}
