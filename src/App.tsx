import AppRoutes from "./components/AppRoutes";
import CustomToast from "./components/CustomToast";
import ConfirmPopupProvider from "./components/modal/ModalConfirm";

export default function App() {
  return (
    <ConfirmPopupProvider>
      <AppRoutes />
      <CustomToast />
    </ConfirmPopupProvider>
  );
}
