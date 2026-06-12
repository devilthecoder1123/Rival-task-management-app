'use client';

import type { ChangeEvent, FormEvent } from 'react';
import type { AuthFormErrors, AuthFormValues } from '@/hooks/useAuthForm';

interface Props {
  formType: 'login' | 'signup';
  values: AuthFormValues;
  errors: AuthFormErrors;
  isSubmitting: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function AuthForm({ formType, values, errors, isSubmitting, onChange, onSubmit }: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {formType === 'signup' && (
        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            className="input"
            value={values.name ?? ''}
            onChange={onChange}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="mt-2 text-sm text-danger">
              {errors.name}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="input"
          value={values.email ?? ''}
          onChange={onChange}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-2 text-sm text-danger">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={formType === 'signup' ? 'new-password' : 'current-password'}
          className="input"
          value={values.password ?? ''}
          onChange={onChange}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <p id="password-error" className="mt-2 text-sm text-danger">
            {errors.password}
          </p>
        )}
      </div>

      {errors.root && (
        <div className="rounded-2xl bg-danger/10 p-4 text-sm text-danger">{errors.root}</div>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? (formType === 'signup' ? 'Creating account…' : 'Logging in…') : formType === 'signup' ? 'Sign up' : 'Log in'}
      </button>
    </form>
  );
}
