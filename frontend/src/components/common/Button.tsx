import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'subtle';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none border';

  const sizeClasses = {
    xs: 'text-[11px] px-2 py-1 gap-1 rounded-md',
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs px-3.5 py-2 gap-2',
    lg: 'text-sm px-4 py-2.5 gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-slate-900 hover:bg-slate-800 text-white border-slate-900 shadow-2xs hover:shadow-xs focus:ring-slate-900 active:bg-black',
    secondary:
      'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-2xs focus:ring-slate-400 active:bg-slate-100',
    outline:
      'border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 bg-white focus:ring-slate-400 shadow-2xs',
    subtle:
      'border-transparent bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-2xs focus:ring-rose-500 active:bg-rose-800',
    ghost:
      'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-400',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
