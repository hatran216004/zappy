import Input from '@/components/Input';
import { type RegisterSchema, registerSchema } from '@/utils/rules';
import { User, Lock, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Divider from '@/components/Divider';
import Button from '@/components/Button';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import authServices from '@/services/authServices';
import toast from 'react-hot-toast';
import { PasswordHints } from '@/components/PasswordHints';
import SelectController from '@/components/SelectController';

type FormData = RegisterSchema;

const RegisterPage = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: authServices.register
  });

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors }
  } = useForm<FormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      agreeTerms: false
    }
  });

  const onSubmit = async (data: FormData) => {
    const { email, password, username, displayName, gender } = data;

    mutate(
      { email, password, username, displayName, gender },
      {
        onSuccess: () => {
          toast.success(
            'Đăng ký thành công. Vui lòng kiểm tra và xác nhận email'
          );
          navigate('/login');
        },
        onError: (error) => {
          toast.error(error.message);
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Đăng ký Zappy
          </h1>
          <p className="text-gray-600">
            Tạo tài khoản mới để kết nối với bạn bè
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              register={register}
              name="displayName"
              placeholder="Họ và tên"
              errorMessage={errors.displayName?.message}
              type="text"
              icon={User}
            />

            <Input
              register={register}
              name="username"
              placeholder="Username"
              errorMessage={errors.username?.message}
              type="text"
              icon={User}
            />

            <Input
              name="email"
              placeholder="Email"
              errorMessage={errors.email?.message}
              type="email"
              register={register}
              icon={Mail}
            />

            <Input
              register={register}
              name="password"
              placeholder="Password"
              errorMessage={errors.password?.message}
              type="password"
              icon={Lock}
            />
            <PasswordHints control={control} name="password" />

            <Input
              register={register}
              name="confirmPassword"
              placeholder="Confirm password"
              errorMessage={errors.confirmPassword?.message}
              type="password"
              icon={Lock}
            />

            <SelectController
              control={control}
              fieldName="gender"
              options={[
                { label: 'Nam', value: 'male' },
                { label: 'Nữ', value: 'female' }
              ]}
              placeholder="Giới tính"
              errorMessage={errors.gender?.message}
            />

            <div className="flex items-start space-x-3 mb-4">
              <input
                type="checkbox"
                id="agreeTerms"
                className="mt-1 h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                {...register('agreeTerms')}
              />
              <label
                htmlFor="agreeTerms"
                className="text-sm text-gray-600 leading-relaxed cursor-pointer select-none"
              >
                Tôi đồng ý với{' '}
                <span className="text-blue-500 hover:text-blue-600 font-medium cursor-pointer">
                  Điều khoản sử dụng
                </span>{' '}
                và{' '}
                <span className="text-blue-500 hover:text-blue-600 font-medium cursor-pointer">
                  Chính sách bảo mật
                </span>{' '}
                của Zalo
              </label>
            </div>
            <Button
              rounded
              primary
              disabled={!watch('agreeTerms') || isPending}
              isLoading={isPending}
              type="submit"
            >
              Đăng ký
            </Button>
          </form>
          <Divider>Hoặc</Divider>

          <div className="space-y-3">
            <Button
              primary={false}
              outline
              rounded
              className="shadow-none py-2 gap-2"
            >
              <FcGoogle className="size-8" />
              <span className="text-gray-700 font-medium">
                Tiếp tục với Google
              </span>
            </Button>

            {/* <Button
              primary={false}
              outline
              rounded
              className="shadow-none py-2 gap-2"
            >
              <FaFacebook className="size-8 text-blue-600" />
              <span className="text-gray-700 font-medium">
                Tiếp tục với Facebook
              </span>
            </Button> */}
          </div>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="text-blue-500 hover:text-blue-600 font-semibold transition-colors cursor-pointer"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Bằng cách đăng ký, bạn đồng ý với Điều khoản dịch vụ của chúng tôi
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
