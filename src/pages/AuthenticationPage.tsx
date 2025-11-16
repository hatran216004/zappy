import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import { Lock, Mail, User, Menu, X } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { type RegisterSchema, registerSchema } from '@/utils/rules';
import authServices from '@/services/authServices';
import profileServices from '@/services/profileServices';
import toast from 'react-hot-toast';
import { useAuth } from '@/stores/user';
import { PasswordHints } from '@/components/PasswordHints';
import SelectController from '@/components/SelectController';
import { useNavigate, useLocation } from 'react-router';

type LoginFormData = Pick<RegisterSchema, 'email' | 'password'>;
type SignUpFormData = RegisterSchema;

const loginSchema = registerSchema.pick(['email', 'password']);

const AuthenticationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // Auto-detect route and set initial state
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');

  useEffect(() => {
    setIsLogin(location.pathname === '/login');
  }, [location.pathname]);

  // Login form
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: errorsLogin }
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema)
  });

  // Sign up form
  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    watch,
    control,
    formState: { errors: errorsSignUp }
  } = useForm<SignUpFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      agreeTerms: false
    }
  });

  // Login mutation
  const { mutate: loginMutate, isPending: isLoginPending } = useMutation({
    mutationFn: authServices.loginWithPassword
  });

  // Sign up mutation
  const { mutate: signUpMutate, isPending: isSignUpPending } = useMutation({
    mutationFn: authServices.register
  });

  const onLoginSubmit = (data: LoginFormData) => {
    const { email, password } = data;

    loginMutate(
      { email, password },
      {
        onSuccess: async (data) => {
          try {
            const profile = await profileServices.getProfile(data.user.id);
            if (profile.is_disabled) {
              await authServices.logout();
              setUser(null);
              toast.error(
                'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin qua email: hieuntadmin@gmail.com để được hỗ trợ.',
                { duration: 10000 }
              );
              return;
            }
            toast.success('Đăng nhập thành công');
            setUser(data.user);
          } catch (error) {
            console.error('Error checking profile:', error);
            toast.success('Đăng nhập thành công');
            setUser(data.user);
          }
        },
        onError: (error) => {
          toast.error(error.message);
        }
      }
    );
  };

  const onSignUpSubmit = (data: SignUpFormData) => {
    const { email, password, username, displayName, gender } = data;

    signUpMutate(
      { email, password, username, displayName, gender },
      {
        onSuccess: () => {
          toast.success(
            'Đăng ký thành công. Vui lòng kiểm tra và xác nhận email'
          );
          setIsLogin(true);
        },
        onError: (error) => {
          toast.error(error.message);
        }
      }
    );
  };

  const toggleMode = () => {
    const newMode = !isLogin;
    setIsLogin(newMode);
    // Update URL without page reload
    navigate(newMode ? '/login' : '/register', { replace: true });
  };

  return (
    <div
      className={`min-h-screen w-screen bg-gray-200 flex items-center justify-center p-2 overflow-x-hidden`}
    >
      <div className={`w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)]`}>
        <div
          className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-700 ease-in-out ${
            isLogin ? 'h-auto min-h-[600px]' : 'h-auto min-h-[700px]'
          }`}
        >
          <div
            className={`relative flex h-full overflow-hidden ${
              isLogin ? 'min-h-[600px]' : 'min-h-[700px]'
            }`}
          >
            {/* Gradient Panel - Right when login, Left when register */}
            <div
              className={`absolute inset-0 w-[50%] bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 z-10 will-change-transform`}
              style={{
                left: isLogin ? '50%' : '0%',
                clipPath: isLogin
                  ? 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)'
                  : 'polygon(0 0, 100% 0, 85% 100%, 0 100%)',
                transition:
                  'left 700ms cubic-bezier(0.4, 0, 0.2, 1), clip-path 700ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-300 rounded-full blur-3xl"></div>
                {/* Circuit pattern */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="circuit"
                      x="0"
                      y="0"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle
                        cx="20"
                        cy="20"
                        r="1"
                        fill="white"
                        opacity="0.3"
                      />
                      <line
                        x1="20"
                        y1="0"
                        x2="20"
                        y2="40"
                        stroke="white"
                        strokeWidth="0.5"
                        opacity="0.2"
                      />
                      <line
                        x1="0"
                        y1="20"
                        x2="40"
                        y2="20"
                        stroke="white"
                        strokeWidth="0.5"
                        opacity="0.2"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#circuit)" />
                </svg>
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-between p-8 md:p-12 text-white">
                {/* Menu icon */}
                <button className="w-10 h-10 flex items-center justify-center">
                  <Menu className="w-6 h-6" />
                </button>

                {/* Center content */}
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
                  <h2 className="text-3xl md:text-4xl font-bold">
                    {isLogin
                      ? 'Chào mừng trở lại!'
                      : 'Đăng ký để nhận cập nhật thường xuyên!'}
                  </h2>

                  {/* Email subscription form */}
                  <div className="w-full max-w-sm space-y-4">
                    <label className="block text-left text-white text-sm font-medium">
                      {isLogin ? 'Đăng nhập ngay!' : 'Nhập Email Của Bạn'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <input
                        type="email"
                        placeholder="makefutureit@gmail.com"
                        className="w-full pl-12 pr-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                    </div>
                    <Button
                      rounded
                      primary={false}
                      className="bg-white text-purple-600 hover:bg-white/90 font-semibold"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleMode();
                      }}
                    >
                      {isLogin ? 'ĐĂNG KÝ!' : 'ĐI THÔI!'}
                    </Button>
                  </div>
                </div>

                {/* Dots decoration */}
                <div
                  className={`absolute bottom-0 ${
                    isLogin ? 'right-0' : 'left-0'
                  } w-32 h-32`}
                >
                  <div className="absolute inset-0 grid grid-cols-4 gap-2 opacity-30">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-white rounded-full"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Login/Sign Up Panel - White */}
            <div
              className={`w-[50%] relative z-20 bg-white will-change-transform ${
                !isLogin ? 'flex-1' : ''
              }`}
              style={{
                transform: isLogin ? 'translateX(0%)' : 'translateX(50%)',
                transition: 'transform 700ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <div
                className={`h-full ${
                  !isLogin ? 'p-6 md:p-8' : 'p-8 md:p-10'
                } flex flex-col ${!isLogin ? 'overflow-y-auto' : ''} ${
                  !isLogin ? 'max-h-[700px] max-w-1/2 pr-4' : ''
                }`}
              >
                {/* Close button */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => navigate('/')}
                    className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Welcome text */}
                <div className={`${!isLogin ? 'mb-4' : 'mt-8 mb-8'}`}>
                  <h1
                    className={`${
                      !isLogin ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'
                    } font-bold text-purple-600 mb-2`}
                  >
                    {isLogin ? 'Xin chào!' : 'Chào mừng!'}
                  </h1>
                  <p
                    className={`${
                      !isLogin ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'
                    } font-semibold text-purple-600`}
                  >
                    {isLogin ? 'Chào mừng trở lại' : 'Bắt đầu hành trình'}
                  </p>
                </div>

                {/* Form */}
                <form
                  onSubmit={
                    isLogin
                      ? handleSubmitLogin(onLoginSubmit)
                      : handleSubmitSignUp(onSignUpSubmit)
                  }
                  className={`flex-1 flex flex-col ${
                    !isLogin ? 'space-y-3' : 'space-y-4'
                  } pb-4`}
                >
                  {!isLogin && (
                    <>
                      <Input
                        register={registerSignUp}
                        name="displayName"
                        placeholder="Họ và tên"
                        errorMessage={errorsSignUp.displayName?.message}
                        type="text"
                        icon={User}
                      />

                      <Input
                        register={registerSignUp}
                        name="username"
                        placeholder="Username"
                        errorMessage={errorsSignUp.username?.message}
                        type="text"
                        icon={User}
                      />
                    </>
                  )}

                  <Input
                    name="email"
                    placeholder={isLogin ? 'Email' : 'Email'}
                    errorMessage={
                      isLogin
                        ? errorsLogin.email?.message
                        : errorsSignUp.email?.message
                    }
                    type="email"
                    register={isLogin ? registerLogin : registerSignUp}
                    icon={Mail}
                    defaultValue={
                      isLogin ? 'minhhatran153@gmail.com' : undefined
                    }
                  />

                  <Input
                    register={isLogin ? registerLogin : registerSignUp}
                    name="password"
                    placeholder="Password"
                    defaultValue={isLogin ? 'Test@123' : undefined}
                    errorMessage={
                      isLogin
                        ? errorsLogin.password?.message
                        : errorsSignUp.password?.message
                    }
                    type="password"
                    icon={Lock}
                  />

                  {!isLogin && (
                    <>
                      <PasswordHints control={control} name="password" />
                      <Input
                        register={registerSignUp}
                        name="confirmPassword"
                        placeholder="Xác nhận mật khẩu"
                        errorMessage={errorsSignUp.confirmPassword?.message}
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
                        errorMessage={errorsSignUp.gender?.message}
                      />
                    </>
                  )}

                  <Button
                    rounded
                    disabled={
                      isLogin
                        ? isLoginPending
                        : isSignUpPending || !watch('agreeTerms')
                    }
                    isLoading={isLogin ? isLoginPending : isSignUpPending}
                    className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold py-4 mt-4"
                  >
                    {isLogin ? 'Đăng nhập' : 'Đăng ký'}
                  </Button>
                </form>

                {/* Social login */}
                <div className={`${!isLogin ? 'mt-4' : 'mt-6'} space-y-3`}>
                  <Button
                    primary={false}
                    outline
                    rounded
                    className="shadow-none py-2 gap-2 border-purple-300 text-purple-600 hover:bg-purple-50"
                    onClick={(e) => e.preventDefault()}
                  >
                    <FcGoogle className="size-8" />
                    <span className="text-gray-700 font-medium">
                      Tiếp tục với Google
                    </span>
                  </Button>
                </div>

                {/* Footer links */}
                <div
                  className={`${
                    !isLogin ? 'mt-4' : 'mt-8'
                  } space-y-2 text-center`}
                >
                  {isLogin ? (
                    <>
                      <p className="text-gray-500 text-sm">
                        Chưa có tài khoản?{' '}
                        <button
                          onClick={toggleMode}
                          className="text-purple-600 hover:text-purple-700 font-semibold transition-colors cursor-pointer"
                        >
                          Đăng ký
                        </button>
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start space-x-2 mb-3">
                        <input
                          type="checkbox"
                          id="agreeTerms"
                          className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 flex-shrink-0"
                          {...registerSignUp('agreeTerms')}
                        />
                        <label
                          htmlFor="agreeTerms"
                          className="text-xs md:text-sm text-gray-500 leading-relaxed cursor-pointer select-none"
                        >
                          Tôi đồng ý với{' '}
                          <span className="text-purple-600 hover:text-purple-700 font-medium cursor-pointer">
                            Điều khoản sử dụng
                          </span>
                        </label>
                      </div>
                      <p className="text-gray-500 text-xs md:text-sm">
                        Đã có tài khoản?{' '}
                        <button
                          onClick={toggleMode}
                          className="text-purple-600 hover:text-purple-700 font-semibold transition-colors cursor-pointer"
                        >
                          Đăng nhập
                        </button>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationPage;
