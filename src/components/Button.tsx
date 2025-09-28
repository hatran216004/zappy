import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';
import Loading from './Loading';

type ButtonProps = {
  primary?: boolean;
  rounded?: boolean;
  outline?: boolean;
  className?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button(props: ButtonProps) {
  const {
    primary = true,
    rounded = false,
    outline = false,
    disabled = false,
    isLoading = false,
    className = '',
    children,
    onClick = () => {},
    ...passProps
  } = props;

  if (disabled && typeof onClick === 'function') {
    delete props.onClick;
  }

  return (
    <button
      type="submit"
      disabled={disabled}
      className={clsx(
        twMerge(
          'w-full flex items-center justify-center gap-2 bg-gradient-to-r cursor-pointer disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 transition-all duration-200 shadow-lg transform disabled:transform-none disabled:cursor-not-allowed',
          className
        ),
        {
          'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700':
            primary,
          'rounded-2xl': rounded,
          'border border-gray-200': outline
        }
      )}
      {...passProps}
    >
      {isLoading && <Loading />}
      {children}
    </button>
  );
}
