// Tier 1 — Presentational Token
import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from './button';

const alertVariants = cva('relative w-full rounded-xl border px-4 py-3 text-sm', {
  variants: {
    variant: {
      success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
      danger: 'border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-100',
      warning: 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100',
      info: 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100',
    },
  },
  defaultVariants: { variant: 'info' },
});

const Alert = React.forwardRef(({ className, variant, children, onClose, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
    <div className="flex items-start justify-between gap-4">
      <div>{children}</div>
      {onClose ? (
        <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-7 px-2">
          ✕
        </Button>
      ) : null}
    </div>
  </div>
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription, alertVariants };
