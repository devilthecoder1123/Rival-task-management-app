'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ApiClientError } from '@/lib/api';
import { isEmail } from '@/lib/validation';

type FormValues = {
  name: string;
  email: string;
  password: string;
};

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  root?: string;
};

export default function SignupPage() {
  const router = useRouter();
  const { signup, user, loading } = useAuth();

  const [values, setValues] = useState<FormValues>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/tasks');
  }, [user, loading, router]);

  const validate = (fields: FormValues) => {
    const next: FormErrors = {};

    if (!fields.name.trim()) {
      next.name = 'Name is required';
    } else if (fields.name.length > 100) {
      next.name = 'Name must be 100 characters or less';
    }

    if (!fields.email.trim()) {
      next.email = 'Email is required';
    } else if (!isEmail(fields.email)) {
      next.email = 'Enter a valid email';
    }

    if (!fields.password) {
      next.password = 'Password is required';
    } else if (fields.password.length < 8) {
      next.password = 'Password must be at least 8 characters';
    } else if (fields.password.length > 128) {
      next.password = 'Password must be 128 characters or less';
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
      await signup(values.email.trim(), values.password, values.name.trim());
      router.replace('/tasks');
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.message : 'Unable to sign up. Please try again.';
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
        <h1 className="mb-2 text-3xl font-semibold">Create your account</h1>
        <p className="mb-6 text-sm text-muted-foreground">Sign up to start managing tasks.</p>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              className="input"
              value={values.name}
              onChange={handleChange}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-2 text-sm text-danger">
                {errors.name}
              </p>
            )}
          </div>

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
              autoComplete="new-password"
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
            {isSubmitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
