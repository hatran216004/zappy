import ChatLayout from '@/layouts/ChatLayout';
import FriendLayout from '@/layouts/FriendLayout';
import MainLayout from '@/layouts/MainLayout';
import ChatPage from '@/pages/ChatPage';
import FriendGroupsPage from '@/pages/friends/FriendGroupsPage';
import FriendPage from '@/pages/friends/FriendPage';
import FriendRequestsPage from '@/pages/friends/FriendRequestsPage';
import NotFound from '@/pages/NotFound';
import AuthenticationPage from '@/pages/AuthenticationPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import { JoinGroupPage } from '@/pages/JoinGroupPage';
import { useAuth } from '@/stores/user';
import { BrowserRouter, Outlet, Route, Routes, Navigate } from 'react-router';
import PostsPage from '@/pages/posts/PostsPage';

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

            <Route path="chat" element={<ChatLayout />}>
              <Route index element={<ChatPage />} />
              <Route path=":conversationId" element={<ChatPage />} />
            </Route>

            <Route path="friends" element={<FriendLayout />}>
              <Route index element={<FriendPage />} />
              <Route path="group" element={<FriendGroupsPage />} />
              <Route path="requests" element={<FriendRequestsPage />} />
            </Route>

            <Route path="posts">
              <Route index element={<PostsPage />} />
              <Route path=":postId" element={<PostsPage />} />
            </Route>
          </Route>
        </Route>

        <Route element={<RejectedRoutes />}>
          <Route path="/login" element={<AuthenticationPage />} />
          <Route path="/register" element={<AuthenticationPage />} />
        </Route>

        {/* Public routes for password reset */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Public route for OAuth callback */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Public route for joining via invite */}
        <Route path="/invite/:inviteCode" element={<JoinGroupPage />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
