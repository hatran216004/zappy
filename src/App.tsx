import AppRoutes from './components/AppRoutes';
import CustomToast from './components/CustomToast';
import Layout from './layouts/Layout';

export default function App() {
  return (
    <>
      <AppRoutes />
      <CustomToast />
      <Layout />
    </>
  );
}
