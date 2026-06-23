// Tier 4 — Context Compound Component
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { cn } from '@/lib/utils';
import { useState, cloneElement } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * FormInput — labeled + validated wrapper around the base Input primitive.
 * Named FormInput to distinguish from the raw Input primitive.
 *
 * Supports compound pattern via children for custom addons (e.g., PasswordToggle).
 */
export function FormInput({
  ref,
  label,
  error,
  disabled = false,
  className = '',
  id,
  name,
  children,
  type = 'text',
  ...props
}) {
  const inputId = id || name;
  const [inputType, setInputType] = useState(type);

  return (
    <div className={cn('space-y-2', className)}>
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}
      {children ? (
        <div className="relative">
          <Input
            ref={ref}
            id={inputId}
            name={name}
            type={inputType}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={
              error
                ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/20'
                : undefined
            }
            {...props}
          />
          {cloneElement(children, { onToggleType: setInputType, currentType: inputType })}
        </div>
      ) : (
        <Input
          ref={ref}
          id={inputId}
          name={name}
          type={inputType}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={
            error
              ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/20'
              : undefined
          }
          {...props}
        />
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

/**
 * PasswordToggle — compound component for password visibility toggle.
 * Manages visibility state and provides an eye icon button using the Button component.
 *
 * Usage:
 * <FormInput label="Password" type="password" {...register('password')}>
 *   <FormInput.PasswordToggle />
 * </FormInput>
 */
export function PasswordToggle({
  onToggleType,
  currentType = 'password',
  iconClassName = 'h-5 w-5',
  buttonClassName = 'absolute right-3 top-1/2 -translate-y-1/2',
}) {
  const isVisible = currentType === 'text';

  const toggleVisibility = () => {
    onToggleType(isVisible ? 'password' : 'text');
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggleVisibility}
      className={cn('p-0 h-auto hover:bg-transparent', buttonClassName)}
      aria-label={isVisible ? 'Hide password' : 'Show password'}
      tabIndex={-1}
    >
      {isVisible ? <EyeOff className={iconClassName} /> : <Eye className={iconClassName} />}
    </Button>
  );
}

FormInput.PasswordToggle = PasswordToggle;

export default FormInput;
