import { AUTH_ERROR_MESSAGES } from '@/config/constant';
import { supabase } from '@/lib/supabase';
import { CustomError } from '@/utils/errors';
import { User } from '@supabase/supabase-js';

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
  // Set offline status trước khi logout
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({
          status: 'offline',
          last_seen_at: new Date().toISOString(),
          status_updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
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

export default {
  register,
  loginWithPassword,
  loginWithGoogle,
  getCurrentUser,
  logout,
  forgotPassword,
  resetPassword
};
