import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import { Lock, ArrowLeft } from 'lucide-react';
import * as yup from 'yup';
import Input from '@/components/Input';
import Button from '@/components/Button';
import authServices from '@/services/authServices';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '@/stores/user';
import { supabase } from '@/lib/supabase';

const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .min(6, 'Mật khẩu phải ít nhất 6 ký tự')
    .required('Mật khẩu là bắt buộc')
    .matches(/[a-z]/, 'Phải có ít nhất 1 chữ thường (a-z)')
    .matches(/[A-Z]/, 'Phải có ít nhất 1 chữ hoa (A-Z)')
    .matches(/[0-9]/, 'Phải có ít nhất 1 số (0-9)')
    .matches(
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/,
      'Phải có ít nhất 1 ký tự đặc biệt'
    ),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp')
    .required('Xác nhận mật khẩu là bắt buộc')
});

type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      // Check if we have the access token from the URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (type === 'recovery' && accessToken) {
        // Supabase will automatically process the hash fragment when we call getSession
        // This establishes the session needed for password reset
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          setIsValidToken(false);
          toast.error('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
        } else {
          setIsValidToken(true);
          // Clear the hash from URL for security
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else {
        // Check if we already have a valid session (user might have refreshed)
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
          toast.error('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
        }
      }
    };

    checkSession();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema)
  });

  const { mutate: resetPasswordMutate, isPending } = useMutation({
    mutationFn: authServices.resetPassword
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    resetPasswordMutate(data.password, {
      onSuccess: async (result) => {
        toast.success('Đặt lại mật khẩu thành công!');
        setUser(result.user);
        navigate('/chat');
      },
      onError: (error) => {
        toast.error(error.message);
      }
    });
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen w-screen bg-gray-200 flex items-center justify-center p-2">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang kiểm tra...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen w-screen bg-gray-200 flex items-center justify-center p-2">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">
                Link không hợp lệ
              </h1>
              <p className="text-gray-600">
                Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu
                cầu link mới.
              </p>
            </div>
            <Link to="/forgot-password">
              <Button
                rounded
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold w-full"
              >
                Yêu cầu link mới
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gray-200 flex items-center justify-center p-2">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10">
        <Link
          to="/login"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
            Đặt lại mật khẩu
          </h1>
          <p className="text-gray-600">
            Nhập mật khẩu mới của bạn. Mật khẩu phải có ít nhất 6 ký tự và bao
            gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            register={register}
            name="password"
            placeholder="Mật khẩu mới"
            errorMessage={errors.password?.message}
            type="password"
            icon={Lock}
          />

          <Input
            register={register}
            name="confirmPassword"
            placeholder="Xác nhận mật khẩu"
            errorMessage={errors.confirmPassword?.message}
            type="password"
            icon={Lock}
          />

          <Button
            rounded
            disabled={isPending}
            isLoading={isPending}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold w-full py-4"
          >
            Đặt lại mật khẩu
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

