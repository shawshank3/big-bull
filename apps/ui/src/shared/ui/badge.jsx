import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40',
  {
    variants: {
      variant: {
        success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
        danger: 'border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-100',
        warning: 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100',
        info: 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100',
      },
    },
    defaultVariants: { variant: 'info' },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
