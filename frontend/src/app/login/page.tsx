'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ApiClientError } from '@/lib/api';
import { isEmail } from '@/lib/validation';

type FormValues = {
  email: string;
  password: string;
};

type FormErrors = {
  email?: string;
  password?: string;
  root?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading } = useAuth();

  const [values, setValues] = useState<FormValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/tasks');
  }, [user, loading, router]);

  const validate = (fields: FormValues) => {
    const next: FormErrors = {};

    if (!fields.email.trim()) {
      next.email = 'Email is required';
    } else if (!isEmail(fields.email)) {
      next.email = 'Enter a valid email';
    }

    if (!fields.password) {
      next.password = 'Password is required';
    }

    return next;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await login(values.email.trim(), values.password);
      router.replace('/tasks');
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : 'Unable to log in. Please try again.';
      setErrors({ root: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, root: undefined }));
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="mb-2 text-3xl font-semibold">Welcome back</h1>
        <p className="mb-6 text-sm text-muted-foreground">Log in to access your tasks.</p>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
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
              value={values.email}
              onChange={handleChange}
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
              autoComplete="current-password"
              className="input"
              value={values.password}
              onChange={handleChange}
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
            <div className="rounded-2xl bg-danger/10 p-4 text-sm text-danger">
              {errors.root}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          New here?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
