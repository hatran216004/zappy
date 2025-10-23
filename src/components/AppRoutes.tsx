import FriendLayout from '@/layouts/FriendLayout';
import MainLayout from '@/layouts/MainLayout';
import ChatPage from '@/pages/ChatPage';
import FriendGroupsPage from '@/pages/friends/FriendGroupsPage';
import FriendPage from '@/pages/friends/FriendPage';
import FriendRequestsPage from '@/pages/friends/FriendRequestsPage';
import LoginPage from '@/pages/LoginPage';
import NotFound from '@/pages/NotFound';
import RegisterPage from '@/pages/RegisterPage';
import { useAuth } from '@/stores/user';
import { BrowserRouter, Outlet, Route, Routes, Navigate } from 'react-router';

const ProtectedRoutes = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const RejectedRoutes = () => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedRoutes />}>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="chat" replace />} />

            <Route path="chat">
              <Route index element={<ChatPage />} />
              <Route path=":conversationId" element={<ChatPage />} />
            </Route>

            <Route path="friends" element={<FriendLayout />}>
              <Route index element={<FriendPage />} />
              <Route path="group" element={<FriendGroupsPage />} />
              <Route path="requests" element={<FriendRequestsPage />} />
            </Route>
          </Route>
        </Route>

        <Route element={<RejectedRoutes />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
