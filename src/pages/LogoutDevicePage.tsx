import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { supabase } from '@/lib/supabase';
import { deactivateSessionByToken } from '@/services/sessionServices';
import toast from 'react-hot-toast';

const LogoutDevicePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const token = searchParams.get('token');

  useEffect(() => {
    const handleLogout = async () => {
      if (!token) {
        setStatus('error');
        toast.error('Token không hợp lệ');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      try {
        console.log('Attempting to logout device with token:', token);
        
        // Gọi database function để logout session
        const { data, error } = await supabase.rpc('logout_session_by_token', {
          p_logout_token: token
        });

        console.log('Logout response:', { data, error });

        if (error) {
          console.error('RPC Error:', error);
          setStatus('error');
          toast.error(`Lỗi: ${error.message || 'Không thể đăng xuất thiết bị'}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!data || data.length === 0) {
          console.error('No data returned from function');
          setStatus('error');
          toast.error('Không tìm thấy session với token này');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!data[0].success) {
          console.error('Function returned success=false');
          setStatus('error');
          toast.error('Token không hợp lệ hoặc session đã bị đăng xuất');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        console.log('Logout successful:', data[0]);
        setStatus('success');
        toast.success('Đã đăng xuất thiết bị thành công!');
        setTimeout(() => navigate('/login'), 2000);
      } catch (error: any) {
        console.error('Error in logout device:', error);
        setStatus('error');
        toast.error(`Có lỗi xảy ra: ${error.message || 'Unknown error'}`);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleLogout();
  }, [token, navigate]);

  return (
    <div className="min-h-screen w-screen bg-gray-200 flex items-center justify-center p-2">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10">
        <div className="text-center space-y-6">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600">Đang xử lý đăng xuất thiết bị...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-gray-600">Đã đăng xuất thiết bị thành công!</p>
              <p className="text-sm text-gray-500">Đang chuyển hướng đến trang đăng nhập...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-gray-600">Không thể đăng xuất thiết bị.</p>
              <p className="text-sm text-gray-500">Token có thể đã hết hạn hoặc không hợp lệ.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogoutDevicePage;

