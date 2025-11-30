import { AUTH_ERROR_MESSAGES } from '@/config/constant';
import { supabase } from '@/lib/supabase';
import { CustomError } from '@/utils/errors';
import { User } from '@supabase/supabase-js';
import { createUserSession, getOtherActiveSessions, deactivateSession } from './sessionServices';
import { getDeviceInfo } from '@/utils/deviceInfo';

type RegisterInput = {
  email: string;
  password: string;
  username: string;
  displayName: string;
  gender: 'male' | 'female';
};

const register = async ({
  email,
  password,
  username,
  displayName,
  gender
}: RegisterInput) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        profile: {
          username,
          display_name: displayName,
          gender: gender === 'male' ? 1 : 0
        }
      },
      emailRedirectTo: 'http://localhost:5173'
    }
  });

  if (error) {
    console.log(error);
    const message =
      AUTH_ERROR_MESSAGES[error?.code as string] ||
      error?.message ||
      'Có lỗi xảy ra. Vui lòng thử lại';

    throw new CustomError(message, {
      type: 'authentication',
      details: `HTTP ${error.status ?? 'unknown'}`,
      retryable: false
    });
  }

  return data;
};

const loginWithPassword = async ({
  email,
  password
}: {
  email: string;
  password: string;
}) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    const message =
      AUTH_ERROR_MESSAGES[error?.code as string] ||
      error?.message ||
      'Có lỗi xảy ra. Vui lòng thử lại';

    throw new CustomError(message, {
      type: 'authentication',
      details: `HTTP ${error.status ?? 'unknown'}`,
      retryable: false
    });
  }

  // Lưu session vào database và kiểm tra sessions cũ
  if (data.user && data.session) {
    try {
      const deviceInfo = getDeviceInfo();
      const sessionId = data.session.access_token; // Hoặc có thể dùng refresh_token
      
      // Lưu session mới
      await createUserSession(data.user.id, sessionId, deviceInfo);

      // Kiểm tra sessions cũ và gửi email cảnh báo (async, không block login)
      checkAndNotifyOtherSessions(data.user.id, sessionId, deviceInfo).catch((err) => {
        console.error('Error checking other sessions:', err);
        // Không throw error vì đây là operation không critical
      });
    } catch (sessionError) {
      console.error('Error creating user session:', sessionError);
      // Không throw error vì login đã thành công, chỉ log
    }
  }

  return { user: data.user, session: data.session };
};

const getCurrentUser = async (): Promise<{ user: User }> => {
  const { data, error } = await supabase.auth.getUser();

  if (!data.user) {
    throw new CustomError(
      'Người dùng chưa được xác thực, vui lòng đăng nhập lại',
      {
        type: 'authentication',
        details: 'HTTP 401',
        retryable: false
      }
    );
  }

  if (error) {
    const message =
      AUTH_ERROR_MESSAGES[error?.code as string] ||
      error?.message ||
      'Có lỗi xảy ra. Vui lòng thử lại';

    throw new CustomError(message, {
      type: 'authentication',
      details: `HTTP ${error.status ?? 'unknown'}`,
      retryable: false
    });
  }

  return { user: data.user };
};

const logout = async () => {
  // Set offline status và deactivate session trước khi logout
  try {
    const {
      data: { user },
      data: { session }
    } = await supabase.auth.getSession();
    
    if (user) {
      // Set offline status
      await supabase
        .from('profiles')
        .update({
          status: 'offline',
          last_seen_at: new Date().toISOString(),
          status_updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      // Deactivate session trong database
      if (session?.access_token) {
        try {
          await deactivateSession(session.access_token);
        } catch (sessionError) {
          console.error('Error deactivating session:', sessionError);
          // Không throw, vẫn tiếp tục logout
        }
      }
    }
  } catch (error) {
    // Log nhưng không throw - vẫn tiếp tục logout
    console.error('Error setting offline status during logout:', error);
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    const message =
      AUTH_ERROR_MESSAGES[error?.code as string] ||
      error?.message ||
      'Có lỗi xảy ra. Vui lòng thử lại';

    throw new CustomError(message, {
      type: 'authentication',
      details: `HTTP ${error.status ?? 'unknown'}`,
      retryable: false
    });
  }
  return null;
};

const loginWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });

  if (error) {
    const message =
      AUTH_ERROR_MESSAGES[error?.code as string] ||
      error?.message ||
      'Có lỗi xảy ra khi đăng nhập với Google. Vui lòng thử lại';

    throw new CustomError(message, {
      type: 'authentication',
      details: `HTTP ${error.status ?? 'unknown'}`,
      retryable: false
    });
  }

  return data;
};

const forgotPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });

  if (error) {
    const message =
      AUTH_ERROR_MESSAGES[error?.code as string] ||
      error?.message ||
      'Có lỗi xảy ra. Vui lòng thử lại';

    throw new CustomError(message, {
      type: 'authentication',
      details: `HTTP ${error.status ?? 'unknown'}`,
      retryable: false
    });
  }

  return { success: true };
};

const resetPassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    const message =
      AUTH_ERROR_MESSAGES[error?.code as string] ||
      error?.message ||
      'Có lỗi xảy ra. Vui lòng thử lại';

    throw new CustomError(message, {
      type: 'authentication',
      details: `HTTP ${error.status ?? 'unknown'}`,
      retryable: false
    });
  }

  return { user: data.user, session: data.session };
};

/**
 * Helper function để kiểm tra sessions cũ và gửi email cảnh báo
 */
const checkAndNotifyOtherSessions = async (
  userId: string,
  currentSessionId: string,
  deviceInfo: ReturnType<typeof getDeviceInfo>
) => {
  try {
    // Lấy các sessions active khác
    const otherSessions = await getOtherActiveSessions(userId, currentSessionId);

    // Nếu có sessions khác, gửi email cảnh báo
    if (otherSessions.length > 0) {
      // Gọi Edge Function để gửi email
      const { error: notifyError } = await supabase.functions.invoke('notify-new-login', {
        body: {
          userId,
          sessionId: currentSessionId,
          frontendUrl: window.location.origin,
          deviceInfo: {
            deviceName: deviceInfo.deviceName,
            browserName: deviceInfo.browserName,
            browserVersion: deviceInfo.browserVersion,
            osName: deviceInfo.osName,
            osVersion: deviceInfo.osVersion,
            deviceType: deviceInfo.deviceType
          },
          otherSessions: otherSessions.map((s) => ({
            id: s.id,
            device_name: s.device_name,
            browser_name: s.browser_name,
            os_name: s.os_name,
            device_type: s.device_type,
            created_at: s.created_at,
            logout_token: s.logout_token
          }))
        }
      });

      if (notifyError) {
        console.error('Error sending login notification email:', notifyError);
        // Không throw, chỉ log
      }
    }
  } catch (error) {
    console.error('Error in checkAndNotifyOtherSessions:', error);
    // Không throw, chỉ log
  }
};

export default {
  register,
  loginWithPassword,
  loginWithGoogle,
  getCurrentUser,
  logout,
  forgotPassword,
  resetPassword
};
