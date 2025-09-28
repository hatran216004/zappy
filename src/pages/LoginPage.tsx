import Input from '@/components/Input';
import { type RegisterSchema, registerSchema } from '@/utils/rules';
import { Lock, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, useNavigate } from 'react-router';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import Button from '@/components/Button';
import Divider from '@/components/Divider';
import { useMutation } from '@tanstack/react-query';
import authServices from '@/services/authServices';
import toast from 'react-hot-toast';

type FormData = Pick<RegisterSchema, 'email' | 'password'>;
const loginSchema = registerSchema.pick(['email', 'password']);

const LoginPage = () => {
  const { mutate, isPending } = useMutation({
    mutationFn: authServices.loginWithPassword
  });

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: yupResolver(loginSchema)
  });

  const onSubmit = (data: FormData) => {
    const { email, password } = data;

    mutate(
      { email, password },
      {
        onSuccess: () => {
          toast.success('Login succesful');
          navigate('/');
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
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Đăng nhập Zappy
          </h1>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

            <Button rounded disabled={isPending} isLoading={isPending}>
              Đăng nhập
            </Button>
          </form>

          <Divider>Hoặc</Divider>

          <div className="space-y-3">
            <Button
              onClick={(e) => e.preventDefault()}
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

            <Button
              onClick={(e) => e.preventDefault()}
              primary={false}
              outline
              rounded
              className="shadow-none py-2 gap-2"
            >
              <FaFacebook className="size-8 text-blue-600" />
              <span className="text-gray-700 font-medium">
                Tiếp tục với Facebook
              </span>
            </Button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Chưa có tài khoản?{' '}
              <Link
                to="/register"
                className="text-blue-500 hover:text-blue-600 font-semibold transition-colors cursor-pointer"
              >
                Đăng ký
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
