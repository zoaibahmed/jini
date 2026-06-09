import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-heading font-semibold rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-[#F5C400] hover:bg-[#D9A300] text-[#0B0B0B] shadow-md hover:shadow-lg transition-all duration-200',
    secondary: 'bg-white dark:bg-transparent border-2 border-[#0B0B0B] dark:border-slate-200 text-[#0B0B0B] dark:text-slate-200 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 transition-all duration-200',
    accent: 'bg-[#D9A300] hover:bg-[#b88a00] text-white shadow-md',
    outline: 'border border-[#E5E5E5] dark:border-zinc-800 bg-transparent text-[#111111] dark:text-slate-200 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800',
    ghost: 'bg-transparent text-[#111111] dark:text-slate-200 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
