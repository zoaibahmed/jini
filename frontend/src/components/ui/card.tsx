import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverGlow?: boolean;
}

export function Card({
  children,
  hoverGlow = true,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 rounded-2xl p-6 transition-all duration-300 ${
        hoverGlow 
          ? 'hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 hover:border-[#F5C400]/40 dark:hover:border-[#F5C400]/30' 
          : 'shadow-sm'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`space-y-1.5 mb-4 ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ children, className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`font-heading font-bold text-lg text-[#111111] dark:text-slate-100 tracking-tight ${className}`} {...props}>{children}</h3>;
}

export function CardDescription({ children, className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-slate-500 dark:text-slate-400 leading-relaxed ${className}`} {...props}>{children}</p>;
}

export function CardContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`text-sm text-slate-600 dark:text-slate-400 leading-relaxed ${className}`} {...props}>{children}</div>;
}

export function CardFooter({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center ${className}`} {...props}>{children}</div>;
}
