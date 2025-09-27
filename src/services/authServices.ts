import { AUTH_ERROR_MESSAGES } from '@/config/constant';
import { supabase } from '@/lib/supabase';
import { CustomError } from '@/utils/errors';

type RegisterInput = {
  email: string;
  password: string;
  username: string;
};

const register = async ({ email, password, username }: RegisterInput) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
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
    console.error('Login error:', error);
    throw new CustomError(error.message, {
      type: 'authentication'
    });
  }

  return data;
};

export default { register, loginWithPassword };
