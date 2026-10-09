import { type ReactNode, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-green-800 text-white hover:bg-green-900 focus-visible:ring-green-600 shadow-sm',
  secondary:
    'bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-400 shadow-sm',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400 shadow-sm',
  ghost:
    'bg-transparent text-green-800 hover:bg-green-50 focus-visible:ring-green-400',
  outline:
    'bg-white text-green-800 border border-green-300 hover:bg-green-50 focus-visible:ring-green-400',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
