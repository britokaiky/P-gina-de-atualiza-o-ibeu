
import * as React from 'react';
import { clsx } from 'clsx';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md';
};

export function Button({ className, variant='default', size='md', ...props }: Props) {
  const base =
    'rounded-2xl px-4 font-medium transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60';
  const variants = {
    default: 'bg-white text-black hover:opacity-90',
    ghost: 'bg-transparent hover:bg-white/10',
    outline: 'border border-white/20 hover:bg-white/10'
  };
  const sizes = { sm: 'h-8 text-sm', md: 'h-10 text-base' };
  return <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}
