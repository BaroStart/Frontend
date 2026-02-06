import * as React from 'react';

import { cn } from '@/lib/utils';

import { Label } from './Label';

interface InputProps extends React.ComponentProps<'input'> {
  label?: string;
  labelClassName?: string;
  endAdornment?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, labelClassName, endAdornment, id, ...props }, ref) => {
    const inputElement = endAdornment ? (
      <div className="relative">
        <input
          type={type}
          id={id}
          className={cn(
            'flex h-12 w-full rounded-2xl border border-border bg-secondary/50 px-4 py-3 pr-10 text-base transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus:bg-white focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          ref={ref}
          {...props}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 [&>*]:pointer-events-auto">
          {endAdornment}
        </div>
      </div>
    ) : (
      <input
        type={type}
        id={id}
        className={cn(
          'flex h-12 w-full rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-base transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus:bg-white focus:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );

    if (label) {
      return (
        <div className="space-y-2">
          <Label htmlFor={id} className={cn('text-sm font-medium text-foreground', labelClassName)}>
            {label}
          </Label>
          {inputElement}
        </div>
      );
    }

    return inputElement;
  },
);
Input.displayName = 'Input';

export { Input };
