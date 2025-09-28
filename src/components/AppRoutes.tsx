import useUser from '@/hooks/useUser';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import { BrowserRouter, Outlet, Route, Routes, Navigate } from 'react-router';

const ProtectedRoutes = () => {
  const { isAuthenticated } = useUser();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const RejectedRoutes = () => {
  const { isAuthenticated } = useUser();
  return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<HomePage />} />
        </Route>

        <Route element={<RejectedRoutes />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
