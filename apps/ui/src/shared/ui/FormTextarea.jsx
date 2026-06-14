import { Label } from './label';
import { cn } from '@/lib/utils';

export function FormTextarea({ ref, label, error, id, name, className = '', ...props }) {
  const fieldId = id || name;
  return (
    <div className={cn('space-y-2', className)}>
      {label ? <Label htmlFor={fieldId}>{label}</Label> : null}
      <textarea
        ref={ref}
        id={fieldId}
        name={name}
        aria-invalid={Boolean(error)}
        className={cn(
          'flex w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-foreground',
          'placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-danger focus-visible:ring-danger/20'
        )}
        {...props}
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export default FormTextarea;
