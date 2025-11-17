import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import { Mail, ArrowLeft } from 'lucide-react';
import * as yup from 'yup';
import Input from '@/components/Input';
import Button from '@/components/Button';
import authServices from '@/services/authServices';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router';

const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .email('Email không hợp lệ')
    .required('Email là bắt buộc')
});

type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema)
  });

  const { mutate: forgotPasswordMutate, isPending } = useMutation({
    mutationFn: authServices.forgotPassword
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutate(data.email, {
      onSuccess: () => {
        setEmailSent(true);
        toast.success('Email đặt lại mật khẩu đã được gửi!');
      },
      onError: (error) => {
        toast.error(error.message);
      }
    });
  };

  if (emailSent) {
    return (
      <div className="min-h-screen w-screen bg-gray-200 flex items-center justify-center p-2">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">
                Email đã được gửi!
              </h1>
              <p className="text-gray-600">
                Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn. Vui
                lòng kiểm tra hộp thư và làm theo hướng dẫn.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                rounded
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold w-full"
              >
                Quay lại đăng nhập
              </Button>
              <button
                onClick={() => setEmailSent(false)}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Gửi lại email
              </button>
            </div>
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
            Quên mật khẩu?
          </h1>
          <p className="text-gray-600">
            Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            register={register}
            name="email"
            placeholder="Email"
            errorMessage={errors.email?.message}
            type="email"
            icon={Mail}
          />

          <Button
            rounded
            disabled={isPending}
            isLoading={isPending}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold w-full py-4"
          >
            Gửi email đặt lại mật khẩu
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

