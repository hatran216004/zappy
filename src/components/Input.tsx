/* eslint-disable @typescript-eslint/no-explicit-any */
import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';
import { ElementType, InputHTMLAttributes, useState } from 'react';
import { UseFormRegister } from 'react-hook-form';

type InputProps = {
  className?: string;
  iconClassName?: string;
  errorMessage?: string;
  icon?: ElementType;
  register: UseFormRegister<any>;
} & InputHTMLAttributes<HTMLInputElement>;

export default function Input({
  name,
  icon,
  type,
  className = '',
  iconClassName = '',
  errorMessage,
  register,
  ...passProps
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const registerResult = name && register ? register(name) : null;
  const Icon = icon;

  return (
    <>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {Icon && (
            <Icon className={clsx('h-5 w-5 text-gray-400', iconClassName)} />
          )}
        </div>
        <input
          type={showPassword ? 'text' : type}
          name={name}
          className={clsx(
            'w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700 placeholder-gray-400',
            className
          )}
          {...registerResult}
          {...passProps}
        />
        {type === 'password' && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        )}
      </div>
      {errorMessage && (
        <span className="text-red-500 text-sm">{errorMessage}</span>
      )}
    </>
  );
}
