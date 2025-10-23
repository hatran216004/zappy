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

export default { register, loginWithPassword, getCurrentUser, logout };
