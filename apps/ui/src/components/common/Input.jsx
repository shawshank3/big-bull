import { Input as UiInput } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

export function Input({ ref, label, error, disabled = false, className = '', id, name, ...props }) {
  const inputId = id || name;

  return (
    <div className={cn('space-y-2', className)}>
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}
      <UiInput
        ref={ref}
        id={inputId}
        name={name}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={
          error
            ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/20'
            : undefined
        }
        {...props}
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export default Input;
