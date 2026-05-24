import { cn } from '@/lib/utils';

export const PageTitle = ({ children, className }) => (
  <h1 className={cn('text-3xl font-extrabold tracking-tight text-foreground', className)}>{children}</h1>
);

export const PageDescription = ({ children, className }) => (
  <p className={cn('text-base text-muted', className)}>{children}</p>
);

export const SectionTitle = ({ children, className }) => (
  <h2 className={cn('text-lg font-bold text-foreground', className)}>{children}</h2>
);

export const MutedText = ({ children, className, as: Component = 'p' }) => (
  <Component className={cn('text-sm text-muted', className)}>{children}</Component>
);

export const StatValue = ({ children, className, tone = 'default' }) => (
  <p
    className={cn(
      'text-xl font-extrabold',
      tone === 'primary' && 'text-primary',
      tone === 'success' && 'text-success',
      tone === 'danger' && 'text-danger',
      tone === 'default' && 'text-foreground',
      className
    )}
  >
    {children}
  </p>
);
