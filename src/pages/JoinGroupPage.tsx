import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { joinGroupViaInvite } from '@/services/chatService';
import { useAuth } from '@/stores/user';
import { Button } from '@/components/ui/button';
import { Users, AlertCircle, CheckCircle } from 'lucide-react';

export const JoinGroupPage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!user) {
      // Redirect to login
      navigate('/login', { replace: true });
      return;
    }

    if (!inviteCode) {
      setStatus('error');
      setErrorMessage('Mã mời không hợp lệ');
      return;
    }

    handleJoinGroup();
  }, [inviteCode, user]);

  const handleJoinGroup = async () => {
    if (!inviteCode) return;

    try {
      const convId = await joinGroupViaInvite(inviteCode);
      setConversationId(convId);
      setStatus('success');
    } catch (error: any) {
      console.error('Error joining group:', error);
      setStatus('error');
      
      if (error.message?.includes('Invalid or expired')) {
        setErrorMessage('Link mời không hợp lệ hoặc đã hết hạn');
      } else if (error.message?.includes('Not authenticated')) {
        setErrorMessage('Bạn cần đăng nhập để tham gia nhóm');
      } else {
        setErrorMessage('Không thể tham gia nhóm. Vui lòng thử lại sau.');
      }
    }
  };

  const handleGoToChat = () => {
    if (conversationId) {
      navigate(`/chat/${conversationId}`);
    }
  };

  const handleGoHome = () => {
    navigate('/chat');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Đang xử lý lời mời...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Không thể tham gia nhóm
          </h1>
          
          <p className="text-gray-600 mb-6">
            {errorMessage}
          </p>

          <div className="space-y-2">
            <Button onClick={handleGoHome} className="w-full">
              Về trang chủ
            </Button>
            {user && (
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Thử lại
              </Button>
            )}
            {!user && (
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Đăng nhập
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Tham gia thành công!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Bạn đã tham gia nhóm. Nhấn nút bên dưới để bắt đầu trò chuyện.
        </p>

        <div className="space-y-2">
          <Button onClick={handleGoToChat} className="w-full">
            <Users className="w-4 h-4 mr-2" />
            Mở cuộc trò chuyện
          </Button>
          <Button
            variant="outline"
            onClick={handleGoHome}
            className="w-full"
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
};

